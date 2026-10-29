/**
 * Position identity and comparison logic.
 * Ensures positions are compared by full chess identity (placement, side to move, castling, en passant)
 * rather than piece placement alone.
 */

import { parseFen, normalizeFen } from './fen.js';

/**
 * Returns a canonical key representing the chess state identity.
 * @param {string} fen
 * @param {{ strict?: boolean }} [options={}]
 * @returns {string}
 */
export function getPositionKey(fen, options = {}) {
  const parsed = parseFen(fen);
  if (options.strict) {
    return normalizeFen(fen);
  }
  // Standard chess repetition identity: placement + activeColor + castling + enPassant
  return `${parsed.placement} ${parsed.activeColor} ${parsed.castling} ${parsed.enPassant}`;
}

/**
 * Extracts only the piece placement string from a FEN.
 * @param {string} fen
 * @returns {string}
 */
export function getPiecePlacement(fen) {
  const parsed = parseFen(fen);
  return parsed.placement;
}

/**
 * Determines whether two positions are identical chess states.
 *
 * @param {string} fenA
 * @param {string} fenB
 * @param {{ strict?: boolean }} [options={}] - If strict is true, also compares move clocks
 * @returns {boolean}
 */
export function arePositionsEqual(fenA, fenB, options = {}) {
  try {
    const keyA = getPositionKey(fenA, options);
    const keyB = getPositionKey(fenB, options);
    return keyA === keyB;
  } catch {
    return false;
  }
}

/**
 * Checks whether two positions share the same piece placement,
 * ignoring side to move, castling rights, and move clocks.
 *
 * @param {string} fenA
 * @param {string} fenB
 * @returns {boolean}
 */
export function haveIdenticalPlacement(fenA, fenB) {
  try {
    return getPiecePlacement(fenA) === getPiecePlacement(fenB);
  } catch {
    return false;
  }
}
