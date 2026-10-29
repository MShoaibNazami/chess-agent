/**
 * Offscreen Document hosting the Stockfish Web Worker and AnalysisController.
 */

import { UciClient } from '../../core/engine/uci-client.js';
import { AnalysisController } from '../../core/analysis/analysis-controller.js';
import {
  MESSAGE_TYPES,
  createSuccessResponse,
  createErrorResponse,
} from '../../shared/messages.js';
import { ERROR_CODES } from '../../shared/errors.js';

let controller = null;
let client = null;

function initEngine() {
  if (controller) return controller;

  // Stockfish single-threaded WASM runner in worker
  const workerUrl = chrome.runtime
    ? chrome.runtime.getURL('engine/stockfish/stockfish.js')
    : '/engine/stockfish/stockfish.js';
  const worker = new Worker(workerUrl);

  const transport = {
    send: cmd => worker.postMessage(cmd),
    onLine: cb => {
      worker.onmessage = e => {
        if (typeof e.data === 'string') {
          cb(e.data);
        }
      };
    },
    onError: cb => {
      worker.onerror = cb;
    },
    terminate: () => {
      worker.terminate();
    },
  };

  client = new UciClient(transport);
  controller = new AnalysisController(client);
  return controller;
}

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message !== 'object') return false;

    if (message.type === MESSAGE_TYPES.ANALYSIS_REQUEST) {
      handleAnalysisRequest(message, sendResponse);
      return true; // asynchronous response
    }

    if (message.type === MESSAGE_TYPES.ANALYSIS_CANCEL) {
      if (controller) {
        controller.cancelAnalysis().then(() => {
          sendResponse(createSuccessResponse(message.id, { cancelled: true }));
        });
      } else {
        sendResponse(createSuccessResponse(message.id, { cancelled: false }));
      }
      return true;
    }

    if (message.type === MESSAGE_TYPES.GET_STATE) {
      const state = controller ? controller.getStatus() : { status: 'idle' };
      sendResponse(createSuccessResponse(message.id, state));
      return false;
    }

    return false;
  });
}

async function handleAnalysisRequest(message, sendResponse) {
  try {
    const c = initEngine();
    const result = await c.requestAnalysis(message.payload);
    sendResponse(createSuccessResponse(message.id, result));
  } catch (err) {
    sendResponse(createErrorResponse(message.id, err, ERROR_CODES.ENGINE_ERROR));
  }
}
