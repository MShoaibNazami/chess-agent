/**
 * FEN parsing, serialization, and syntax validation.
 */

import { ERROR_CODES, ChessAgentError } from '../../shared/errors.js';

const VALID_PIECES = new Set(['p', 'r', 'n', 'b', 'q', 'k', 'P', 'R', 'N', 'B', 'Q', 'K']);
const VALID_FILES = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
const VALID_RANKS = new Set(['1', '2', '3', '4', '5', '6', '7', '8']);

/**
 * Normalizes a FEN string by trimming and collapsing multiple whitespace characters.
 * @param {string} fen
 * @returns {string}
 */
export function normalizeFen(fen) {
  if (typeof fen !== 'string') {
    throw new ChessAgentError(ERROR_CODES.INVALID_FEN, 'FEN must be a string');
  }
  return fen.trim().replace(/\s+/g, ' ');
}

/**
 * Validates the syntax of a FEN string.
 * @param {string} fen
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFenSyntax(fen) {
  if (typeof fen !== 'string' || fen.trim().length === 0) {
    return { valid: false, error: 'FEN string is empty or not a string' };
  }

  const normalized = normalizeFen(fen);
  const parts = normalized.split(' ');

  if (parts.length !== 6) {
    return {
      valid: false,
      error: `FEN must contain exactly 6 space-separated fields, got ${parts.length}`,
    };
  }

  const [placement, activeColor, castling, enPassant, halfmove, fullmove] = parts;

  // 1. Piece placement
  const ranks = placement.split('/');
  if (ranks.length !== 8) {
    return {
      valid: false,
      error: `Piece placement must have exactly 8 ranks separated by '/', got ${ranks.length}`,
    };
  }

  for (let i = 0; i < 8; i++) {
    const rankStr = ranks[i];
    let fileCount = 0;

    for (const char of rankStr) {
      if (VALID_PIECES.has(char)) {
        fileCount += 1;
      } else if (char >= '1' && char <= '8') {
        fileCount += parseInt(char, 10);
      } else {
        return {
          valid: false,
          error: `Invalid character '${char}' in rank ${8 - i}`,
        };
      }
    }

    if (fileCount !== 8) {
      return {
        valid: false,
        error: `Rank ${8 - i} specifies ${fileCount} squares instead of 8`,
      };
    }
  }

  // 2. Active color
  if (activeColor !== 'w' && activeColor !== 'b') {
    return {
      valid: false,
      error: `Active color must be 'w' or 'b', got '${activeColor}'`,
    };
  }

  // 3. Castling availability
  if (castling !== '-') {
    if (!/^[KQkq]+$/.test(castling)) {
      return {
        valid: false,
        error: `Castling rights must be '-' or contain only K, Q, k, q, got '${castling}'`,
      };
    }
    const seen = new Set();
    for (const c of castling) {
      if (seen.has(c)) {
        return {
          valid: false,
          error: `Duplicate castling symbol '${c}' in '${castling}'`,
        };
      }
      seen.add(c);
    }
  }

  // 4. En passant target
  if (enPassant !== '-') {
    if (enPassant.length !== 2) {
      return {
        valid: false,
        error: `En passant square must be '-' or a 2-character square coordinate, got '${enPassant}'`,
      };
    }
    const [file, rank] = enPassant;
    if (!VALID_FILES.has(file) || !VALID_RANKS.has(rank)) {
      return {
        valid: false,
        error: `Invalid en passant square coordinate: '${enPassant}'`,
      };
    }
    // In legal chess, en passant square is rank 3 (if Black just moved) or rank 6 (if White just moved)
    if ((activeColor === 'w' && rank !== '6') || (activeColor === 'b' && rank !== '3')) {
      return {
        valid: false,
        error: `En passant square '${enPassant}' is inconsistent with active color '${activeColor}'`,
      };
    }
  }

  // 5. Halfmove clock
  if (!/^\d+$/.test(halfmove)) {
    return {
      valid: false,
      error: `Halfmove clock must be a non-negative integer, got '${halfmove}'`,
    };
  }

  // 6. Fullmove number
  if (!/^\d+$/.test(fullmove) || parseInt(fullmove, 10) < 1) {
    return {
      valid: false,
      error: `Fullmove number must be a positive integer (>= 1), got '${fullmove}'`,
    };
  }

  return { valid: true };
}

/**
 * Parses a FEN string into structured components.
 * Throws ChessAgentError(INVALID_FEN) if syntax is invalid.
 *
 * @param {string} fen
 * @returns {{
 *   placement: string,
 *   activeColor: 'w'|'b',
 *   castling: string,
 *   enPassant: string,
 *   halfmove: number,
 *   fullmove: number,
 *   ranks: string[]
 * }}
 */
export function parseFen(fen) {
  const validation = validateFenSyntax(fen);
  if (!validation.valid) {
    throw new ChessAgentError(ERROR_CODES.INVALID_FEN, validation.error, { fen });
  }

  const normalized = normalizeFen(fen);
  const [placement, activeColor, castling, enPassant, halfmove, fullmove] = normalized.split(' ');

  return {
    placement,
    activeColor,
    castling,
    enPassant,
    halfmove: parseInt(halfmove, 10),
    fullmove: parseInt(fullmove, 10),
    ranks: placement.split('/'),
  };
}

/**
 * Serializes parsed FEN fields into a canonical FEN string.
 * @param {{
 *   placement: string,
 *   activeColor?: string,
 *   castling?: string,
 *   enPassant?: string,
 *   halfmove?: number,
 *   fullmove?: number
 * }} parsed
 * @returns {string}
 */
export function serializeFen(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    throw new ChessAgentError(ERROR_CODES.INVALID_FEN, 'Parsed FEN object is required');
  }

  const placement = parsed.placement;
  const activeColor = parsed.activeColor || 'w';
  const castling = parsed.castling || '-';
  const enPassant = parsed.enPassant || '-';
  const halfmove = parsed.halfmove !== undefined ? parsed.halfmove : 0;
  const fullmove = parsed.fullmove !== undefined ? parsed.fullmove : 1;

  const fen = `${placement} ${activeColor} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
  const validation = validateFenSyntax(fen);
  if (!validation.valid) {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_FEN,
      `Cannot serialize invalid FEN: ${validation.error}`,
      { fen }
    );
  }

  return fen;
}
