# Chess Agent Extension

An independent Chrome / Chromium Manifest V3 extension for chess learning, authorized board recognition, and completed-game analysis powered by a local WebAssembly Stockfish engine.

---

## 1. Features Implemented

- **Local Stockfish Engine (WebAssembly & UCI)**:
  - Bundled local Stockfish 19 Lite WASM engine (`public/engine/stockfish/`).
  - Communicates asynchronously via the Universal Chess Interface (UCI).
  - Supports bounded depth searches, centipawn (`cp`) and forced mate (`mate`) evaluations, principal variations, cancellation, and timeout management.
  - Zero remote executable JavaScript loaded at runtime.
- **Rules & FEN Validation**:
  - Full chess rules validation powered by `chess.js`.
  - Comprehensive syntax and legality checking (king count, back-rank pawn illegality, checkmate, stalemate, check status).
  - CLI FEN validator: `pnpm validate-fen "<FEN>"`.
- **Fair-Play Safeguards & Permission Gate**:
  - Hardcoded non-bypassable permission gate (`src/core/analysis/permission-gate.js`).
  - Strictly blocks engine move recommendations during live human games on Chess.com.
  - Blocks unknown or unclassified contexts by default.
  - Permits manual FEN analysis, completed PGN game review, and controlled local test-board recognition.
- **Controlled Board Recognition**:
  - Semantic DOM recognition on controlled test boards.
  - Coordinate translation supporting both White-at-bottom and Black-at-bottom perspectives.
  - Confidence scoring and completeness verification.
  - Incomplete or uncertain observations are never assumed or guessed.
- **Move Transition Detection**:
  - Detects legal transitions between consecutive observations.
  - Validates candidate moves, captures, castling (kingside/queenside), en passant, and pawn promotions.
  - Preserves the confirmed position if a transition is unresolved or ambiguous.
- **Completed Game Review**:
  - Full PGN import, header parsing, and ply replay.
  - Move-by-move navigation with position snapshots.
  - Selective position analysis and exportable review reports (JSON and text).
- **Chrome Extension Shell (MV3)**:
  - Manifest V3 compliant, generated from code (`src/manifest.js`).
  - Offscreen document engine host (`src/extension/offscreen/`) preventing service worker timeout issues.
  - Accessible popup interface (`src/extension/popup/`), settings page (`src/extension/options/`), and side panel (`src/extension/sidepanel/`).

---

## 2. Technology Stack & Dependencies

- **Runtime & Language**: Node.js v22+, JavaScript with ES Modules (`type: "module"`).
- **Package Manager**: `pnpm` (v12+).
- **Extension Platform**: Google Chrome / Chromium Manifest V3.
- **Dependencies**:
  - `chess.js`: Chess rules, legal move generation, FEN/PGN handling.
  - `stockfish`: Pinned local WebAssembly build (Stockfish 19 Lite Single WASM).
  - `vite`: Fast build tool and module bundler.
  - `vitest`: Unit and integration test runner.
  - `@playwright/test`: Controlled end-to-end browser testing.
  - `eslint` & `prettier`: Code quality, linting, and formatting.

---

## 3. Installation and Setup

Ensure Node.js and pnpm are installed:

```bash
# Verify pnpm is installed
pnpm --version

# Install all dependencies
pnpm install
```

---

## 4. Commands Reference

| Task                  | Command                     | Description                                              |
| :-------------------- | :-------------------------- | :------------------------------------------------------- |
| **All Tests**         | `pnpm test`                 | Runs all 14 unit and integration test suites via Vitest  |
| **Unit Tests**        | `pnpm test:unit`            | Runs unit tests (`tests/unit/`)                          |
| **Integration Tests** | `pnpm test:integration`     | Runs real Stockfish WASM integration tests               |
| **Browser Tests**     | `pnpm test:browser`         | Runs Playwright tests with real Google Chrome            |
| **Lint**              | `pnpm lint`                 | Runs ESLint flat config checks                           |
| **Format Check**      | `pnpm format:check`         | Verifies code styling with Prettier                      |
| **Format Fix**        | `pnpm format`               | Auto-formats codebase with Prettier                      |
| **Production Build**  | `pnpm build`                | Bundles extension into `dist/` and emits `manifest.json` |
| **Dev Server**        | `pnpm dev`                  | Starts Vite dev server with test board                   |
| **Validate FEN**      | `pnpm validate-fen "<FEN>"` | CLI command to parse and validate a FEN position         |

### Example CLI FEN Validation:

```bash
pnpm validate-fen "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
```

---

## 5. How to Load the Extension in Google Chrome

1. Build the production extension package:
   ```bash
   pnpm build
   ```
2. Open Google Chrome and navigate to:
   ```text
   chrome://extensions
   ```
3. Enable **Developer mode** using the toggle switch in the upper-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the **`dist`** directory inside this repository (`/home/work/Desktop/personal/chess-agent/dist`).
6. The **Chess Agent** extension icon will appear in your Chrome toolbar. Click it to open the popup interface!

---

## 6. Permissions and Security Model

The extension requests only minimal permissions:

- **`storage`**: Used exclusively to store user engine preferences (depth, timeout, perspective) locally on your machine.
- **`activeTab`**: Enables user-invoked interactions with the active tab when clicking the extension icon.
- **`offscreen`**: Creates an offscreen document to host the WebAssembly Stockfish engine so long-running searches do not terminate when service workers go idle.
- **Content Security Policy**: `script-src 'self' 'wasm-unsafe-eval'; object-src 'self'`. Evaluates only local bundled WASM without allowing remote script execution.

---

## 7. Architecture Decision Records (ADRs)

- [ADR 0001: Engine Hosting Architecture in MV3](docs/decisions/0001-engine-hosting.md)
- [ADR 0002: Manifest V3 Architecture and Permission Strategy](docs/decisions/0002-manifest-v3-strategy.md)
- [ADR 0003: Structured DOM Recognition vs Computer Vision](docs/decisions/0003-structured-recognition.md)

---

## 8. License & Third-Party Notices

- **Extension Codebase**: Licensed under the [MIT License](LICENSE) (Copyright (c) 2026 MShoaibNazami).
- **Stockfish Engine Asset**: GNU General Public License v3.0 (GPL-3.0) — see `public/engine/stockfish/LICENSE.txt` and `THIRD_PARTY_NOTICES.md`.
- **chess.js**: BSD 2-Clause License.
