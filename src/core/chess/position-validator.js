/**
 * Validates chess positions for legality and rules compliance using chess.js and domain rules.
 */

import { Chess } from 'chess.js';
import { parseFen, validateFenSyntax } from './fen.js';
import { ERROR_CODES } from '../../shared/errors.js';

/**
 * Counts pieces on a placement string.
 * @param {string} placement
 * @returns {{ whiteKings: number, blackKings: number, whitePawns: number, blackPawns: number, whiteTotal: number, blackTotal: number }}
 */
function inspectPieceCounts(placement) {
  let whiteKings = 0;
  let blackKings = 0;
  let whitePawns = 0;
  let blackPawns = 0;
  let whiteTotal = 0;
  let blackTotal = 0;

  for (const char of placement) {
    if (char === 'K') whiteKings++;
    else if (char === 'k') blackKings++;
    else if (char === 'P') {
      whitePawns++;
      whiteTotal++;
    } else if (char === 'p') {
      blackPawns++;
      blackTotal++;
    } else if (char >= 'A' && char <= 'Z') whiteTotal++;
    else if (char >= 'a' && char <= 'z') blackTotal++;
  }

  return {
    whiteKings,
    blackKings,
    whitePawns,
    blackPawns,
    whiteTotal: whiteTotal + whiteKings,
    blackTotal: blackTotal + blackKings,
  };
}

/**
 * Validates a chess position represented by FEN.
 * Checks syntax, structural legality (king count, pawns on back rank, piece counts),
 * and verifies chess rules using chess.js.
 *
 * @param {string} fen
 * @returns {{
 *   valid: boolean,
 *   fen: string,
 *   code?: string,
 *   error?: string,
 *   details?: {
 *     isCheck: boolean,
 *     isCheckmate: boolean,
 *     isStalemate: boolean,
 *     isDraw: boolean,
 *     legalMovesCount: number,
 *     activeColor: 'w'|'b',
 *     halfmove: number,
 *     fullmove: number
 *   }
 * }}
 */
export function validatePosition(fen) {
  // 1. Syntax check
  const syntax = validateFenSyntax(fen);
  if (!syntax.valid) {
    return {
      valid: false,
      fen,
      code: ERROR_CODES.INVALID_FEN,
      error: `Syntax error: ${syntax.error}`,
    };
  }

  const parsed = parseFen(fen);
  const ranks = parsed.ranks;

  // 2. Pawns on back ranks (ranks 8 and 1, which are ranks[0] and ranks[7])
  if (/[Pp]/.test(ranks[0])) {
    return {
      valid: false,
      fen,
      code: ERROR_CODES.INVALID_FEN,
      error: 'Illegal position: pawns cannot be on the 8th rank',
    };
  }
  if (/[Pp]/.test(ranks[7])) {
    return {
      valid: false,
      fen,
      code: ERROR_CODES.INVALID_FEN,
      error: 'Illegal position: pawns cannot be on the 1st rank',
    };
  }

  // 3. Piece count checks
  const counts = inspectPieceCounts(parsed.placement);
  if (counts.whiteKings !== 1) {
    return {
      valid: false,
      fen,
      code: ERROR_CODES.INVALID_FEN,
      error: `Position must have exactly 1 White king, found ${counts.whiteKings}`,
    };
  }
  if (counts.blackKings !== 1) {
    return {
      valid: false,
      fen,
      code: ERROR_CODES.INVALID_FEN,
      error: `Position must have exactly 1 Black king, found ${counts.blackKings}`,
    };
  }
  if (counts.whitePawns > 8) {
    return {
      valid: false,
      fen,
      code: ERROR_CODES.INVALID_FEN,
      error: `Position has too many White pawns: ${counts.whitePawns} (max 8)`,
    };
  }
  if (counts.blackPawns > 8) {
    return {
      valid: false,
      fen,
      code: ERROR_CODES.INVALID_FEN,
      error: `Position has too many Black pawns: ${counts.blackPawns} (max 8)`,
    };
  }
  if (counts.whiteTotal > 16) {
    return {
      valid: false,
      fen,
      code: ERROR_CODES.INVALID_FEN,
      error: `Position has too many White pieces: ${counts.whiteTotal} (max 16)`,
    };
  }
  if (counts.blackTotal > 16) {
    return {
      valid: false,
      fen,
      code: ERROR_CODES.INVALID_FEN,
      error: `Position has too many Black pieces: ${counts.blackTotal} (max 16)`,
    };
  }

  // 4. Validate with chess.js
  let chess;
  try {
    chess = new Chess(fen);
  } catch (err) {
    return {
      valid: false,
      fen,
      code: ERROR_CODES.INVALID_FEN,
      error: `Chess rules violation: ${err.message}`,
    };
  }

  // 5. Inactive side cannot be in check (opponent king can be captured)
  // We can test this by checking if the inactive king is attacked by the active side
  const opponentColor = parsed.activeColor === 'w' ? 'b' : 'w';
  const testOpponentTurnFen = `${parsed.placement} ${opponentColor} ${parsed.castling} - 0 1`;
  try {
    const oppChess = new Chess(testOpponentTurnFen);
    // If opponent is to move, oppChess.inCheck() would mean active side from original FEN is attacking inactive side
    // Wait: if original activeColor is 'w', opponent is 'b'.
    // If oppChess (b to move) is in check, that's normal (b is attacked by w, so w just put b in check - wait!
    // In original FEN, White is to move. If Black was in check, that means Black played a move that left Black in check,
    // which is ILLEGAL! The side that just moved cannot leave itself in check!)
    if (oppChess.inCheck()) {
      return {
        valid: false,
        fen,
        code: ERROR_CODES.INVALID_FEN,
        error: `Illegal position: side not to move (${opponentColor === 'w' ? 'White' : 'Black'}) is in check`,
      };
    }
  } catch {
    // If swapping turn fails, chess.js still loaded the original position
  }

  const legalMoves = chess.moves({ verbose: true });

  return {
    valid: true,
    fen: chess.fen(),
    details: {
      isCheck: chess.inCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      legalMovesCount: legalMoves.length,
      activeColor: parsed.activeColor,
      halfmove: parsed.halfmove,
      fullmove: parsed.fullmove,
    },
  };
}
