import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

// État local de l'écran (mémoire vive, pas persisté)
let activeDirection = 'all'; // 'all' | 'lent' | 'borrowed'
let activeStatus = 'all'; // 'all' | 'active' | 'partial' | 'completed' | 'late'
let creatingDebt = false; // formulaire de création inline ouvert ou non
let openDebtId = null; // id de la dette dont le détail (historique remboursements) est déplié
let addingRepaymentFor = null; // id de dette en cours d'ajout de remboursement (mini-formulaire avec compte)

function fmtAmount(n) {
  return `${Math.round(n).toLocaleString('fr-FR')} MGA`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_COLOR = {
  active: 'var(--text-primary)',
  partial: 'var(--ember-500)',
  completed: 'var(--success-500)',
  late: 'var(--danger-500)',
};

function deleteConfirmSheet(title, desc, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">${title}</h2>
      <p class="confirm-sheet__desc">${desc}</p>
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
    onConfirm();
    backdrop.remove();
  });
  return backdrop;
}

function debtFormHtml() {
  return `
    <form id="debt-form" class="card" style="margin-bottom:var(--sp-3)" novalidate>
      <div class="form-group">
        <label class="form-label">Type</label>
        <div class="tab-row mind-tab-row" id="direction-picker">
          <button type="button" class="tab-btn is-active" data-direction="lent">${icons.handshakeOut}J'ai prêté</button>
          <button type="button" class="tab-btn" data-direction="borrowed">${icons.handshakeIn}On m'a prêté</button>
        </div>
      </div>
      <div class="form-group" style="margin-top:var(--sp-4)">
        <label class="form-label" for="f-debt-person">Personne</label>
        <input class="form-input" id="f-debt-person" name="person" placeholder="Ex. Rina" required />
      </div>
      <div class="form-group" style="margin-top:var(--sp-4)">
        <label class="form-label" for="f-debt-amount">Montant (MGA)</label>
        <input class="form-input" type="number" min="0" id="f-debt-amount" name="amount" placeholder="0" required />
      </div>
      <div class="form-group" style="margin-top:var(--sp-4)">
        <label class="form-label" for="f-debt-date">Date</label>
        <input class="form-input" type="date" id="f-debt-date" name="date" value="${new Date().toISOString().slice(0, 10)}" />
      </div>
      <div class="form-group" style="margin-top:var(--sp-4)">
        <label class="form-label" for="f-debt-due">Échéance <span class="optional">(optionnel)</span></label>
        <input class="form-input" type="date" id="f-debt-due" name="dueDate" />
      </div>
      <div class="form-group" style="margin-top:var(--sp-4)">
        <label class="form-label" for="f-debt-note">Note <span class="optional">(optionnel)</span></label>
        <input class="form-input" id="f-debt-note" name="note" placeholder="Ex. Prêt pour réparation moto" />
      </div>
      <p class="form-error" id="debt-form-error" hidden>Indique une personne et un montant valides.</p>
      <div class="form-actions" style="margin-top:var(--sp-4)">
        <button type="button" class="btn-secondary" id="debt-cancel-btn">Annuler</button>
        <button type="submit" class="btn-primary">Ajouter</button>
      </div>
    </form>
  `;
}

function repaymentRow(debt, repayment, accountsById, rerender) {
  const row = document.createElement('div');
  row.className = 'step-row';
  const accountLabel = repayment.accountId ? accountsById[repayment.accountId]?.name : null;
  row.innerHTML = `
    <span class="step-row__text mono">+${fmtAmount(repayment.amount)}${repayment.note ? ` — ${repayment.note}` : ''}${accountLabel ? ` · ${accountLabel}` : ''}</span>
    <button class="step-row__delete" aria-label="Supprimer">${icons.trash}</button>
  `;
  row.querySelector('.step-row__delete').addEventListener('click', () => {
    store.deleteDebtRepayment(debt.id, repayment.id);
    rerender();
  });
  return row;
}

