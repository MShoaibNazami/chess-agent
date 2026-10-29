import { test, expect } from '@playwright/test';

test.describe('Synthetic Chessboard and Extension Interface', () => {
  test('renders 64 squares on synthetic test board and responds to orientation toggle', async ({
    page,
  }) => {
    await page.goto('/tests/test-board/index.html');

    const board = page.locator('#syntheticChessboard');
    await expect(board).toBeVisible();
    await expect(board).toHaveAttribute('data-orientation', 'white-bottom');

    const squares = page.locator('#syntheticChessboard [data-square]');
    await expect(squares).toHaveCount(64);

    // Verify e2 pawn exists in starting position
    const e2Square = page.locator('#syntheticChessboard [data-square="e2"]');
    await expect(e2Square).toHaveAttribute('data-piece', 'P');

    // Click 1. e4 preset
    await page.click('#presetE4');
    const e4Square = page.locator('#syntheticChessboard [data-square="e4"]');
    await expect(e4Square).toHaveAttribute('data-piece', 'P');

    // Flip orientation
    await page.click('#toggleOrientationBtn');
    await expect(board).toHaveAttribute('data-orientation', 'black-bottom');
  });

  test('validates FEN and navigates PGN in the extension popup interface', async ({ page }) => {
    await page.goto('/src/extension/popup/popup.html');

    const fenInput = page.locator('#fenInput');
    await expect(fenInput).toBeVisible();

    // Verify valid badge for starting position
    const validBadge = page.locator('#validationBadge');
    await expect(validBadge).toHaveText('Valid');

    // Enter invalid FEN
    await fenInput.fill('invalid_fen_string');
    await page.click('#loadFenBtn');
    await expect(validBadge).toHaveText('Invalid');

    const statusMsg = page.locator('#statusMessage');
    await expect(statusMsg).toBeVisible();
    await expect(statusMsg).toHaveText(/Syntax error/);

    // Switch to PGN Tab
    await page.click('#tabPgn');
    const pgnInput = page.locator('#pgnInput');
    await expect(pgnInput).toBeVisible();

    // Import game
    const samplePgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 0-1';
    await pgnInput.fill(samplePgn);
    await page.click('#loadPgnBtn');

    const pgnIndicator = page.locator('#pgnMoveIndicator');
    await expect(pgnIndicator).toBeVisible();
    await expect(pgnIndicator).toHaveText('Start');

    // Step forward
    await page.click('#pgnNextBtn');
    await expect(pgnIndicator).toHaveText('1. e4');

    await page.click('#pgnNextBtn');
    await expect(pgnIndicator).toHaveText('2. e5');

    // Step backward
    await page.click('#pgnPrevBtn');
    await expect(pgnIndicator).toHaveText('1. e4');
  });
});
