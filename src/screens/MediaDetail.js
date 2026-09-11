import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { mediaCategoryMap } from '../data/mediaCategories.js';
import { mediaPlaylistMap } from '../data/mediaPlaylists.js';
import { MediaPlayer } from '../components/MediaPlayer.js';
import { deleteMediaFile } from '../utils/mediaStorage.js';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function deleteConfirmSheet(item) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer ce média ?</h2>
      <p class="confirm-sheet__desc">Cette référence sera supprimée définitivement. Cette opération est irréversible.</p>
      <div class="form-actions">
        <button class="btn-secondary" id="cancel-delete">Annuler</button>
        <button class="btn-danger" id="confirm-delete">Supprimer</button>
      </div>
    </div>
  `;
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.remove();
  });
  backdrop.querySelector('#cancel-delete').addEventListener('click', () => backdrop.remove());
  backdrop.querySelector('#confirm-delete').addEventListener('click', async () => {
    if (item.mediaFileId) {
      try { await deleteMediaFile(item.mediaFileId); } catch { /* best-effort */ }
    }
    store.deleteMediaItem(item.id);
    router.navigate('/media');
  });
  return backdrop;
}

export function MediaDetail(params = {}) {
  const item = store.getMediaItem(params.id);
  const el = document.createElement('div');

  if (!item) {
    router.navigate('/media');
    return el;
  }

  const cat = mediaCategoryMap[item.category] ?? mediaCategoryMap.autre;
  const playlistMeta = item.playlist ? mediaPlaylistMap[item.playlist] : null;
  const isPlayable = item.category === 'video' || item.category === 'audio';
  const siblingPlaylist = isPlayable && item.playlist
    ? store.listMediaByPlaylist(item.playlist).filter((m) => m.category === item.category)
    : null;

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = '0 var(--sp-5)';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <div class="detail-header-row__actions">
      <button class="icon-btn" id="edit-btn" aria-label="Modifier">${icons.edit}</button>
      <button class="icon-btn icon-btn--danger" id="delete-btn" aria-label="Supprimer">${icons.trash}</button>
    </div>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/media'));
  header.querySelector('#edit-btn').addEventListener('click', () => router.navigate(`/media/${item.id}/modifier`));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-4)';

  screen.innerHTML = `
    <div>
      <div class="detail-tags-row">
        <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon]}${cat.label}</span>
        ${playlistMeta ? `<span class="category-tag" style="color:var(${playlistMeta.color})">${icons[playlistMeta.icon]}${playlistMeta.label}</span>` : ''}
        <span class="chip">${fmtDate(item.createdAt)}</span>
        ${item.consumed ? `<span class="chip">${icons.check}Terminé</span>` : ''}
      </div>
      <h1 class="detail-title" style="margin-top:var(--sp-3)">${item.title || 'Sans titre'}</h1>
    </div>

    <section id="player-slot"></section>

    ${!isPlayable && item.url ? `
    <section class="card">
      <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="display:inline-flex;align-items:center;gap:var(--sp-2);text-decoration:none">${icons.media}Ouvrir le lien</a>
    </section>` : ''}

    <section class="card">
      <p class="detail-desc" style="white-space:pre-wrap">${item.notes || '—'}</p>
    </section>

    <div class="form-actions">
      <button type="button" class="btn-primary" id="toggle-consumed-btn">${item.consumed ? 'Marquer comme non terminé' : 'Marquer comme terminé'}</button>
    </div>
  `;

  el.appendChild(screen);

  if (isPlayable) {
    const playerSlot = screen.querySelector('#player-slot');
    playerSlot.appendChild(MediaPlayer(item, {
      playlist: siblingPlaylist && siblingPlaylist.length > 1 ? siblingPlaylist : null,
    }));
  }

  screen.querySelector('#toggle-consumed-btn').addEventListener('click', () => {
    store.toggleMediaConsumed(item.id);
    el.replaceWith(MediaDetail(params));
  });

  header.querySelector('#delete-btn').addEventListener('click', () => {
    el.appendChild(deleteConfirmSheet(item));
  });

  return el;
}
