import { describe, it, expect } from 'vitest';
import {
  parseFen,
  serializeFen,
  validateFenSyntax,
  normalizeFen,
} from '../../src/core/chess/fen.js';
import { STARTING_FEN } from '../../src/shared/constants.js';

describe('FEN Parser and Serializer', () => {
  it('parses the starting position FEN', () => {
    const parsed = parseFen(STARTING_FEN);
    expect(parsed.placement).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    expect(parsed.activeColor).toBe('w');
    expect(parsed.castling).toBe('KQkq');
    expect(parsed.enPassant).toBe('-');
    expect(parsed.halfmove).toBe(0);
    expect(parsed.fullmove).toBe(1);
    expect(parsed.ranks).toHaveLength(8);
  });

  it('normalizes extra whitespace in FEN', () => {
    const raw = '  rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR    w   KQkq   -   0   1  ';
    expect(normalizeFen(raw)).toBe(STARTING_FEN);
    const parsed = parseFen(raw);
    expect(parsed.activeColor).toBe('w');
  });

  it('serializes parsed components back to canonical FEN', () => {
    const parsed = parseFen(STARTING_FEN);
    const serialized = serializeFen(parsed);
    expect(serialized).toBe(STARTING_FEN);
  });

  it('rejects FEN with missing fields', () => {
    const incomplete = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';
    const validation = validateFenSyntax(incomplete);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('must contain exactly 6 space-separated fields');

    expect(() => parseFen(incomplete)).toThrowError();
  });

  it('rejects FEN with fewer than 8 ranks', () => {
    const shortRanks = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1';
    const validation = validateFenSyntax(shortRanks);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('exactly 8 ranks');
  });

  it('rejects FEN with invalid characters in placement', () => {
    const badChar = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPX/RNBQKBNR w KQkq - 0 1';
    const validation = validateFenSyntax(badChar);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain("Invalid character 'X'");
  });

  it('rejects FEN where rank files do not sum to 8', () => {
    const overflowRank = 'rnbqkbnr/pppppppp/9/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const underflowRank = 'rnbqkbnr/pppppppp/7/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(validateFenSyntax(overflowRank).valid).toBe(false);
    expect(validateFenSyntax(underflowRank).valid).toBe(false);
  });

  it('rejects invalid active color', () => {
    const badColor = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1';
    expect(validateFenSyntax(badColor).valid).toBe(false);
  });

  it('rejects invalid castling characters and duplicates', () => {
    const duplicate = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KKkq - 0 1';
    const badChar = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkqX - 0 1';
    expect(validateFenSyntax(duplicate).valid).toBe(false);
    expect(validateFenSyntax(badChar).valid).toBe(false);
  });

  it('rejects en passant coordinates that violate chess geometry', () => {
    // White to move, but en passant square on rank 4 (impossible)
    const badRank = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e4 0 1';
    expect(validateFenSyntax(badRank).valid).toBe(false);
  });

  it('rejects invalid move counter fields', () => {
    const badHalf = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - -1 1';
    const badFull = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0';
    expect(validateFenSyntax(badHalf).valid).toBe(false);
    expect(validateFenSyntax(badFull).valid).toBe(false);
  });
});
