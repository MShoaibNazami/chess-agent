# Compliance and Fair Play Review Policy

## 1. Ethical Principles & Fair Play

The Chess Agent Extension is designed strictly as a study, analysis, and educational tool. It enforces platform fair-play rules and anti-cheat policies directly within the application architecture.

> [!IMPORTANT]
> The permission gate is enforced in core application logic (`src/core/analysis/permission-gate.js`), not simply hidden behind a disabled UI element. UI actions cannot bypass it.

## 2. Permitted vs Prohibited Operating Modes

| Mode           | Operating Context            | Status                 | Policy Rationale                                                                                                                                               |
| :------------- | :--------------------------- | :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mode A**     | Manual FEN Analysis          | **PERMITTED**          | Pure study of arbitrary positions entered manually by the user.                                                                                                |
| **Mode B**     | Controlled Test Board        | **PERMITTED**          | Developer testing on authorized synthetic test boards (`tests/test-board/index.html`).                                                                         |
| **Mode C**     | Completed Game Review (PGN)  | **PERMITTED**          | Retrospective post-mortem analysis of completed games is standard chess pedagogy and permitted across all platforms.                                           |
| **Mode D**     | Permitted Computer Practice  | **RESTRICTED**         | Analysis is available only where the platform explicitly authorizes assistance. Playing against a bot does **not** grant automatic permission.                 |
| **Prohibited** | Live Human Chess.com Games   | **STRICTLY BLOCKED**   | Under Chess.com Fair Play rules and FIDE regulations, engine recommendations during live human games constitute cheating and are prohibited without exception. |
| **Unknown**    | Unclassified / Uncertain URL | **BLOCKED BY DEFAULT** | If operating context cannot be authoritatively classified as permitted, engine analysis is blocked by default (`UNSUPPORTED_CONTEXT`).                         |

## 3. Product Invariants & Prohibitions

1. **No Automated Gameplay**: The extension never automatically submits moves, clicks squares, or simulates keystrokes.
2. **No Anti-Cheat Bypasses**: The extension never attempts to evade DOM monitoring, tamper with anti-cheat scripts, or access private endpoints.
3. **No Credential Access**: The extension does not read authentication cookies, session tokens, passwords, or profile credentials.
4. **No Remote Code Execution**: All engine binaries and JavaScript modules are stored locally in the extension package (`public/engine/stockfish/`). No remote scripts are evaluated (`eval` and remote URLs are strictly forbidden by CSP).
5. **No Data Exfiltration**: Board positions, analysis logs, and PGN texts remain 100% on the user's local device and are never sent to external servers.
6. **No Unrestricted Host Permissions**: Broad wildcard matches (e.g. `<all_urls>` or `*://*/*`) are omitted from requested permissions.
