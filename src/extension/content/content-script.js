/**
 * Extension Content Script.
 * Operates on controlled test boards only.
 */

import { TestBoardAdapter } from '../adapters/test-board-adapter.js';
import { MESSAGE_TYPES, createMessage } from '../../shared/messages.js';

// Listen for scan requests from popup or background
chrome.runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'SCAN_BOARD') {
    const observation = TestBoardAdapter.scan(document);
    if (observation) {
      sendResponse({ success: true, observation });
    } else {
      sendResponse({ success: false, reason: 'Controlled chessboard element not found on page.' });
    }
    return false;
  }
  return false;
});

// Auto-report observation if on a controlled test board
const initialObs = TestBoardAdapter.scan(document);
if (initialObs) {
  try {
    chrome.runtime?.sendMessage(
      createMessage(MESSAGE_TYPES.BOARD_OBSERVATION, initialObs)
    );
  } catch {
    // Port closed or background not active yet
  }
}
