Chess Agent Extension: Product Requirements and Technical Design

Chess Agent Extension
Product Requirements and Technical Design Document · Version 1.1 · Status: Proposed

Platform

Google Chrome / Chromium (Manifest V3)

Language

JavaScript (ES modules)

Rules library

chess.js

Engine

Stockfish (local, WebAssembly), via UCI

Testing

Vitest (unit, integration), Playwright (browser)

Contents

1. Project Overview
2. Scope and Operating Modes
3. Technology Stack
4. System Architecture
5. Repository and Extension Structure
6. Board Recognition
7. Position Representation
8. Move Detection
9. Stockfish Integration
10. Extension Communication and Security
11. User Interface
12. Error Handling
13. Testing Strategy
14. Privacy and Data Handling
15. Implementation Roadmap
16. Acceptance Criteria
17. Development Workflow
18. Initial Development Task
19. References

Page 1 of 22

Chess Agent Extension: Product Requirements and Technical Design

1. Project Overview
   1.1 Purpose
   Build an independent Chrome extension that helps users understand chess positions. It
   recognizes board positions from authorized sources, validates moves, and runs local
   chess-engine analysis.
   The extension has its own interface and processing logic. It does not modify Chess.com's
   internal code and does not use private APIs.

1.2 Problem Statement
Users need a convenient way to:
Convert a visible chess position into structured data.
Identify which move occurred between two positions.
Confirm that a detected move is legal.
Analyze positions with a chess engine.
Review completed games and understand mistakes.
Test board-recognition technology on controlled pages.

1.3 Product Goals

1. Recognize chessboard squares and pieces accurately.
2. Represent positions in Forsyth–Edwards Notation (FEN).
3. Validate moves and game states with chess.js.
4. Integrate Stockfish through the Universal Chess Interface (UCI).
5. Provide a self-contained extension interface.
6. Process positions locally wherever practical.
7. Offer clear diagnostics when recognition fails.
8. Respect website rules and restrict engine analysis to permitted contexts.

1.4 Non-Goals
The product will not:
Recommend engine moves during live human games where outside assistance is
prohibited.

Page 2 of 22

Chess Agent Extension: Product Requirements and Technical Design

Play moves automatically on Chess.com.
Automate clicks, keystrokes, or game submissions.
Bypass anti-cheat systems, access controls, or private endpoints.
Read authentication cookies or account credentials.
Modify Chess.com's internal application code.
Treat a technically working integration as automatically permitted by the website.

2. Scope and Operating Modes
   2.1 Supported Modes
   Mode

Name

Description

A

Manual Position Analysis

The user enters a FEN or PGN. The extension
validates it, Stockfish evaluates it, and results
appear in the extension panel.

B

Controlled Board
Recognition

The user opens a local or authorized test board.
The extension recognizes the rendered board, the
user confirms the position, and the extension
reports the board state and any detected
transition.

C

Completed Game Review

The user imports a finished PGN. The extension
replays it move by move, analyzes selected
positions, and presents mistakes, alternatives, and
evaluations.

D

Permitted Computer Practice

Analysis is available in a computer game only
where the platform's rules explicitly allow it.
Playing against a bot does not by itself make
analysis permitted, so the applicable rules and
environment must be verified first.

2.2 Mode Restrictions
Reading a board is not the same as providing engine assistance. Recognizing a board does
not authorize engine recommendations during an ongoing game. On Chess.com, live
human games must never receive engine analysis from this extension.

Page 3 of 22

Chess Agent Extension: Product Requirements and Technical Design

If a context cannot be classified reliably, the extension defaults to a non-analysis state
and asks the user to switch to manual analysis, a controlled test board, or a completed
game.

3. Technology Stack
   3.1 Core Technologies
   Technology

Responsibility

JavaScript (ES modules)

Application logic

Chrome Extension Manifest V3

Browser integration

HTML and CSS

Extension interface

chess.js

Legal moves, FEN, PGN, game state

Stockfish (WASM)

Position evaluation and move search

UCI

Engine communication protocol

Chrome Storage API

User preferences, if needed

Vite

Build and bundling

Vitest

Unit and integration tests

Playwright

Controlled browser tests

ESLint and Prettier

Code quality and formatting

