// home.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { initTheme } from './theme.js';

// ---------- boot ----------
initTheme();
document.getElementById('year').textContent = new Date().getFullYear();

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const grid = document.getElementById('story-grid');
const countEl = document.getElementById('story-count');

// ---------- helpers ----------
function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function card(story) {
  const cover = story.cover_url
    ? `<img src="${escapeHtml(story.cover_url)}" alt="" loading="lazy" />`
    : `<div class="ph">${escapeHtml((story.title || 'W')[0])}</div>`;

  const tags = (story.tags || [])
    .slice(0, 2)
    .map(t => `<span class="tag">${escapeHtml(t)}</span>`)
    .join(' ');

  return `
    <a class="card" href="/story.html?slug=${encodeURIComponent(story.slug)}">
      <div class="cover">${cover}</div>
      <h3>${escapeHtml(story.title)}</h3>
      <div class="meta">${tags}</div>
    </a>`;
}

// ---------- load stories ----------
async function load() {
  const { data, error } = await sb
    .from('stories')
    .select('slug,title,cover_url,tags,is_featured,created_at')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Wryter] Supabase error:', error);
    grid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1">
      Couldn't load stories: ${escapeHtml(error.message)}
    </p>`;
    if (countEl) countEl.textContent = '';
    return;
  }

  if (!data || data.length === 0) {
    grid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1">
      No stories published yet.
    </p>`;
    if (countEl) countEl.textContent = '0 stories';
    return;
  }

  grid.innerHTML = data.map(card).join('');
  if (countEl) {
    countEl.textContent = `${data.length} ${data.length === 1 ? 'story' : 'stories'}`;
  }
}

load();
