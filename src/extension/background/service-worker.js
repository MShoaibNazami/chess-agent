/**
 * Minimal MV3 Service Worker message router.
 */

import { MESSAGE_TYPES, createErrorResponse } from '../../shared/messages.js';
import { ERROR_CODES } from '../../shared/errors.js';

let creatingOffscreenPromise = null;

async function ensureOffscreenDocument() {
  const offscreenUrl = 'src/extension/offscreen/offscreen.html';

  if (chrome.offscreen?.hasDocument) {
    const hasDoc = await chrome.offscreen.hasDocument();
    if (hasDoc) return;
  }

  if (creatingOffscreenPromise) {
    await creatingOffscreenPromise;
    return;
  }

  creatingOffscreenPromise = chrome.offscreen.createDocument({
    url: offscreenUrl,
    reasons: ['WORKERS'],
    justification: 'Stockfish WebAssembly chess engine execution',
  });

  try {
    await creatingOffscreenPromise;
  } finally {
    creatingOffscreenPromise = null;
  }
}

// Service worker install event
chrome.runtime?.onInstalled?.addListener(() => {
  console.log('[Chess Agent] Extension installed and service worker ready.');
});

// Route messages to offscreen document or other components
chrome.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') return false;

  // Analysis requests or cancels routed to offscreen document
  if (
    message.type === MESSAGE_TYPES.ANALYSIS_REQUEST ||
    message.type === MESSAGE_TYPES.ANALYSIS_CANCEL ||
    message.type === MESSAGE_TYPES.GET_STATE
  ) {
    // If sent from offscreen itself, do not cycle
    if (sender?.url?.includes('offscreen.html')) {
      return false;
    }

    ensureOffscreenDocument()
      .then(() => {
        chrome.runtime.sendMessage(message, response => {
          sendResponse(response);
        });
      })
      .catch(err => {
        sendResponse(
          createErrorResponse(
            message.id,
            `Failed to route to offscreen host: ${err.message}`,
            ERROR_CODES.ENGINE_START_FAILED
          )
        );
      });

    return true; // Keep message channel open for async response
  }

  return false;
});