3.2 Optional Technologies
A computer-vision library for screenshot-based recognition.
An image-processing module for square and piece classification.
Web Workers for CPU-intensive image processing.
A local test page for synthetic positions.
Do not add computer vision or other dependencies until DOM-based recognition has
been evaluated on a controlled board.

Page 4 of 22

Chess Agent Extension: Product Requirements and Technical Design

3.3 Key Distinction
chess.js is a rules library, not an engine. Stockfish searches positions and evaluates
moves. Board recognition turns visual or structured input into a position that those two
components can process.

4. System Architecture
   4.1 High-Level Data Flow
   Manual FEN / Imported PGN / Controlled Board / Authorized Adapter
   |
   v
   Input Adapter
   |
   v
   Position Parser
   |
   v
   Position Validator
   |
   v
   Game State Store
   |
   v
   Analysis Permission Gate
   |
   v
   Stockfish Worker
   |
   v
   Result Processor
   |
   v
   Extension Interface

4.2 Component Responsibilities
Input Adapter. Accepts manual FEN, imported PGN, controlled test-board data, and
explicitly enabled, authorized board adapters. It must not assume that any website's DOM
structure is stable.

Page 5 of 22

Chess Agent Extension: Product Requirements and Technical Design

Position Parser. Converts input into a normalized representation: piece placement, side to
move, castling rights, en passant square, half-move clock, and full-move number.
Position Validator. Uses chess.js to validate positions and legal move sequences. A
syntactically valid FEN is not necessarily a reachable or legal position, so the validator
performs legality checks and reports unsupported or invalid states.
Game State Store. Maintains the current position, previous position, move history,
position source, recognition confidence, and processing status.
Analysis Permission Gate. Allows engine analysis only in supported contexts. This is a
product safeguard. It is not a substitute for compliance review and does not guarantee
that a website permits a particular use.
Stockfish Worker. Runs the engine locally, receives UCI commands, and returns search
output.
Result Processor. Converts raw engine output into structured results: best move,
evaluation, depth, principal variation, processing time, and error information.
Extension Interface. Displays the input source, recognized position, confidence, analysis
status, engine results, validation errors, and import and export controls.

4.3 Layering Principle
The codebase is split into two layers:
Core contains pure JavaScript with no chrome.* calls and no DOM access. It covers
FEN handling, validation, move detection, UCI parsing, and the permission gate. It runs
in Node, so it can be tested quickly and deterministically.
Extension contains everything that touches the browser: the service worker, content
scripts, UI pages, the offscreen document, and the engine host.
Extension code may import from core. Core must never import from extension.

5. Repository and Extension Structure
   5.1 Recommended Directory Structure
   chess-agent-extension/
   ├── package.json
   ├── vite.config.js
   ├── eslint.config.js

Page 6 of 22

Chess Agent Extension: Product Requirements and Technical Design

├── .prettierrc
├── .editorconfig
├── .gitignore
├── README.md
├── LICENSE
├── THIRD_PARTY_NOTICES.md
│

# chess.js, Stockfish, and other licenses

├── docs/
│
├── PRD.md

# this document

│
│

# permitted contexts and platform rules

├── architecture.md
├── compliance.md

review
│
├── known-limitations.md
│
│

└── decisions/

# short architecture decision records (ADRs)

├── public/
│
├── icons/

# copied to the build output unchanged

# 16, 32, 48, 128 px

│
│

# pinned local WASM build + version notes

└── engine/
└── stockfish/

│
├── src/
│
├── manifest.js
of truth)

# manifest generated from code (single source

│
│

│
├── core/

│
│

│
│

├── chess/
│
├── fen.js

│
│

│
│

│
│

├── position-validator.js
├── position-identity.js

│
│

│
│

│
│

├── move-detector.js
└── pgn.js

│
│

│
│

├── engine/
│
├── uci-client.js

│
│

│
│

│
└── uci-parser.js
├── analysis/

│
│

│
│

│
│

│
│

│
│

│
└── result-formatter.js
└── recognition/

│
│

│
│

├── square-mapper.js
├── confidence.js

│
│

│
│

└── position-differ.js

# pure logic: no chrome.*, no DOM

├── analysis-controller.js
├── permission-gate.js

Page 7 of 22

Chess Agent Extension: Product Requirements and Technical Design

│

├── extension/

# browser-specific code

│
│

│
│

├── background/
│
└── service-worker.js

