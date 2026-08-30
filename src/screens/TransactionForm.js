import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

function deleteConfirmSheet(transaction, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  const label = transaction.note?.trim() || (transaction.type === 'income' ? 'ce revenu' : transaction.type === 'transfer' ? 'ce transfert' : 'cette dépense');
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
  const canTransfer = accounts.length > 1;
  let selectedType = existing?.type ?? 'expense';
  let categories = selectedType === 'transfer' ? [] : store.listCategories(selectedType);
  let selectedCategory = existing?.category ?? categories[0]?.id ?? 'autre';
  let selectedSubcategory = existing?.subcategory ?? null;
  // Une ancienne transaction sans accountId est rattachée implicitement au compte
  // par défaut côté store (voir _effectiveAccountId) — même logique ici pour
  // présélectionner le bon compte dans le formulaire.
  let selectedAccountId = existing?.accountId || accounts[0]?.id || 'acc_default';
  let selectedToAccountId = existing?.toAccountId || accounts.find((a) => a.id !== selectedAccountId)?.id || null;

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

  function currentCategory() {
    return categories.find((c) => c.id === selectedCategory) ?? categories[0] ?? null;
  }

  function categoryPickerHtml() {
    return categories.map((c) => `
      <button type="button" class="category-picker-item ${selectedCategory === c.id ? 'is-selected' : ''}" data-cat="${c.id}">
        ${icons[c.icon]}<span>${c.label}</span>
      </button>`).join('');
  }

  function subcategoryFieldHtml() {
    const cat = currentCategory();
    if (!cat || !cat.subcategories || cat.subcategories.length === 0) return '';
    return `
      <div class="form-group" style="margin-top: var(--sp-4)" id="subcat-group">
        <label class="form-label" for="f-subcategory">Sous-catégorie <span class="optional">(optionnel)</span></label>
        <select class="form-input" id="f-subcategory" name="subcategory">
          <option value="">—</option>
          ${cat.subcategories.map((s) => `<option value="${s.id}" ${selectedSubcategory === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
        </select>
      </div>`;
  }

  function accountOptionsHtml(excludeId) {
    return accounts
      .filter((a) => a.id !== excludeId)
      .map((a) => {
        const typeLabel = store.getAccountTypeInfo(a.type)?.label;
        const suffix = typeLabel && typeLabel !== a.name ? ` (${typeLabel})` : '';
        return `<option value="${a.id}">${a.name}${suffix}</option>`;
      }).join('');
  }

  function categoryOrTransferFieldsHtml() {
    if (selectedType === 'transfer') {
      return `
        <div class="form-group" style="margin-top: var(--sp-4)">
          <label class="form-label" for="f-to-account">Vers le compte</label>
          <select class="form-input" id="f-to-account" name="toAccountId">
            ${accountOptionsHtml(selectedAccountId).replace(
              `value="${selectedToAccountId}"`,
              `value="${selectedToAccountId}" selected`,
            )}
          </select>
        </div>`;
    }
    return `
      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label">Catégorie</label>
        <div class="category-picker" id="cat-picker">${categoryPickerHtml()}</div>
      </div>
      <div id="subcat-container">${subcategoryFieldHtml()}</div>`;
  }

  function accountFieldHtml() {
    const label = selectedType === 'transfer' ? 'Depuis le compte' : 'Compte';
    if (accounts.length <= 1) return '';
    return `
      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-account">${label}</label>
        <select class="form-input" id="f-account" name="accountId">
          ${accounts.map((a) => {
            const typeLabel = store.getAccountTypeInfo(a.type)?.label;
            const suffix = typeLabel && typeLabel !== a.name ? ` (${typeLabel})` : '';
            return `<option value="${a.id}" ${selectedAccountId === a.id ? 'selected' : ''}>${a.name}${suffix}</option>`;
          }).join('')}
        </select>
      </div>`;
  }

  screen.innerHTML = `
    <form id="tx-form" novalidate>
      <div class="form-group">
        <label class="form-label">Type</label>
        <div class="tab-row mind-tab-row" id="type-picker">
          <button type="button" class="tab-btn ${selectedType === 'expense' ? 'is-active' : ''}" data-type="expense">Dépense</button>
          <button type="button" class="tab-btn ${selectedType === 'income' ? 'is-active' : ''}" data-type="income">Revenu</button>
          ${canTransfer ? `<button type="button" class="tab-btn ${selectedType === 'transfer' ? 'is-active' : ''}" data-type="transfer">Transfert</button>` : ''}
        </div>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-amount">Montant (MGA)</label>
        <input class="form-input" type="number" min="0" id="f-amount" name="amount" placeholder="0" value="${existing?.amount ?? ''}" required />
      </div>

      <div id="account-field-container">${accountFieldHtml()}</div>

      <div id="category-or-transfer-container">${categoryOrTransferFieldsHtml()}</div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-note">Note <span class="optional">(optionnel)</span></label>
        <input class="form-input" id="f-note" name="note" placeholder="Ex. Courses de la semaine" value="${existing?.note ?? ''}" />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-date">Date</label>
        <input class="form-input" type="date" id="f-date" name="date" value="${existing?.date ?? new Date().toISOString().slice(0, 10)}" />
      </div>

      <p class="form-error" id="form-error" hidden>Indique un montant valide.</p>
      <p class="form-error" id="form-error-transfer" hidden>Choisis deux comptes différents pour le transfert.</p>

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
        selectedSubcategory = null; // la sous-catégorie précédente n'a plus de sens sous une autre catégorie
        screen.querySelectorAll('#cat-picker [data-cat]').forEach((b) => b.classList.toggle('is-selected', b.dataset.cat === selectedCategory));
        screen.querySelector('#subcat-container').innerHTML = subcategoryFieldHtml();
        bindSubcategoryPicker();
      });
    });
  }

  function bindSubcategoryPicker() {
    const select = screen.querySelector('#f-subcategory');
    if (!select) return;
    select.addEventListener('change', () => {
      selectedSubcategory = select.value || null;
    });
  }

  function bindToAccountPicker() {
    const select = screen.querySelector('#f-to-account');
    if (!select) return;
    select.addEventListener('change', () => {
      selectedToAccountId = select.value || null;
    });
  }

  function bindAccountPicker() {
    const select = screen.querySelector('#f-account');
    if (!select) return;
    select.addEventListener('change', () => {
      selectedAccountId = select.value;
      if (selectedType === 'transfer') {
        // Le compte source ne peut plus être aussi la destination — retire-le
        // des options et choisit une nouvelle destination par défaut si besoin.
        if (selectedToAccountId === selectedAccountId) {
          selectedToAccountId = accounts.find((a) => a.id !== selectedAccountId)?.id ?? null;
        }
        screen.querySelector('#category-or-transfer-container').innerHTML = categoryOrTransferFieldsHtml();
        bindToAccountPicker();
      }
    });
  }

  function rebindDynamicFields() {
    bindCategoryPicker();
    bindSubcategoryPicker();
    bindToAccountPicker();
    bindAccountPicker();
  }
  rebindDynamicFields();

  screen.querySelectorAll('#type-picker [data-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedType = btn.dataset.type;
      categories = selectedType === 'transfer' ? [] : store.listCategories(selectedType);
      selectedCategory = categories[0]?.id ?? 'autre';
      selectedSubcategory = null;
      if (selectedType === 'transfer' && !selectedToAccountId) {
        selectedToAccountId = accounts.find((a) => a.id !== selectedAccountId)?.id ?? null;
      }
      screen.querySelectorAll('#type-picker [data-type]').forEach((b) => b.classList.toggle('is-active', b.dataset.type === selectedType));
      screen.querySelector('#account-field-container').innerHTML = accountFieldHtml();
      screen.querySelector('#category-or-transfer-container').innerHTML = categoryOrTransferFieldsHtml();
      rebindDynamicFields();
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
    const errorTransferEl = screen.querySelector('#form-error-transfer');
    errorEl.hidden = true;
    errorTransferEl.hidden = true;

    if (!amount || amount <= 0) {
      errorEl.hidden = false;
      screen.querySelector('#f-amount').focus();
      return;
    }

    const accountId = formData.get('accountId')?.toString() || selectedAccountId;

    if (selectedType === 'transfer') {
      const toAccountId = formData.get('toAccountId')?.toString() || selectedToAccountId;
      if (!toAccountId || toAccountId === accountId) {
        errorTransferEl.hidden = false;
        return;
      }
      const fields = {
        type: 'transfer',
        amount,
        note: formData.get('note')?.toString() ?? '',
        date: formData.get('date')?.toString() ?? '',
        accountId,
        toAccountId,
      };
      if (existing) {
        store.updateTransaction(existing.id, fields);
      } else {
        store.createTransaction(fields);
      }
      router.navigate('/money');
      return;
    }

    const fields = {
      type: selectedType,
      amount,
      category: selectedCategory,
      subcategory: formData.get('subcategory')?.toString() || null,
      note: formData.get('note')?.toString() ?? '',
      date: formData.get('date')?.toString() ?? '',
      accountId,
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
