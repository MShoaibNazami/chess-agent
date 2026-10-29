import { describe, it, expect } from 'vitest';
import { diffPieceMaps } from '../../src/core/recognition/position-differ.js';

describe('Position Differ', () => {
  it('identifies identical piece maps with zero changes', () => {
    const pieces = { e1: 'K', e8: 'k', e2: 'P' };
    const diff = diffPieceMaps(pieces, pieces);
    expect(diff.isIdentical).toBe(true);
    expect(diff.changedCount).toBe(0);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
  });

  it('identifies a single piece move (e.g. e2 to e4)', () => {
    const oldPieces = { e1: 'K', e8: 'k', e2: 'P' };
    const newPieces = { e1: 'K', e8: 'k', e4: 'P' };

    const diff = diffPieceMaps(oldPieces, newPieces);
    expect(diff.isIdentical).toBe(false);
    expect(diff.changedCount).toBe(2);
    expect(diff.removed).toEqual([{ square: 'e2', piece: 'P' }]);
    expect(diff.added).toEqual([{ square: 'e4', piece: 'P' }]);
  });

  it('identifies a capture move (e.g. exd5)', () => {
    const oldPieces = { e1: 'K', e8: 'k', e4: 'P', d5: 'p' };
    const newPieces = { e1: 'K', e8: 'k', d5: 'P' };

    const diff = diffPieceMaps(oldPieces, newPieces);
    expect(diff.removed).toEqual(
      expect.arrayContaining([
        { square: 'e4', piece: 'P' },
        { square: 'd5', piece: 'p' },
      ])
    );
    expect(diff.added).toEqual([{ square: 'd5', piece: 'P' }]);
  });
});