│
│

│
│

├── content/
│
├── content-script.js

│
│

│
│

│
│

│
│

│
│

├── popup/
│
├── popup.html

│
│

│
│

│
│

│
│

│
│

├── sidepanel/
├── options/

│
│

│
│

│
│

│
│

│
│

├── offscreen/
│
├── offscreen.html

│
│

│
│

│
└── offscreen.js
└── workers/

│
│

│
│

│
│

└── shared/
├── messages.js

│
│

├── schemas.js
├── errors.js

│
│

└── constants.js

└── adapters/
└── test-board-adapter.js

├── popup.css
└── popup.js

# optional: roomier UI for review mode

├── options.html
└── options.js

# hosts the engine worker (see 5.3)

└── stockfish-worker.js

# used by both layers

# message types and builders

# payload validation

├── tests/
│
├── unit/

# mirrors src/core

│
│

├── integration/
├── browser/

# Playwright specs

│
│

├── test-board/
└── fixtures/

# local synthetic chessboard page

# FEN, PGN, and board snapshot data

│
├── scripts/
└── dist/
Chrome

# validate-fen CLI, release packaging, etc.

# build output (git-ignored); load this in

This is the target structure. Create files only when their responsibility is implemented.
Phase 1 needs only core/chess , shared , tests/unit , and the tooling files.

Page 8 of 22

Chess Agent Extension: Product Requirements and Technical Design

5.2 Why This Structure
Decision

Reason

core/ separate from extension/

Chess logic is testable in Node without a browser
and is not tied to Chrome APIs.

public/ for icons and engine files

Large binary and WASM assets stay out of the
bundler and are copied as is.

Manifest generated in

Version, permissions, and entry points stay in
sync with package.json .

src/manifest.js
dist/ as the load target

The loaded extension is always a clean build,
never raw source.

docs/decisions/

Architectural choices are recorded briefly so
they are not re-debated later.

tests/test-board/

The controlled board is a first-class test asset.

THIRD_PARTY_NOTICES.md

Stockfish is GPL-licensed, so redistribution
obligations must be tracked from the start.

5.3 Engine Hosting in Manifest V3
The MV3 service worker is event-driven and can be shut down at any time, so it is a poor
host for a long-running search. Recommended approach:

1. Run the engine in a dedicated Web Worker owned by an offscreen document (or
   directly in the popup or side panel for the first prototype).
2. Let the service worker act only as a message router.
3. Start with a single-threaded WASM build. Multi-threaded builds require cross-origin
   isolation, which adds complexity.
4. Declare wasm-unsafe-eval in the extension's content security policy, because the
   WASM engine needs it. Do not add unsafe-eval .
   The choice between an offscreen document and the popup should be recorded as an ADR
   before Phase 3.

5.4 Manifest V3 Principles
Request only permissions that are actually required.

Page 9 of 22

Chess Agent Extension: Product Requirements and Technical Design

Avoid broad host access. Prefer activeTab or explicit, user-triggered access.
Keep all engine assets bundled locally.
Never load executable JavaScript from remote servers.
Do not request cookie access.
Do not inject scripts into unrelated pages.
The final manifest is written after the input adapter and activation flow are designed.

6. Board Recognition
   6.1 Strategy
   Implement recognition in two stages.
   Stage 1: Structured recognition on a controlled test page. Read the test page's
   documented board representation or stable DOM attributes and map each square to its
   piece.
   Stage 2: Visual recognition. If structured data is unavailable, explore screenshot-based
   recognition on an authorized test board. Visual recognition must identify board
   boundaries, eight files and eight ranks, square orientation, piece identity, empty squares,
   and, optionally, indicators of the side to move.
   Do not assume that a piece's appearance or CSS class is the same across websites.

6.2 Square Mapping
Use standard algebraic coordinates: files a through h, ranks 1 through 8. White's home
rank is rank 1 and Black's is rank 8. The mapping must handle boards displayed from either
player's perspective.

6.3 Recognition Result
The recognizer returns a structured result like this:

Page 10 of 22

Chess Agent Extension: Product Requirements and Technical Design

{
"source": "controlled-test-board",
"orientation": "white-bottom",
"pieces": {
"e1": "K",
"e8": "k",
"e2": "P",
"e7": "p"
},
"confidence": 0.99,
"complete": true
}

