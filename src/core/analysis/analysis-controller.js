/**
 * Analysis Controller.
 * Manages position validation, permission checks, search execution, and result formatting.
 */

import { validatePosition } from '../chess/position-validator.js';
import { assertAnalysisPermitted } from './permission-gate.js';
import { formatAnalysisResult } from './result-formatter.js';
import { ANALYSIS_STATUS } from '../../shared/constants.js';
import { ERROR_CODES, ChessAgentError, toErrorResponse } from '../../shared/errors.js';

export class AnalysisController {
  /**
   * @param {import('../engine/uci-client.js').UciClient} uciClient
   */
  constructor(uciClient) {
    if (!uciClient) {
      throw new ChessAgentError(
        ERROR_CODES.ENGINE_START_FAILED,
        'AnalysisController requires a UciClient instance'
      );
    }
    this.client = uciClient;
    this.status = ANALYSIS_STATUS.IDLE;
    this.currentRequest = null;
    this.latestResult = null;
  }

  /**
   * Initiates analysis for a given FEN within an operating context.
   *
   * @param {{
   *   fen: string,
   *   context: {
   *     source: string,
   *     url?: string,
   *     gameStatus?: string,
   *     isHumanOpponent?: boolean,
   *     isBotGame?: boolean,
   *     isExplicitlyAuthorized?: boolean
   *   },
   *   depth?: number,
   *   timeoutMs?: number,
   *   onUpdate?: function(object): void
   * }} request
   * @returns {Promise<object>} Structured analysis result
   */
  async requestAnalysis(request) {
    if (!request || typeof request !== 'object') {
      throw new ChessAgentError(ERROR_CODES.INVALID_PAYLOAD, 'Analysis request object is required');
    }

    // 1. Permission Gate check (non-bypassable safeguard)
    assertAnalysisPermitted(request.context);

    // 2. Position legality check
    const validation = validatePosition(request.fen);
    if (!validation.valid) {
      throw new ChessAgentError(
        validation.code || ERROR_CODES.INVALID_FEN,
        validation.error || 'Invalid chess position',
        { fen: request.fen }
      );
    }

    // 3. Prepare engine
    this.status = ANALYSIS_STATUS.ANALYZING;
    this.currentRequest = request;

    try {
      this.client.setPosition(validation.fen);

      const rawResult = await this.client.search({
        depth: request.depth || 12,
        timeoutMs: request.timeoutMs || 10000,
        onUpdate: update => {
          if (typeof request.onUpdate === 'function') {
            const intermediate = formatAnalysisResult(update, validation.details?.activeColor);
            request.onUpdate(intermediate);
          }
        },
      });

      const formatted = formatAnalysisResult(rawResult, validation.details?.activeColor);
      this.latestResult = formatted;
      this.status = ANALYSIS_STATUS.COMPLETE;
      return formatted;
    } catch (err) {
      this.status = ANALYSIS_STATUS.ERROR;
      throw toErrorResponse(err, ERROR_CODES.ENGINE_ERROR);
    } finally {
      this.currentRequest = null;
    }
  }

  /**
   * Cancels active analysis.
   */
  async cancelAnalysis() {
    if (this.status === ANALYSIS_STATUS.ANALYZING) {
      await this.client.stop();
      this.status = ANALYSIS_STATUS.CANCELLED;
    }
  }

  /**
   * Returns current controller status.
   */
  getStatus() {
    return {
      status: this.status,
      engineState: this.client.state,
      latestResult: this.latestResult,
    };
  }
}
