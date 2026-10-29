import { describe, it, expect } from 'vitest';
import {
  parseInfoLine,
  parseBestMoveLine,
  parseUciLine,
} from '../../src/core/engine/uci-parser.js';

describe('UCI Output Parser', () => {
  it('parses an info line with centipawn score and PV', () => {
    const line =
      'info depth 6 seldepth 11 multipv 1 score cp 17 nodes 2545 nps 27663 hashfull 0 time 92 pv e2e4 e7e5 g1f3';
    const parsed = parseInfoLine(line);
    expect(parsed.depth).toBe(6);
    expect(parsed.seldepth).toBe(11);
    expect(parsed.multipv).toBe(1);
    expect(parsed.evaluation).toEqual({ type: 'cp', value: 17 });
    expect(parsed.nodes).toBe(2545);
    expect(parsed.nps).toBe(27663);
    expect(parsed.timeMs).toBe(92);
    expect(parsed.principalVariation).toEqual(['e2e4', 'e7e5', 'g1f3']);
  });

  it('parses an info line with a forced mate score', () => {
    const line = 'info depth 12 score mate -2 nodes 1234 pv f7f8q e8f8';
    const parsed = parseInfoLine(line);
    expect(parsed.evaluation).toEqual({ type: 'mate', value: -2 });
    expect(parsed.principalVariation).toEqual(['f7f8q', 'e8f8']);
  });

  it('parses a bestmove line with ponder move', () => {
    const line = 'bestmove e2e4 ponder e7e5';
    const parsed = parseBestMoveLine(line);
    expect(parsed.bestMove).toBe('e2e4');
    expect(parsed.ponderMove).toBe('e7e5');
  });

  it('parses a bestmove line without ponder move', () => {
    const line = 'bestmove e2e4';
    const parsed = parseBestMoveLine(line);
    expect(parsed.bestMove).toBe('e2e4');
    expect(parsed.ponderMove).toBeNull();
  });

  it('parses special bestmove (none)', () => {
    const line = 'bestmove (none)';
    const parsed = parseBestMoveLine(line);
    expect(parsed.bestMove).toBe('(none)');
    expect(parsed.ponderMove).toBeNull();
  });

  it('categorizes general UCI lines', () => {
    expect(parseUciLine('uciok').type).toBe('uciok');
    expect(parseUciLine('readyok').type).toBe('readyok');
    expect(parseUciLine('id name Stockfish').type).toBe('id');
    expect(parseUciLine('option name Threads type spin').type).toBe('option');
  });
});
