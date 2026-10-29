/**
 * Synthetic Chessboard test harness.
 */

import { Chess } from 'chess.js';
import { gridToSquare } from '../../src/core/recognition/square-mapper.js';
import { STARTING_FEN, ORIENTATIONS } from '../../src/shared/constants.js';

const UNICODE_PIECES = {
  K: '♔',
  Q: '♕',
  R: '♖',
  B: '♗',
  N: '♘',
  P: '♙',
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

const PRESETS = {
  startpos: STARTING_FEN,
  e4: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
  e4e5: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
  castling: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
  promotion: '4k3/4P3/8/8/8/8/8/4K3 w - - 0 1',
  endgame: '8/5k2/8/8/8/8/4K1P1/8 w - - 0 1',
  incomplete: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR w - - 0 1', // missing white king
};

let currentOrientation = ORIENTATIONS.WHITE_BOTTOM;
let game = new Chess();

const boardEl = document.getElementById('syntheticChessboard');
const orientationLabel = document.getElementById('orientationLabel');
const currentFenLabel = document.getElementById('currentFenLabel');
const toggleOrientationBtn = document.getElementById('toggleOrientationBtn');
const manualMoveInput = document.getElementById('manualMoveInput');
const applyMoveBtn = document.getElementById('applyMoveBtn');

export function initTestBoard() {
  renderBoard();
  bindControls();
}

export function setPosition(fen) {
  try {
    game.load(fen);
  } catch {
    // If incomplete position for test purposes
  }
  currentFenLabel.textContent = fen;
  renderBoard(fen);
}

export function renderBoard(customFen) {
  const fen = customFen || game.fen();
  boardEl.innerHTML = '';
  boardEl.setAttribute('data-orientation', currentOrientation);
  orientationLabel.textContent = currentOrientation;
  currentFenLabel.textContent = fen;

  const placement = fen.split(' ')[0];
  const ranks = placement.split('/');

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const squareName = gridToSquare(row, col, currentOrientation);
      const isLight = (row + col) % 2 === 0;

      const squareDiv = document.createElement('div');
      squareDiv.className = `square ${isLight ? 'light' : 'dark'}`;
      squareDiv.setAttribute('data-square', squareName);

      // Find piece on this square
      const rankIdx = 8 - parseInt(squareName[1], 10);
      const fileIdx = squareName.charCodeAt(0) - 'a'.charCodeAt(0);

      const rankStr = ranks[rankIdx];
      let currentFile = 0;
      let pieceChar = null;

      if (rankStr) {
        for (const ch of rankStr) {
          if (ch >= '1' && ch <= '8') {
            currentFile += parseInt(ch, 10);
          } else {
            if (currentFile === fileIdx) {
              pieceChar = ch;
              break;
            }
            currentFile += 1;
          }
        }
      }

      if (pieceChar) {
        squareDiv.setAttribute('data-piece', pieceChar);
        squareDiv.textContent = UNICODE_PIECES[pieceChar] || pieceChar;
      }

      boardEl.appendChild(squareDiv);
    }
  }
}

function bindControls() {
  toggleOrientationBtn?.addEventListener('click', () => {
    currentOrientation =
      currentOrientation === ORIENTATIONS.WHITE_BOTTOM
        ? ORIENTATIONS.BLACK_BOTTOM
        : ORIENTATIONS.WHITE_BOTTOM;
    renderBoard();
  });

  document
    .getElementById('presetStartpos')
    ?.addEventListener('click', () => setPosition(PRESETS.startpos));
  document.getElementById('presetE4')?.addEventListener('click', () => setPosition(PRESETS.e4));
  document.getElementById('presetE4E5')?.addEventListener('click', () => setPosition(PRESETS.e4e5));
  document
    .getElementById('presetCastling')
    ?.addEventListener('click', () => setPosition(PRESETS.castling));
  document
    .getElementById('presetPromotion')
    ?.addEventListener('click', () => setPosition(PRESETS.promotion));
  document
    .getElementById('presetEndgame')
    ?.addEventListener('click', () => setPosition(PRESETS.endgame));
  document
    .getElementById('presetIncomplete')
    ?.addEventListener('click', () => setPosition(PRESETS.incomplete));

  applyMoveBtn?.addEventListener('click', () => {
    const moveStr = manualMoveInput.value.trim();
    if (!moveStr) return;
    try {
      game.move(moveStr);
      manualMoveInput.value = '';
      renderBoard();
    } catch (err) {
      alert(`Invalid move: ${err.message}`);
    }
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initTestBoard);
}
