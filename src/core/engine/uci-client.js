/**
 * UCI Engine Client.
 * Provides high-level communication with the local Stockfish engine via UCI protocol.
 */

import { ERROR_CODES, ChessAgentError } from '../../shared/errors.js';
import { parseUciLine } from './uci-parser.js';

export const ENGINE_STATE = Object.freeze({
  UNINITIALIZED: 'UNINITIALIZED',
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  SEARCHING: 'SEARCHING',
  ERROR: 'ERROR',
  TERMINATED: 'TERMINATED',
});

export class UciClient {
  /**
   * @param {object} transport - Engine transport adapter
   * @param {function(string): void} transport.send - Send UCI string to engine
   * @param {function(function(string): void): void} transport.onLine - Register line listener
   * @param {function(function(Error): void): void} [transport.onError] - Register error listener
   * @param {function(): void} [transport.terminate] - Cleanly terminate the engine
   */
  constructor(transport) {
    if (!transport || typeof transport.send !== 'function') {
      throw new ChessAgentError(
        ERROR_CODES.ENGINE_START_FAILED,
        'A valid transport with a send() method is required'
      );
    }

    this.transport = transport;
    this.state = ENGINE_STATE.UNINITIALIZED;
    this.currentSearch = null;
    this.latestInfo = null;

    if (typeof this.transport.onLine === 'function') {
      this.transport.onLine(line => this._handleLine(line));
    }
    if (typeof this.transport.onError === 'function') {
      this.transport.onError(err => this._handleError(err));
    }
  }

  /**
   * Initializes the engine by sending 'uci' and 'isready'.
   * @param {number} [timeoutMs=8000]
   * @returns {Promise<boolean>}
   */
  async init(timeoutMs = 8000) {
    if (this.state === ENGINE_STATE.READY) {
      return true;
    }
    this.state = ENGINE_STATE.INITIALIZING;

    return new Promise((resolve, reject) => {
      let uciOkReceived = false;

      const timer = setTimeout(() => {
        cleanup();
        this.state = ENGINE_STATE.ERROR;
        reject(
          new ChessAgentError(
            ERROR_CODES.ENGINE_TIMEOUT,
            `Engine initialization timed out after ${timeoutMs}ms`
          )
        );
      }, timeoutMs);

      const lineHandler = line => {
        const parsed = parseUciLine(line);
        if (parsed.type === 'uciok') {
          uciOkReceived = true;
          this.transport.send('isready');
        } else if (parsed.type === 'readyok') {
          if (uciOkReceived) {
            cleanup();
            this.state = ENGINE_STATE.READY;
            resolve(true);
          }
        }
      };

      const cleanup = () => {
        clearTimeout(timer);
        this._removeTempListener(lineHandler);
      };

      this._addTempListener(lineHandler);
      this.transport.send('uci');
    });
  }

  /**
   * Checks if the engine is ready by sending 'isready'.
   * @param {number} [timeoutMs=3000]
   * @returns {Promise<boolean>}
   */
  async isReady(timeoutMs = 3000) {
    if (this.state === ENGINE_STATE.TERMINATED || this.state === ENGINE_STATE.ERROR) {
      throw new ChessAgentError(
        ERROR_CODES.ENGINE_TERMINATED,
        `Cannot check readiness in state: ${this.state}`
      );
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(
          new ChessAgentError(
            ERROR_CODES.ENGINE_TIMEOUT,
            `Engine isready check timed out after ${timeoutMs}ms`
          )
        );
      }, timeoutMs);

      const lineHandler = line => {
        const parsed = parseUciLine(line);
        if (parsed.type === 'readyok') {
          cleanup();
          this.state = ENGINE_STATE.READY;
          resolve(true);
        }
      };

      const cleanup = () => {
        clearTimeout(timer);
        this._removeTempListener(lineHandler);
      };

