# Known Limitations and Troubleshooting

## 1. Technical Limitations

### 1.1 Structured DOM Recognition vs Canvas Boards

- **Current Capability**: Structured DOM recognition is implemented and verified for semantic DOM representations containing algebraic coordinates (`data-square="e4"`, `data-piece="P"`), such as the included controlled test harness.
- **Canvas Boards**: Websites rendering pieces onto an un-annotated `<canvas>` element without underlying DOM metadata cannot be parsed using DOM extraction. Rather than guessing or hallucinating missing pieces, the system returns `BOARD_NOT_FOUND` and advises the user to input the position as FEN or PGN.
- **Computer Vision**: Screenshot-based visual recognition is intentionally omitted in this phase to prevent false positives and oversized package binaries.

### 1.2 Single-Threaded Stockfish WASM

- The bundled Stockfish 19 build (`stockfish-19-lite-single.wasm`, 1.8 MB) operates in single-threaded mode.
- Multi-threading requires WebAssembly `SharedArrayBuffer` and `Atomics`, which in Chrome extensions requires Cross-Origin-Opener-Policy (`COOP`) and Cross-Origin-Embedder-Policy (`COEP`) headers.
- Single-threaded execution provides immediate, reliable evaluation up to depth 12–16 within seconds on typical hardware without incurring cross-origin isolation friction.

### 1.3 Move Transition Ambiguity

- When two consecutive observations differ by a move that could legally be produced by multiple actions (e.g. under-promotion where piece appearance is ambiguous), the detector returns `AMBIGUOUS_POSITION` and requests user confirmation rather than assuming a Queen promotion.
- If multiple moves occurred between observation intervals, the transition is flagged as `UNRESOLVED_TRANSITION` and the previous confirmed state is preserved intact.

## 2. Troubleshooting Guide

| Issue                                                | Cause                                                                           | Solution                                                                                    |
| :--------------------------------------------------- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------ |
| **"Engine initialization timed out"**                | WebAssembly initialization delayed or worker crashed.                           | Verify that Chrome supports WebAssembly. Open Options and reset extension state.            |
| **"Illegal position: pawns cannot be on back rank"** | FEN string contains pawns on 1st or 8th rank.                                   | Review FEN string syntax using `pnpm validate-fen "<FEN>"`.                                 |
| **"Engine analysis blocked in this context"**        | Current page URL or mode was classified as a live game or unauthorized context. | Switch to Mode A (Manual FEN), Mode B (Controlled Test Board), or Mode C (Game PGN Review). |
| **"Unresolved Transition"**                          | Board changed abruptly by more than 1 move or animation was in-flight.          | Wait for piece animation to settle, or click "Load Position" to re-sync.                    |
