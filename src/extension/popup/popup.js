/**
 * Extension Popup UI controller.
 */

import {
  STARTING_FEN,
  ORIENTATIONS,
  EVALUATION_PERSPECTIVE,
  POSITION_SOURCES,
} from '../../shared/constants.js';
import { validatePosition } from '../../core/chess/position-validator.js';
import { parseFen } from '../../core/chess/fen.js';
import { checkAnalysisPermission } from '../../core/analysis/permission-gate.js';
import { MESSAGE_TYPES, createMessage } from '../../shared/messages.js';

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

// State
let currentFen = STARTING_FEN;
let currentOrientation = ORIENTATIONS.WHITE_BOTTOM;
let currentPerspective = EVALUATION_PERSPECTIVE.WHITE;
let currentSource = POSITION_SOURCES.MANUAL;
let isAnalyzing = false;
let currentAnalysisResult = null;

// DOM Elements
const tabManual = document.getElementById('tabManual');
const tabPgn = document.getElementById('tabPgn');
const tabBoard = document.getElementById('tabBoard');
const manualContainer = document.getElementById('manualInputContainer');
const pgnContainer = document.getElementById('pgnInputContainer');
const boardContainer = document.getElementById('boardInputContainer');

const fenInput = document.getElementById('fenInput');
const loadFenBtn = document.getElementById('loadFenBtn');
const startposBtn = document.getElementById('startposBtn');
const clearBtn = document.getElementById('clearBtn');
const flipBoardBtn = document.getElementById('flipBoardBtn');

const miniBoard = document.getElementById('miniBoard');
const validationBadge = document.getElementById('validationBadge');
const permissionBadge = document.getElementById('permissionBadge');
const engineBadge = document.getElementById('engineBadge');
const statusMessage = document.getElementById('statusMessage');

const metaActiveColor = document.getElementById('metaActiveColor');
const metaCastling = document.getElementById('metaCastling');
const metaEnPassant = document.getElementById('metaEnPassant');
const metaConfidence = document.getElementById('metaConfidence');

const analyzeBtn = document.getElementById('analyzeBtn');
const cancelAnalyzeBtn = document.getElementById('cancelAnalyzeBtn');
const depthSelect = document.getElementById('depthSelect');
const prohibitedNotice = document.getElementById('prohibitedNotice');
const togglePerspectiveBtn = document.getElementById('togglePerspectiveBtn');
const perspLabel = document.getElementById('perspLabel');

const evalScore = document.getElementById('evalScore');
const evalBestMove = document.getElementById('evalBestMove');
const evalPv = document.getElementById('evalPv');
const openOptionsBtn = document.getElementById('openOptionsBtn');

// Initialize UI
export function initPopup() {
  bindEvents();
  loadPosition(STARTING_FEN);
  checkPermissions();
}

function bindEvents() {
  tabManual?.addEventListener('click', () => switchTab(POSITION_SOURCES.MANUAL));
  tabPgn?.addEventListener('click', () => switchTab(POSITION_SOURCES.PGN_IMPORT));
  tabBoard?.addEventListener('click', () => switchTab(POSITION_SOURCES.CONTROLLED_TEST_BOARD));

  loadFenBtn?.addEventListener('click', () => {
    const val = fenInput.value.trim();
    if (val) loadPosition(val);
  });

  fenInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = fenInput.value.trim();
      if (val) loadPosition(val);
    }
  });

  startposBtn?.addEventListener('click', () => loadPosition(STARTING_FEN));
  clearBtn?.addEventListener('click', () => {
    fenInput.value = '';
    clearResults();
  });

  flipBoardBtn?.addEventListener('click', () => {
    currentOrientation =
      currentOrientation === ORIENTATIONS.WHITE_BOTTOM
        ? ORIENTATIONS.BLACK_BOTTOM
        : ORIENTATIONS.WHITE_BOTTOM;
    renderBoard(currentFen);
  });

  togglePerspectiveBtn?.addEventListener('click', () => {
    currentPerspective =
      currentPerspective === EVALUATION_PERSPECTIVE.WHITE
        ? EVALUATION_PERSPECTIVE.SIDE_TO_MOVE
        : EVALUATION_PERSPECTIVE.WHITE;
    perspLabel.textContent = currentPerspective === EVALUATION_PERSPECTIVE.WHITE ? 'White' : 'Side';
    updateEvaluationDisplay();
  });

  analyzeBtn?.addEventListener('click', startAnalysis);
  cancelAnalyzeBtn?.addEventListener('click', cancelAnalysis);

  openOptionsBtn?.addEventListener('click', () => {
    if (chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('../options/options.html');
    }
  });
}

function switchTab(source) {
  currentSource = source;
  tabManual.classList.toggle('active', source === POSITION_SOURCES.MANUAL);
  tabPgn.classList.toggle('active', source === POSITION_SOURCES.PGN_IMPORT);
  tabBoard.classList.toggle('active', source === POSITION_SOURCES.CONTROLLED_TEST_BOARD);

  manualContainer.classList.toggle('hidden', source !== POSITION_SOURCES.MANUAL);
  pgnContainer.classList.toggle('hidden', source !== POSITION_SOURCES.PGN_IMPORT);
  boardContainer.classList.toggle('hidden', source !== POSITION_SOURCES.CONTROLLED_TEST_BOARD);

  checkPermissions();
}

function checkPermissions() {
  const check = checkAnalysisPermission({ source: currentSource });
  if (check.permitted) {
    permissionBadge.textContent = 'Permitted';
    permissionBadge.className = 'badge badge-permitted';
    prohibitedNotice.classList.add('hidden');
    analyzeBtn.disabled = false;
  } else {
    permissionBadge.textContent = 'Blocked';
    permissionBadge.className = 'badge badge-blocked';
    prohibitedNotice.textContent = `⚠️ ${check.reason}`;
    prohibitedNotice.classList.remove('hidden');
    analyzeBtn.disabled = true;
  }
}

