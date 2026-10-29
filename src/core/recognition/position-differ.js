/**
 * Position differ.
 * Computes delta between two piece maps.
 */

import { FILES, RANKS, toSquare } from './square-mapper.js';

/**
 * Compares two piece maps and returns the difference.
 *
 * @param {Record<string, string>} oldPieces
 * @param {Record<string, string>} newPieces
 * @returns {{
 *   added: Array<{ square: string, piece: string }>,
 *   removed: Array<{ square: string, piece: string }>,
 *   changedCount: number,
 *   isIdentical: boolean
 * }}
 */
export function diffPieceMaps(oldPieces = {}, newPieces = {}) {
  const added = [];
  const removed = [];

  for (let f = 0; f < 8; f++) {
    for (let r = 0; r < 8; r++) {
      const sq = toSquare(f, r);
      const oldP = oldPieces[sq] || null;
      const newP = newPieces[sq] || null;

      if (oldP !== newP) {
        if (!oldP && newP) {
          added.push({ square: sq, piece: newP });
        } else if (oldP && !newP) {
          removed.push({ square: sq, piece: oldP });
        } else if (oldP && newP) {
          // Changed piece on same square (e.g. capture or promotion)
          removed.push({ square: sq, piece: oldP });
          added.push({ square: sq, piece: newP });
        }
      }
    }
  }

  const changedCount = added.length + removed.length;

  return {
    added,
    removed,
    changedCount,
    isIdentical: changedCount === 0,
  };
}
