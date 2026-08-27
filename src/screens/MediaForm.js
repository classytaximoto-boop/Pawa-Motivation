import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { mediaCategories } from '../data/mediaCategories.js';
import { mediaPlaylists } from '../data/mediaPlaylists.js';
import { saveMediaFile, deleteMediaFile } from '../utils/mediaStorage.js';

// Limite volontairement prudente pour un import local : au-delà, IndexedDB
// reste techniquement capable mais le transfert/lecture devient peu pratique
// sur mobile. Purement informatif — pas bloquant, juste un avertissement.
const LARGE_FILE_WARNING_MB = 200;

export function MediaForm(params = {}) {
  const editingId = params.id ?? null;
  const existing = editingId ? store.getMediaItem(editingId) : null;

  if (editingId && !existing) {
    router.navigate('/media');
    return document.createElement('div');
  }

  let selectedCategory = existing?.category ?? 'video';
  let selectedPlaylist = existing?.playlist ?? '';
  let pendingFile = null; // File choisi mais pas encore enregistré (soumission différée)
  let removeExistingFile = false;

  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">${existing ? 'Modifier le média' : 'Nouveau média'}</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => {
    router.navigate(existing ? `/media/${existing.id}` : '/media');
  });
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  screen.innerHTML = `
    <form id="media-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="f-title">Titre</label>
        <input class="form-input" id="f-title" name="title" placeholder="Ex. Interview sur la discipline" value="${existing?.title ?? ''}" required />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label">Type</label>
        <div class="category-picker" id="cat-picker">
          ${mediaCategories.map((c) => `
            <button type="button" class="category-picker-item ${selectedCategory === c.id ? 'is-selected' : ''}" data-cat="${c.id}">
              ${icons[c.icon]}<span>${c.label}</span>
            </button>`).join('')}
        </div>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label">Playlist <span class="optional">(optionnel)</span></label>
        <div class="category-picker" id="playlist-picker" style="grid-template-columns:repeat(2,1fr)">
          <button type="button" class="category-picker-item ${selectedPlaylist === '' ? 'is-selected' : ''}" data-playlist="">
            ${icons.inbox}<span>Aucune</span>
          </button>
          ${mediaPlaylists.map((p) => `
            <button type="button" class="category-picker-item ${selectedPlaylist === p.id ? 'is-selected' : ''}" data-playlist="${p.id}">
              ${icons[p.icon]}<span>${p.label}</span>
            </button>`).join('')}
        </div>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)" id="file-group">
        <label class="form-label">Fichier local <span class="optional">(optionnel)</span></label>
        <input type="file" accept="audio/*,video/*" id="f-file" style="display:none" />
        <button type="button" class="btn-secondary" id="f-file-btn" style="display:inline-flex;align-items:center;gap:var(--sp-2)">${icons.upload}<span id="f-file-label">${existing?.mediaFileId ? 'Remplacer le fichier' : 'Choisir un fichier'}</span></button>
        ${existing?.mediaFileId ? `<button type="button" class="chip" id="f-file-remove" style="margin-left:var(--sp-2)">${icons.trash}Retirer le fichier actuel</button>` : ''}
        <p class="detail-desc" id="f-file-warning" style="margin-top:var(--sp-2)" hidden></p>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-url">Lien externe <span class="optional">(optionnel, ignoré si un fichier local est choisi)</span></label>
        <input class="form-input" id="f-url" name="url" type="url" placeholder="https://..." value="${existing?.url ?? ''}" />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-notes">Notes <span class="optional">(optionnel)</span></label>
        <textarea class="form-textarea" id="f-notes" name="notes" placeholder="Ce que tu retiens, pourquoi c'est utile..." style="min-height:120px">${existing?.notes ?? ''}</textarea>
      </div>

      <p class="form-error" id="form-error" hidden>Donne au moins un titre.</p>

      <div class="form-actions">
        <button type="button" class="btn-secondary" id="cancel-btn">Annuler</button>
        <button type="submit" class="btn-primary">${existing ? 'Enregistrer' : 'Ajouter'}</button>
      </div>
    </form>
  `;

  el.appendChild(screen);

  const fileGroup = screen.querySelector('#file-group');
  const fileInput = screen.querySelector('#f-file');
  const fileBtn = screen.querySelector('#f-file-btn');
  const fileLabel = screen.querySelector('#f-file-label');
  const fileRemoveBtn = screen.querySelector('#f-file-remove');
  const fileWarning = screen.querySelector('#f-file-warning');
  const submitBtn = screen.querySelector('button[type="submit"]');

  function syncFileGroupVisibility() {
    const relevant = selectedCategory === 'video' || selectedCategory === 'audio';
    fileGroup.style.display = relevant ? 'block' : 'none';
  }
  syncFileGroupVisibility();

  screen.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.cat;
      screen.querySelectorAll('[data-cat]').forEach((b) => b.classList.toggle('is-selected', b.dataset.cat === selectedCategory));
      syncFileGroupVisibility();
    });
  });

  screen.querySelectorAll('[data-playlist]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedPlaylist = btn.dataset.playlist;
      screen.querySelectorAll('[data-playlist]').forEach((b) => b.classList.toggle('is-selected', b.dataset.playlist === selectedPlaylist));
    });
  });

  fileBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    pendingFile = file;
    removeExistingFile = false;
    fileLabel.textContent = file.name;
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > LARGE_FILE_WARNING_MB) {
      fileWarning.hidden = false;
      fileWarning.textContent = `Fichier volumineux (${sizeMb.toFixed(0)} Mo) — l'import et la lecture peuvent être lents sur cet appareil.`;
    } else {
      fileWarning.hidden = true;
    }
  });

  fileRemoveBtn?.addEventListener('click', () => {
    removeExistingFile = true;
    pendingFile = null;
    fileLabel.textContent = 'Choisir un fichier';
    fileRemoveBtn.style.display = 'none';
    fileWarning.hidden = true;
  });

  screen.querySelector('#cancel-btn').addEventListener('click', () => {
    router.navigate(existing ? `/media/${existing.id}` : '/media');
  });

  screen.querySelector('#media-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('title')?.toString().trim();
    const errorEl = screen.querySelector('#form-error');
    if (!title) {
      errorEl.hidden = false;
      screen.querySelector('#f-title').focus();
      return;
    }
    errorEl.hidden = true;

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = 'Enregistrement…';

    let mediaFileId = existing?.mediaFileId ?? null;

    try {
      if (removeExistingFile && existing?.mediaFileId) {
        await deleteMediaFile(existing.mediaFileId);
        mediaFileId = null;
      }
      if (pendingFile) {
        if (existing?.mediaFileId && !removeExistingFile) {
          await deleteMediaFile(existing.mediaFileId); // remplace : on libère l'ancien fichier
        }
        const saved = await saveMediaFile(pendingFile);
        mediaFileId = saved.id;
      }
    } catch (err) {
      console.warn('[MediaForm] échec de sauvegarde du fichier local', err);
      errorEl.hidden = false;
      errorEl.textContent = "Le fichier n'a pas pu être enregistré sur cet appareil (espace de stockage ?). Réessaie ou utilise un lien externe.";
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
      return;
    }

    const fields = {
      title,
      category: selectedCategory,
      playlist: selectedPlaylist,
      url: formData.get('url')?.toString() ?? '',
      notes: formData.get('notes')?.toString() ?? '',
      mediaFileId,
    };

    if (existing) {
      store.updateMediaItem(existing.id, fields);
      router.navigate(`/media/${existing.id}`);
    } else {
      const id = store.createMediaItem(fields);
      router.navigate(`/media/${id}`);
    }
  });

  return el;
}
