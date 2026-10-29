/**
 * Message definitions and builders for component communication.
 */

import { ERROR_CODES, ChessAgentError, toErrorResponse } from './errors.js';
import { validateObservationPayload, validateAnalysisRequest } from './schemas.js';

export const MESSAGE_TYPES = Object.freeze({
  BOARD_OBSERVATION: 'BOARD_OBSERVATION',
  POSITION_VALIDATED: 'POSITION_VALIDATED',
  MOVE_DETECTED: 'MOVE_DETECTED',
  ANALYSIS_REQUEST: 'ANALYSIS_REQUEST',
  ANALYSIS_RESULT: 'ANALYSIS_RESULT',
  ANALYSIS_CANCEL: 'ANALYSIS_CANCEL',
  RECOGNITION_ERROR: 'RECOGNITION_ERROR',
  ENGINE_ERROR: 'ENGINE_ERROR',
  GET_STATE: 'GET_STATE',
  STATE_UPDATE: 'STATE_UPDATE',
  PING: 'PING',
  PONG: 'PONG',
});

let messageCounter = 0;
export function generateMessageId(prefix = 'msg') {
  messageCounter += 1;
  return `${prefix}_${Date.now()}_${messageCounter}`;
}

export function createMessage(type, payload = {}, id = null) {
  if (!MESSAGE_TYPES[type]) {
    throw new ChessAgentError(ERROR_CODES.INVALID_PAYLOAD, `Unknown message type: ${type}`);
  }
  return {
    id: id || generateMessageId(type.toLowerCase()),
    type,
    payload,
    timestamp: Date.now(),
  };
}

export function createSuccessResponse(requestId, data = {}) {
  return {
    id: generateMessageId('res'),
    requestId,
    success: true,
    data,
    timestamp: Date.now(),
  };
}

export function createErrorResponse(requestId, err, fallbackCode = ERROR_CODES.UNKNOWN_ERROR) {
  return {
    id: generateMessageId('err'),
    requestId,
    success: false,
    error: toErrorResponse(err, fallbackCode),
    timestamp: Date.now(),
  };
}

/**
 * Validates incoming message envelopes and payloads.
 * @param {unknown} msg
 * @returns {boolean}
 */
export function validateMessageEnvelope(msg) {
  if (!msg || typeof msg !== 'object') {
    throw new ChessAgentError(ERROR_CODES.INVALID_PAYLOAD, 'Message must be an object');
  }
  if (typeof msg.type !== 'string' || !MESSAGE_TYPES[msg.type]) {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_PAYLOAD,
      `Unrecognized message type: ${msg.type}`
    );
  }
  if (msg.payload === undefined) {
    throw new ChessAgentError(ERROR_CODES.INVALID_PAYLOAD, 'Message payload is missing');
  }

  if (msg.type === MESSAGE_TYPES.BOARD_OBSERVATION) {
    validateObservationPayload(msg.payload);
  } else if (msg.type === MESSAGE_TYPES.ANALYSIS_REQUEST) {
    validateAnalysisRequest(msg.payload);
  }

  return true;
}
