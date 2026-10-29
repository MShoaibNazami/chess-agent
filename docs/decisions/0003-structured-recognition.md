# ADR 0003: Structured DOM Recognition vs Computer Vision

## Status

Accepted

## Context

Recognizing a chessboard from a web browser can theoretically be implemented via:

1. **Structured DOM Recognition**: Extracting semantic square coordinates (`data-square="e4"`) and piece indicators (`data-piece="P"`) from page DOM elements.
2. **Computer Vision / Screen Capture**: Taking tab screenshots via `chrome.tabs.captureVisibleTab`, cropping board boundaries, running image classification or convolutional neural networks (CNNs) to classify pieces and squares.

## Decision

1. We implement **Structured DOM Recognition** as the foundational board recognition engine:
   - Evaluated first on our local controlled synthetic test environment (`tests/test-board/index.html`).
   - Guarantees 100% deterministic accuracy with zero false piece identifications when elements provide algebraic coordinates.
   - Requires zero heavy computer-vision libraries (TensorFlow.js, OpenCV.js) that would inflate extension package size by 50MB+.
   - Eliminates screenshot latency, canvas permission overhead, and GPU contention.
2. **Limitations Documented**:
   - Structured recognition relies on well-defined attributes (`data-square`, `data-piece`, or stable CSS class mappings).
   - If an external site dynamically obfuscates class names or renders on an un-annotated HTML5 `<canvas>`, structured recognition fails gracefully with `BOARD_NOT_FOUND` or `BOARD_RECOGNITION_FAILED` rather than hallucinating pieces.
3. **Computer Vision Deferred**: As required by product specifications, computer vision is deferred until structured recognition is fully validated across all legal move scenarios.

## Consequences

- **Positive**: Extremely fast (<5ms), zero hallucination risk, lightweight footprint, fully testable in headless Vitest and Playwright.
- **Negative**: Unannotated canvas boards cannot be read without manual FEN/PGN entry.
