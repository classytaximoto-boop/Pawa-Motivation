import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { priorityLevels } from '../data/goalCategories.js';

export function FinancialGoalForm(params = {}) {
  const editingId = params.id ?? null;
  const existing = editingId ? store.getFinancialGoal(editingId) : null;

  if (editingId && !existing) {
    router.navigate('/money');
    return document.createElement('div');
  }

  let selectedPriority = existing?.priority ?? 'moyenne';

  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">${existing ? "Modifier l'objectif" : 'Nouvel objectif financier'}</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => {
    router.navigate(existing ? `/money/objectifs/${existing.id}` : '/money');
  });
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  screen.innerHTML = `
    <form id="fg-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="f-name">${icons.edit}Nom</label>
        <input class="form-input" id="f-name" name="name" placeholder="Ex. Fonds d'urgence" value="${existing?.name ?? ''}" required />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-target">${icons.target}Montant cible (Ar)</label>
        <input class="form-input" type="number" min="0" id="f-target" name="targetAmount" placeholder="0" value="${existing?.targetAmount ?? ''}" required />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-desc">${icons.notes}Description <span class="optional">(optionnel)</span></label>
        <textarea class="form-textarea" id="f-desc" name="description" placeholder="Pourquoi cet objectif ?">${existing?.description ?? ''}</textarea>
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

      <p class="form-error" id="form-error" hidden>Indique un nom et un montant cible valides.</p>

      <div class="form-actions">
        <button type="button" class="btn-secondary" id="cancel-btn">Annuler</button>
        <button type="submit" class="btn-primary">${existing ? 'Enregistrer' : "Créer l'objectif"}</button>
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
    router.navigate(existing ? `/money/objectifs/${existing.id}` : '/money');
  });

  screen.querySelector('#fg-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name')?.toString().trim();
    const targetAmount = Number(formData.get('targetAmount'));
    const errorEl = screen.querySelector('#form-error');
    if (!name || !targetAmount || targetAmount <= 0) {
      errorEl.hidden = false;
      screen.querySelector('#f-name').focus();
      return;
    }
    errorEl.hidden = true;

    const fields = {
      name,
      description: formData.get('description')?.toString() ?? '',
      targetAmount,
      priority: selectedPriority,
      deadline: formData.get('deadline')?.toString() ?? '',
    };

    if (existing) {
      store.updateFinancialGoal(existing.id, fields);
      router.navigate(`/money/objectifs/${existing.id}`);
    } else {
      const id = store.createFinancialGoal(fields);
      router.navigate(`/money/objectifs/${id}`);
    }
  });

  return el;
}
