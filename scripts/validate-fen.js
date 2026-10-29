#!/usr/bin/env node

/**
 * CLI script to validate a supplied FEN position string.
 * Usage: node scripts/validate-fen.js "<FEN>"
 * Or via pnpm: pnpm validate-fen "<FEN>"
 */

import { validatePosition } from '../src/core/chess/position-validator.js';
import { parseFen } from '../src/core/chess/fen.js';

const fenArg = process.argv.slice(2).join(' ').trim();

if (!fenArg) {
  console.error('Error: Please provide a FEN string to validate.');
  console.error(
    'Example: node scripts/validate-fen.js "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"'
  );
  process.exit(1);
}

console.log(`\nValidating FEN: "${fenArg}"\n`);

const result = validatePosition(fenArg);

if (!result.valid) {
  console.error('RESULT: INVALID');
  console.error(`Code:    ${result.code}`);
  console.error(`Reason:  ${result.error}\n`);
  process.exit(1);
}

const parsed = parseFen(result.fen);

console.log('RESULT: VALID');
console.log('Normalized FEN:       ', result.fen);
console.log('Active Color:         ', parsed.activeColor === 'w' ? 'White' : 'Black');
console.log('Castling Availability:', parsed.castling);
console.log('En Passant Square:    ', parsed.enPassant);
console.log('Halfmove Clock:       ', parsed.halfmove);
console.log('Fullmove Number:      ', parsed.fullmove);

if (result.details) {
  console.log('In Check:             ', result.details.isCheck);
  console.log('Is Checkmate:         ', result.details.isCheckmate);
  console.log('Is Stalemate:         ', result.details.isStalemate);
  console.log('Legal Moves Count:    ', result.details.legalMovesCount);
}

console.log('\nPosition is legal and ready for analysis.\n');
process.exit(0);
