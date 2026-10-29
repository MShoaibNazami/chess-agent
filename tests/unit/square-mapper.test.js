import { describe, it, expect } from 'vitest';
import {
  toSquare,
  fromSquare,
  gridToSquare,
  piecesToPlacement,
} from '../../src/core/recognition/square-mapper.js';
import { ORIENTATIONS } from '../../src/shared/constants.js';

describe('Square Mapper and Coordinates', () => {
  it('converts file and rank indices to algebraic coordinates', () => {
    expect(toSquare(0, 0)).toBe('a1');
    expect(toSquare(4, 3)).toBe('e4');
    expect(toSquare(7, 7)).toBe('h8');
  });

  it('parses algebraic coordinates into indices', () => {
    expect(fromSquare('a1')).toEqual({ fileIndex: 0, rankIndex: 0, file: 'a', rank: '1' });
    expect(fromSquare('e4')).toEqual({ fileIndex: 4, rankIndex: 3, file: 'e', rank: '4' });
    expect(fromSquare('h8')).toEqual({ fileIndex: 7, rankIndex: 7, file: 'h', rank: '8' });
  });

  it('translates grid row and column for White-at-bottom orientation', () => {
    // Top-left is a8 (row 0, col 0)
    expect(gridToSquare(0, 0, ORIENTATIONS.WHITE_BOTTOM)).toBe('a8');
    // Top-right is h8 (row 0, col 7)
    expect(gridToSquare(0, 7, ORIENTATIONS.WHITE_BOTTOM)).toBe('h8');
    // Bottom-left is a1 (row 7, col 0)
    expect(gridToSquare(7, 0, ORIENTATIONS.WHITE_BOTTOM)).toBe('a1');
    // Bottom-right is h1 (row 7, col 7)
    expect(gridToSquare(7, 7, ORIENTATIONS.WHITE_BOTTOM)).toBe('h1');
    // Center e4: row 4, col 4
    expect(gridToSquare(4, 4, ORIENTATIONS.WHITE_BOTTOM)).toBe('e4');
  });

  it('translates grid row and column for Black-at-bottom orientation', () => {
    // Top-left is h1 (row 0, col 0)
    expect(gridToSquare(0, 0, ORIENTATIONS.BLACK_BOTTOM)).toBe('h1');
    // Top-right is a1 (row 0, col 7)
    expect(gridToSquare(0, 7, ORIENTATIONS.BLACK_BOTTOM)).toBe('a1');
    // Bottom-left is h8 (row 7, col 0)
    expect(gridToSquare(7, 0, ORIENTATIONS.BLACK_BOTTOM)).toBe('h8');
    // Bottom-right is a8 (row 7, col 7)
    expect(gridToSquare(7, 7, ORIENTATIONS.BLACK_BOTTOM)).toBe('a8');
  });

  it('converts a piece map to standard FEN placement', () => {
    const startposPieces = {
      a8: 'r',
      b8: 'n',
      c8: 'b',
      d8: 'q',
      e8: 'k',
      f8: 'b',
      g8: 'n',
      h8: 'r',
      a7: 'p',
      b7: 'p',
      c7: 'p',
      d7: 'p',
      e7: 'p',
      f7: 'p',
      g7: 'p',
      h7: 'p',
      a2: 'P',
      b2: 'P',
      c2: 'P',
      d2: 'P',
      e2: 'P',
      f2: 'P',
      g2: 'P',
      h2: 'P',
      a1: 'R',
      b1: 'N',
      c1: 'B',
      d1: 'Q',
      e1: 'K',
      f1: 'B',
      g1: 'N',
      h1: 'R',
    };
    const placement = piecesToPlacement(startposPieces);
    expect(placement).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
  });
});
