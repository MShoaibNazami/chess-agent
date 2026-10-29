import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import {
  detectTransition,
  GameStateTracker,
  TRACKER_STATE,
} from '../../src/core/chess/move-detector.js';
import { STARTING_FEN } from '../../src/shared/constants.js';
import { ERROR_CODES } from '../../src/shared/errors.js';

describe('Move Detector and State Tracker', () => {
  it('detects a normal pawn move (1. e4)', () => {
    const afterE4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const result = detectTransition(STARTING_FEN, afterE4);

    expect(result.resolved).toBe(true);
    expect(result.type).toBe('MOVE');
    expect(result.san).toBe('e4');
    expect(result.uci).toBe('e2e4');
    expect(result.newFen).toBe(afterE4);
  });

  it('detects a knight move (1... Nc6)', () => {
    const fenAfterE4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
    const fenAfterNc6 = 'r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2';

    const result = detectTransition(fenAfterE4, fenAfterNc6);
    expect(result.resolved).toBe(true);
    expect(result.san).toBe('Nc6');
    expect(result.uci).toBe('b8c6');
  });

  it('detects a piece capture', () => {
    // White pawn on e4 captures Black pawn on d5
    const beforeCapture = 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
    const afterCapture = 'rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2';

    const result = detectTransition(beforeCapture, afterCapture);
    expect(result.resolved).toBe(true);
    expect(result.san).toBe('exd5');
  });

  it('detects kingside castling (O-O)', () => {
    const readyCastle = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    const game = new Chess(readyCastle);
    game.move('O-O');
    const afterCastle = game.fen();

    const result = detectTransition(readyCastle, afterCastle);
    expect(result.resolved).toBe(true);
    expect(result.san).toBe('O-O');
    expect(result.uci).toBe('e1g1');
  });

  it('detects queenside castling (O-O-O)', () => {
    const readyCastle = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    const game = new Chess(readyCastle);
    game.move('O-O-O');
    const afterCastle = game.fen();

    const result = detectTransition(readyCastle, afterCastle);
    expect(result.resolved).toBe(true);
    expect(result.san).toBe('O-O-O');
    expect(result.uci).toBe('e1c1');
  });

  it('detects en passant pawn capture', () => {
    // 1. e4 c5 2. e5 d5 3. exd6 (en passant)
    const beforeEnPassant = 'rnbqkbnr/pp2pppp/8/2ppP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3';
    const game = new Chess(beforeEnPassant);
    game.move('exd6');
    const afterEnPassant = game.fen();

    const result = detectTransition(beforeEnPassant, afterEnPassant);
    expect(result.resolved).toBe(true);
    expect(result.san).toBe('exd6');
  });

  it('detects pawn promotion to Queen', () => {
    const readyPromotion = '8/4P3/4k3/8/8/8/8/4K3 w - - 0 1';
    const game = new Chess(readyPromotion);
    game.move({ from: 'e7', to: 'e8', promotion: 'q' });
    const afterPromotion = game.fen();

    const result = detectTransition(readyPromotion, afterPromotion);
    expect(result.resolved).toBe(true);
    expect(result.san).toBe('e8=Q+');
    expect(result.uci).toBe('e7e8q');
  });

  it('returns NO_CHANGE when observed placement is identical', () => {
    const result = detectTransition(STARTING_FEN, STARTING_FEN);
    expect(result.resolved).toBe(true);
    expect(result.type).toBe('NO_CHANGE');
    expect(result.move).toBeNull();
  });

  it('returns UNRESOLVED_TRANSITION when piece moves illegally', () => {
    // Rook jumps like a knight
    const illegalPlacement = '1nbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    const result = detectTransition(STARTING_FEN, illegalPlacement);

    expect(result.resolved).toBe(false);
    expect(result.code).toBe(ERROR_CODES.UNRESOLVED_TRANSITION);
    expect(result.preservedFen).toBe(STARTING_FEN);
  });

  it('returns UNRESOLVED_TRANSITION when multiple moves occurred between observations', () => {
    // Two full moves played in one gap
    const afterTwoMoves = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2';
    const result = detectTransition(STARTING_FEN, afterTwoMoves);

    expect(result.resolved).toBe(false);
    expect(result.code).toBe(ERROR_CODES.UNRESOLVED_TRANSITION);
    expect(result.preservedFen).toBe(STARTING_FEN);
  });

  it('GameStateTracker preserves confirmed state on unresolved transitions', () => {
    const tracker = new GameStateTracker(STARTING_FEN);
    expect(tracker.confirmedFen).toBe(STARTING_FEN);
    expect(tracker.state).toBe(TRACKER_STATE.WAITING_FOR_NEW_OBSERVATION);

    // Apply valid move 1. e4
    const afterE4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const res1 = tracker.processObservation(afterE4);
    expect(res1.resolved).toBe(true);
    expect(tracker.confirmedFen).toBe(afterE4);
    expect(tracker.moveHistory).toHaveLength(1);
    expect(tracker.state).toBe(TRACKER_STATE.STATE_UPDATED);

    // Apply invalid transition
    const badObservation = '8/8/8/8/8/8/8/8';
    const res2 = tracker.processObservation(badObservation);
    expect(res2.resolved).toBe(false);
    // Verified invariant: last confirmed position must NOT be erased or corrupted
    expect(tracker.confirmedFen).toBe(afterE4);
    expect(tracker.moveHistory).toHaveLength(1);
    expect(tracker.state).toBe(TRACKER_STATE.UNRESOLVED);
  });
});
