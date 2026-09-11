import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { journalCategories } from '../data/journalCategories.js';

export function NoteForm(params = {}) {
  const editingId = params.id ?? null;
  const existing = editingId ? store.getJournalEntry(editingId) : null;

  if (editingId && !existing) {
    router.navigate('/notes');
    return document.createElement('div');
  }

  let selectedCategory = existing?.category ?? 'libre';

  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">${existing ? 'Modifier l’entrée' : 'Nouvelle entrée'}</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => {
    router.navigate(existing ? `/notes/${existing.id}` : '/notes');
  });
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  screen.innerHTML = `
    <form id="note-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="f-title">Titre <span class="optional">(optionnel)</span></label>
        <input class="form-input" id="f-title" name="title" placeholder="Ex. Une bonne journée" value="${existing?.title ?? ''}" />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label">Catégorie</label>
        <div class="category-picker" id="cat-picker">
          ${journalCategories.map((c) => `
            <button type="button" class="category-picker-item ${selectedCategory === c.id ? 'is-selected' : ''}" data-cat="${c.id}">
              ${icons[c.icon]}<span>${c.label}</span>
            </button>`).join('')}
        </div>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-text">Texte</label>
        <textarea class="form-textarea" id="f-text" name="text" placeholder="Écris librement..." style="min-height:160px" required>${existing?.text ?? ''}</textarea>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-date">Date</label>
        <input class="form-input" type="date" id="f-date" name="date" value="${(existing?.date ?? new Date().toISOString()).slice(0, 10)}" />
      </div>

      <p class="form-error" id="form-error" hidden>Écris au moins quelques mots.</p>

      <div class="form-actions">
        <button type="button" class="btn-secondary" id="cancel-btn">Annuler</button>
        <button type="submit" class="btn-primary">${existing ? 'Enregistrer' : 'Ajouter'}</button>
      </div>
    </form>
  `;

  el.appendChild(screen);

  screen.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.cat;
      screen.querySelectorAll('[data-cat]').forEach((b) => b.classList.toggle('is-selected', b.dataset.cat === selectedCategory));
    });
  });

  screen.querySelector('#cancel-btn').addEventListener('click', () => {
    router.navigate(existing ? `/notes/${existing.id}` : '/notes');
  });

  screen.querySelector('#note-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const text = formData.get('text')?.toString().trim();
    const errorEl = screen.querySelector('#form-error');
    if (!text) {
      errorEl.hidden = false;
      screen.querySelector('#f-text').focus();
      return;
    }
    errorEl.hidden = true;

    const dateValue = formData.get('date')?.toString();
    const fields = {
      title: formData.get('title')?.toString() ?? '',
      text,
      category: selectedCategory,
      date: dateValue ? new Date(dateValue).toISOString() : new Date().toISOString(),
    };

    if (existing) {
      store.updateJournalEntry(existing.id, fields);
      router.navigate(`/notes/${existing.id}`);
    } else {
      const id = store.createJournalEntry(fields);
      router.navigate(`/notes/${id}`);
    }
  });

  return el;
}