function debtDetailBlock(debt, accounts, accountsById, rerender) {
  const remaining = store.getDebtRemainingAmount(debt);
  const computedStatus = store.getDebtComputedStatus(debt);
  const isAddingRepayment = addingRepaymentFor === debt.id;

  const block = document.createElement('div');
  block.style.marginTop = 'var(--sp-3)';
  block.innerHTML = `
    <div class="detail-meta-grid">
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">Remboursé</span>
        <span class="detail-meta-item__value mono">${fmtAmount(debt.amount - remaining)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">Restant dû</span>
        <span class="detail-meta-item__value mono" style="color:${STATUS_COLOR[computedStatus]}">${fmtAmount(remaining)}</span>
      </div>
    </div>
    ${debt.note ? `<p class="detail-desc" style="margin-top:var(--sp-2)">${debt.note}</p>` : ''}
    <div class="detail-section-title" style="margin-top:var(--sp-4)">Remboursements</div>
    <div id="repayments-list-${debt.id}"></div>
    ${remaining > 0 ? (
      isAddingRepayment
        ? `
      <form id="repayment-form-${debt.id}" style="margin-top:var(--sp-2)">
        <div class="form-group">
          <input class="form-input" type="number" min="0" max="${remaining}" id="f-rep-amount" placeholder="Montant (MGA)" required />
        </div>
        <div class="form-group" style="margin-top:var(--sp-2)">
          <input class="form-input" id="f-rep-note" placeholder="Note (optionnel)" />
        </div>
        ${accounts.length > 0 ? `
        <div class="form-group" style="margin-top:var(--sp-2)">
          <label class="form-label" for="f-rep-account">Compte associé <span class="optional">(optionnel)</span></label>
          <select class="form-input" id="f-rep-account">
            <option value="">Aucun (juste solder la dette)</option>
            ${accounts.map((a) => `<option value="${a.id}">${a.name}</option>`).join('')}
          </select>
        </div>` : ''}
        <div class="form-actions" style="margin-top:var(--sp-2)">
          <button type="button" class="btn-secondary" id="repayment-cancel-btn">Annuler</button>
          <button type="submit" class="btn-primary">Ajouter</button>
        </div>
      </form>`
        : `<button type="button" class="chip" data-add-repayment="${debt.id}" style="margin-top:var(--sp-2)">${icons.plus}Ajouter un remboursement</button>`
    ) : ''}
  `;

  const list = block.querySelector(`#repayments-list-${debt.id}`);
  if (debt.repayments.length === 0) {
    list.innerHTML = `<p style="font-size:var(--fs-sm);color:var(--text-tertiary)">Aucun remboursement pour l'instant.</p>`;
  } else {
    debt.repayments.forEach((r) => list.appendChild(repaymentRow(debt, r, accountsById, rerender)));
  }

  const addRepaymentBtn = block.querySelector('[data-add-repayment]');
  if (addRepaymentBtn) {
    addRepaymentBtn.addEventListener('click', () => {
      addingRepaymentFor = debt.id;
      rerender();
    });
  }

  const repaymentForm = block.querySelector(`#repayment-form-${debt.id}`);
  if (repaymentForm) {
    repaymentForm.querySelector('#repayment-cancel-btn').addEventListener('click', () => {
      addingRepaymentFor = null;
      rerender();
    });
    repaymentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = Number(repaymentForm.querySelector('#f-rep-amount').value);
      const note = repaymentForm.querySelector('#f-rep-note').value;
      const accountSelect = repaymentForm.querySelector('#f-rep-account');
      const accountId = accountSelect?.value || null;
      if (!amount || amount <= 0) return;
      store.addDebtRepayment(debt.id, { amount, note, accountId });
      addingRepaymentFor = null;
      rerender();
    });
  }

  return block;
}

function debtCard(debt, accounts, accountsById, rerender) {
  const remaining = store.getDebtRemainingAmount(debt);
  const computedStatus = store.getDebtComputedStatus(debt);
  const directionInfo = store.getDebtDirectionInfo(debt.direction);
  const isOpen = openDebtId === debt.id;

  const card = document.createElement('div');
  card.className = 'card goal-card';
  card.innerHTML = `
    <button type="button" class="goal-card__top" data-toggle="${debt.id}" style="background:none;border:none;cursor:pointer;text-align:left;width:100%;padding:0">
      <div>
        <div class="goal-card__title-row">
          <span class="goal-card__name">${debt.person}</span>
        </div>
        <div class="goal-card__meta-row">
          <span class="category-tag">${icons[debt.direction === 'lent' ? 'handshakeOut' : 'handshakeIn']}${directionInfo.label}</span>
          <span class="chip" style="color:${STATUS_COLOR[computedStatus]}">${store.DEBT_STATUS_LABELS[computedStatus]}</span>
          ${debt.dueDate ? `<span class="chip">${icons.clock}${fmtDate(debt.dueDate)}</span>` : ''}
        </div>
      </div>
      <span class="goal-card__deadline mono" style="color:${STATUS_COLOR[computedStatus]}">${fmtAmount(remaining)}</span>
    </button>
    <div class="form-actions" style="margin-top:var(--sp-3)">
      <button type="button" class="chip" data-delete="${debt.id}" style="color:var(--danger-500)">${icons.trash}Supprimer</button>
    </div>
    <div id="debt-detail-${debt.id}"></div>
  `;

  card.querySelector('[data-toggle]').addEventListener('click', () => {
    openDebtId = isOpen ? null : debt.id;
    addingRepaymentFor = null;
    rerender();
  });

  if (isOpen) {
    card.querySelector(`#debt-detail-${debt.id}`).appendChild(debtDetailBlock(debt, accounts, accountsById, rerender));
  }

  card.querySelector('[data-delete]').addEventListener('click', () => {
    card.appendChild(deleteConfirmSheet(
      'Supprimer cette dette ?',
      `« ${debt.person} » sera supprimée avec son historique de remboursements. Cette opération est irréversible.`,
      () => {
        store.deleteDebt(debt.id);
        rerender();
      },
    ));
  });

  return card;
}

