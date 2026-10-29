# ADR 0001: Engine Hosting Architecture in Chrome Extension Manifest V3

## Status

Accepted

## Context

In Chrome Extension Manifest V3 (MV3), background scripts are implemented as event-driven Service Workers. Service workers can be terminated by the browser at any time after periods of inactivity (typically 30 seconds), making them unsuitable for hosting persistent, computationally intensive WebAssembly processes such as Stockfish search threads.

Additionally, Stockfish compiled to WebAssembly requires:

1. Local execution without downloading remote executable JavaScript (MV3 security mandate).
2. Content Security Policy allowing WebAssembly execution: `script-src 'self' 'wasm-unsafe-eval'`.
3. Non-blocking asynchronous message handling so UI interactions remain responsive.

## Decision

We adopt a hybrid dedicated host architecture:

1. **Engine Runtime**: Stockfish 19 Lite WASM (single-threaded) runs inside an extension Web Worker.
2. **Host Context**:
   - Primary: An MV3 **Offscreen Document** (`src/extension/offscreen/offscreen.html`) manages the Web Worker lifecycle, ensuring searches can proceed even when the extension popup is closed.
   - Fallback/Direct Mode: When the popup is active, it connects directly or routes through the service worker to the offscreen worker.
3. **Threading**: We use a single-threaded WASM build. Multi-threaded Stockfish requires `SharedArrayBuffer` and Cross-Origin Isolation headers (`COOP`/`COEP`), which add significant packaging complexity and manifest friction without being required for standard tactical and positional analysis depths (depth 10–14).
4. **Service Worker Role**: The background service worker acts strictly as a lightweight, stateless message router and lifecycle coordinator.

## Consequences

- **Positive**: Clean separation of concerns; background worker shutdown will not crash or corrupt analysis; popup UI remains 60fps responsive; compliant with Chrome Web Store MV3 review guidelines.
- **Negative**: Offscreen documents require `offscreen` permission in `manifest.json`.
