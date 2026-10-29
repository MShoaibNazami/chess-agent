/**
 * Options page controller for user preferences.
 */

const defaultDepthEl = document.getElementById('defaultDepth');
const timeoutLimitEl = document.getElementById('timeoutLimit');
const evalPerspectiveEl = document.getElementById('evalPerspective');
const saveBtn = document.getElementById('saveBtn');
const saveStatus = document.getElementById('saveStatus');
const clearDataBtn = document.getElementById('clearDataBtn');
const dataStatus = document.getElementById('dataStatus');

const STORAGE_KEY = 'chess_agent_settings';

export async function loadSettings() {
  if (chrome.storage?.local) {
    chrome.storage.local.get([STORAGE_KEY], result => {
      const settings = result[STORAGE_KEY] || {};
      applySettings(settings);
    });
  } else {
    // LocalStorage fallback for standalone testing
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) applySettings(JSON.parse(raw));
    } catch {
      // Ignore fallback error
    }
  }
}

function applySettings(settings) {
  if (settings.depth) defaultDepthEl.value = String(settings.depth);
  if (settings.timeoutSeconds) timeoutLimitEl.value = String(settings.timeoutSeconds);
  if (settings.perspective) evalPerspectiveEl.value = settings.perspective;
}

export async function saveSettings() {
  const settings = {
    depth: parseInt(defaultDepthEl.value, 10) || 12,
    timeoutSeconds: parseInt(timeoutLimitEl.value, 10) || 10,
    perspective: evalPerspectiveEl.value || 'white',
  };

  if (chrome.storage?.local) {
    chrome.storage.local.set({ [STORAGE_KEY]: settings }, () => {
      showStatus(saveStatus, 'Settings saved!');
    });
  } else {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      showStatus(saveStatus, 'Settings saved locally!');
    } catch {
      showStatus(saveStatus, 'Failed to save settings');
    }
  }
}

export function clearData() {
  if (chrome.storage?.local) {
    chrome.storage.local.clear(() => {
      showStatus(dataStatus, 'Local data cleared!');
    });
  } else {
    try {
      localStorage.clear();
      showStatus(dataStatus, 'Local data cleared!');
    } catch {
      showStatus(dataStatus, 'Failed to clear data');
    }
  }
}

function showStatus(element, text) {
  element.textContent = text;
  element.classList.remove('hidden');
  setTimeout(() => {
    element.classList.add('hidden');
  }, 2500);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    saveBtn?.addEventListener('click', saveSettings);
    clearDataBtn?.addEventListener('click', clearData);
  });
}
