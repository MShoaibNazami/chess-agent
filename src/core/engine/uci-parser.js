/**
 * Parses raw UCI output from Stockfish.
 */

/**
 * Parses an 'info' line from Stockfish UCI output.
 * Example line:
 * "info depth 6 seldepth 11 multipv 1 score cp 17 nodes 2545 nps 27663 hashfull 0 time 92 pv e2e4 e7e5 g1f3 b8c6 d2d4 e5d4"
 *
 * @param {string} line
 * @returns {Record<string, unknown>|null}
 */
export function parseInfoLine(line) {
  if (!line || !line.startsWith('info ')) {
    return null;
  }

  const tokens = line.trim().split(/\s+/);
  const result = {
    raw: line,
    principalVariation: [],
  };

  let i = 1;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token === 'depth') {
      result.depth = parseInt(tokens[++i], 10);
    } else if (token === 'seldepth') {
      result.seldepth = parseInt(tokens[++i], 10);
    } else if (token === 'multipv') {
      result.multipv = parseInt(tokens[++i], 10);
    } else if (token === 'score') {
      const type = tokens[++i]; // 'cp' or 'mate'
      const val = parseInt(tokens[++i], 10);
      result.evaluation = {
        type: type === 'mate' ? 'mate' : 'cp',
        value: Number.isNaN(val) ? 0 : val,
      };
    } else if (token === 'nodes') {
      result.nodes = parseInt(tokens[++i], 10);
    } else if (token === 'nps') {
      result.nps = parseInt(tokens[++i], 10);
    } else if (token === 'time') {
      result.timeMs = parseInt(tokens[++i], 10);
    } else if (token === 'pv') {
      i++;
      while (i < tokens.length) {
        result.principalVariation.push(tokens[i]);
        i++;
      }
      break;
    } else {
      i++;
    }
  }

  return result;
}

/**
 * Parses a 'bestmove' line from Stockfish UCI output.
 * Example: "bestmove e2e4 ponder e7e5" or "bestmove (none)"
 *
 * @param {string} line
 * @returns {{ bestMove: string, ponderMove: string|null }|null}
 */
export function parseBestMoveLine(line) {
  if (!line || !line.startsWith('bestmove ')) {
    return null;
  }

  const parts = line.trim().split(/\s+/);
  const bestMove = parts[1] || '(none)';
  let ponderMove = null;

  if (parts.length >= 4 && parts[2] === 'ponder') {
    ponderMove = parts[3];
  }

  return {
    bestMove,
    ponderMove,
  };
}

/**
 * Parses an arbitrary engine output line.
 * @param {string} line
 * @returns {{
 *   type: 'uciok'|'readyok'|'info'|'bestmove'|'id'|'option'|'other',
 *   data: unknown
 * }}
 */
export function parseUciLine(line) {
  const trimmed = (line || '').trim();
  if (trimmed === 'uciok' || trimmed.endsWith('uciok')) {
    return { type: 'uciok', data: true };
  }
  if (trimmed === 'readyok' || trimmed.endsWith('readyok')) {
    return { type: 'readyok', data: true };
  }
  if (trimmed.startsWith('bestmove ')) {
    return { type: 'bestmove', data: parseBestMoveLine(trimmed) };
  }
  if (trimmed.startsWith('info ')) {
    return { type: 'info', data: parseInfoLine(trimmed) };
  }
  if (trimmed.startsWith('id ')) {
    return { type: 'id', data: trimmed.substring(3).trim() };
  }
  if (trimmed.startsWith('option ')) {
    return { type: 'option', data: trimmed };
  }
  return { type: 'other', data: trimmed };
}
