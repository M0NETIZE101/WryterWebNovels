import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { marked } from 'https://esm.sh/marked@12';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { initTheme } from './theme.js';

initTheme();

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const params = new URLSearchParams(location.search);
const slug = params.get('slug');
const number = Number(params.get('n') || 1);

const el = {
  eyebrow: document.getElementById('eyebrow'),
  title: document.getElementById('chapter-title'),
  byline: document.getElementById('byline'),
  content: document.getElementById('content'),
  nav: document.getElementById('chapter-nav'),
  progress: document.getElementById('progress'),
  storyLink: document.getElementById('story-link'),
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => (
  { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
));

/* ---------- load ---------- */
async function load() {
  if (!slug) { el.title.textContent = 'No story selected'; return; }

  const { data: story, error: sErr } = await sb
    .from('stories')
    .select('id,slug,title')
    .eq('slug', slug)
    .single();

  if (sErr || !story) {
    el.title.textContent = 'Story not found';
    el.eyebrow.textContent = '';
    return;
  }

  const { data: chapters, error: cErr } = await sb
    .from('chapters')
    .select('number,title,content,published_at')
    .eq('story_id', story.id)
    .order('number');

  if (cErr || !chapters?.length) {
    el.title.textContent = 'No chapters yet';
    el.eyebrow.textContent = story.title;
    return;
  }

  const idx = Math.max(0, chapters.findIndex(c => c.number === number));
  const ch = chapters[idx];
  const prev = chapters[idx - 1];
  const next = chapters[idx + 1];

  document.title = `${ch.title} — ${story.title}`;
  el.eyebrow.textContent = `${story.title} · Chapter ${ch.number}`;
  el.title.textContent = ch.title;
  el.byline.textContent = new Date(ch.published_at)
    .toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });
  el.content.innerHTML = marked.parse(ch.content);

  el.storyLink.href = `/?story=${encodeURIComponent(slug)}`;
  el.storyLink.textContent = `← ${story.title}`;

  const link = (ch, label) => ch
    ? `<a class="btn ghost" href="?slug=${encodeURIComponent(slug)}&n=${ch.number}">${label}</a>`
    : `<span></span>`;

  el.nav.innerHTML =
    link(prev, `← ${prev ? 'Ch. ' + prev.number : ''}`) +
    link(next, `${next ? 'Ch. ' + next.number : ''} →`);

  // Remember reading position
  localStorage.setItem('wryter-last', JSON.stringify({ slug, n: ch.number }));

  window.scrollTo(0, 0);
  applyReaderPrefs();
}

/* ---------- reading progress ---------- */
function updateProgress() {
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
  el.progress.style.width = pct + '%';
}
document.addEventListener('scroll', updateProgress, { passive: true });

/* ---------- reader preferences ---------- */
const PREF_KEY = 'wryter-reader-prefs';

function getPrefs() {
  return JSON.parse(localStorage.getItem(PREF_KEY) || '{"size":19,"font":"serif"}');
}
function savePrefs(p) { localStorage.setItem(PREF_KEY, JSON.stringify(p)); }

function applyReaderPrefs() {
  const p = getPrefs();
  document.documentElement.style.setProperty('--reader-size', p.size + 'px');
  document.documentElement.style.setProperty(
    '--reader-font',
    p.font === 'sans' ? 'var(--font-ui)' : 'var(--font-serif)'
  );
  document.querySelectorAll('#size-seg button')
    .forEach(b => b.classList.toggle('on', Number(b.dataset.size) === p.size));
  document.querySelectorAll('#font-seg button')
    .forEach(b => b.classList.toggle('on', b.dataset.font === p.font));
}

document.getElementById('size-seg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  savePrefs({ ...getPrefs(), size: Number(b.dataset.size) });
  applyReaderPrefs();
});

document.getElementById('font-seg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  savePrefs({ ...getPrefs(), font: b.dataset.font });
  applyReaderPrefs();
});

document.getElementById('settings-toggle').addEventListener('click', () => {
  document.getElementById('settings-panel').classList.toggle('open');
});

/* ---------- go ---------- */
applyReaderPrefs();
load();