This is an illustrative partial position. A real implementation must account for every
occupied and empty square.

6.4 Confidence and Failure Handling
The recognizer must:
Report confidence at both board and piece level.
Detect missing or ambiguous squares.
Reject incomplete board observations.
Never invent pieces to fill gaps.
Ask the user to confirm uncertain positions.
Support manual correction.
Distinguish an unreadable board from an invalid chess position.
A low-confidence recognition is never treated as an authoritative position.

7. Position Representation
   7.1 FEN
   FEN is the standard compact position format. It has six fields:
1. Piece placement
1. Side to move
1. Castling availability
1. En passant target square

Page 11 of 22

Chess Agent Extension: Product Requirements and Technical Design

5. Half-move clock
6. Full-move number
   Starting position:
   rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1

7.2 Validation Steps
Before any analysis:

1. Parse the FEN.
2. Check for eight ranks and eight files per rank.
3. Check that kings and pieces are represented correctly.
4. Validate the side to move and position metadata.
5. Apply relevant legality checks.
6. Reject invalid or unsupported positions with a clear message.

7.3 Position Identity
Do not compare positions by piece placement alone. Side to move, castling rights, en
passant availability, and move counters can all change the legal moves, so two boards with
identical placement may be different positions.

8. Move Detection
   8.1 Objective
   Detect the transition between two valid observed positions.

8.2 Algorithm

1. Store the last confirmed position.
2. Read the new position.
3. Normalize both positions.
4. Generate the legal moves from the previous position.
5. Apply each candidate move to a copy of the previous state.
6. Compare each resulting state with the new observation.

Page 12 of 22

Chess Agent Extension: Product Requirements and Technical Design

7. Accept a move only when exactly one legal candidate matches.
8. If no unique match exists, report the transition as unresolved.
9. Update state only after validation succeeds.

8.3 Special Cases to Test
Normal moves and captures
Castling
En passant
Pawn promotion
A board that changes before an animation finishes
Multiple moves between observations
Orientation changes
A reset or newly loaded game

8.4 Limitation
Two snapshots do not always determine the full game history or metadata. If multiple
candidates match, the recognizer must not guess. It requests another observation, an
imported move history, or user confirmation.

Page 13 of 22

Chess Agent Extension: Product Requirements and Technical Design

8.5 State Machine
NO_POSITION
|
v
POSITION_RECOGNIZED
|
v
POSITION_VALIDATED
|
v
WAITING_FOR_NEW_OBSERVATION
|
v
TRANSITION_DETECTED
|
v
MOVE_VALIDATED
|
v
STATE_UPDATED

On failure, return to a safe waiting state without corrupting the last confirmed position.

9. Stockfish Integration
   9.1 Responsibilities
   Stockfish evaluates a supplied position and searches for strong candidate moves. It is not
   responsible for reading the external board, detecting pieces, deciding whether a page is
   an authorized source, managing the UI, or clicking and playing moves.

9.2 UCI Communication
The engine client must:

1. Start the local engine worker.
2. Send uci and wait for uciok .
3. Send isready and wait for readyok .
4. Send the position.
5. Start a bounded search.

Page 14 of 22

Chess Agent Extension: Product Requirements and Technical Design

6. Parse info and bestmove output.
7. Stop or cancel a search when appropriate.
8. Handle worker termination and engine errors.
   Illustrative commands:
   uci
   isready
   position startpos
   go depth 12

Production code waits for each required response and never assumes the engine is ready
immediately.

9.3 Result Schema
{
"bestMove": "e2e4",
"evaluation": { "type": "cp", "value": 25 },
"depth": 12,
"principalVariation": ["e2e4", "e7e5", "g1f3"],
"status": "complete"
}

This is an example schema. Actual output depends on the position, search settings, and
engine version.

9.4 Evaluation Interpretation
cp is an evaluation in centipawns.
mate is a forced-mate score.

Sign depends on the engine's score perspective. The UI must state whether the
displayed evaluation is from White's or the side-to-move perspective.

9.5 Performance and Licensing
Start with a modest search depth.
Provide a cancel operation.
Do not start duplicate searches for the same position.
Terminate workers when no longer needed.

Page 15 of 22

Chess Agent Extension: Product Requirements and Technical Design

Keep the UI responsive.
Bundle a compatible Stockfish build locally and pin its version.
Verify licensing and redistribution requirements for the chosen engine package.

