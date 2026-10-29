/**
 * PGN parsing, game replay, navigation, and review reporting.
 */

import { Chess } from 'chess.js';
import { ERROR_CODES, ChessAgentError } from '../../shared/errors.js';
import { STARTING_FEN } from '../../shared/constants.js';

/**
 * Parses header tags from a PGN string.
 * @param {string} pgnString
 * @returns {Record<string, string>}
 */
export function parsePgnHeaders(pgnString) {
  const headers = {};
  const headerRegex = /^\s*\[([A-Za-z0-9_]+)\s+"([^"]*)"\]/gm;
  let match;
  while ((match = headerRegex.exec(pgnString)) !== null) {
    headers[match[1]] = match[2];
  }
  return headers;
}

/**
 * Parses a PGN string into structured game moves and position snapshots.
 *
 * @param {string} pgnString
 * @returns {{
 *   headers: Record<string, string>,
 *   moves: Array<{
 *     ply: number,
 *     moveNumber: number,
 *     color: 'w'|'b',
 *     san: string,
 *     uci: string,
 *     from: string,
 *     to: string,
 *     piece: string,
 *     captured?: string,
 *     promotion?: string,
 *     fenBefore: string,
 *     fenAfter: string,
 *   }>,
 *   result: string,
 *   totalPlies: number
 * }}
 */
export function parsePgn(pgnString) {
  if (!pgnString || typeof pgnString !== 'string' || pgnString.trim().length === 0) {
    throw new ChessAgentError(ERROR_CODES.INVALID_PAYLOAD, 'PGN text cannot be empty');
  }

  const headers = parsePgnHeaders(pgnString);
  const chess = new Chess();

  try {
    chess.loadPgn(pgnString);
  } catch (err) {
    throw new ChessAgentError(ERROR_CODES.INVALID_PAYLOAD, `Failed to parse PGN: ${err.message}`);
  }

  // Extract history by replaying from startpos to capture FEN before & after each move
  const replayChess = new Chess();
  const verboseMoves = chess.history({ verbose: true });
  const snapshots = [];

  for (let i = 0; i < verboseMoves.length; i++) {
    const mv = verboseMoves[i];
    const fenBefore = replayChess.fen();
    replayChess.move(mv);
    const fenAfter = replayChess.fen();

    const ply = i + 1;
    const moveNumber = Math.ceil(ply / 2);

    snapshots.push({
      ply,
      moveNumber,
      color: mv.color,
      san: mv.san,
      uci: `${mv.from}${mv.to}${mv.promotion || ''}`,
      from: mv.from,
      to: mv.to,
      piece: mv.piece,
      captured: mv.captured || null,
      promotion: mv.promotion || null,
      fenBefore,
      fenAfter,
      analysis: null, // Populated during engine review
    });
  }

  return {
    headers,
    moves: snapshots,
    result: headers.Result || chess.header().Result || '*',
    totalPlies: snapshots.length,
  };
}

/**
 * Game Review session manager.
 * Tracks position replay index, attached analysis, and comparative review reports.
 */
export class GameReviewer {
  /**
   * @param {string} pgnString
   */
  constructor(pgnString = null) {
    this.headers = {};
    this.moves = [];
    this.result = '*';
    this.totalPlies = 0;
    this.currentIndex = -1; // -1 represents initial starting position before move 1

    if (pgnString) {
      this.loadPgn(pgnString);
    }
  }

  /**
   * Loads a PGN game into the reviewer.
   * @param {string} pgnString
   */
  loadPgn(pgnString) {
    const parsed = parsePgn(pgnString);
    this.headers = parsed.headers;
    this.moves = parsed.moves;
    this.result = parsed.result;
    this.totalPlies = parsed.totalPlies;
    this.currentIndex = -1;
  }

  /**
   * Returns the current position FEN and metadata.
   */
  getCurrentPosition() {
    if (this.currentIndex === -1 || this.moves.length === 0) {
      return {
        ply: 0,
        moveNumber: 0,
        san: 'Start',
        fen: STARTING_FEN,
        move: null,
      };
    }

    const currentMove = this.moves[this.currentIndex];
    return {
      ply: currentMove.ply,
      moveNumber: currentMove.moveNumber,
      san: currentMove.san,
      fen: currentMove.fenAfter,
      move: currentMove,
    };
  }

  nextMove() {
    if (this.currentIndex < this.moves.length - 1) {
      this.currentIndex++;
    }
    return this.getCurrentPosition();
  }

  previousMove() {
    if (this.currentIndex > -1) {
      this.currentIndex--;
    }
    return this.getCurrentPosition();
  }

  firstMove() {
    this.currentIndex = -1;
    return this.getCurrentPosition();
  }

  lastMove() {
    this.currentIndex = this.moves.length - 1;
    return this.getCurrentPosition();
  }

  goToMove(index) {
    if (index >= -1 && index < this.moves.length) {
      this.currentIndex = index;
    }
    return this.getCurrentPosition();
  }

  /**
   * Attaches engine analysis to a move in the game.
   * @param {number} moveIndex
   * @param {object} analysisResult
   */
  attachAnalysis(moveIndex, analysisResult) {
    if (moveIndex >= 0 && moveIndex < this.moves.length) {
      this.moves[moveIndex].analysis = analysisResult;
    }
  }

  /**
   * Generates a structured summary report of the reviewed game.
   */
  generateSummaryReport() {
    const analyzedMoves = this.moves.filter(m => m.analysis !== null);

    return {
      event: this.headers.Event || 'Chess Game',
      white: this.headers.White || 'White',
      black: this.headers.Black || 'Black',
      result: this.result,
      totalMoves: Math.ceil(this.totalPlies / 2),
      analyzedPositionsCount: analyzedMoves.length,
      moves: this.moves.map(m => ({
        ply: m.ply,
        move: m.san,
        uci: m.uci,
        bestMove: m.analysis?.bestMove || null,
        evalWhite: m.analysis?.evalWhite || null,
        pv: m.analysis?.pvString || null,
      })),
    };
  }

  /**
   * Exports review report as text or JSON.
   * @param {'json'|'text'} [format='json']
   * @returns {string}
   */
  exportReport(format = 'json') {
    const summary = this.generateSummaryReport();
    if (format === 'json') {
      return JSON.stringify(summary, null, 2);
    }

    let report = `Game Review: ${summary.white} vs ${summary.black} (${summary.result})\n`;
    report += `Event: ${summary.event} | Total Moves: ${summary.totalMoves}\n\n`;

    for (const m of summary.moves) {
      const moveLabel = m.ply % 2 !== 0 ? `${Math.ceil(m.ply / 2)}. ${m.move}` : `   ... ${m.move}`;
      const evalStr = m.evalWhite ? ` [Eval: ${m.evalWhite}, Best: ${m.bestMove || '-'}]` : '';
      report += `${moveLabel}${evalStr}\n`;
    }

    return report;
  }
}
