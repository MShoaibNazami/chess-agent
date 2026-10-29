/**
 * Move transition detection and state tracking between consecutive observations.
 */

import { Chess } from 'chess.js';
import { ERROR_CODES, ChessAgentError } from '../../shared/errors.js';
import { piecesToPlacement } from '../recognition/square-mapper.js';
import { validatePosition } from './position-validator.js';

export const TRACKER_STATE = Object.freeze({
  NO_POSITION: 'NO_POSITION',
  POSITION_RECOGNIZED: 'POSITION_RECOGNIZED',
  POSITION_VALIDATED: 'POSITION_VALIDATED',
  WAITING_FOR_NEW_OBSERVATION: 'WAITING_FOR_NEW_OBSERVATION',
  TRANSITION_DETECTED: 'TRANSITION_DETECTED',
  MOVE_VALIDATED: 'MOVE_VALIDATED',
  STATE_UPDATED: 'STATE_UPDATED',
  UNRESOLVED: 'UNRESOLVED',
});

/**
 * Detects the legal chess move that occurred between a confirmed previous position and a new observation.
 *
 * @param {string} previousFen - Last confirmed valid FEN string
 * @param {Record<string, string>|string} newObservation - Either piece map { e4: 'P' } or placement string
 * @returns {{
 *   resolved: boolean,
 *   type?: 'MOVE'|'NO_CHANGE'|'RESET',
 *   move?: object,
 *   san?: string,
 *   uci?: string,
 *   newFen?: string,
 *   preservedFen: string,
 *   code?: string,
 *   error?: string,
 *   matchingCandidates?: string[]
 * }}
 */
export function detectTransition(previousFen, newObservation) {
  if (!previousFen || typeof previousFen !== 'string') {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_FEN,
      'Valid previous FEN is required to detect transitions'
    );
  }

  // 1. Normalize observation into piece placement string
  let targetPlacement = '';
  if (typeof newObservation === 'string') {
    targetPlacement = newObservation.split(' ')[0];
  } else if (newObservation && typeof newObservation === 'object') {
    targetPlacement = piecesToPlacement(newObservation);
  } else {
    throw new ChessAgentError(
      ERROR_CODES.INVALID_PAYLOAD,
      'New observation must be a piece map or placement string'
    );
  }

  const prevGame = new Chess(previousFen);
  const prevPlacement = prevGame.fen().split(' ')[0];

  // 2. No change
  if (prevPlacement === targetPlacement) {
    return {
      resolved: true,
      type: 'NO_CHANGE',
      move: null,
      san: null,
      uci: null,
      newFen: previousFen,
      preservedFen: previousFen,
    };
  }

  // 3. Generate all legal moves from previous position
  const legalMoves = prevGame.moves({ verbose: true });
  const matches = [];

  for (const candidate of legalMoves) {
    const simGame = new Chess(previousFen);
    simGame.move(candidate);

    const simPlacement = simGame.fen().split(' ')[0];
    if (simPlacement === targetPlacement) {
      matches.push({
        move: candidate,
        resultingFen: simGame.fen(),
      });
    }
  }

  // 4. Evaluate match count
  if (matches.length === 1) {
    const match = matches[0];
    const mv = match.move;
    const uci = `${mv.from}${mv.to}${mv.promotion || ''}`;

    return {
      resolved: true,
      type: 'MOVE',
      move: mv,
      san: mv.san,
      uci,
      newFen: match.resultingFen,
      preservedFen: match.resultingFen,
    };
  }

  if (matches.length > 1) {
    // Ambiguous move (e.g. multiple promotions produce identical placement if piece is unclear)
    return {
      resolved: false,
      code: ERROR_CODES.AMBIGUOUS_POSITION,
      error: `Ambiguous transition: ${matches.length} candidate moves match the observed change.`,
      matchingCandidates: matches.map(m => m.move.san),
      preservedFen: previousFen,
    };
  }

  // 5. 0 matches - could be a game reset or multiple moves between observations
  return {
    resolved: false,
    code: ERROR_CODES.UNRESOLVED_TRANSITION,
    error: 'No single legal move connects the previous state to the new observation.',
    matchingCandidates: [],
    preservedFen: previousFen,
  };
}

/**
 * State machine managing confirmed positions, move history, and observation updates.
 */
export class GameStateTracker {
  /**
   * @param {string} [initialFen]
   */
  constructor(initialFen = null) {
    this.confirmedFen = null;
    this.moveHistory = []; // Array of { san, uci, fenBefore, fenAfter }
    this.state = TRACKER_STATE.NO_POSITION;
    this.lastUnresolvedError = null;

    if (initialFen) {
      this.setInitialPosition(initialFen);
    }
  }

  /**
   * Sets the initial confirmed position.
   * @param {string} fen
   */
  setInitialPosition(fen) {
    const val = validatePosition(fen);
    if (!val.valid) {
      throw new ChessAgentError(val.code || ERROR_CODES.INVALID_FEN, val.error);
    }
    this.confirmedFen = val.fen;
    this.moveHistory = [];
    this.state = TRACKER_STATE.WAITING_FOR_NEW_OBSERVATION;
    this.lastUnresolvedError = null;
  }

  /**
   * Processes a newly observed position.
   * @param {Record<string, string>|string} newObservation
   * @returns {object} Transition result
   */
  processObservation(newObservation) {
    if (!this.confirmedFen) {
      throw new ChessAgentError(
        ERROR_CODES.UNRESOLVED_TRANSITION,
        'Cannot detect transition: no confirmed previous position in tracker'
      );
    }

    this.state = TRACKER_STATE.TRANSITION_DETECTED;
    const transition = detectTransition(this.confirmedFen, newObservation);

    if (transition.resolved) {
      if (transition.type === 'MOVE') {
        this.moveHistory.push({
          san: transition.san,
          uci: transition.uci,
          fenBefore: this.confirmedFen,
          fenAfter: transition.newFen,
        });
        this.confirmedFen = transition.newFen;
        this.state = TRACKER_STATE.STATE_UPDATED;
      } else if (transition.type === 'NO_CHANGE') {
        this.state = TRACKER_STATE.WAITING_FOR_NEW_OBSERVATION;
      }
      this.lastUnresolvedError = null;
    } else {
      // Preserve confirmed state on failure
      this.state = TRACKER_STATE.UNRESOLVED;
      this.lastUnresolvedError = transition;
    }

    return transition;
  }

  /**
   * Clears game state.
   */
  reset() {
    this.confirmedFen = null;
    this.moveHistory = [];
    this.state = TRACKER_STATE.NO_POSITION;
    this.lastUnresolvedError = null;
  }
}