10. Extension Communication and Security
    10.1 Messaging
    Components communicate by message passing. Example message types:
    BOARD_OBSERVATION

POSITION_VALIDATED

MOVE_DETECTED

ANALYSIS_REQUEST

ANALYSIS_RESULT

ANALYSIS_CANCEL

RECOGNITION_ERROR

ENGINE_ERROR

Every message includes a message type, a request identifier where applicable, a payload
validated against a schema, and a clear success or error result.

10.2 Security Rules
Validate every message that crosses a component boundary.
Treat all data read from a web page as untrusted.
Never execute page-provided strings as code.
Do not expose internal extension functions to page scripts.
Keep engine execution inside the extension's controlled environment.
Do not send board positions to a remote server by default.
Do not store credentials, cookies, or unrelated browsing data.

11. User Interface
    11.1 Main Panel
    Section

Contents

Input

Enter FEN, import PGN, start a controlled board
test, clear the current position

Position

Recognized FEN, board orientation, recognition
confidence, validation status

Page 16 of 22

Chess Agent Extension: Product Requirements and Technical Design

Section

Contents

Move history

Validated moves, unresolved transitions, manual
correction

Analysis

Start analysis (when permitted), engine status,
evaluation, depth, principal variation, cancel, errors
and limitations

Settings

Search limits, recognition preferences, local data
handling, clear saved data

11.2 Interface Principles
Do not modify or obscure the external site's board.
Keep the extension interface separate from the page.
Show clear status labels.
Never present uncertain recognition as fact.
Never display engine recommendations in a prohibited live-game context.
Support keyboard navigation and readable contrast.

12. Error Handling
    Code

Meaning

BOARD_NOT_FOUND

No board detected on the page

BOARD_RECOGNITION_FAILED

Board found but could not be read

AMBIGUOUS_POSITION

Multiple interpretations of the observation

INVALID_FEN

FEN is malformed or illegal

ILLEGAL_MOVE

Move is not legal in the position

UNRESOLVED_TRANSITION

No unique move explains the change

ENGINE_START_FAILED

Engine worker did not start

ENGINE_TIMEOUT

Search exceeded its time limit

ENGINE_TERMINATED

Engine worker ended unexpectedly

Page 17 of 22

Chess Agent Extension: Product Requirements and Technical Design

Code

Meaning

UNSUPPORTED_CONTEXT

Page or mode is not supported

ANALYSIS_NOT_PERMITTED

Analysis is blocked in this context

Errors must be recoverable whenever possible. A recognition failure must not crash the
extension. An engine failure must not erase the last confirmed position. An unsupported
context must not be bypassed by forcing analysis manually.

13. Testing Strategy
    13.1 Unit Tests
    FEN parsing and serialization, board orientation, piece-to-square mapping, move
    validation, position equality, move detection, confidence thresholds, UCI response
    parsing, evaluation formatting, and permission-gate decisions.

13.2 Chess-Rule Tests
Ordinary pawn and knight moves, captures, castling, en passant, promotion, check,
checkmate, stalemate, and invalid positions.

13.3 Integration Tests
A recognized position becomes a valid FEN.
A transition produces the correct move.
A legal position reaches Stockfish.
UCI output becomes a structured result.
Engine timeouts are handled.
Invalid observations do not overwrite confirmed state.
Prohibited contexts cannot start engine analysis.

13.4 Browser Tests
Using the controlled test page: extension activation, board detection, orientation
handling, UI status changes, reload behavior, worker startup and termination, permission
handling, and import and export workflows.

Page 18 of 22

Chess Agent Extension: Product Requirements and Technical Design

13.5 Fixtures
Starting position, midgame, endgame, board from Black's perspective, promotion, castling,
en passant, partially obscured board, ambiguous visual recognition, and two or more
moves between observations.

13.6 Quality Gates
A release candidate must:
Pass all unit, integration, and controlled-browser tests.
Have no unresolved critical security issues.
Reject ambiguous positions safely.
Demonstrate that analysis is disabled in prohibited contexts.
Document its known limitations.
Contain no automated move-playing functionality.

14. Privacy and Data Handling
    14.1 Local-First Design
    Recognition, validation, and analysis run on the user's computer by default. No account
    information or game data is uploaded to a server by default.

