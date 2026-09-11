import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { priorityLevels } from '../data/goalCategories.js';

const priorityMap = Object.fromEntries(priorityLevels.map((p) => [p.id, p]));

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function stepRow(goalId, step, rerender) {
  const row = document.createElement('div');
  row.className = `step-row ${step.done ? 'is-done' : ''}`;
  row.innerHTML = `
    <span class="mission-checkbox" style="width:20px;height:20px">${icons.check}</span>
    <span class="step-row__text">${step.text}</span>
    <button class="step-row__delete" aria-label="Supprimer">${icons.trash}</button>
  `;
  row.querySelector('.mission-checkbox').addEventListener('click', () => {
    store.toggleFamilyGoalStep(goalId, step.id);
    rerender();
  });
  row.querySelector('.step-row__delete').addEventListener('click', () => {
    store.deleteFamilyGoalStep(goalId, step.id);
    rerender();
  });
  return row;
}

function deleteConfirmSheet(goal) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer ce projet ?</h2>
      <p class="confirm-sheet__desc">« ${goal.name} » sera supprimé définitivement, avec ses étapes. Cette opération est irréversible.</p>
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
    store.deleteFamilyGoal(goal.id);
    router.navigate('/family');
  });
  return backdrop;
}

export function FamilyGoalDetail(params = {}) {
  const goal = store.getFamilyGoal(params.id);
  const el = document.createElement('div');

  if (!goal) {
    router.navigate('/family');
    return el;
  }

  const rerender = () => {
    const fresh = FamilyGoalDetail(params);
    el.replaceWith(fresh);
  };

  const pr = priorityMap[goal.priority] ?? priorityMap.moyenne;

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
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/family'));
  header.querySelector('#edit-btn').addEventListener('click', () => router.navigate(`/family/projets/${goal.id}/modifier`));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-4)';

  screen.innerHTML = `
    <div>
      <div class="detail-tags-row">
        <span class="chip"><span class="priority-dot" style="background:var(${pr.color});display:inline-block;margin-right:5px"></span>${pr.label}</span>
        ${goal.status === 'completed' ? '<span class="chip" style="color:var(--success-500)">✓ Terminé</span>' : ''}
      </div>
      <h1 class="detail-title" style="margin-top:var(--sp-3)">${goal.name}</h1>
    </div>

    ${goal.description ? `
    <section class="card">
      <div class="detail-section-title">Description</div>
      <p class="detail-desc">${goal.description}</p>
    </section>` : ''}

    <section class="card">
      <div class="progress-header">
        <span class="progress-header__title">Progression</span>
        <span class="progress-header__value mono">${goal.progress}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${goal.progress}%"></div></div>
    </section>

    <section class="card">
      <div class="detail-meta-grid">
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Deadline</span>
          <span class="detail-meta-item__value">${goal.deadline ? fmtDate(goal.deadline) : '—'}</span>
        </div>
        ${goal.budget != null ? `
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Budget</span>
          <span class="detail-meta-item__value">${goal.budget.toLocaleString('fr-FR')} Ar</span>
        </div>` : ''}
      </div>
    </section>

    <section class="card">
      <div class="detail-section-title">Étapes</div>
      <div id="steps-list"></div>
      <div class="add-inline-row">
        <input class="form-input" id="new-step-input" placeholder="Ajouter une étape..." />
        <button class="add-inline-btn" id="add-step-btn" aria-label="Ajouter">${icons.plus}</button>
      </div>
    </section>
  `;

  const stepsList = screen.querySelector('#steps-list');
  if (goal.steps.length === 0) {
    stepsList.innerHTML = `<p style="font-size:var(--fs-sm);color:var(--text-tertiary)">Aucune étape pour l'instant.</p>`;
  } else {
    goal.steps.forEach((s) => stepsList.appendChild(stepRow(goal.id, s, rerender)));
  }

  screen.querySelector('#add-step-btn').addEventListener('click', () => {
    const input = screen.querySelector('#new-step-input');
    if (input.value.trim()) {
      store.addFamilyGoalStep(goal.id, input.value);
      rerender();
    }
  });
  screen.querySelector('#new-step-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      screen.querySelector('#add-step-btn').click();
    }
  });

  el.appendChild(screen);

  header.querySelector('#delete-btn').addEventListener('click', () => {
    el.appendChild(deleteConfirmSheet(goal));
  });

  return el;
}
