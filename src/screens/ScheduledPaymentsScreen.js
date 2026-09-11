import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

// État local de l'écran (mémoire vive, pas persisté)
let activeFilter = 'all'; // 'all' | 'due' | 'active' | 'inactive'
let editingPaymentId = null; // 'new' pour une création, id existant en modification, ou null si fermé
let openPaymentId = null; // id du paiement dont l'historique est déplié
// Champs de sélection dynamiques du formulaire, remis à zéro à chaque ouverture (voir openForm)
let formType = 'expense';
let formCategory = null;
let formSubcategory = null;
let formAccountId = null;
let formFrequency = 'monthly';

function fmtAmount(n) {
  return `${Math.round(n).toLocaleString('fr-FR')} MGA`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function deleteConfirmSheet(payment, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer ce paiement planifié ?</h2>
      <p class="confirm-sheet__desc">« ${payment.name} » sera supprimé. Les transactions déjà créées lors de confirmations précédentes ne sont pas affectées. Cette opération est irréversible.</p>
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

function openForm(existing, accounts) {
  editingPaymentId = existing ? existing.id : 'new';
  formType = existing?.type ?? 'expense';
  const categories = store.listCategories(formType);
  formCategory = existing?.category ?? categories[0]?.id ?? 'autre';
  formSubcategory = existing?.subcategory ?? null;
  formAccountId = existing?.accountId ?? accounts[0]?.id ?? store.DEFAULT_ACCOUNT_ID;
  formFrequency = existing?.frequency ?? 'monthly';
}

function categoryPickerHtml() {
  const categories = store.listCategories(formType);
  return categories.map((c) => `
    <button type="button" class="category-picker-item ${formCategory === c.id ? 'is-selected' : ''}" data-cat="${c.id}">
      ${icons[c.icon]}<span>${c.label}</span>
    </button>`).join('');
}

function subcategoryFieldHtml() {
  const categories = store.listCategories(formType);
  const cat = categories.find((c) => c.id === formCategory) ?? categories[0] ?? null;
  if (!cat || !cat.subcategories || cat.subcategories.length === 0) return '';
  return `
    <div class="form-group" style="margin-top: var(--sp-4)" id="subcat-group">
      <label class="form-label" for="f-sp-subcategory">${icons.inbox}Sous-catégorie <span class="optional">(optionnel)</span></label>
      <select class="form-input" id="f-sp-subcategory" name="subcategory">
        <option value="">—</option>
        ${cat.subcategories.map((s) => `<option value="${s.id}" ${formSubcategory === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
      </select>
    </div>`;
}

function paymentFormHtml(existing, accounts) {
  return `
    <form id="sp-form" class="card" style="margin-bottom:var(--sp-3)" novalidate>
      <div class="form-group">
        <label class="form-label" for="f-sp-name">${icons.edit}Nom</label>
        <input class="form-input" id="f-sp-name" name="name" placeholder="Ex. Loyer" value="${existing?.name ?? ''}" required />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label">${icons.sliders}Type</label>
        <div class="tab-row mind-tab-row" id="sp-type-picker">
          <button type="button" class="tab-btn ${formType === 'expense' ? 'is-active' : ''}" data-type="expense">Dépense</button>
          <button type="button" class="tab-btn ${formType === 'income' ? 'is-active' : ''}" data-type="income">Revenu</button>
        </div>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-sp-amount">${icons.cash}Montant (MGA)</label>
        <input class="form-input" type="number" min="0" id="f-sp-amount" name="amount" placeholder="0" value="${existing?.amount ?? ''}" required />
      </div>

      ${accounts.length > 1 ? `
      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-sp-account">${icons.bank}Compte</label>
        <select class="form-input" id="f-sp-account" name="accountId">
          ${accounts.map((a) => `<option value="${a.id}" ${formAccountId === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
        </select>
      </div>` : ''}

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label">${icons.inbox}Catégorie</label>
        <div class="category-picker" id="sp-cat-picker">${categoryPickerHtml()}</div>
      </div>
      <div id="sp-subcat-container">${subcategoryFieldHtml()}</div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label">${icons.refresh}Fréquence</label>
        <div class="tab-row mind-tab-row" id="sp-frequency-picker">
          ${store.SCHEDULED_PAYMENT_FREQUENCIES.map((f) => `
            <button type="button" class="tab-btn ${formFrequency === f.id ? 'is-active' : ''}" data-frequency="${f.id}">${f.label}</button>`).join('')}
        </div>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-sp-due">${icons.calendar}Prochaine échéance</label>
        <input class="form-input" type="date" id="f-sp-due" name="nextDueDate" value="${existing?.nextDueDate ?? new Date().toISOString().slice(0, 10)}" required />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-sp-reminder">${icons.clock}Rappel <span class="optional">(jours avant l'échéance)</span></label>
        <input class="form-input" type="number" min="0" id="f-sp-reminder" name="reminderDays" placeholder="0" value="${existing?.reminderDays ?? 3}" />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-sp-active">
          <input type="checkbox" id="f-sp-active" name="active" ${existing?.active !== false ? 'checked' : ''} />
          Actif
        </label>
      </div>

      <div class="form-group" style="margin-top: var(--sp-2)">
        <label class="form-label" for="f-sp-auto">
          <input type="checkbox" id="f-sp-auto" name="autoCreate" ${existing?.autoCreate ? 'checked' : ''} />
          Créer automatiquement la transaction à échéance <span class="optional">(désactivé par défaut — sinon, confirmation manuelle requise)</span>
        </label>
      </div>

      <p class="form-error" id="sp-form-error" hidden>Indique un nom et un montant valides.</p>

      <div class="form-actions" style="margin-top:var(--sp-4)">
        <button type="button" class="btn-secondary" id="sp-cancel-btn">Annuler</button>
        <button type="submit" class="btn-primary">${existing ? 'Enregistrer' : 'Ajouter'}</button>
      </div>
    </form>
  `;
}

function historyBlock(payment) {
  const block = document.createElement('div');
  block.style.marginTop = 'var(--sp-3)';
  if (payment.history.length === 0) {
    block.innerHTML = `<p style="font-size:var(--fs-sm);color:var(--text-tertiary)">Aucune confirmation pour l'instant.</p>`;
    return block;
  }
  block.innerHTML = `
    <div class="detail-section-title">${icons.clock}Historique des confirmations</div>
    ${payment.history.map((h) => `
      <div class="step-row">
        <span class="step-row__text mono">${fmtDate(h.date)} — ${fmtAmount(h.amount)}</span>
      </div>`).join('')}
  `;
  return block;
}

function paymentCard(payment, accounts, accountsById, categoryMap, rerender) {
  const isDue = store.getDueScheduledPayments().some((p) => p.id === payment.id);
  const freqInfo = store.getScheduledPaymentFrequencyInfo(payment.frequency);
  const cat = categoryMap[payment.category] ?? categoryMap.autre;
  const isOpen = openPaymentId === payment.id;
  // BUGFIX audit : accountsById était déjà calculé et transmis mais jamais lu ici —
  // le compte source du paiement n'apparaissait donc jamais sur la carte. Repli
  // "Compte supprimé" si le compte n'existe plus (même logique que DebtsScreen).
  const accountLabel = accountsById[payment.accountId]?.name ?? 'Compte supprimé';

  const card = document.createElement('div');
  card.className = 'card goal-card';
  card.innerHTML = `
    <button type="button" class="goal-card__top" data-toggle="${payment.id}" style="background:none;border:none;cursor:pointer;text-align:left;width:100%;padding:0">
      <div>
        <div class="goal-card__title-row">
          <span class="goal-card__name">${payment.name}</span>
          ${!payment.active ? '<span class="chip">Inactif</span>' : ''}
        </div>
        <div class="goal-card__meta-row">
          <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon]}${cat.label}</span>
          <span class="chip">${icons.refresh}${freqInfo.label}</span>
          <span class="chip" style="color:${isDue ? 'var(--danger-500)' : 'var(--text-tertiary)'}">${icons.calendar}${fmtDate(payment.nextDueDate)}</span>
          <span class="chip">${icons.wallet}${accountLabel}</span>
        </div>
      </div>
      <span class="goal-card__deadline mono" style="color:${payment.type === 'income' ? 'var(--success-500)' : 'var(--danger-500)'}">
        ${payment.type === 'income' ? '+' : '−'}${fmtAmount(payment.amount)}
      </span>
    </button>
    <div class="form-actions" style="margin-top:var(--sp-3)">
      ${isDue ? `<button type="button" class="chip" data-confirm="${payment.id}" style="color:var(--success-500)">${icons.check}Confirmer le paiement</button>` : ''}
      <button type="button" class="chip" data-edit="${payment.id}">${icons.edit}Modifier</button>
      <button type="button" class="chip" data-delete="${payment.id}" style="color:var(--danger-500)">${icons.trash}Supprimer</button>
    </div>
    <div id="sp-detail-${payment.id}"></div>
  `;

  card.querySelector('[data-toggle]').addEventListener('click', () => {
    openPaymentId = isOpen ? null : payment.id;
    rerender();
  });

  if (isOpen) {
    card.querySelector(`#sp-detail-${payment.id}`).appendChild(historyBlock(payment));
  }

  const confirmBtn = card.querySelector('[data-confirm]');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      store.confirmScheduledPayment(payment.id);
      rerender();
    });
  }

  card.querySelector('[data-edit]').addEventListener('click', (e) => {
    e.stopPropagation();
    openForm(payment, accounts);
    rerender();
  });

  card.querySelector('[data-delete]').addEventListener('click', (e) => {
    e.stopPropagation();
    card.appendChild(deleteConfirmSheet(payment, () => {
      store.deleteScheduledPayment(payment.id);
      rerender();
    }));
  });

  return card;
}

export function ScheduledPaymentsScreen() {
  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">Paiements planifiés</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/money'));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  function rerender() {
    el.replaceWith(ScheduledPaymentsScreen());
  }

  const accounts = store.listAccounts();
  const accountsById = Object.fromEntries(accounts.map((a) => [a.id, a]));
  const categoryMap = store.getCategoryMap();
  const allPayments = store.listScheduledPayments();
  const duePayments = store.getDueScheduledPayments();
  const dueIds = new Set(duePayments.map((p) => p.id));

  const payments = allPayments.filter((p) => {
    if (activeFilter === 'due') return dueIds.has(p.id);
    if (activeFilter === 'active') return p.active;
    if (activeFilter === 'inactive') return !p.active;
    return true;
  });

  const existing = editingPaymentId && editingPaymentId !== 'new'
    ? allPayments.find((p) => p.id === editingPaymentId) ?? null
    : null;

  let formHtml = '';
  if (editingPaymentId === 'new' || existing) {
    formHtml = paymentFormHtml(existing, accounts);
  } else {
    formHtml = `<button type="button" class="chip" id="add-sp-btn" style="margin-bottom:var(--sp-3)">${icons.plus}Ajouter un paiement planifié</button>`;
  }

  screen.innerHTML = `
    ${duePayments.length > 0 ? `
    <section class="card" style="border-color:var(--danger-500)">
      <div class="detail-section-title" style="color:var(--danger-500)">${icons.alertTriangle}${duePayments.length} paiement(s) à confirmer</div>
      <p class="detail-desc">Ces échéances sont dues — confirme-les pour créer les transactions correspondantes.</p>
    </section>` : ''}

    <div class="tab-row mind-tab-row" role="tablist" id="filter-tabs" style="margin-top:var(--sp-3)">
      <button class="tab-btn ${activeFilter === 'all' ? 'is-active' : ''}" data-filter="all">Tous</button>
      <button class="tab-btn ${activeFilter === 'due' ? 'is-active' : ''}" data-filter="due">Dus</button>
      <button class="tab-btn ${activeFilter === 'active' ? 'is-active' : ''}" data-filter="active">Actifs</button>
      <button class="tab-btn ${activeFilter === 'inactive' ? 'is-active' : ''}" data-filter="inactive">Inactifs</button>
    </div>

    <div style="margin-top:var(--sp-3)">${formHtml}</div>

    <div id="sp-list" class="goal-list"></div>
  `;

  const list = screen.querySelector('#sp-list');
  if (payments.length === 0) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-6)">
        ${icons.calendar.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">Aucun paiement planifié</h2>
        <p class="state-block__desc">Ajoute ton loyer, tes abonnements ou ton salaire pour ne plus les oublier.</p>
      </div>`;
  } else {
    payments.forEach((p) => list.appendChild(paymentCard(p, accounts, accountsById, categoryMap, rerender)));
  }

  el.appendChild(screen);

  screen.querySelectorAll('#filter-tabs [data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      rerender();
    });
  });

  const addBtn = screen.querySelector('#add-sp-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      openForm(null, accounts);
      rerender();
    });
  }

  const form = screen.querySelector('#sp-form');
  if (form) {
    function bindDynamicFields() {
      form.querySelectorAll('#sp-cat-picker [data-cat]').forEach((btn) => {
        btn.addEventListener('click', () => {
          formCategory = btn.dataset.cat;
          formSubcategory = null;
          form.querySelectorAll('#sp-cat-picker [data-cat]').forEach((b) => b.classList.toggle('is-selected', b.dataset.cat === formCategory));
          form.querySelector('#sp-subcat-container').innerHTML = subcategoryFieldHtml();
        });
      });
    }
    bindDynamicFields();

    form.querySelectorAll('#sp-type-picker [data-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        formType = btn.dataset.type;
        const categories = store.listCategories(formType);
        formCategory = categories[0]?.id ?? 'autre';
        formSubcategory = null;
        form.querySelectorAll('#sp-type-picker [data-type]').forEach((b) => b.classList.toggle('is-active', b.dataset.type === formType));
        form.querySelector('#sp-cat-picker').innerHTML = categoryPickerHtml();
        form.querySelector('#sp-subcat-container').innerHTML = subcategoryFieldHtml();
        bindDynamicFields();
      });
    });

    form.querySelectorAll('#sp-frequency-picker [data-frequency]').forEach((btn) => {
      btn.addEventListener('click', () => {
        formFrequency = btn.dataset.frequency;
        form.querySelectorAll('#sp-frequency-picker [data-frequency]').forEach((b) => b.classList.toggle('is-active', b.dataset.frequency === formFrequency));
      });
    });

    form.querySelector('#sp-cancel-btn').addEventListener('click', () => {
      editingPaymentId = null;
      rerender();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const name = formData.get('name')?.toString().trim();
      const amount = Number(formData.get('amount'));
      const errorEl = form.querySelector('#sp-form-error');
      if (!name || !amount || amount <= 0) {
        errorEl.hidden = false;
        form.querySelector('#f-sp-name').focus();
        return;
      }
      errorEl.hidden = true;

      const fields = {
        name,
        type: formType,
        amount,
        accountId: formData.get('accountId')?.toString() || formAccountId,
        category: formCategory,
        subcategory: formData.get('subcategory')?.toString() || null,
        frequency: formFrequency,
        nextDueDate: formData.get('nextDueDate')?.toString() ?? '',
        reminderDays: Number(formData.get('reminderDays')) || 0,
        active: form.querySelector('#f-sp-active').checked,
        autoCreate: form.querySelector('#f-sp-auto').checked,
      };

      if (existing) {
        store.updateScheduledPayment(existing.id, fields);
      } else {
        store.createScheduledPayment(fields);
      }
      editingPaymentId = null;
      rerender();
    });
  }

  return el;
}
