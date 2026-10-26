const KEY = 'wryter-theme';

export function initTheme() {
  const saved = localStorage.getItem(KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(saved || (prefersDark ? 'dark' : 'light'));

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      setTheme(next);
      localStorage.setItem(KEY, next);
    });
  }
}

export function setTheme(mode) {
  document.documentElement.dataset.theme = mode;
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = mode === 'dark' ? '☀' : '☾';
}
