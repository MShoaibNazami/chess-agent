import { describe, it, expect, afterAll } from 'vitest';
import stockfishPkg from 'stockfish';
import { UciClient } from '../../src/core/engine/uci-client.js';
import { AnalysisController } from '../../src/core/analysis/analysis-controller.js';
import { POSITION_SOURCES } from '../../src/shared/constants.js';

describe('Local Stockfish Engine Integration', () => {
  let sfInstance;
  let client;
  let controller;

  afterAll(() => {
    if (client) {
      client.terminate();
    }
  });

  it('initializes real Stockfish WASM engine and analyzes starting position', async () => {
    sfInstance = stockfishPkg('lite-single');
    const transport = {
      send: cmd => sfInstance.processCommand(cmd),
      onLine: cb => {
        sfInstance.listener = cb;
      },
      onError: cb => {
        sfInstance.printErr = cb;
      },
      terminate: () => {
        sfInstance.terminate();
      },
    };

    client = new UciClient(transport);
    await client.init(10000);

    controller = new AnalysisController(client);

    const result = await controller.requestAnalysis({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      context: { source: POSITION_SOURCES.MANUAL },
      depth: 4,
      timeoutMs: 10000,
    });

    expect(result.status).toBe('complete');
    expect(result.bestMove).toBeTruthy();
    expect(result.bestMove.length).toBe(4);
    expect(typeof result.evalWhite).toBe('string');
    expect(result.depth).toBeGreaterThanOrEqual(1);
    expect(result.principalVariation.length).toBeGreaterThan(0);
  }, 15000);
});
