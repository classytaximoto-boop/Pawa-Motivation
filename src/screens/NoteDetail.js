import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { journalCategoryMap } from '../data/journalCategories.js';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function deleteConfirmSheet(entry) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer cette entrée ?</h2>
      <p class="confirm-sheet__desc">Cette entrée de journal sera supprimée définitivement. Cette opération est irréversible.</p>
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
    store.deleteJournalEntry(entry.id);
    router.navigate('/notes');
  });
  return backdrop;
}

export function NoteDetail(params = {}) {
  const entry = store.getJournalEntry(params.id);
  const el = document.createElement('div');

  if (!entry) {
    router.navigate('/notes');
    return el;
  }

  const cat = journalCategoryMap[entry.category] ?? journalCategoryMap.libre;

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
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/notes'));
  header.querySelector('#edit-btn').addEventListener('click', () => router.navigate(`/notes/${entry.id}/modifier`));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-4)';

  screen.innerHTML = `
    <div>
      <div class="detail-tags-row">
        <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon]}${cat.label}</span>
        <span class="chip">${fmtDate(entry.date)}</span>
      </div>
      ${entry.title ? `<h1 class="detail-title" style="margin-top:var(--sp-3)">${entry.title}</h1>` : ''}
    </div>

    <section class="card">
      <p class="detail-desc" style="white-space:pre-wrap">${entry.text || '—'}</p>
    </section>
  `;

  el.appendChild(screen);

  header.querySelector('#delete-btn').addEventListener('click', () => {
    el.appendChild(deleteConfirmSheet(entry));
  });

  return el;
}
