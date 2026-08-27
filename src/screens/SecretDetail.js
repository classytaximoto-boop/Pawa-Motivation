import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { decryptText, isEncryptedPayload, hasSessionKey } from '../utils/secretStorage.js';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function deleteConfirmSheet(note) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer cette note ?</h2>
      <p class="confirm-sheet__desc">Cette note confidentielle sera supprimée définitivement. Cette opération est irréversible.</p>
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
  backdrop.querySelector('#confirm-delete').addEventListener('click', () => {
    store.deleteSecretNote(note.id);
    router.navigate('/secret');
  });
  return backdrop;
}

export function SecretDetail(params = {}) {
  const note = store.getSecretNote(params.id);
  const el = document.createElement('div');

  if (!note) {
    router.navigate('/secret');
    return el;
  }

  if (!hasSessionKey()) {
    router.navigate('/secret');
    return el;
  }

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
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/secret'));
  header.querySelector('#edit-btn').addEventListener('click', () => router.navigate(`/secret/${note.id}/modifier`));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-4)';

  screen.innerHTML = `
    <div>
      <div class="detail-tags-row">
        <span class="chip">${icons.lock}Confidentiel</span>
        <span class="chip">${fmtDate(note.updatedAt)}</span>
      </div>
      <h1 class="detail-title" id="note-title" style="margin-top:var(--sp-3)"></h1>
    </div>

    <section class="card">
      <p class="detail-desc" id="note-text" style="white-space:pre-wrap">Déchiffrement…</p>
    </section>
  `;

  el.appendChild(screen);

  (async () => {
    try {
      const title = isEncryptedPayload(note.title) ? await decryptText(note.title) : (note.title || '');
      const text = isEncryptedPayload(note.text) ? await decryptText(note.text) : (note.text || '');
      if (title === null || text === null) throw new Error('decrypt_failed');
      const titleEl = screen.querySelector('#note-title');
      if (title) titleEl.textContent = title;
      else titleEl.remove();
      screen.querySelector('#note-text').textContent = text || '—';
    } catch {
      screen.querySelector('#note-title').remove();
      screen.querySelector('#note-text').textContent = 'Impossible de déchiffrer cette note.';
    }
  })();

  header.querySelector('#delete-btn').addEventListener('click', () => {
    el.appendChild(deleteConfirmSheet(note));
  });

  return el;
}