export function loadPosition(fen) {
  const result = validatePosition(fen);
  currentFen = fen;
  fenInput.value = fen;

  if (result.valid) {
    validationBadge.textContent = 'Valid';
    validationBadge.className = 'badge badge-valid';
    hideStatus();

    const parsed = parseFen(result.fen);
    metaActiveColor.textContent = parsed.activeColor === 'w' ? 'White' : 'Black';
    metaCastling.textContent = parsed.castling;
    metaEnPassant.textContent = parsed.enPassant;
    metaConfidence.textContent = '100%';

    renderBoard(result.fen);
  } else {
    validationBadge.textContent = 'Invalid';
    validationBadge.className = 'badge badge-invalid';
    showStatus(result.error || 'Invalid FEN position', 'error');
  }
}

export function renderBoard(fen) {
  if (!miniBoard) return;
  miniBoard.innerHTML = '';

  const parsed = parseFen(fen);
  const ranks = parsed.ranks; // 8 strings from rank 8 down to 1

  const rankIndices =
    currentOrientation === ORIENTATIONS.WHITE_BOTTOM
      ? [0, 1, 2, 3, 4, 5, 6, 7]
      : [7, 6, 5, 4, 3, 2, 1, 0];
  const fileIndices =
    currentOrientation === ORIENTATIONS.WHITE_BOTTOM
      ? [0, 1, 2, 3, 4, 5, 6, 7]
      : [7, 6, 5, 4, 3, 2, 1, 0];

  for (const rIdx of rankIndices) {
    const rankStr = ranks[rIdx];
    // Expand rank squares
    const squares = [];
    for (const ch of rankStr) {
      if (ch >= '1' && ch <= '8') {
        const count = parseInt(ch, 10);
        for (let i = 0; i < count; i++) squares.push(null);
      } else {
        squares.push(ch);
      }
    }

    for (const fIdx of fileIndices) {
      const piece = squares[fIdx];
      const isLight = (rIdx + fIdx) % 2 === 0;

      const squareDiv = document.createElement('div');
      squareDiv.className = `board-square ${isLight ? 'square-light' : 'square-dark'}`;
      if (piece) {
        squareDiv.textContent = UNICODE_PIECES[piece] || piece;
      }
      miniBoard.appendChild(squareDiv);
    }
  }
}

async function startAnalysis() {
  if (isAnalyzing) return;
  const perm = checkAnalysisPermission({ source: currentSource });
  if (!perm.permitted) {
    showStatus(perm.reason, 'error');
    return;
  }

  isAnalyzing = true;
  analyzeBtn.classList.add('hidden');
  cancelAnalyzeBtn.classList.remove('hidden');
  engineBadge.textContent = 'Searching...';
  engineBadge.className = 'badge badge-analyzing';

  const depth = parseInt(depthSelect.value, 10) || 12;

  const msg = createMessage(MESSAGE_TYPES.ANALYSIS_REQUEST, {
    fen: currentFen,
    depth,
    context: { source: currentSource },
  });

  try {
    if (chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(msg, response => {
        handleAnalysisResponse(response);
      });
    } else {
      // In standalone / non-extension test mode
      showStatus('Engine analysis requested (mocked in browser standalone mode)', 'success');
      setTimeout(() => {
        isAnalyzing = false;
        analyzeBtn.classList.remove('hidden');
        cancelAnalyzeBtn.classList.add('hidden');
        engineBadge.textContent = 'Engine Idle';
        engineBadge.className = 'badge badge-idle';
      }, 1000);
    }
  } catch (err) {
    showStatus(`Failed to send analysis request: ${err.message}`, 'error');
    resetAnalysisUi();
  }
}

function handleAnalysisResponse(response) {
  resetAnalysisUi();
  if (response?.success && response.data) {
    currentAnalysisResult = response.data;
    updateEvaluationDisplay();
    showStatus('Analysis complete', 'success');
  } else {
    const errorMsg = response?.error?.message || 'Engine analysis failed';
    showStatus(errorMsg, 'error');
  }
}

function updateEvaluationDisplay() {
  if (!currentAnalysisResult) return;
  const score =
    currentPerspective === EVALUATION_PERSPECTIVE.WHITE
      ? currentAnalysisResult.evalWhite
      : currentAnalysisResult.evalSideToMove;

  evalScore.textContent = score || '+0.00';
  evalBestMove.textContent = currentAnalysisResult.bestMove || '--';
  evalPv.textContent = currentAnalysisResult.pvString || '--';
}

function cancelAnalysis() {
  if (chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage(createMessage(MESSAGE_TYPES.ANALYSIS_CANCEL));
  }
  resetAnalysisUi();
  showStatus('Analysis cancelled', 'success');
}

function resetAnalysisUi() {
  isAnalyzing = false;
  analyzeBtn.classList.remove('hidden');
  cancelAnalyzeBtn.classList.add('hidden');
  engineBadge.textContent = 'Engine Idle';
  engineBadge.className = 'badge badge-idle';
}

function clearResults() {
  evalScore.textContent = '+0.00';
  evalBestMove.textContent = '--';
  evalPv.textContent = '--';
  currentAnalysisResult = null;
}

function showStatus(text, type = 'info') {
  statusMessage.textContent = text;
  statusMessage.className = `status-box status-${type}`;
  statusMessage.classList.remove('hidden');
}

function hideStatus() {
  statusMessage.classList.add('hidden');
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initPopup);
}
