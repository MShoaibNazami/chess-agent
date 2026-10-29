/**
 * Central constants for the Chess Agent Extension.
 */

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const COLORS = Object.freeze({
  WHITE: 'w',
  BLACK: 'b',
});

export const PIECE_TYPES = Object.freeze({
  PAWN: 'p',
  KNIGHT: 'n',
  BISHOP: 'b',
  ROOK: 'r',
  QUEEN: 'q',
  KING: 'k',
});

export const ORIENTATIONS = Object.freeze({
  WHITE_BOTTOM: 'white-bottom',
  BLACK_BOTTOM: 'black-bottom',
});

export const POSITION_SOURCES = Object.freeze({
  MANUAL: 'manual',
  PGN_IMPORT: 'pgn-import',
  CONTROLLED_TEST_BOARD: 'controlled-test-board',
  EXTERNAL_BOARD: 'external-board',
});

export const ANALYSIS_STATUS = Object.freeze({
  IDLE: 'idle',
  ANALYZING: 'analyzing',
  COMPLETE: 'complete',
  CANCELLED: 'cancelled',
  ERROR: 'error',
});

export const DEFAULT_ENGINE_LIMITS = Object.freeze({
  depth: 12,
  timeoutMs: 10000,
  multiPv: 1,
});

export const EVALUATION_PERSPECTIVE = Object.freeze({
  WHITE: 'white',
  SIDE_TO_MOVE: 'side-to-move',
});

export const CONFIDENCE_THRESHOLDS = Object.freeze({
  MINIMUM_ACCEPTABLE: 0.95,
  HIGH: 0.99,
});
