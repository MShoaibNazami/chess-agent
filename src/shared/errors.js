/**
 * Error codes and standard structured error class for the Chess Agent.
 */

export const ERROR_CODES = Object.freeze({
  BOARD_NOT_FOUND: 'BOARD_NOT_FOUND',
  BOARD_RECOGNITION_FAILED: 'BOARD_RECOGNITION_FAILED',
  AMBIGUOUS_POSITION: 'AMBIGUOUS_POSITION',
  INVALID_FEN: 'INVALID_FEN',
  ILLEGAL_MOVE: 'ILLEGAL_MOVE',
  UNRESOLVED_TRANSITION: 'UNRESOLVED_TRANSITION',
  ENGINE_START_FAILED: 'ENGINE_START_FAILED',
  ENGINE_TIMEOUT: 'ENGINE_TIMEOUT',
  ENGINE_TERMINATED: 'ENGINE_TERMINATED',
  ENGINE_ERROR: 'ENGINE_ERROR',
  UNSUPPORTED_CONTEXT: 'UNSUPPORTED_CONTEXT',
  ANALYSIS_NOT_PERMITTED: 'ANALYSIS_NOT_PERMITTED',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
});

export class ChessAgentError extends Error {
  /**
   * @param {string} code - One of ERROR_CODES
   * @param {string} message - Human-readable explanation
   * @param {Record<string, unknown>} [details={}] - Contextual details
   */
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ChessAgentError';
    this.code = code;
    this.details = details;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Creates a standard error payload from an error or unknown input.
 * @param {unknown} err
 * @param {string} [fallbackCode=ERROR_CODES.UNKNOWN_ERROR]
 * @returns {{ code: string, message: string, details: Record<string, unknown> }}
 */
export function toErrorResponse(err, fallbackCode = ERROR_CODES.UNKNOWN_ERROR) {
  if (err instanceof ChessAgentError) {
    return err.toJSON();
  }
  if (err instanceof Error) {
    return {
      name: 'ChessAgentError',
      code: fallbackCode,
      message: err.message,
      details: {},
    };
  }
  return {
    name: 'ChessAgentError',
    code: fallbackCode,
    message: String(err),
    details: {},
  };
}
