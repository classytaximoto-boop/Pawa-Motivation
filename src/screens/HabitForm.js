import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

const iconChoices = ['flame', 'bolt', 'target', 'mind', 'compass', 'sparkles'];
const frequencies = [
  { id: 'quotidien', label: 'Quotidien' },
  { id: 'hebdo', label: 'Hebdo' },
];

export function HabitForm(params = {}) {
  const editingId = params.id ?? null;
  const existing = editingId ? store.getHabit(editingId) : null;

  if (editingId && !existing) {
    router.navigate('/habitudes');
    return document.createElement('div');
  }

  let selectedIcon = existing?.icon ?? 'flame';
  let selectedFrequency = existing?.frequency ?? 'quotidien';

  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">${existing ? 'Modifier l’habitude' : 'Nouvelle habitude'}</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => {
    router.navigate(existing ? `/habitudes/${existing.id}` : '/habitudes');
  });
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  screen.innerHTML = `
    <form id="habit-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="f-name">Nom</label>
        <input class="form-input" id="f-name" name="name" placeholder="Ex. Méditer 10 minutes" value="${existing?.name ?? ''}" required />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label">Icône</label>
        <div class="category-picker" id="icon-picker">
          ${iconChoices.map((i) => `
            <button type="button" class="category-picker-item ${selectedIcon === i ? 'is-selected' : ''}" data-icon="${i}">
              ${icons[i]}
            </button>`).join('')}
        </div>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label">Fréquence</label>
        <div class="category-picker" id="freq-picker">
          ${frequencies.map((f) => `
            <button type="button" class="category-picker-item ${selectedFrequency === f.id ? 'is-selected' : ''}" data-freq="${f.id}">
              <span>${f.label}</span>
            </button>`).join('')}
        </div>
      </div>

      <p class="form-error" id="form-error" hidden>Donne un nom à ton habitude.</p>

      <div class="form-actions">
        <button type="button" class="btn-secondary" id="cancel-btn">Annuler</button>
        <button type="submit" class="btn-primary">${existing ? 'Enregistrer' : 'Ajouter'}</button>
      </div>
    </form>
  `;

  el.appendChild(screen);

  screen.querySelectorAll('[data-icon]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedIcon = btn.dataset.icon;
      screen.querySelectorAll('[data-icon]').forEach((b) => b.classList.toggle('is-selected', b.dataset.icon === selectedIcon));
    });
  });

  screen.querySelectorAll('[data-freq]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedFrequency = btn.dataset.freq;
      screen.querySelectorAll('[data-freq]').forEach((b) => b.classList.toggle('is-selected', b.dataset.freq === selectedFrequency));
    });
  });

  screen.querySelector('#cancel-btn').addEventListener('click', () => {
    router.navigate(existing ? `/habitudes/${existing.id}` : '/habitudes');
  });

  screen.querySelector('#habit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name')?.toString().trim();
    const errorEl = screen.querySelector('#form-error');
    if (!name) {
      errorEl.hidden = false;
      screen.querySelector('#f-name').focus();
      return;
    }
    errorEl.hidden = true;

    const fields = {
      name,
      icon: selectedIcon,
      frequency: selectedFrequency,
    };

    if (existing) {
      store.updateHabit(existing.id, fields);
      router.navigate(`/habitudes/${existing.id}`);
    } else {
      const id = store.createHabit(fields);
      router.navigate(`/habitudes/${id}`);
    }
  });

  return el;
}
