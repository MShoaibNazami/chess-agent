import { describe, it, expect } from 'vitest';
import {
  MESSAGE_TYPES,
  createMessage,
  createSuccessResponse,
  createErrorResponse,
  validateMessageEnvelope,
} from '../../src/shared/messages.js';
import { ERROR_CODES, ChessAgentError, toErrorResponse } from '../../src/shared/errors.js';

describe('Shared Messages and Errors', () => {
  it('creates structured messages with unique IDs and timestamps', () => {
    const msg = createMessage(MESSAGE_TYPES.ANALYSIS_CANCEL, { id: 'req_1' });
    expect(msg.type).toBe(MESSAGE_TYPES.ANALYSIS_CANCEL);
    expect(msg.id).toContain('analysis_cancel_');
    expect(msg.payload.id).toBe('req_1');
    expect(typeof msg.timestamp).toBe('number');
  });

  it('validates observation payloads', () => {
    const validObs = createMessage(MESSAGE_TYPES.BOARD_OBSERVATION, {
      source: 'controlled-test-board',
      orientation: 'white-bottom',
      pieces: { e1: 'K', e8: 'k' },
      confidence: 0.99,
      complete: true,
    });
    expect(validateMessageEnvelope(validObs)).toBe(true);
  });

  it('rejects invalid observation payloads', () => {
    const invalidObs = {
      type: MESSAGE_TYPES.BOARD_OBSERVATION,
      payload: {
        source: 'unsupported-source',
        pieces: {},
        confidence: 1.5,
        complete: 'yes',
      },
    };
    expect(() => validateMessageEnvelope(invalidObs)).toThrowError();
  });

  it('serializes errors into structured responses', () => {
    const agentErr = new ChessAgentError(ERROR_CODES.INVALID_FEN, 'Malformed FEN string', {
      fen: 'bad',
    });
    const json = agentErr.toJSON();
    expect(json.code).toBe(ERROR_CODES.INVALID_FEN);
    expect(json.message).toBe('Malformed FEN string');
    expect(json.details.fen).toBe('bad');

    const res = createErrorResponse('req_123', agentErr);
    expect(res.success).toBe(false);
    expect(res.requestId).toBe('req_123');
    expect(res.error.code).toBe(ERROR_CODES.INVALID_FEN);

    const successRes = createSuccessResponse('req_123', { ok: true });
    expect(successRes.success).toBe(true);
    expect(successRes.data.ok).toBe(true);
  });

  it('converts unknown exceptions cleanly with fallback codes', () => {
    const fallback = toErrorResponse('something unexpected', ERROR_CODES.ENGINE_ERROR);
    expect(fallback.code).toBe(ERROR_CODES.ENGINE_ERROR);
    expect(fallback.message).toBe('something unexpected');
  });
});
