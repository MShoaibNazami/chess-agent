import { describe, it, expect } from 'vitest';
import { validatePosition } from '../../src/core/chess/position-validator.js';
import { STARTING_FEN } from '../../src/shared/constants.js';
import { ERROR_CODES } from '../../src/shared/errors.js';

describe('Position Validator', () => {
  it('validates the standard starting position successfully', () => {
    const result = validatePosition(STARTING_FEN);
    expect(result.valid).toBe(true);
    expect(result.details.isCheck).toBe(false);
    expect(result.details.isCheckmate).toBe(false);
    expect(result.details.legalMovesCount).toBe(20);
    expect(result.details.activeColor).toBe('w');
  });

  it("validates a checkmate position (Fool's mate)", () => {
    const foolsMate = 'rnb1kbnr/pppp1ppp/4p3/8/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
    const result = validatePosition(foolsMate);
    expect(result.valid).toBe(true);
    expect(result.details.isCheck).toBe(true);
    expect(result.details.isCheckmate).toBe(true);
    expect(result.details.legalMovesCount).toBe(0);
  });

  it('validates a stalemate position', () => {
    const stalemate = '7k/5K2/6Q1/8/8/8/8/8 b - - 0 1';
    const result = validatePosition(stalemate);
    expect(result.valid).toBe(true);
    expect(result.details.isCheck).toBe(false);
    expect(result.details.isStalemate).toBe(true);
    expect(result.details.legalMovesCount).toBe(0);
  });

  it('rejects a position with pawns on the 8th rank', () => {
    const pawnOn8 = 'rnbqkbnP/pppppppp/8/8/8/8/PPPPPPP1/RNBQKBNR w KQkq - 0 1';
    const result = validatePosition(pawnOn8);
    expect(result.valid).toBe(false);
    expect(result.code).toBe(ERROR_CODES.INVALID_FEN);
    expect(result.error).toContain('pawns cannot be on the 8th rank');
  });

  it('rejects a position with pawns on the 1st rank', () => {
    const pawnOn1 = 'rnbqkbnr/ppppppp1/8/8/8/8/PPPPPPPP/RNBQKBp1 w KQkq - 0 1';
    const result = validatePosition(pawnOn1);
    expect(result.valid).toBe(false);
    expect(result.code).toBe(ERROR_CODES.INVALID_FEN);
    expect(result.error).toContain('pawns cannot be on the 1st rank');
  });

  it('rejects a position without a White king', () => {
    const noWhiteKing = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR w KQkq - 0 1';
    const result = validatePosition(noWhiteKing);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must have exactly 1 White king');
  });

  it('rejects a position with two Black kings', () => {
    const twoBlackKings = 'rnbqkbnr/pppppppk/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const result = validatePosition(twoBlackKings);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must have exactly 1 Black king');
  });

  it('rejects an impossible position where inactive side is in check', () => {
    // White to move, but White queen is directly attacking Black king who is on e8,
    // which would mean Black made a move that left their king under attack
    const inactiveInCheck = '4k3/4Q3/8/8/8/8/8/4K3 w - - 0 1';
    const result = validatePosition(inactiveInCheck);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('side not to move');
  });

  it('rejects positions with more than 8 pawns of one color', () => {
    const fen = 'rnbqkbnr/pppppppp/P7/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const result = validatePosition(fen);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too many White pawns');
  });
});
