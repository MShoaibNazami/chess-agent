import { describe, it, expect } from 'vitest';
import {
  checkAnalysisPermission,
  assertAnalysisPermitted,
  CONTEXT_TYPES,
} from '../../src/core/analysis/permission-gate.js';
import { ERROR_CODES } from '../../src/shared/errors.js';
import { POSITION_SOURCES } from '../../src/shared/constants.js';

describe('Analysis Permission Gate', () => {
  it('permits manual FEN analysis', () => {
    const result = checkAnalysisPermission({ source: POSITION_SOURCES.MANUAL });
    expect(result.permitted).toBe(true);
    expect(() => assertAnalysisPermitted({ source: POSITION_SOURCES.MANUAL })).not.toThrow();
  });

  it('permits controlled synthetic test board analysis', () => {
    const result = checkAnalysisPermission({ source: POSITION_SOURCES.CONTROLLED_TEST_BOARD });
    expect(result.permitted).toBe(true);
    expect(() =>
      assertAnalysisPermitted({ source: POSITION_SOURCES.CONTROLLED_TEST_BOARD })
    ).not.toThrow();
  });

  it('permits completed game PGN review', () => {
    const result = checkAnalysisPermission({
      source: POSITION_SOURCES.PGN_IMPORT,
      gameStatus: 'completed',
    });
    expect(result.permitted).toBe(true);
  });

  it('strictly blocks engine analysis during live human games on Chess.com', () => {
    const liveContext = {
      source: CONTEXT_TYPES.LIVE_HUMAN_GAME,
      url: 'https://www.chess.com/play/online',
      gameStatus: 'in_progress',
      isHumanOpponent: true,
    };
    const result = checkAnalysisPermission(liveContext);
    expect(result.permitted).toBe(false);
    expect(result.code).toBe(ERROR_CODES.ANALYSIS_NOT_PERMITTED);
    expect(result.reason).toContain('live human games');

    expect(() => assertAnalysisPermitted(liveContext)).toThrowError();
  });

  it('blocks analysis in bot games unless explicitly authorized', () => {
    const unauthorizedBot = {
      source: CONTEXT_TYPES.BOT_GAME,
      isBotGame: true,
      isExplicitlyAuthorized: false,
    };
    const check1 = checkAnalysisPermission(unauthorizedBot);
    expect(check1.permitted).toBe(false);
    expect(check1.code).toBe(ERROR_CODES.ANALYSIS_NOT_PERMITTED);

    const authorizedBot = {
      source: CONTEXT_TYPES.BOT_GAME,
      isBotGame: true,
      isExplicitlyAuthorized: true,
    };
    const check2 = checkAnalysisPermission(authorizedBot);
    expect(check2.permitted).toBe(true);
  });

  it('blocks external-board integration by default until explicitly authorized', () => {
    const externalDefault = {
      source: POSITION_SOURCES.EXTERNAL_BOARD,
      isExplicitlyAuthorized: false,
    };
    const check1 = checkAnalysisPermission(externalDefault);
    expect(check1.permitted).toBe(false);
    expect(check1.code).toBe(ERROR_CODES.ANALYSIS_NOT_PERMITTED);

    const externalAuthorized = {
      source: POSITION_SOURCES.EXTERNAL_BOARD,
      isExplicitlyAuthorized: true,
    };
    const check2 = checkAnalysisPermission(externalAuthorized);
    expect(check2.permitted).toBe(true);
  });

  it('blocks unknown or uncertain contexts by default', () => {
    const unknownContext = { source: 'unrecognized_page' };
    const result = checkAnalysisPermission(unknownContext);
    expect(result.permitted).toBe(false);
    expect(result.code).toBe(ERROR_CODES.UNSUPPORTED_CONTEXT);
  });
});
