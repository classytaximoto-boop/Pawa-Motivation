import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { priorityLevels } from '../data/goalCategories.js';

export function FamilyGoalForm(params = {}) {
  const editingId = params.id ?? null;
  const existing = editingId ? store.getFamilyGoal(editingId) : null;

  if (editingId && !existing) {
    router.navigate('/family');
    return document.createElement('div');
  }

  let selectedPriority = existing?.priority ?? 'moyenne';

  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">${existing ? 'Modifier le projet' : 'Nouveau projet familial'}</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => {
    router.navigate(existing ? `/family/projets/${existing.id}` : '/family');
  });
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  screen.innerHTML = `
    <form id="fg-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="f-name">${icons.edit}Nom</label>
        <input class="form-input" id="f-name" name="name" placeholder="Ex. Vacances en famille" value="${existing?.name ?? ''}" required />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-desc">${icons.notes}Description <span class="optional">(optionnel)</span></label>
        <textarea class="form-textarea" id="f-desc" name="description" placeholder="En quoi consiste ce projet ?">${existing?.description ?? ''}</textarea>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-budget">${icons.cash}Budget (Ar) <span class="optional">(optionnel)</span></label>
        <input class="form-input" type="number" min="0" id="f-budget" name="budget" placeholder="0" value="${existing?.budget ?? ''}" />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-deadline">${icons.calendar}Deadline <span class="optional">(optionnel)</span></label>
        <input class="form-input" type="date" id="f-deadline" name="deadline" value="${existing?.deadline ?? ''}" />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label">${icons.star}Priorité</label>
        <div class="priority-picker" id="priority-picker">
          ${priorityLevels.map((p) => `
            <button type="button" class="priority-picker-item ${selectedPriority === p.id ? 'is-selected' : ''}" data-priority="${p.id}">
              <span class="priority-dot" style="background:var(${p.color})"></span>${p.label}
            </button>`).join('')}
        </div>
      </div>

      <p class="form-error" id="form-error" hidden>Indique un nom valide.</p>

      <div class="form-actions">
        <button type="button" class="btn-secondary" id="cancel-btn">Annuler</button>
        <button type="submit" class="btn-primary">${existing ? 'Enregistrer' : 'Créer le projet'}</button>
      </div>
    </form>
  `;

  el.appendChild(screen);

  screen.querySelectorAll('[data-priority]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedPriority = btn.dataset.priority;
      screen.querySelectorAll('[data-priority]').forEach((b) => b.classList.toggle('is-selected', b.dataset.priority === selectedPriority));
    });
  });

  screen.querySelector('#cancel-btn').addEventListener('click', () => {
    router.navigate(existing ? `/family/projets/${existing.id}` : '/family');
  });

  screen.querySelector('#fg-form').addEventListener('submit', (e) => {
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
      budget: formData.get('budget')?.toString() ?? '',
      priority: selectedPriority,
      deadline: formData.get('deadline')?.toString() ?? '',
    };

    if (existing) {
      store.updateFamilyGoal(existing.id, fields);
      router.navigate(`/family/projets/${existing.id}`);
    } else {
      const id = store.createFamilyGoal(fields);
      router.navigate(`/family/projets/${id}`);
    }
  });

  return el;
}
