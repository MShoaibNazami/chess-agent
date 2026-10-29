# Stockfish WebAssembly Engine Asset

- **Version**: Stockfish 19 Lite WASM (Single-Threaded)
- **Source**: `stockfish@19.0.1` npm package (`bin/stockfish-19-lite-single.js`, `bin/stockfish-19-lite-single.wasm`)
- **License**: GNU General Public License v3.0 (GPL-3.0) — see `LICENSE.txt`
- **Execution Target**: Chrome / Chromium Web Worker or Offscreen Document
- **Memory & Threads**: Single-threaded, does not require `SharedArrayBuffer` or Cross-Origin-Isolation (COOP/COEP) headers.
- **CSP Requirement**: `script-src 'self' 'wasm-unsafe-eval'`
- **UCI Protocol**: Standard UCI interface (`uci`, `isready`, `position`, `go`, `stop`, `quit`)
