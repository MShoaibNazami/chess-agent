/**
 * Message and payload validation schemas.
 */

import { ERROR_CODES, ChessAgentError } from './errors.js';
import { POSITION_SOURCES, ORIENTATIONS } from './constants.js';

export function assertObject(val, fieldName = 'payload') {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_PAYLOAD,
      `Expected ${fieldName} to be a non-null object`
    );
  }
}

export function assertString(val, fieldName) {
  if (typeof val !== 'string' || val.trim().length === 0) {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_PAYLOAD,
      `Expected ${fieldName} to be a non-empty string`
    );
  }
}

export function validateObservationPayload(payload) {
  assertObject(payload, 'observation');
  assertString(payload.source, 'source');
  if (!Object.values(POSITION_SOURCES).includes(payload.source)) {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_PAYLOAD,
      `Invalid observation source: ${payload.source}`
    );
  }
  if (payload.orientation && !Object.values(ORIENTATIONS).includes(payload.orientation)) {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_PAYLOAD,
      `Invalid board orientation: ${payload.orientation}`
    );
  }
  assertObject(payload.pieces, 'pieces');
  if (typeof payload.confidence !== 'number' || payload.confidence < 0 || payload.confidence > 1) {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_PAYLOAD,
      `Invalid observation confidence: ${payload.confidence}`
    );
  }
  if (typeof payload.complete !== 'boolean') {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_PAYLOAD,
      `Observation must include a boolean 'complete' property`
    );
  }
  return true;
}

export function validateAnalysisRequest(payload) {
  assertObject(payload, 'analysisRequest');
  assertString(payload.fen, 'fen');
  assertString(payload.context, 'context');
  if (payload.depth !== undefined && (typeof payload.depth !== 'number' || payload.depth < 1)) {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_PAYLOAD,
      `Invalid search depth: ${payload.depth}`
    );
  }
  if (
    payload.timeoutMs !== undefined &&
    (typeof payload.timeoutMs !== 'number' || payload.timeoutMs < 100)
  ) {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_PAYLOAD,
      `Invalid timeoutMs: ${payload.timeoutMs}`
    );
  }
  return true;
}
