import { describe, it, expect } from 'vitest';
import {
  formatEvaluation,
  formatPrincipalVariation,
  formatAnalysisResult,
} from '../../src/core/analysis/result-formatter.js';
import { EVALUATION_PERSPECTIVE } from '../../src/shared/constants.js';

describe('Result Formatter', () => {
  it('formats positive and negative centipawn evaluations', () => {
    expect(formatEvaluation({ type: 'cp', value: 35 })).toBe('+0.35');
    expect(formatEvaluation({ type: 'cp', value: -120 })).toBe('-1.20');
    expect(formatEvaluation({ type: 'cp', value: 0 })).toBe('0.00');
  });

  it('formats forced mate evaluations', () => {
    expect(formatEvaluation({ type: 'mate', value: 2 })).toBe('#+2');
    expect(formatEvaluation({ type: 'mate', value: -4 })).toBe('#-4');
  });

  it('inverts evaluation when score is White perspective but Black is to move', () => {
    // If Black is to move, Stockfish reported +50 (advantage Black).
    // From White perspective, that is -0.50.
    const evalBlack = { type: 'cp', value: 50 };
    expect(formatEvaluation(evalBlack, EVALUATION_PERSPECTIVE.WHITE, 'b')).toBe('-0.50');
    expect(formatEvaluation(evalBlack, EVALUATION_PERSPECTIVE.SIDE_TO_MOVE, 'b')).toBe('+0.50');
  });

  it('formats principal variation moves', () => {
    expect(formatPrincipalVariation(['e2e4', 'e7e5', 'g1f3'])).toBe('e2e4 e7e5 g1f3');
    expect(formatPrincipalVariation([])).toBe('(none)');
  });

  it('formats complete analysis result object', () => {
    const raw = {
      bestMove: 'e2e4',
      ponderMove: 'e7e5',
      depth: 12,
      nodes: 50000,
      timeMs: 120,
      status: 'complete',
      evaluation: { type: 'cp', value: 45 },
      principalVariation: ['e2e4', 'e7e5'],
    };

    const formatted = formatAnalysisResult(raw, 'w');
    expect(formatted.bestMove).toBe('e2e4');
    expect(formatted.evalWhite).toBe('+0.45');
    expect(formatted.evalSideToMove).toBe('+0.45');
    expect(formatted.pvString).toBe('e2e4 e7e5');
  });
});
