import { describe, it, expect } from 'vitest';
import { parsePgn, parsePgnHeaders, GameReviewer } from '../../src/core/chess/pgn.js';
import { STARTING_FEN } from '../../src/shared/constants.js';

const SAMPLE_PGN = `[Event "World Championship"]
[Site "Reykjavik"]
[Date "1972.07.11"]
[White "Spassky, Boris V"]
[Black "Fischer, Robert J"]
[Result "0-1"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 0-1`;

describe('PGN Parser and Game Reviewer', () => {
  it('parses header tags from PGN', () => {
    const headers = parsePgnHeaders(SAMPLE_PGN);
    expect(headers.Event).toBe('World Championship');
    expect(headers.White).toBe('Spassky, Boris V');
    expect(headers.Black).toBe('Fischer, Robert J');
    expect(headers.Result).toBe('0-1');
  });

  it('parses moves, calculates plies, and captures FEN snapshots', () => {
    const parsed = parsePgn(SAMPLE_PGN);
    expect(parsed.totalPlies).toBe(8);
    expect(parsed.result).toBe('0-1');

    // First move 1. e4
    const m1 = parsed.moves[0];
    expect(m1.ply).toBe(1);
    expect(m1.moveNumber).toBe(1);
    expect(m1.color).toBe('w');
    expect(m1.san).toBe('e4');
    expect(m1.uci).toBe('e2e4');
    expect(m1.fenBefore).toBe(STARTING_FEN);
    expect(m1.fenAfter).toContain('4P3');

    // Second move 1... e5
    const m2 = parsed.moves[1];
    expect(m2.ply).toBe(2);
    expect(m2.moveNumber).toBe(1);
    expect(m2.color).toBe('b');
    expect(m2.san).toBe('e5');
  });

  it('rejects empty or invalid PGN text', () => {
    expect(() => parsePgn('')).toThrowError();
    expect(() => parsePgn('1. InvalidMove999')).toThrowError();
  });

  it('navigates through a game with GameReviewer', () => {
    const reviewer = new GameReviewer(SAMPLE_PGN);
    expect(reviewer.currentIndex).toBe(-1);
    expect(reviewer.getCurrentPosition().san).toBe('Start');
    expect(reviewer.getCurrentPosition().fen).toBe(STARTING_FEN);

    // Step forward
    const pos1 = reviewer.nextMove();
    expect(pos1.ply).toBe(1);
    expect(pos1.san).toBe('e4');

    const pos2 = reviewer.nextMove();
    expect(pos2.ply).toBe(2);
    expect(pos2.san).toBe('e5');

    // Step backward
    const back1 = reviewer.previousMove();
    expect(back1.ply).toBe(1);
    expect(back1.san).toBe('e4');

    // Jump to end
    const last = reviewer.lastMove();
    expect(last.ply).toBe(8);
    expect(last.san).toBe('Nf6');

    // Jump to start
    const first = reviewer.firstMove();
    expect(first.ply).toBe(0);
    expect(first.san).toBe('Start');
  });

  it('attaches engine analysis and generates summary review report', () => {
    const reviewer = new GameReviewer(SAMPLE_PGN);

    // Attach analysis to move 1 (1. e4)
    reviewer.attachAnalysis(0, {
      bestMove: 'e2e4',
      evalWhite: '+0.25',
      pvString: 'e2e4 e7e5 g1f3',
    });

    const report = reviewer.generateSummaryReport();
    expect(report.white).toBe('Spassky, Boris V');
    expect(report.black).toBe('Fischer, Robert J');
    expect(report.result).toBe('0-1');
    expect(report.analyzedPositionsCount).toBe(1);
    expect(report.moves[0].bestMove).toBe('e2e4');
    expect(report.moves[0].evalWhite).toBe('+0.25');

    const jsonText = reviewer.exportReport('json');
    expect(jsonText).toContain('"Spassky, Boris V"');

    const textReport = reviewer.exportReport('text');
    expect(textReport).toContain('Spassky, Boris V vs Fischer, Robert J (0-1)');
    expect(textReport).toContain('1. e4 [Eval: +0.25, Best: e2e4]');
  });
});
