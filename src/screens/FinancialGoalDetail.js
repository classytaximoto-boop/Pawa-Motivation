import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { priorityLevels } from '../data/goalCategories.js';

const priorityMap = Object.fromEntries(priorityLevels.map((p) => [p.id, p]));

function fmtAmount(n) {
  return `${Math.round(n).toLocaleString('fr-FR')} Ar`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function contributionRow(goalId, contribution, rerender) {
  const row = document.createElement('div');
  row.className = 'step-row';
  row.innerHTML = `
    <span class="step-row__text mono">+${fmtAmount(contribution.amount)}${contribution.note ? ` — ${contribution.note}` : ''}</span>
    <button class="step-row__delete" aria-label="Supprimer">${icons.trash}</button>
  `;
  row.querySelector('.step-row__delete').addEventListener('click', () => {
    store.deleteFinancialGoalContribution(goalId, contribution.id);
    rerender();
  });
  return row;
}

function deleteConfirmSheet(goal) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer cet objectif ?</h2>
      <p class="confirm-sheet__desc">« ${goal.name} » sera supprimé définitivement, avec ses apports. Cette opération est irréversible.</p>
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
    store.deleteFinancialGoal(goal.id);
    router.navigate('/money');
  });
  return backdrop;
}

export function FinancialGoalDetail(params = {}) {
  const goal = store.getFinancialGoal(params.id);
  const el = document.createElement('div');

  if (!goal) {
    router.navigate('/money');
    return el;
  }

  const rerender = () => {
    const fresh = FinancialGoalDetail(params);
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
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/money'));
  header.querySelector('#edit-btn').addEventListener('click', () => router.navigate(`/money/objectifs/${goal.id}/modifier`));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-4)';

  screen.innerHTML = `
    <div>
      <div class="detail-tags-row">
        <span class="chip"><span class="priority-dot" style="background:var(${pr.color});display:inline-block;margin-right:5px"></span>${pr.label}</span>
        ${goal.status === 'completed' ? '<span class="chip" style="color:var(--success-500)">✓ Atteint</span>' : ''}
      </div>
      <h1 class="detail-title" style="margin-top:var(--sp-3)">${goal.name}</h1>
    </div>

    ${goal.description ? `
    <section class="card">
      <div class="detail-section-title">${icons.notes}Description</div>
      <p class="detail-desc">${goal.description}</p>
    </section>` : ''}

    <section class="card">
      <div class="progress-header">
        <span class="progress-header__title">Progression</span>
        <span class="progress-header__value mono">${goal.progress}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${goal.progress}%"></div></div>
      <div class="detail-meta-grid" style="margin-top:var(--sp-3)">
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">${icons.piggyBank}Épargné</span>
          <span class="detail-meta-item__value mono">${fmtAmount(goal.currentAmount)}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">${icons.target}Objectif</span>
          <span class="detail-meta-item__value mono">${fmtAmount(goal.targetAmount)}</span>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="detail-meta-grid">
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">${icons.calendar}Deadline</span>
          <span class="detail-meta-item__value">${goal.deadline ? fmtDate(goal.deadline) : '—'}</span>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="detail-section-title">${icons.cash}Apports</div>
      <div id="contributions-list"></div>
      <div class="add-inline-row">
        <input class="form-input" type="number" min="0" id="new-contrib-amount" placeholder="Montant (Ar)" style="max-width:140px" />
        <input class="form-input" id="new-contrib-note" placeholder="Note (optionnel)" />
        <button class="add-inline-btn" id="add-contrib-btn" aria-label="Ajouter">${icons.plus}</button>
      </div>
    </section>
  `;

  const list = screen.querySelector('#contributions-list');
  if (goal.contributions.length === 0) {
    list.innerHTML = `<p style="font-size:var(--fs-sm);color:var(--text-tertiary)">Aucun apport pour l'instant.</p>`;
  } else {
    goal.contributions.forEach((c) => list.appendChild(contributionRow(goal.id, c, rerender)));
  }

  screen.querySelector('#add-contrib-btn').addEventListener('click', () => {
    const amountInput = screen.querySelector('#new-contrib-amount');
    const noteInput = screen.querySelector('#new-contrib-note');
    if (amountInput.value && Number(amountInput.value) > 0) {
      store.addFinancialGoalContribution(goal.id, amountInput.value, noteInput.value);
      rerender();
    }
  });
  screen.querySelector('#new-contrib-amount').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      screen.querySelector('#add-contrib-btn').click();
    }
  });

  el.appendChild(screen);

  header.querySelector('#delete-btn').addEventListener('click', () => {
    el.appendChild(deleteConfirmSheet(goal));
  });

  return el;
}
