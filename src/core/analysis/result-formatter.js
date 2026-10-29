/**
 * Result formatter for engine evaluations and moves.
 */

import { EVALUATION_PERSPECTIVE } from '../../shared/constants.js';

/**
 * Formats a raw evaluation object into a user-friendly string.
 * Stockfish UCI scores are from the perspective of the side to move.
 *
 * @param {{ type: 'cp'|'mate', value: number }} evaluation
 * @param {string} [perspective=EVALUATION_PERSPECTIVE.WHITE] - 'white' or 'side-to-move'
 * @param {'w'|'b'} [activeColor='w']
 * @returns {string} E.g. "+0.35", "-1.20", "#+3", "#-1", "0.00"
 */
export function formatEvaluation(
  evaluation,
  perspective = EVALUATION_PERSPECTIVE.WHITE,
  activeColor = 'w'
) {
  if (!evaluation || typeof evaluation.value !== 'number') {
    return '0.00';
  }

  let value = evaluation.value;
  // If perspective is White, invert value when Black is to move (since Stockfish scores side-to-move)
  if (perspective === EVALUATION_PERSPECTIVE.WHITE && activeColor === 'b') {
    value = -value;
  }

  if (evaluation.type === 'mate') {
    return value > 0 ? `#+${value}` : `#${value}`;
  }

  // Centipawns to pawns
  const pawns = (value / 100).toFixed(2);
  if (value > 0) {
    return `+${pawns}`;
  }
  if (value === 0) {
    return '0.00';
  }
  return pawns;
}

/**
 * Formats a principal variation array into space-separated moves.
 * @param {string[]} pv
 * @returns {string}
 */
export function formatPrincipalVariation(pv) {
  if (!Array.isArray(pv) || pv.length === 0) {
    return '(none)';
  }
  return pv.join(' ');
}

/**
 * Formats complete engine analysis into a structured response object.
 * @param {object} rawResult
 * @param {'w'|'b'} [activeColor='w']
 * @returns {object}
 */
export function formatAnalysisResult(rawResult, activeColor = 'w') {
  const evalObj = rawResult.evaluation || { type: 'cp', value: 0 };

  return {
    bestMove: rawResult.bestMove || '(none)',
    ponderMove: rawResult.ponderMove || null,
    depth: rawResult.depth || 0,
    nodes: rawResult.nodes || 0,
    timeMs: rawResult.timeMs || 0,
    status: rawResult.status || 'complete',
    principalVariation: rawResult.principalVariation || [],
    pvString: formatPrincipalVariation(rawResult.principalVariation),
    evaluation: evalObj,
    evalWhite: formatEvaluation(evalObj, EVALUATION_PERSPECTIVE.WHITE, activeColor),
    evalSideToMove: formatEvaluation(evalObj, EVALUATION_PERSPECTIVE.SIDE_TO_MOVE, activeColor),
  };
}
