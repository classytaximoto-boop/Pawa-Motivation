import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

// État local de l'écran (mémoire vive, pas persisté) : id du compte en cours
// de création/modification dans le formulaire inline, ou null si fermé.
let editingAccountId = null; // 'new' pour une création, ou l'id d'un compte existant
let pendingType = null;

function fmtAmount(n) {
  return `${Math.round(n).toLocaleString('fr-FR')} MGA`;
}

function deleteConfirmSheet(account, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer ce compte ?</h2>
      <p class="confirm-sheet__desc">« ${account.name} » sera supprimé. Ses transactions seront réattribuées au compte par défaut. Cette opération est irréversible.</p>
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

function accountFormHtml(existing) {
  const types = store.ACCOUNT_TYPES;
  const selectedType = pendingType || existing?.type || types[0].id;
  return `
    <form id="account-form" class="card" style="margin-bottom:var(--sp-3)" novalidate>
      <div class="form-group">
        <label class="form-label">Type</label>
        <div class="category-picker" id="account-type-picker">
          ${types.map((t) => `
            <button type="button" class="category-picker-item ${selectedType === t.id ? 'is-selected' : ''}" data-type="${t.id}">
              ${icons[t.icon]}<span>${t.label}</span>
            </button>`).join('')}
        </div>
      </div>
      <div class="form-group" style="margin-top:var(--sp-4)">
        <label class="form-label" for="f-account-name">Nom du compte</label>
        <input class="form-input" id="f-account-name" name="name" placeholder="${store.getAccountTypeInfo(selectedType).label}" value="${existing?.name ?? ''}" />
      </div>
      <div class="form-actions" style="margin-top:var(--sp-4)">
        <button type="button" class="btn-secondary" id="account-cancel-btn">Annuler</button>
        <button type="submit" class="btn-primary">${existing ? 'Enregistrer' : 'Ajouter'}</button>
      </div>
    </form>
  `;
}

function accountRow(account) {
  const typeInfo = store.getAccountTypeInfo(account.type);
  const balance = store.getAccountBalance(account.id);
  const row = document.createElement('div');
  row.className = 'card goal-card';
  row.innerHTML = `
    <div class="goal-card__top">
      <div>
        <div class="goal-card__title-row">
          <span class="goal-card__name">${account.name}</span>
        </div>
        <div class="goal-card__meta-row">
          <span class="category-tag">${icons[account.icon] || icons[typeInfo.icon]}${typeInfo.label}</span>
        </div>
      </div>
      <span class="goal-card__deadline mono" style="color:${balance >= 0 ? 'var(--text-primary)' : 'var(--danger-500)'}">
        ${fmtAmount(balance)}
      </span>
    </div>
    <div class="form-actions" style="margin-top:var(--sp-3)">
      <button type="button" class="chip" data-edit="${account.id}">${icons.edit}Modifier</button>
      <button type="button" class="chip" data-delete="${account.id}" style="color:var(--danger-500)">${icons.trash}Supprimer</button>
    </div>
  `;
  return row;
}

export function AccountsScreen() {
  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">Comptes</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/money'));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  const accounts = store.listAccounts();
  const existing = editingAccountId && editingAccountId !== 'new'
    ? accounts.find((a) => a.id === editingAccountId) ?? null
    : null;

  let formHtml = '';
  if (editingAccountId === 'new' || existing) {
    formHtml = accountFormHtml(existing);
  } else {
    formHtml = `<button type="button" class="chip" id="add-account-btn" style="margin-bottom:var(--sp-3)">${icons.plus}Ajouter un compte</button>`;
  }

  const listHtml = accounts.length === 0
    ? `
    <div class="state-block" style="padding-top: var(--sp-6)">
      ${icons.wallet.replace('<svg ', '<svg class="state-block__icon" ')}
      <h2 class="state-block__title">Aucun compte</h2>
      <p class="state-block__desc">Ajoute un premier compte pour suivre ton argent.</p>
    </div>` : '';

  screen.innerHTML = `${formHtml}<div id="accounts-list" class="goal-list">${listHtml}</div>`;

  const list = screen.querySelector('#accounts-list');
  if (accounts.length > 0) {
    accounts.forEach((a) => list.appendChild(accountRow(a)));
  }

  el.appendChild(screen);

  function rerender() {
    el.replaceWith(AccountsScreen());
  }

  const addBtn = screen.querySelector('#add-account-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      editingAccountId = 'new';
      pendingType = null;
      rerender();
    });
  }

  const form = screen.querySelector('#account-form');
  if (form) {
    form.querySelectorAll('#account-type-picker [data-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        pendingType = btn.dataset.type;
        rerender();
      });
    });

    const cancelBtn = form.querySelector('#account-cancel-btn');
    cancelBtn.addEventListener('click', () => {
      editingAccountId = null;
      pendingType = null;
      rerender();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const name = formData.get('name')?.toString() ?? '';
      const type = pendingType || existing?.type || store.ACCOUNT_TYPES[0].id;
      const fields = { name, type };

      if (existing) {
        store.updateAccount(existing.id, {
          name: name.trim() || store.getAccountTypeInfo(type).label,
          type,
          icon: store.getAccountTypeInfo(type).icon,
        });
      } else {
        store.createAccount(fields);
      }
      editingAccountId = null;
      pendingType = null;
      rerender();
    });
  }

  list.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingAccountId = btn.dataset.edit;
      pendingType = null;
      rerender();
    });
  });

  list.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const account = accounts.find((a) => a.id === btn.dataset.delete);
      if (!account) return;
      el.appendChild(deleteConfirmSheet(account, () => {
        const result = store.deleteAccount(account.id);
        if (!result.ok) {
          alert(result.error);
          return;
        }
        rerender();
      }));
    });
  });

  return el;
}
