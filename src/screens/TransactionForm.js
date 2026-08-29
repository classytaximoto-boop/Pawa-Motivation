import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { moneyCategoriesByType } from '../data/moneyCategories.js';

function deleteConfirmSheet(transaction, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  const label = transaction.note?.trim() || (transaction.type === 'income' ? 'ce revenu' : 'cette dépense');
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer cette transaction ?</h2>
      <p class="confirm-sheet__desc">« ${label} » sera supprimée définitivement. Cette opération est irréversible.</p>
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

export function TransactionForm(params = {}) {
  const editingId = params.id ?? null;
  const existing = editingId ? store.getTransaction(editingId) : null;

  if (editingId && !existing) {
    router.navigate('/money');
    return document.createElement('div');
  }

  const accounts = store.listAccounts();
  let selectedType = existing?.type ?? 'expense';
  let selectedCategory = existing?.category ?? moneyCategoriesByType[selectedType][0].id;
  // Une ancienne transaction sans accountId est rattachée implicitement au compte
  // par défaut côté store (voir _effectiveAccountId) — même logique ici pour
  // présélectionner le bon compte dans le formulaire.
  let selectedAccountId = existing?.accountId || accounts[0]?.id || 'acc_default';

  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">${existing ? 'Modifier la transaction' : 'Nouvelle transaction'}</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/money'));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  function categoryPickerHtml() {
    return moneyCategoriesByType[selectedType].map((c) => `
      <button type="button" class="category-picker-item ${selectedCategory === c.id ? 'is-selected' : ''}" data-cat="${c.id}">
        ${icons[c.icon]}<span>${c.label}</span>
      </button>`).join('');
  }

  screen.innerHTML = `
    <form id="tx-form" novalidate>
      <div class="form-group">
        <label class="form-label">Type</label>
        <div class="tab-row mind-tab-row" id="type-picker">
          <button type="button" class="tab-btn ${selectedType === 'expense' ? 'is-active' : ''}" data-type="expense">Dépense</button>
          <button type="button" class="tab-btn ${selectedType === 'income' ? 'is-active' : ''}" data-type="income">Revenu</button>
        </div>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-amount">Montant (Ar)</label>
        <input class="form-input" type="number" min="0" id="f-amount" name="amount" placeholder="0" value="${existing?.amount ?? ''}" required />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label">Catégorie</label>
        <div class="category-picker" id="cat-picker">${categoryPickerHtml()}</div>
      </div>

      ${accounts.length > 1 ? `
      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-account">Compte</label>
        <select class="form-input" id="f-account" name="accountId">
          ${accounts.map((a) => `<option value="${a.id}" ${selectedAccountId === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
        </select>
      </div>` : ''}

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-note">Note <span class="optional">(optionnel)</span></label>
        <input class="form-input" id="f-note" name="note" placeholder="Ex. Courses de la semaine" value="${existing?.note ?? ''}" />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-date">Date</label>
        <input class="form-input" type="date" id="f-date" name="date" value="${existing?.date ?? new Date().toISOString().slice(0, 10)}" />
      </div>

      <p class="form-error" id="form-error" hidden>Indique un montant valide.</p>

      <div class="form-actions">
        ${existing ? `<button type="button" class="btn-secondary" id="delete-btn" style="color:var(--danger-500)">Supprimer</button>` : `<button type="button" class="btn-secondary" id="cancel-btn">Annuler</button>`}
        <button type="submit" class="btn-primary">${existing ? 'Enregistrer' : 'Ajouter'}</button>
      </div>
    </form>
  `;

  el.appendChild(screen);

  function bindCategoryPicker() {
    screen.querySelectorAll('#cat-picker [data-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedCategory = btn.dataset.cat;
        screen.querySelectorAll('#cat-picker [data-cat]').forEach((b) => b.classList.toggle('is-selected', b.dataset.cat === selectedCategory));
      });
    });
  }
  bindCategoryPicker();

  screen.querySelectorAll('#type-picker [data-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedType = btn.dataset.type;
      selectedCategory = moneyCategoriesByType[selectedType][0].id;
      screen.querySelectorAll('#type-picker [data-type]').forEach((b) => b.classList.toggle('is-active', b.dataset.type === selectedType));
      screen.querySelector('#cat-picker').innerHTML = categoryPickerHtml();
      bindCategoryPicker();
    });
  });

  const cancelBtn = screen.querySelector('#cancel-btn');
  if (cancelBtn) cancelBtn.addEventListener('click', () => router.navigate('/money'));

  const deleteBtn = screen.querySelector('#delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      el.appendChild(deleteConfirmSheet(existing, () => {
        store.deleteTransaction(existing.id);
        router.navigate('/money');
      }));
    });
  }

  screen.querySelector('#tx-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const amount = Number(formData.get('amount'));
    const errorEl = screen.querySelector('#form-error');
    if (!amount || amount <= 0) {
      errorEl.hidden = false;
      screen.querySelector('#f-amount').focus();
      return;
    }
    errorEl.hidden = true;

    const fields = {
      type: selectedType,
      amount,
      category: selectedCategory,
      note: formData.get('note')?.toString() ?? '',
      date: formData.get('date')?.toString() ?? '',
      accountId: formData.get('accountId')?.toString() || selectedAccountId,
    };

    if (existing) {
      store.updateTransaction(existing.id, fields);
    } else {
      store.createTransaction(fields);
    }
    router.navigate('/money');
  });

  return el;
}
