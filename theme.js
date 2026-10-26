// theme.js
const KEY = 'wryter-theme';

export function initTheme() {
  // Default to light on first visit — Wryter's primary look is whitish.
  // Once the user toggles, their choice sticks.
  const saved = localStorage.getItem(KEY);
  setTheme(saved === 'dark' ? 'dark' : 'light');

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    // Make sure the icon matches the current theme on load
    syncIcon(btn);

    btn.addEventListener('click', () => {
      const next =
        document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      setTheme(next);
      localStorage.setItem(KEY, next);
    });
  }
}

export function setTheme(mode) {
  document.documentElement.dataset.theme = mode;
  syncIcon(document.getElementById('theme-toggle'));
}

function syncIcon(btn) {
  if (!btn) return;
  const isDark = document.documentElement.dataset.theme === 'dark';
  btn.textContent = isDark ? '☀' : '☾';
  btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}
