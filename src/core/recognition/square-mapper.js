/**
 * Square mapping and coordinate translation.
 * Maps files (a-h) and ranks (1-8) with respect to board orientation (white-bottom or black-bottom).
 */

import { ORIENTATIONS } from '../../shared/constants.js';
import { ERROR_CODES, ChessAgentError } from '../../shared/errors.js';

export const FILES = Object.freeze(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
export const RANKS = Object.freeze(['1', '2', '3', '4', '5', '6', '7', '8']);

/**
 * Returns standard square coordinate (e.g. 'e4') from file and rank index.
 * @param {number} fileIndex - 0 to 7 (a to h)
 * @param {number} rankIndex - 0 to 7 (1 to 8)
 * @returns {string}
 */
export function toSquare(fileIndex, rankIndex) {
  if (fileIndex < 0 || fileIndex > 7 || rankIndex < 0 || rankIndex > 7) {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_PAYLOAD,
      `Invalid square indices: file=${fileIndex}, rank=${rankIndex}`
    );
  }
  return `${FILES[fileIndex]}${RANKS[rankIndex]}`;
}

/**
 * Parses an algebraic square (e.g. 'e4') into file and rank indices.
 * @param {string} square
 * @returns {{ fileIndex: number, rankIndex: number, file: string, rank: string }}
 */
export function fromSquare(square) {
  if (!square || typeof square !== 'string' || square.length !== 2) {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_PAYLOAD,
      `Invalid square coordinate: '${square}'`
    );
  }
  const file = square[0].toLowerCase();
  const rank = square[1];
  const fileIndex = FILES.indexOf(file);
  const rankIndex = RANKS.indexOf(rank);

  if (fileIndex === -1 || rankIndex === -1) {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_PAYLOAD,
      `Invalid square coordinate: '${square}'`
    );
  }

  return { fileIndex, rankIndex, file, rank };
}

/**
 * Translates visual row and column (0-7, 0-7 from top-left) into an algebraic square
 * based on board orientation.
 *
 * @param {number} row - 0 (top) to 7 (bottom)
 * @param {number} col - 0 (left) to 7 (right)
 * @param {string} [orientation=ORIENTATIONS.WHITE_BOTTOM]
 * @returns {string} E.g. 'a8' or 'h1'
 */
export function gridToSquare(row, col, orientation = ORIENTATIONS.WHITE_BOTTOM) {
  if (row < 0 || row > 7 || col < 0 || col > 7) {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_PAYLOAD,
      `Grid indices out of bounds: row=${row}, col=${col}`
    );
  }

  if (orientation === ORIENTATIONS.WHITE_BOTTOM) {
    // Top row is rank 8 (rankIndex 7), bottom row is rank 1 (rankIndex 0)
    // Left col is file a (fileIndex 0), right col is file h (fileIndex 7)
    const fileIndex = col;
    const rankIndex = 7 - row;
    return toSquare(fileIndex, rankIndex);
  } else {
    // Black at bottom:
    // Top row is rank 1 (rankIndex 0), bottom row is rank 8 (rankIndex 7)
    // Left col is file h (fileIndex 7), right col is file a (fileIndex 0)
    const fileIndex = 7 - col;
    const rankIndex = row;
    return toSquare(fileIndex, rankIndex);
  }
}

/**
 * Converts a piece dictionary `{ [square]: piece }` into a FEN piece placement string.
 * @param {Record<string, string>} pieces - Map of square ('e4') to piece ('P', 'n', etc.)
 * @returns {string} Piece placement string (e.g. 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')
 */
export function piecesToPlacement(pieces = {}) {
  const ranks = [];

  // Ranks 8 down to 1
  for (let r = 7; r >= 0; r--) {
    let emptyCount = 0;
    let rankStr = '';

    for (let f = 0; f < 8; f++) {
      const square = toSquare(f, r);
      const piece = pieces[square];

      if (!piece) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rankStr += emptyCount;
          emptyCount = 0;
        }
        rankStr += piece;
      }
    }

    if (emptyCount > 0) {
      rankStr += emptyCount;
    }

    ranks.push(rankStr);
  }

  return ranks.join('/');
}