      this._addTempListener(lineHandler);
      this.transport.send('isready');
    });
  }

  /**
   * Sets the position on the engine.
   * @param {string} fen
   * @param {string[]} [moves=[]]
   */
  setPosition(fen, moves = []) {
    if (this.state !== ENGINE_STATE.READY && this.state !== ENGINE_STATE.SEARCHING) {
      throw new ChessAgentError(
        ERROR_CODES.ENGINE_START_FAILED,
        `Cannot set position in engine state: ${this.state}`
      );
    }

    const movesSuffix = moves && moves.length > 0 ? ` moves ${moves.join(' ')}` : '';
    if (!fen || fen === 'startpos') {
      this.transport.send(`position startpos${movesSuffix}`);
    } else {
      this.transport.send(`position fen ${fen}${movesSuffix}`);
    }
  }

  /**
   * Performs a bounded search on the current position.
   * @param {{
   *   depth?: number,
   *   movetime?: number,
   *   timeoutMs?: number,
   *   onUpdate?: function(object): void
   * }} [options={}]
   * @returns {Promise<{
   *   bestMove: string,
   *   ponderMove: string|null,
   *   evaluation: { type: 'cp'|'mate', value: number },
   *   depth: number,
   *   principalVariation: string[],
   *   status: string,
   *   timeMs?: number,
   *   nodes?: number
   * }>}
   */
  async search(options = {}) {
    if (this.state === ENGINE_STATE.SEARCHING) {
      // Cancel previous search before starting new one
      await this.stop();
    }
    if (this.state !== ENGINE_STATE.READY) {
      await this.init();
    }

    this.state = ENGINE_STATE.SEARCHING;
    this.latestInfo = null;

    const depth = options.depth || 12;
    const timeoutMs = options.timeoutMs || 10000;
    const movetime = options.movetime;

    return new Promise((resolve, reject) => {
      let isCompleted = false;

      const timer = setTimeout(() => {
        if (!isCompleted) {
          this.stop().catch(() => {});
          cleanup();
          this.state = ENGINE_STATE.READY;
          reject(
            new ChessAgentError(
              ERROR_CODES.ENGINE_TIMEOUT,
              `Search exceeded time limit of ${timeoutMs}ms`
            )
          );
        }
      }, timeoutMs);

      const lineHandler = line => {
        const parsed = parseUciLine(line);

        if (parsed.type === 'info') {
          if (parsed.data.evaluation || parsed.data.depth) {
            this.latestInfo = {
              ...(this.latestInfo || {}),
              ...parsed.data,
            };
            if (typeof options.onUpdate === 'function') {
              options.onUpdate(this.latestInfo);
            }
          }
        } else if (parsed.type === 'bestmove') {
          isCompleted = true;
          cleanup();
          this.state = ENGINE_STATE.READY;
          this.currentSearch = null;

          const bestMove = parsed.data.bestMove;
          const ponderMove = parsed.data.ponderMove;

          resolve({
            bestMove,
            ponderMove,
            evaluation: this.latestInfo?.evaluation || { type: 'cp', value: 0 },
            depth: this.latestInfo?.depth || depth,
            principalVariation:
              this.latestInfo?.principalVariation || (bestMove !== '(none)' ? [bestMove] : []),
            status: 'complete',
            timeMs: this.latestInfo?.timeMs,
            nodes: this.latestInfo?.nodes,
          });
        }
      };

      const cleanup = () => {
        clearTimeout(timer);
        this._removeTempListener(lineHandler);
      };

      this._addTempListener(lineHandler);
      this.currentSearch = { resolve, reject, cleanup };

      let goCommand = `go depth ${depth}`;
      if (movetime) {
        goCommand += ` movetime ${movetime}`;
      }
      this.transport.send(goCommand);
    });
  }

  /**
   * Stops an active search.
   * @returns {Promise<void>}
   */
  async stop() {
    if (this.state === ENGINE_STATE.SEARCHING) {
      this.transport.send('stop');
      this.state = ENGINE_STATE.READY;
    }
  }

  /**
   * Cleanly terminates the engine.
   */
  terminate() {
    try {
      this.transport.send('quit');
    } catch {
      // Ignore write after close
    }
    if (typeof this.transport.terminate === 'function') {
      this.transport.terminate();
    }
    this.state = ENGINE_STATE.TERMINATED;
    if (this.currentSearch) {
      this.currentSearch.reject(
        new ChessAgentError(ERROR_CODES.ENGINE_TERMINATED, 'Engine was terminated')
      );
      this.currentSearch = null;
    }
  }

  // Internal listener management
  _tempListeners = new Set();

  _addTempListener(fn) {
    this._tempListeners.add(fn);
  }

  _removeTempListener(fn) {
    this._tempListeners.delete(fn);
  }

  _handleLine(line) {
    if (typeof line !== 'string') return;
    const sublines = line.split(/\r?\n/);
    for (const subline of sublines) {
      const trimmed = subline.trim();
      if (!trimmed) continue;
      for (const listener of Array.from(this._tempListeners)) {
        try {
          listener(trimmed);
        } catch (err) {
          console.error('Error in UCI line listener:', err);
        }
      }
    }
  }

  _handleError(err) {
    this.state = ENGINE_STATE.ERROR;
    if (this.currentSearch) {
      this.currentSearch.reject(
        new ChessAgentError(
          ERROR_CODES.ENGINE_START_FAILED,
          `Engine error: ${err.message || String(err)}`
        )
      );
      this.currentSearch = null;
    }
  }
}
