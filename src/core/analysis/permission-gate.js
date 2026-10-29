/**
 * Analysis Permission Gate.
 * Enforces strict anti-cheat and platform compliance safeguards in application logic.
 */

import { ERROR_CODES, ChessAgentError } from '../../shared/errors.js';
import { POSITION_SOURCES } from '../../shared/constants.js';

export const CONTEXT_TYPES = Object.freeze({
  MANUAL: POSITION_SOURCES.MANUAL,
  PGN_IMPORT: POSITION_SOURCES.PGN_IMPORT,
  CONTROLLED_TEST_BOARD: POSITION_SOURCES.CONTROLLED_TEST_BOARD,
  EXTERNAL_BOARD: POSITION_SOURCES.EXTERNAL_BOARD,
  LIVE_HUMAN_GAME: 'live-human-game',
  BOT_GAME: 'bot-game',
  UNKNOWN: 'unknown',
});

/**
 * Checks whether engine analysis is strictly permitted for the given context.
 *
 * @param {{
 *   source: string,
 *   url?: string,
 *   gameStatus?: 'completed'|'in_progress'|'unknown',
 *   isHumanOpponent?: boolean,
 *   isBotGame?: boolean,
 *   isExplicitlyAuthorized?: boolean
 * }} context
 * @returns {{
 *   permitted: boolean,
 *   code?: string,
 *   reason: string
 * }}
 */
export function checkAnalysisPermission(context) {
  if (!context || typeof context !== 'object') {
    return {
      permitted: false,
      code: ERROR_CODES.UNSUPPORTED_CONTEXT,
      reason: 'No operating context provided. Defaulting to blocked analysis.',
    };
  }

  const {
    source,
    url = '',
    gameStatus = 'unknown',
    isHumanOpponent = false,
    isBotGame = false,
    isExplicitlyAuthorized = false,
  } = context;

  // 1. Explicitly prohibited live human games
  if (
    source === CONTEXT_TYPES.LIVE_HUMAN_GAME ||
    isHumanOpponent ||
    (url.includes('chess.com') &&
      (url.includes('/play/') || url.includes('/live')) &&
      gameStatus === 'in_progress')
  ) {
    return {
      permitted: false,
      code: ERROR_CODES.ANALYSIS_NOT_PERMITTED,
      reason: 'Engine assistance during live human games is strictly prohibited.',
    };
  }

  // 2. Bot games: playing against a bot does NOT grant automatic permission
  if (isBotGame || source === CONTEXT_TYPES.BOT_GAME) {
    if (!isExplicitlyAuthorized) {
      return {
        permitted: false,
        code: ERROR_CODES.ANALYSIS_NOT_PERMITTED,
        reason:
          'Playing against a bot does not automatically authorize engine analysis. Prior platform rule verification required.',
      };
    }
    return {
      permitted: true,
      reason: 'Explicitly authorized bot practice game.',
    };
  }

  // 3. Supported & Permitted Modes:
  // Mode A: Manual Position Analysis
  if (source === POSITION_SOURCES.MANUAL) {
    return {
      permitted: true,
      reason: 'Manual position analysis is permitted.',
    };
  }

  // Mode B: Controlled Test Board
  if (source === POSITION_SOURCES.CONTROLLED_TEST_BOARD) {
    return {
      permitted: true,
      reason: 'Controlled local test board analysis is permitted.',
    };
  }

  // Mode C: Completed Game Review (PGN)
  if (source === POSITION_SOURCES.PGN_IMPORT || gameStatus === 'completed') {
    return {
      permitted: true,
      reason: 'Post-game analysis of completed games is permitted.',
    };
  }

  // Mode D: External board integration (disabled by default)
  if (source === POSITION_SOURCES.EXTERNAL_BOARD) {
    if (!isExplicitlyAuthorized) {
      return {
        permitted: false,
        code: ERROR_CODES.ANALYSIS_NOT_PERMITTED,
        reason:
          'External board integration is disabled by default until explicitly reviewed and authorized.',
      };
    }
    return {
      permitted: true,
      reason: 'Explicitly authorized external board analysis.',
    };
  }

  // 4. Unknown or uncertain context -> block by default
  return {
    permitted: false,
    code: ERROR_CODES.UNSUPPORTED_CONTEXT,
    reason: `Context '${source || 'unknown'}' is unsupported or uncertain. Engine analysis is blocked.`,
  };
}

/**
 * Asserts that analysis is permitted; throws ChessAgentError if blocked.
 * @param {object} context
 */
export function assertAnalysisPermitted(context) {
  const check = checkAnalysisPermission(context);
  if (!check.permitted) {
    throw new ChessAgentError(check.code || ERROR_CODES.ANALYSIS_NOT_PERMITTED, check.reason, {
      context,
    });
  }
}
