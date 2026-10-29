# ADR 0002: Manifest V3 Architecture and Permission Strategy

## Status

Accepted

## Context

Chrome Web Store enforcement of Manifest V3 (MV3) mandates strict security guidelines:

1. No remotely hosted executable code (`eval`, `new Function`, or loading remote scripts).
2. Principle of least privilege: permissions must be minimal and strictly justified.
3. Content scripts should avoid broad wildcard matches (`*://*/*`) to protect user privacy.
4. Background scripts must run as ES module service workers.

## Decision

1. **Single Source of Truth**: The extension manifest is defined dynamically in `src/manifest.js` and emitted into `dist/manifest.json` during the Vite production build.
2. **Minimal Permissions**:
   - `storage`: Preserves user preferences (engine depth, evaluation perspective) and cached review games locally.
   - `activeTab`: Enables user-invoked interactions with authorized active tabs without requesting blanket domain access.
   - `offscreen`: Grants creation of offscreen documents required for long-running WebAssembly Stockfish computations.
3. **No Blanket Host Permissions**: We do not request `<all_urls>` or unrestricted host permissions in `permissions` or `host_permissions`.
4. **Local Engine Execution**: Engine code is bundled locally under `public/engine/stockfish/` and executed using `wasm-unsafe-eval` without violating CSP.

## Consequences

- **Positive**: Clean extension security review profile; minimal attack surface; privacy-respecting by default; fast installation and loading.
- **Negative**: Analysis of external pages requires explicit user action.
