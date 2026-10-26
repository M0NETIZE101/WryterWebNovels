// story.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { initTheme } from './theme.js';

initTheme();
document.getElementById('year').textContent = new Date().getFullYear();

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const params = new URLSearchParams(location.search);
const slug = params.get('slug');

const el = {
  cover: document.getElementById('story-cover'),
  info: document.getElementById('story-info'),
  list: document.getElementById('chapter-list'),
  count: document.getElementById('chapter-count'),
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const fmtDate = d => d
  ? new Date(d).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  : '';

/* ---------- error view ---------- */
function showError(title, msg) {
  document.title = `${title} — Wryter`;
  if (el.cover) el.cover.remove();
  if (el.list) el.list.innerHTML = '';
  if (el.count) el.count.textContent = '';
  el.info.innerHTML = `
    <h1>${esc(title)}</h1>
    <p class="synopsis">${esc(msg)}</p>
    <a href="./" class="btn">← Back to stories</a>
  `;
}

/* ---------- load ---------- */
async function load() {
  if (!slug) {
    return showError(
      'No story selected',
      'Open a story from the homepage to read it.'
    );
  }

  const { data: story, error: sErr } = await sb
    .from('stories')
    .select('id,slug,title,synopsis,cover_url,tags,status,created_at')
    .eq('slug', slug)
    .single();

  if (sErr || !story) {
    console.error('[Wryter] story fetch:', sErr);
    return showError(
      'Story not found',
      `No story with slug "${slug}". Check the URL or return to the homepage.`
    );
  }

  const { data: chapters, error: cErr } = await sb
    .from('chapters')
    .select('number,title,published_at')
    .eq('story_id', story.id)
    .eq('is_published', true)
    .order('number');

  if (cErr) console.error('[Wryter] chapter fetch:', cErr);

  render(story, chapters || []);
}

/* ---------- render ---------- */
function render(story, chapters) {
  document.title = `${story.title} — Wryter`;

  // Cover
  if (story.cover_url) {
    el.cover.innerHTML =
      `<img src="${esc(story.cover_url)}" alt="${esc(story.title)} cover" />`;
  } else {
    el.cover.innerHTML =
      `<div style="width:100%;height:100%;display:grid;place-items:center;
       font-family:var(--font-display);font-size:64px;color:var(--text-muted)">
        ${esc((story.title || 'W')[0])}
      </div>`;
  }

  // Tags + status
  const tags = (story.tags || [])
    .map(t => `<span class="tag">${esc(t)}</span>`)
    .join(' ');
  const status = story.status
    ? `<span class="tag amber">${esc(story.status)}</span>`
    : '';

  const firstCh = chapters[0];
  const lastCh  = chapters[chapters.length - 1];
  const readUrl = n =>
    `read.html?slug=${encodeURIComponent(story.slug)}&n=${n}`;

  const actions = chapters.length
    ? `<div style="display:flex;gap:12px;flex-wrap:wrap">
         <a class="btn" href="${readUrl(firstCh.number)}">Start reading</a>
         ${chapters.length > 1
           ? `<a class="btn ghost" href="${readUrl(lastCh.number)}">
                Latest · Ch. ${lastCh.number}
              </a>`
           : ''}
       </div>`
    : `<p style="color:var(--text-muted)">No chapters published yet.</p>`;

  el.info.innerHTML = `
    <div class="tags">${status} ${tags}</div>
    <h1>${esc(story.title)}</h1>
    <p class="synopsis">${esc(story.synopsis || 'No synopsis yet.')}</p>
    ${actions}
  `;

  // Chapter list
  el.count.textContent = chapters.length
    ? `${chapters.length} ${chapters.length === 1 ? 'chapter' : 'chapters'}`
    : '';

  if (chapters.length) {
    el.list.innerHTML = chapters.map(c => `
      <li>
        <a href="${readUrl(c.number)}">
          <span class="num">${c.number}</span>
          <span class="t">${esc(c.title)}</span>
          <span class="d">${fmtDate(c.published_at)}</span>
        </a>
      </li>
    `).join('');
  } else {
    el.list.innerHTML =
      `<li style="padding:16px 4px;color:var(--text-muted)">No chapters yet.</li>`;
  }
}

load();
