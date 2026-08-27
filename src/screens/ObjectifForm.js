import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { goalCategories, priorityLevels } from '../data/goalCategories.js';

export function ObjectifForm(params = {}) {
  const editingId = params.id ?? null;
  const existing = editingId ? store.getGoal(editingId) : null;

  // Si on tente d'éditer un objectif inexistant, retour à la liste.
  if (editingId && !existing) {
    router.navigate('/objectifs');
    return document.createElement('div');
  }

  let selectedCategory = existing?.category ?? 'personnel';
  let selectedPriority = existing?.priority ?? 'moyenne';

  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">${existing ? 'Modifier l’objectif' : 'Nouvel objectif'}</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => {
    router.navigate(existing ? `/objectifs/${existing.id}` : '/objectifs');
  });
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  screen.innerHTML = `
    <form id="goal-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="f-name">Nom</label>
        <input class="form-input" id="f-name" name="name" placeholder="Ex. Courir un semi-marathon" value="${existing?.name ?? ''}" required />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label">Catégorie</label>
        <div class="category-picker" id="cat-picker">
          ${goalCategories.map((c) => `
            <button type="button" class="category-picker-item ${selectedCategory === c.id ? 'is-selected' : ''}" data-cat="${c.id}">
              ${icons[c.icon]}<span>${c.label}</span>
            </button>`).join('')}
        </div>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-desc">Description <span class="optional">(optionnel)</span></label>
        <textarea class="form-textarea" id="f-desc" name="description" placeholder="Décris ton objectif...">${existing?.description ?? ''}</textarea>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-why">Pourquoi <span class="optional">(ce qui te motive vraiment)</span></label>
        <textarea class="form-textarea" id="f-why" name="why" placeholder="Pourquoi cet objectif compte pour toi ?">${existing?.why ?? ''}</textarea>
      </div>

      <div class="form-row-2" style="margin-top: var(--sp-4)">
        <div class="form-group">
          <label class="form-label" for="f-start">Date de début</label>
          <input class="form-input" type="date" id="f-start" name="startDate" value="${existing?.startDate ?? new Date().toISOString().slice(0, 10)}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="f-deadline">Deadline <span class="optional">(optionnel)</span></label>
          <input class="form-input" type="date" id="f-deadline" name="deadline" value="${existing?.deadline ?? ''}" />
        </div>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label">Priorité</label>
        <div class="priority-picker" id="priority-picker">
          ${priorityLevels.map((p) => `
            <button type="button" class="priority-picker-item ${selectedPriority === p.id ? 'is-selected' : ''}" data-priority="${p.id}">
              <span class="priority-dot" style="background:var(${p.color})"></span>${p.label}
            </button>`).join('')}
        </div>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-budget">Budget éventuel <span class="optional">(optionnel, en Ar)</span></label>
        <input class="form-input" type="number" min="0" id="f-budget" name="budget" placeholder="0" value="${existing?.budget ?? ''}" />
      </div>

      <p class="form-error" id="form-error" hidden>Le nom de l'objectif est requis.</p>

      <div class="form-actions">
        <button type="button" class="btn-secondary" id="cancel-btn">Annuler</button>
        <button type="submit" class="btn-primary">${existing ? 'Enregistrer' : 'Créer l’objectif'}</button>
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

  screen.querySelectorAll('[data-priority]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedPriority = btn.dataset.priority;
      screen.querySelectorAll('[data-priority]').forEach((b) => b.classList.toggle('is-selected', b.dataset.priority === selectedPriority));
    });
  });

  screen.querySelector('#cancel-btn').addEventListener('click', () => {
    router.navigate(existing ? `/objectifs/${existing.id}` : '/objectifs');
  });

  screen.querySelector('#goal-form').addEventListener('submit', (e) => {
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
      description: formData.get('description')?.toString() ?? '',
      why: formData.get('why')?.toString() ?? '',
      category: selectedCategory,
      priority: selectedPriority,
      startDate: formData.get('startDate')?.toString() ?? '',
      deadline: formData.get('deadline')?.toString() ?? '',
      budget: formData.get('budget')?.toString() ?? '',
    };

    if (existing) {
      store.updateGoal(existing.id, {
        ...fields,
        budget: fields.budget ? Number(fields.budget) : null,
      });
      router.navigate(`/objectifs/${existing.id}`);
    } else {
      const id = store.createGoal(fields);
      router.navigate(`/objectifs/${id}`);
    }
  });

  return el;
}
