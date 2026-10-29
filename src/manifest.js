/**
 * Single source of truth for Chrome Extension Manifest V3 generation.
 */

export function getManifest(pkg = {}) {
  return {
    manifest_version: 3,
    name: 'Chess Agent',
    version: pkg.version || '1.0.0',
    description:
      pkg.description ||
      'Chrome extension for chess learning, authorized board recognition, and completed-game analysis.',
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
    action: {
      default_title: 'Chess Agent',
      default_popup: 'src/extension/popup/popup.html',
      default_icon: {
        16: 'icons/icon-16.png',
        32: 'icons/icon-32.png',
        48: 'icons/icon-48.png',
        128: 'icons/icon-128.png',
      },
    },
    permissions: ['storage', 'activeTab', 'offscreen'],
    background: {
      service_worker: 'src/extension/background/service-worker.js',
      type: 'module',
    },
    options_ui: {
      page: 'src/extension/options/options.html',
      open_in_tab: true,
    },
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    },
    web_accessible_resources: [
      {
        resources: [
          'engine/stockfish/stockfish.js',
          'engine/stockfish/stockfish.wasm',
          'icons/*',
        ],
        matches: ['<all_urls>'],
      },
    ],
  };
}
