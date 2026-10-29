/**
 * Stockfish Web Worker wrapper.
 * Runs inside an extension Worker context, interfacing with local Stockfish WASM.
 */

/* global importScripts, postMessage */

try {
  // Load local single-threaded Stockfish WASM wrapper
  const engineUrl = new URL('../../public/engine/stockfish/stockfish.js', import.meta.url).href;
  importScripts(engineUrl);
} catch {
  try {
    importScripts('/engine/stockfish/stockfish.js');
  } catch (err) {
    postMessage({ type: 'error', message: `Failed to load Stockfish engine: ${err.message}` });
  }
}

// In stockfish.js worker mode, onmessage is wired by the engine or listens here:
self.addEventListener('message', event => {
  const data = event.data;
  if (typeof data === 'string') {
    // Forward UCI command
    if (typeof self.Stockfish === 'function') {
      // If module export
    }
  }
});
