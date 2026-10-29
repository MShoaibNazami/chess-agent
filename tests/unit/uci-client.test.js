import { describe, it, expect } from 'vitest';
import { UciClient, ENGINE_STATE } from '../../src/core/engine/uci-client.js';
import { ERROR_CODES } from '../../src/shared/errors.js';

class MockTransport {
  constructor() {
    this.sentCommands = [];
    this.lineCallbacks = [];
    this.errorCallbacks = [];
    this.isTerminated = false;
  }

  send(cmd) {
    this.sentCommands.push(cmd);
  }

  onLine(cb) {
    this.lineCallbacks.push(cb);
  }

  onError(cb) {
    this.errorCallbacks.push(cb);
  }

  emitLine(line) {
    for (const cb of this.lineCallbacks) {
      cb(line);
    }
  }

  emitError(err) {
    for (const cb of this.errorCallbacks) {
      cb(err);
    }
  }

  terminate() {
    this.isTerminated = true;
  }
}

describe('UciClient', () => {
  it('initializes engine through uci and isready handshake', async () => {
    const transport = new MockTransport();
    const client = new UciClient(transport);

    const initPromise = client.init(1000);

    expect(transport.sentCommands).toContain('uci');
    transport.emitLine('id name Stockfish Mock');
    transport.emitLine('uciok');

    expect(transport.sentCommands).toContain('isready');
    transport.emitLine('readyok');

    await expect(initPromise).resolves.toBe(true);
    expect(client.state).toBe(ENGINE_STATE.READY);
  });

  it('rejects with ENGINE_TIMEOUT if initialization times out', async () => {
    const transport = new MockTransport();
    const client = new UciClient(transport);

    await expect(client.init(50)).rejects.toMatchObject({
      code: ERROR_CODES.ENGINE_TIMEOUT,
    });
    expect(client.state).toBe(ENGINE_STATE.ERROR);
  });

  it('performs a bounded search and parses structured result', async () => {
    const transport = new MockTransport();
    const client = new UciClient(transport);
    client.state = ENGINE_STATE.READY;

    client.setPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(transport.sentCommands).toContain(
      'position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    );

    const searchPromise = client.search({ depth: 8 });
    expect(transport.sentCommands).toContain('go depth 8');

    transport.emitLine('info depth 8 score cp 25 nodes 1000 nps 50000 time 20 pv e2e4 e7e5');
    transport.emitLine('bestmove e2e4 ponder e7e5');

    const result = await searchPromise;
    expect(result.bestMove).toBe('e2e4');
    expect(result.ponderMove).toBe('e7e5');
    expect(result.depth).toBe(8);
    expect(result.evaluation).toEqual({ type: 'cp', value: 25 });
    expect(result.principalVariation).toEqual(['e2e4', 'e7e5']);
    expect(result.status).toBe('complete');
  });

  it('handles search cancellation via stop command', async () => {
    const transport = new MockTransport();
    const client = new UciClient(transport);
    client.state = ENGINE_STATE.READY;

    const _searchPromise = client.search({ depth: 10 });
    expect(client.state).toBe(ENGINE_STATE.SEARCHING);

    await client.stop();
    expect(transport.sentCommands).toContain('stop');
    expect(client.state).toBe(ENGINE_STATE.READY);
  });

  it('handles worker termination cleanly', () => {
    const transport = new MockTransport();
    const client = new UciClient(transport);
    client.state = ENGINE_STATE.READY;

    client.terminate();
    expect(transport.sentCommands).toContain('quit');
    expect(transport.isTerminated).toBe(true);
    expect(client.state).toBe(ENGINE_STATE.TERMINATED);
  });

  it('handles transport errors gracefully', async () => {
    const transport = new MockTransport();
    const client = new UciClient(transport);
    client.state = ENGINE_STATE.READY;

    const searchPromise = client.search({ depth: 5 });
    transport.emitError(new Error('WebWorker crashed'));

    await expect(searchPromise).rejects.toMatchObject({
      code: ERROR_CODES.ENGINE_START_FAILED,
    });
    expect(client.state).toBe(ENGINE_STATE.ERROR);
  });
});
