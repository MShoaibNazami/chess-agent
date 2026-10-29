import { describe, it, expect } from 'vitest';
import {
  arePositionsEqual,
  haveIdenticalPlacement,
  getPositionKey,
} from '../../src/core/chess/position-identity.js';

describe('Position Identity and Comparison', () => {
  const baseFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const blackToMoveFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1';
  const noCastlingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
  const diffCountersFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 4 10';

  it('identifies identical positions as equal', () => {
    expect(arePositionsEqual(baseFen, baseFen)).toBe(true);
  });

  it('distinguishes positions with different side to move', () => {
    expect(arePositionsEqual(baseFen, blackToMoveFen)).toBe(false);
    expect(haveIdenticalPlacement(baseFen, blackToMoveFen)).toBe(true);
  });

  it('distinguishes positions with different castling rights', () => {
    expect(arePositionsEqual(baseFen, noCastlingFen)).toBe(false);
    expect(haveIdenticalPlacement(baseFen, noCastlingFen)).toBe(true);
  });

  it('ignores move counters for standard position equality (3-fold repetition style)', () => {
    expect(arePositionsEqual(baseFen, diffCountersFen)).toBe(true);
  });

  it('respects strict mode when comparing move counters', () => {
    expect(arePositionsEqual(baseFen, diffCountersFen, { strict: true })).toBe(false);
  });

  it('generates consistent position keys', () => {
    const key1 = getPositionKey(baseFen);
    const key2 = getPositionKey(diffCountersFen);
    expect(key1).toBe(key2);
  });
});