export function DebtsScreen() {
  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">Dettes / Prêts</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/money'));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  function rerender() {
    el.replaceWith(DebtsScreen());
  }

  const accounts = store.listAccounts();
  const accountsById = Object.fromEntries(accounts.map((a) => [a.id, a]));
  const summary = store.getDebtsSummary();
  const directionFilter = activeDirection === 'all' ? null : activeDirection;
  const statusFilter = activeStatus === 'all' ? null : activeStatus;
  const debts = store.listDebtsFiltered(directionFilter, statusFilter);

  const summaryHtml = `
    <section class="card">
      <div class="detail-meta-grid">
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">${icons.handshakeOut}On me doit</span>
          <span class="detail-meta-item__value mono" style="color:var(--success-500)">${fmtAmount(summary.totalLent)}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">${icons.handshakeIn}Je dois</span>
          <span class="detail-meta-item__value mono" style="color:var(--danger-500)">${fmtAmount(summary.totalBorrowed)}</span>
        </div>
      </div>
      ${summary.lateCount > 0 ? `<p class="detail-desc" style="color:var(--danger-500);margin-top:var(--sp-2)">${summary.lateCount} dette(s) en retard</p>` : ''}
    </section>
  `;

  screen.innerHTML = `
    ${summaryHtml}

    <div class="tab-row mind-tab-row" role="tablist" id="direction-tabs" style="margin-top:var(--sp-3)">
      <button class="tab-btn ${activeDirection === 'all' ? 'is-active' : ''}" data-direction="all">Toutes</button>
      <button class="tab-btn ${activeDirection === 'lent' ? 'is-active' : ''}" data-direction="lent">${icons.handshakeOut}J'ai prêté</button>
      <button class="tab-btn ${activeDirection === 'borrowed' ? 'is-active' : ''}" data-direction="borrowed">${icons.handshakeIn}On m'a prêté</button>
    </div>

    <div class="tab-row mind-tab-row" role="tablist" id="status-tabs" style="margin-top:var(--sp-2)">
      <button class="tab-btn ${activeStatus === 'all' ? 'is-active' : ''}" data-status="all">Tous</button>
      <button class="tab-btn ${activeStatus === 'active' ? 'is-active' : ''}" data-status="active">Actif</button>
      <button class="tab-btn ${activeStatus === 'partial' ? 'is-active' : ''}" data-status="partial">Partiel</button>
      <button class="tab-btn ${activeStatus === 'late' ? 'is-active' : ''}" data-status="late">En retard</button>
      <button class="tab-btn ${activeStatus === 'completed' ? 'is-active' : ''}" data-status="completed">Remboursé</button>
    </div>

    <div style="margin-top:var(--sp-3)">
      ${creatingDebt ? debtFormHtml() : `<button type="button" class="chip" id="add-debt-btn">${icons.plus}Ajouter une dette / un prêt</button>`}
    </div>

    <div id="debts-list" class="goal-list" style="margin-top:var(--sp-3)"></div>
  `;

  const list = screen.querySelector('#debts-list');
  if (debts.length === 0) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-6)">
        ${icons.handshakeOut.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">Aucune dette</h2>
        <p class="state-block__desc">Enregistre un prêt fait ou reçu pour en suivre le remboursement.</p>
      </div>`;
  } else {
    debts.forEach((d) => list.appendChild(debtCard(d, accounts, accountsById, rerender)));
  }

  el.appendChild(screen);

  screen.querySelectorAll('#direction-tabs [data-direction]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeDirection = btn.dataset.direction;
      rerender();
    });
  });

  screen.querySelectorAll('#status-tabs [data-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeStatus = btn.dataset.status;
      rerender();
    });
  });

  const addBtn = screen.querySelector('#add-debt-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      creatingDebt = true;
      rerender();
    });
  }

  const form = screen.querySelector('#debt-form');
  if (form) {
    let selectedDirection = 'lent';
    form.querySelectorAll('#direction-picker [data-direction]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedDirection = btn.dataset.direction;
        form.querySelectorAll('#direction-picker [data-direction]').forEach((b) => b.classList.toggle('is-active', b.dataset.direction === selectedDirection));
      });
    });

    form.querySelector('#debt-cancel-btn').addEventListener('click', () => {
      creatingDebt = false;
      rerender();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const person = formData.get('person')?.toString().trim();
      const amount = Number(formData.get('amount'));
      const errorEl = form.querySelector('#debt-form-error');
      if (!person || !amount || amount <= 0) {
        errorEl.hidden = false;
        form.querySelector('#f-debt-person').focus();
        return;
      }
      errorEl.hidden = true;
      store.createDebt({
        direction: selectedDirection,
        person,
        amount,
        date: formData.get('date')?.toString() ?? '',
        dueDate: formData.get('dueDate')?.toString() ?? '',
        note: formData.get('note')?.toString() ?? '',
      });
      creatingDebt = false;
      rerender();
    });
  }

  return el;
}
