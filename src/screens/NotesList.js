import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AppHeader } from '../components/AppHeader.js';
import { journalCategories, journalCategoryMap } from '../data/journalCategories.js';

// État local de filtre (mémoire vive de l'écran, pas persistée)
let activeCategory = 'toutes';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function excerpt(text, max = 100) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

function entryCard(entry) {
  const cat = journalCategoryMap[entry.category] ?? journalCategoryMap.libre;
  const card = document.createElement('button');
  card.className = 'card goal-card';
  card.style.textAlign = 'left';
  card.innerHTML = `
    <div class="goal-card__top">
      <div>
        <div class="goal-card__title-row">
          <span class="goal-card__name">${entry.title || excerpt(entry.text, 40) || 'Sans titre'}</span>
        </div>
        <div class="goal-card__meta-row">
          <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon]}${cat.label}</span>
          <span class="chip">${fmtDate(entry.date)}</span>
        </div>
      </div>
    </div>
    ${entry.text ? `<p class="detail-desc" style="margin-top:var(--sp-2)">${excerpt(entry.text)}</p>` : ''}
  `;
  card.addEventListener('click', () => router.navigate(`/notes/${entry.id}`));
  return card;
}

export function NotesList() {
  const entries = store.listJournalEntries();
  const el = document.createElement('div');
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen';

  const filtered = entries.filter((e) => (activeCategory === 'toutes' ? true : e.category === activeCategory));

  screen.innerHTML = `
    <div class="screen-title-row"><h1>Notes</h1></div>

    <div class="category-scroll" id="cat-scroll">
      <button class="category-chip ${activeCategory === 'toutes' ? 'is-active' : ''}" data-cat="toutes">Toutes</button>
      ${journalCategories.map((c) => `
        <button class="category-chip ${activeCategory === c.id ? 'is-active' : ''}" data-cat="${c.id}">${icons[c.icon]}${c.label}</button>
      `).join('')}
    </div>

    <div class="goal-list" id="entries-list"></div>
  `;

  const list = screen.querySelector('#entries-list');
  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-8)">
        ${icons.notes.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">${entries.length === 0 ? 'Aucune entrée pour le moment' : 'Rien ici pour l’instant'}</h2>
        <p class="state-block__desc">${entries.length === 0
          ? 'Écris ta première entrée de journal.'
          : 'Essaie une autre catégorie.'}</p>
      </div>`;
  } else {
    filtered.forEach((e) => list.appendChild(entryCard(e)));
  }

  screen.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      el.replaceWith(NotesList());
    });
  });

  el.appendChild(screen);

  const fab = document.createElement('div');
  fab.className = 'fab';
  fab.innerHTML = `<button class="fab-btn" aria-label="Nouvelle entrée">${icons.plus}</button>`;
  fab.querySelector('button').addEventListener('click', () => router.navigate('/notes/nouveau'));
  el.appendChild(fab);

  return el;
}
