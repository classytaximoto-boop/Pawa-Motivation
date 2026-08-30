import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { MoneySubScreenHeader } from '../components/MoneySubScreenHeader.js';
import { fmtAmount, fmtDate } from '../utils/moneyFormat.js';

// État local de l'écran (mémoire vive, pas persisté)
let editingId = null; // id en cours de modification, ou 'new' pour création, ou null si formulaire fermé
let viewingId = null; // id de l'investissement affiché en détail, ou null

function performanceColor(pct) {
  if (pct > 0) return 'var(--success-500)';
  if (pct < 0) return 'var(--danger-500)';
  return 'var(--text-tertiary)';
}

function fmtPct(pct) {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${Math.round(pct * 10) / 10}%`;
}

function investmentCard(inv, onView, onEdit, onDelete) {
  const gain = store.getInvestmentGain(inv);
  const perf = store.getInvestmentPerformance(inv);
  const typeLabel = store.getInvestmentTypeInfo(inv.type).label;
  const card = document.createElement('div');
  card.className = 'money-card';
  card.style.cursor = 'pointer';
  card.innerHTML = `
    <div class="detail-meta-item">
      <span class="category-tag">${icons.briefcase || ''}${inv.name}</span>
      <span class="chip">${typeLabel}</span>
    </div>
    <div class="detail-meta-grid" style="margin-top:var(--sp-2)">
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">Capital investi</span>
        <span class="detail-meta-item__value mono">${fmtAmount(inv.initialAmount)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">Valeur actuelle</span>
        <span class="detail-meta-item__value mono">${fmtAmount(inv.currentValue)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">Gain/Perte</span>
        <span class="detail-meta-item__value mono" style="color:${performanceColor(gain)}">${gain >= 0 ? '+' : ''}${fmtAmount(gain)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">Performance</span>
        <span class="detail-meta-item__value mono" style="color:${performanceColor(perf)}">${fmtPct(perf)}</span>
      </div>
    </div>
    <div class="form-actions" style="margin-top:var(--sp-3)">
      <button type="button" class="chip" data-view>${icons.eye || ''}Voir</button>
      <button type="button" class="chip" data-edit>${icons.edit}Modifier</button>
      <button type="button" class="chip" data-delete style="color:var(--danger-500)">${icons.trash}Supprimer</button>
    </div>
  `;
  card.querySelector('[data-view]').addEventListener('click', (e) => { e.stopPropagation(); onView(inv.id); });
  card.querySelector('[data-edit]').addEventListener('click', (e) => { e.stopPropagation(); onEdit(inv.id); });
  card.querySelector('[data-delete]').addEventListener('click', (e) => { e.stopPropagation(); onDelete(inv.id, inv.name); });
  card.addEventListener('click', () => onView(inv.id));
  return card;
}

function deleteConfirmSheet(name, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer cet investissement ?</h2>
      <p class="confirm-sheet__desc">« ${name} » sera définitivement supprimé, y compris son historique de valeur.</p>
      <div class="form-actions">
        <button class="btn-secondary" id="cancel-delete">Annuler</button>
        <button class="btn-danger" id="confirm-delete">Supprimer</button>
      </div>
    </div>
  `;
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
  backdrop.querySelector('#cancel-delete').addEventListener('click', () => backdrop.remove());
  backdrop.querySelector('#confirm-delete').addEventListener('click', () => {
    onConfirm();
    backdrop.remove();
  });
  return backdrop;
}

function investmentDetailView(inv, onBack) {
  const gain = store.getInvestmentGain(inv);
  const perf = store.getInvestmentPerformance(inv);
  const accounts = store.listAccounts();
  const account = inv.accountId ? accounts.find((a) => a.id === inv.accountId) : null;

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <button type="button" class="money-btn-ghost" id="back-btn">${icons.arrowLeft || '←'} Retour</button>
    <section class="card" style="margin-top:var(--sp-3)">
      <div class="detail-section-title">${inv.name}</div>
      <div class="detail-meta-grid" style="margin-top:var(--sp-2)">
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Type</span>
          <span class="detail-meta-item__value">${store.getInvestmentTypeInfo(inv.type).label}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Date</span>
          <span class="detail-meta-item__value">${fmtDate(inv.date, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Capital investi</span>
          <span class="detail-meta-item__value mono">${fmtAmount(inv.initialAmount)}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Valeur actuelle</span>
          <span class="detail-meta-item__value mono">${fmtAmount(inv.currentValue)}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Gain/Perte</span>
          <span class="detail-meta-item__value mono" style="color:${performanceColor(gain)}">${gain >= 0 ? '+' : ''}${fmtAmount(gain)}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Performance</span>
          <span class="detail-meta-item__value mono" style="color:${performanceColor(perf)}">${fmtPct(perf)}</span>
        </div>
        ${account ? `
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Compte associé</span>
          <span class="detail-meta-item__value">${account.name}</span>
        </div>` : ''}
      </div>
      ${inv.notes ? `<p class="detail-desc" style="margin-top:var(--sp-3)">${inv.notes}</p>` : ''}
    </section>
    ${inv.valueHistory.length > 1 ? `
    <section class="card" style="margin-top:var(--sp-3)">
      <div class="detail-section-title">Évolution de la valeur</div>
      <div style="margin-top:var(--sp-2)">
        ${inv.valueHistory.slice().reverse().map((h) => `
          <div class="detail-meta-item" style="margin-bottom:var(--sp-2)">
            <span class="chip">${fmtDate(h.date)}</span>
            <span class="detail-meta-item__value mono">${fmtAmount(h.value)}</span>
          </div>`).join('')}
      </div>
    </section>` : ''}
  `;
  wrap.querySelector('#back-btn').addEventListener('click', onBack);
  return wrap;
}

export function InvestmentsScreen() {
  const el = document.createElement('div');
  el.appendChild(MoneySubScreenHeader('Investissements', 'investissements'));

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  function rerender() {
    el.replaceWith(InvestmentsScreen());
  }

  const investments = store.getInvestments();

  // Vue détail : remplace toute la liste tant que viewingId est défini.
  if (viewingId) {
    const inv = store.getInvestment(viewingId);
    if (inv) {
      screen.appendChild(investmentDetailView(inv, () => { viewingId = null; rerender(); }));
      el.appendChild(screen);
      return el;
    }
    viewingId = null; // l'investissement a été supprimé entre-temps
  }

  const summary = store.getInvestmentsSummary();

  const summaryCard = document.createElement('section');
  summaryCard.className = 'card';
  summaryCard.innerHTML = `
    <div class="progress-header">
      <span class="progress-header__title">Valeur actuelle totale</span>
      <span class="progress-header__value mono">${fmtAmount(summary.totalCurrent)}</span>
    </div>
    <div class="detail-meta-grid" style="margin-top:var(--sp-3)">
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">Capital total</span>
        <span class="detail-meta-item__value mono">${fmtAmount(summary.totalInitial)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">Gain/Perte total</span>
        <span class="detail-meta-item__value mono" style="color:${performanceColor(summary.totalGain)}">${summary.totalGain >= 0 ? '+' : ''}${fmtAmount(summary.totalGain)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">Performance globale</span>
        <span class="detail-meta-item__value mono" style="color:${performanceColor(summary.globalPerformance)}">${fmtPct(summary.globalPerformance)}</span>
      </div>
    </div>
  `;
  screen.appendChild(summaryCard);

  const list = document.createElement('div');
  list.className = 'goal-list';
  list.style.marginTop = 'var(--sp-3)';
  if (investments.length === 0) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-8)">
        ${(icons.briefcase || icons.inbox).replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">Aucun investissement</h2>
        <p class="state-block__desc">Ajoute ta première position pour suivre son évolution.</p>
      </div>`;
  } else {
    investments.forEach((inv) => list.appendChild(investmentCard(
      inv,
      (id) => { viewingId = id; rerender(); },
      (id) => { editingId = id; rerender(); },
      (id, name) => {
        el.appendChild(deleteConfirmSheet(name, () => {
          store.deleteInvestment(id);
          rerender();
        }));
      },
    )));
  }
  screen.appendChild(list);

  // Formulaire d'ajout/modification
  const editingInv = editingId && editingId !== 'new' ? store.getInvestment(editingId) : null;
  const accounts = store.listAccounts();

  if (editingId) {
    const formCard = document.createElement('section');
    formCard.className = 'money-card';
    formCard.style.marginTop = 'var(--sp-3)';
    formCard.innerHTML = `
      <div class="money-card__title">${editingInv ? 'Modifier' : 'Nouvel'} investissement</div>
      <form id="inv-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="f-inv-name">Nom</label>
          <input class="form-input" type="text" id="f-inv-name" name="name" value="${editingInv?.name ?? ''}" placeholder="Ex: Actions Airtel" required />
        </div>
        <div class="form-group" style="margin-top:var(--sp-3)">
          <label class="form-label" for="f-inv-type">Type</label>
          <select class="form-input" id="f-inv-type" name="type">
            ${store.INVESTMENT_TYPES.map((t) => `<option value="${t.id}" ${(editingInv?.type ?? 'other') === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-top:var(--sp-3)">
          <label class="form-label" for="f-inv-initial">Capital investi (MGA)</label>
          <input class="form-input" type="number" min="0" id="f-inv-initial" name="initialAmount" value="${editingInv?.initialAmount ?? ''}" placeholder="0" required />
        </div>
        <div class="form-group" style="margin-top:var(--sp-3)">
          <label class="form-label" for="f-inv-current">Valeur actuelle (MGA)</label>
          <input class="form-input" type="number" min="0" id="f-inv-current" name="currentValue" value="${editingInv?.currentValue ?? ''}" placeholder="Laisser vide = identique au capital" />
        </div>
        <div class="form-group" style="margin-top:var(--sp-3)">
          <label class="form-label" for="f-inv-date">Date</label>
          <input class="form-input" type="date" id="f-inv-date" name="date" value="${editingInv?.date ?? new Date().toISOString().slice(0, 10)}" />
        </div>
        ${accounts.length > 0 ? `
        <div class="form-group" style="margin-top:var(--sp-3)">
          <label class="form-label" for="f-inv-account">Compte associé (optionnel)</label>
          <select class="form-input" id="f-inv-account" name="accountId">
            <option value="">Aucun</option>
            ${accounts.map((a) => `<option value="${a.id}" ${editingInv?.accountId === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
          </select>
        </div>` : ''}
        <div class="form-group" style="margin-top:var(--sp-3)">
          <label class="form-label" for="f-inv-notes">Notes</label>
          <textarea class="form-input" id="f-inv-notes" name="notes" rows="3" placeholder="Détails, contexte...">${editingInv?.notes ?? ''}</textarea>
        </div>
        <div class="form-actions" style="margin-top:var(--sp-3)">
          <button type="button" class="btn-secondary" id="inv-cancel-btn">Annuler</button>
          <button type="submit" class="btn-primary">Enregistrer</button>
        </div>
      </form>
    `;
    screen.appendChild(formCard);

    formCard.querySelector('#inv-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const fields = {
        name: fd.get('name')?.toString(),
        type: fd.get('type')?.toString(),
        initialAmount: fd.get('initialAmount'),
        currentValue: fd.get('currentValue'),
        date: fd.get('date')?.toString(),
        accountId: fd.get('accountId')?.toString() || null,
        notes: fd.get('notes')?.toString(),
      };
      if (!fields.name?.trim() || !fields.initialAmount) return;
      if (editingInv) {
        store.updateInvestment(editingInv.id, fields);
      } else {
        store.createInvestment(fields);
      }
      editingId = null;
      rerender();
    });
    formCard.querySelector('#inv-cancel-btn').addEventListener('click', () => { editingId = null; rerender(); });
  } else {
    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'btn-primary';
    fab.style.marginTop = 'var(--sp-3)';
    fab.innerHTML = `${icons.plus}Nouvel investissement`;
    fab.addEventListener('click', () => { editingId = 'new'; rerender(); });
    screen.appendChild(fab);
  }

  el.appendChild(screen);
  return el;
}
