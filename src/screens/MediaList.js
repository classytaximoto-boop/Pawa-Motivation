import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AppHeader } from '../components/AppHeader.js';
import { mediaCategories, mediaCategoryMap } from '../data/mediaCategories.js';
import { mediaPlaylists, mediaPlaylistMap } from '../data/mediaPlaylists.js';

// État local de filtre (mémoire vive de l'écran, pas persistée)
let activeCategory = 'toutes';
let activePlaylist = 'toutes';
let favoritesOnly = false;

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function itemCard(item) {
  const cat = mediaCategoryMap[item.category] ?? mediaCategoryMap.autre;
  const playlistMeta = item.playlist ? mediaPlaylistMap[item.playlist] : null;
  const card = document.createElement('button');
  card.className = 'card goal-card';
  card.style.textAlign = 'left';
  card.innerHTML = `
    <div class="goal-card__top">
      <div>
        <div class="goal-card__title-row">
          ${item.favorite ? icons.heartFill.replace('<svg ', '<svg style="width:14px;height:14px;stroke:var(--ember-500);color:var(--ember-500)" ') : ''}
          <span class="goal-card__name" style="${item.consumed ? 'text-decoration:line-through;opacity:.6' : ''}">${item.title || 'Sans titre'}</span>
        </div>
        <div class="goal-card__meta-row">
          <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon]}${cat.label}</span>
          ${playlistMeta ? `<span class="chip">${playlistMeta.label}</span>` : ''}
          <span class="chip">${fmtDate(item.createdAt)}</span>
          ${item.consumed ? `<span class="chip">${icons.check}Terminé</span>` : ''}
        </div>
      </div>
    </div>
  `;
  card.addEventListener('click', () => router.navigate(`/media/${item.id}`));
  return card;
}

export function MediaList() {
  const items = store.listMediaItems();
  const el = document.createElement('div');
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen';

  const filtered = items
    .filter((m) => (activeCategory === 'toutes' ? true : m.category === activeCategory))
    .filter((m) => (activePlaylist === 'toutes' ? true : m.playlist === activePlaylist))
    .filter((m) => (favoritesOnly ? m.favorite : true));

  screen.innerHTML = `
    <div class="screen-title-row"><h1>Media</h1></div>

    <button type="button" class="card next-action" id="voice-btn" style="width:100%; text-align:left; margin-bottom:var(--sp-4);">
      <span class="next-action__icon">${icons.mic}</span>
      <span class="next-action__body">
        <span class="next-action__title">My Own Motivation</span>
        <span class="next-action__meta">Enregistre tes propres messages</span>
      </span>
      <span class="next-action__chevron">${icons.chevronRight}</span>
    </button>

    <div class="category-scroll" id="cat-scroll">
      <button class="category-chip ${activeCategory === 'toutes' ? 'is-active' : ''}" data-cat="toutes">Tous</button>
      ${mediaCategories.map((c) => `
        <button class="category-chip ${activeCategory === c.id ? 'is-active' : ''}" data-cat="${c.id}">${icons[c.icon]}${c.label}</button>
      `).join('')}
      <button class="category-chip ${favoritesOnly ? 'is-active' : ''}" id="fav-filter-btn">${icons.heartFill}Favoris</button>
    </div>

    <div class="category-scroll" id="playlist-scroll" style="margin-top:var(--sp-2)">
      <button class="category-chip ${activePlaylist === 'toutes' ? 'is-active' : ''}" data-playlist="toutes">Toutes playlists</button>
      ${mediaPlaylists.map((p) => `
        <button class="category-chip ${activePlaylist === p.id ? 'is-active' : ''}" data-playlist="${p.id}">${icons[p.icon]}${p.label}</button>
      `).join('')}
    </div>

    <div class="goal-list" id="media-list" style="margin-top:var(--sp-3)"></div>
  `;

  const list = screen.querySelector('#media-list');
  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-8)">
        ${icons.media.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">${items.length === 0 ? 'Aucun média pour le moment' : 'Rien ici pour l’instant'}</h2>
        <p class="state-block__desc">${items.length === 0
          ? 'Ajoute une vidéo, un audio ou un article de motivation.'
          : 'Essaie un autre filtre.'}</p>
      </div>`;
  } else {
    filtered.forEach((m) => list.appendChild(itemCard(m)));
  }

  screen.querySelector('#voice-btn').addEventListener('click', () => router.navigate('/media/voix'));

  screen.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      el.replaceWith(MediaList());
    });
  });

  screen.querySelectorAll('[data-playlist]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activePlaylist = btn.dataset.playlist;
      el.replaceWith(MediaList());
    });
  });

  screen.querySelector('#fav-filter-btn').addEventListener('click', () => {
    favoritesOnly = !favoritesOnly;
    el.replaceWith(MediaList());
  });

  el.appendChild(screen);

  const fab = document.createElement('div');
  fab.className = 'fab';
  fab.innerHTML = `<button class="fab-btn" aria-label="Nouveau média">${icons.plus}</button>`;
  fab.querySelector('button').addEventListener('click', () => router.navigate('/media/nouveau'));
  el.appendChild(fab);

  return el;
}
