/**
 * Controlled Synthetic Test Board Adapter.
 * Reads square and piece attributes exclusively from the documented controlled test-board DOM.
 */

import { POSITION_SOURCES, ORIENTATIONS } from '../../shared/constants.js';

export class TestBoardAdapter {
  /**
   * Scans document for the synthetic chessboard container `#syntheticChessboard`.
   * @param {Document} [doc=document]
   * @returns {{
   *   source: string,
   *   orientation: string,
   *   pieces: Record<string, string>,
   *   confidence: number,
   *   complete: boolean
   * }|null}
   */
  static scan(doc = document) {
    const boardEl = doc.getElementById('syntheticChessboard');
    if (!boardEl) {
      return null;
    }

    const orientation =
      boardEl.getAttribute('data-orientation') === 'black-bottom'
        ? ORIENTATIONS.BLACK_BOTTOM
        : ORIENTATIONS.WHITE_BOTTOM;

    const squares = boardEl.querySelectorAll('[data-square]');
    const pieces = {};
    let squareCount = 0;

    for (const sq of squares) {
      const squareName = sq.getAttribute('data-square');
      const piece = sq.getAttribute('data-piece'); // 'P', 'k', etc. or null
      if (squareName && /^[a-h][1-8]$/.test(squareName)) {
        squareCount++;
        if (piece && /^[prnbqkPRNBQK]$/.test(piece)) {
          pieces[squareName] = piece;
        }
      }
    }

    const complete = squareCount === 64;

    return {
      source: POSITION_SOURCES.CONTROLLED_TEST_BOARD,
      orientation,
      pieces,
      confidence: complete ? 1.0 : 0.5,
      complete,
    };
  }
}
