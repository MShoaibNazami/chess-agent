/**
 * Confidence calculation and observation completeness assessment.
 */

import { CONFIDENCE_THRESHOLDS } from '../../shared/constants.js';
import { ERROR_CODES, ChessAgentError } from '../../shared/errors.js';

/**
 * Assesses an observation's completeness, confidence, and structural sanity.
 *
 * @param {{
 *   source: string,
 *   pieces: Record<string, string>,
 *   confidence?: number,
 *   complete?: boolean,
 *   squareConfidences?: Record<string, number>
 * }} observation
 * @returns {{
 *   confidence: number,
 *   isAcceptable: boolean,
 *   requiresConfirmation: boolean,
 *   complete: boolean,
 *   issues: string[]
 * }}
 */
export function evaluateObservationConfidence(observation) {
  if (!observation || typeof observation !== 'object' || !observation.pieces) {
    throw new ChessAgentError(
      ERROR_CODES.BOARD_RECOGNITION_FAILED,
      'Invalid observation: missing pieces dictionary'
    );
  }

  const issues = [];
  const pieces = observation.pieces;
  let rawConfidence = typeof observation.confidence === 'number' ? observation.confidence : 1.0;

  // 1. Completeness check
  if (observation.complete === false) {
    issues.push('Observation explicitly marked incomplete');
    rawConfidence = Math.min(rawConfidence, 0.5);
  }

  // 2. King presence check (every valid chess position must have exactly 1 white and 1 black king)
  let whiteKings = 0;
  let blackKings = 0;

  for (const [sq, p] of Object.entries(pieces)) {
    if (!/^[a-h][1-8]$/.test(sq)) {
      issues.push(`Invalid square identifier: ${sq}`);
      rawConfidence *= 0.8;
    }
    if (p === 'K') whiteKings++;
    if (p === 'k') blackKings++;
  }

  if (whiteKings !== 1) {
    issues.push(`Missing or duplicate White king (found ${whiteKings})`);
    rawConfidence *= 0.6;
  }
  if (blackKings !== 1) {
    issues.push(`Missing or duplicate Black king (found ${blackKings})`);
    rawConfidence *= 0.6;
  }

  // 3. Piece confidence breakdown
  if (observation.squareConfidences) {
    let sum = 0;
    let count = 0;
    for (const score of Object.values(observation.squareConfidences)) {
      sum += score;
      count++;
    }
    if (count > 0) {
      const avgPieceConf = sum / count;
      rawConfidence = Math.min(rawConfidence, avgPieceConf);
    }
  }

  const finalConfidence = Math.max(0, Math.min(1, Math.round(rawConfidence * 100) / 100));
  const isAcceptable =
    finalConfidence >= CONFIDENCE_THRESHOLDS.MINIMUM_ACCEPTABLE && issues.length === 0;
  const requiresConfirmation = !isAcceptable || finalConfidence < CONFIDENCE_THRESHOLDS.HIGH;

  return {
    confidence: finalConfidence,
    isAcceptable,
    requiresConfirmation,
    complete: Boolean(observation.complete) && issues.length === 0,
    issues,
  };
}
