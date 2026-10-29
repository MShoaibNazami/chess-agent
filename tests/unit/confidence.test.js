import { describe, it, expect } from 'vitest';
import { evaluateObservationConfidence } from '../../src/core/recognition/confidence.js';
import { POSITION_SOURCES } from '../../src/shared/constants.js';

describe('Observation Confidence and Completeness', () => {
  it('accepts a complete observation with valid kings and high confidence', () => {
    const obs = {
      source: POSITION_SOURCES.CONTROLLED_TEST_BOARD,
      pieces: { e1: 'K', e8: 'k', e2: 'P', e7: 'p' },
      confidence: 1.0,
      complete: true,
    };
    const result = evaluateObservationConfidence(obs);
    expect(result.isAcceptable).toBe(true);
    expect(result.requiresConfirmation).toBe(false);
    expect(result.confidence).toBe(1.0);
    expect(result.complete).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('flags observation as requiring confirmation if confidence is below 0.99', () => {
    const obs = {
      source: POSITION_SOURCES.CONTROLLED_TEST_BOARD,
      pieces: { e1: 'K', e8: 'k' },
      confidence: 0.96,
      complete: true,
    };
    const result = evaluateObservationConfidence(obs);
    expect(result.isAcceptable).toBe(true);
    expect(result.requiresConfirmation).toBe(true);
  });

  it('rejects an observation marked incomplete', () => {
    const obs = {
      source: POSITION_SOURCES.CONTROLLED_TEST_BOARD,
      pieces: { e1: 'K', e8: 'k' },
      confidence: 1.0,
      complete: false,
    };
    const result = evaluateObservationConfidence(obs);
    expect(result.isAcceptable).toBe(false);
    expect(result.issues).toContain('Observation explicitly marked incomplete');
  });

  it('rejects an observation missing a White king', () => {
    const obs = {
      source: POSITION_SOURCES.CONTROLLED_TEST_BOARD,
      pieces: { e8: 'k', e2: 'P' },
      confidence: 1.0,
      complete: true,
    };
    const result = evaluateObservationConfidence(obs);
    expect(result.isAcceptable).toBe(false);
    expect(result.issues.some(i => i.includes('Missing or duplicate White king'))).toBe(true);
  });

  it('factors in square-level confidences when provided', () => {
    const obs = {
      source: POSITION_SOURCES.CONTROLLED_TEST_BOARD,
      pieces: { e1: 'K', e8: 'k' },
      confidence: 1.0,
      complete: true,
      squareConfidences: {
        e1: 0.9,
        e8: 0.92,
      },
    };
    const result = evaluateObservationConfidence(obs);
    expect(result.confidence).toBe(0.91);
    expect(result.isAcceptable).toBe(false);
  });
});