14.2 Permissions
Request only the permissions a specific feature requires. Prefer user-initiated access and
narrow host permissions. Do not request unrestricted site access for implementation
convenience.

14.3 Data Retention
Do not retain board observations unless a user-selected feature requires it.
Do not store account identifiers.
Provide a clear-data action if positions or preferences are stored.
Collect no analytics by default.
Document all third-party code and its licenses.

Page 19 of 22

Chess Agent Extension: Product Requirements and Technical Design

15. Implementation Roadmap
    Phase

Focus

Key Work

Deliverable

1

Foundation

Repository, tooling, tests,
chess.js, FEN validation,
command-line validator

Positions validated locally

2

Engine

Pick Stockfish build, UCI client,
bounded searches, evaluation
parsing, failure and timeout
tests

Position in, structured
engine result out

3

Extension shell

MV3 manifest, popup UI,
messaging, engine hosting
(ADR), popup-to-engine
connection

Extension analyzes manually
supplied positions

4

Controlled
recognition

Test board page, adapter,
square mapping, FEN
generation, confidence display

Controlled board recognized

5

Move detection

Confirmed-state store,
observation comparison,
candidate validation, special
and ambiguous moves

Transitions identified
reliably on the test board

6

Game review

PGN import, replay, selective
analysis, played-versus-engine
comparison, report export

Completed games can be
analyzed

7

Hardening and
release

Full test run, permission and
dependency audit, license
check, browser compatibility,
platform-rules review,
documentation

Tested, documented
package

16. Acceptance Criteria
    The first production-quality release is acceptable when:
1. Users can enter and validate a FEN.

Page 20 of 22

Chess Agent Extension: Product Requirements and Technical Design

2. Users can import a completed PGN.
3. Stockfish starts and completes a bounded search.
4. The UI shows structured analysis results.
5. The controlled test board is recognized.
6. Board orientation is handled correctly.
7. Legal moves are detected without guessing.
8. Ambiguous transitions require confirmation.
9. Worker failures do not lose confirmed state.
10. Permissions are minimal and documented.
11. No automated Chess.com move submission exists.
12. Engine analysis is unavailable in prohibited live-game contexts.
13. All required tests pass.
14. Setup, operation, limitations, and troubleshooting are documented.

15. Development Workflow
    Work incrementally rather than generating the whole extension at once. For each phase:
16. Inspect the current repository.
17. Explain the implementation plan.
18. State assumptions, and ask before making uncertain architectural decisions.
19. Implement one phase.
20. Run tests and inspect the actual results.
21. Review errors and edge cases.
22. Update the documentation.
23. Commit the phase separately.
24. Continue only after the phase meets its acceptance criteria.
    Do not introduce unrelated refactors or dependencies without a clear requirement.

25. Initial Development Task
    Start with Phase 1 only. The coding agent must:
    Check the installed Node.js and npm versions.
    Inspect the repository before creating or changing files.

Page 21 of 22

Chess Agent Extension: Product Requirements and Technical Design

Propose the smallest useful project structure (from Section 5.1: src/core/chess ,
src/shared , tests/unit , and tooling files).

Install and verify chess.js.
Implement FEN parsing and validation.
Add tests for valid and invalid inputs.
Demonstrate the result with a sample FEN.
Explain every command and file.
Stop before implementing Stockfish or browser integration.
Do not begin later phases until Phase 1 has been reviewed and approved.

19. References
    Chrome Extensions documentation: https://developer.chrome.com/docs/extensions/
    Manifest V3: https://developer.chrome.com/docs/extensions/develop/
    Chrome permissions:
    https://developer.chrome.com/docs/extensions/develop/concepts/declarepermissions
    chess.js: https://github.com/jhlywa/chess.js
    Stockfish: https://stockfishchess.org/
    Stockfish documentation: https://official-stockfish.github.io/docs/stockfishwiki/Home.html
    Chess.com Fair Play: https://support.chess.com/en/articles/8568369-what-do-i-needto-know-about-fair-play-on-chess-com
    Chess.com cheating rules: https://support.chess.com/en/articles/8583921-whatcounts-as-cheating-on-chess-com
    Review current official policies before enabling any new integration. This document is a
    technical design specification, not a guarantee of approval by Chess.com or a browser
    extension store.

Page 22 of 22


