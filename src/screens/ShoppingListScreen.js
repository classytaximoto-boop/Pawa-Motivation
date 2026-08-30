import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { MoneySubScreenHeader } from '../components/MoneySubScreenHeader.js';
import { fmtAmount } from '../utils/moneyFormat.js';

// État local (mémoire vive, pas persisté)
let filters = { status: 'all', priority: 'all' }; // status: all | todo | bought
let editingId = null; // id en édition, 'new' pour création, null si fermé

const PRIORITY_COLOR_VAR = { high: '--danger-500', medium: '--warning-500', low: '--text-tertiary' };

function shoppingRow(item, onToggle, onEdit, onDelete) {
  const priorityInfo = store.getShoppingPriorityInfo(item.priority);
  const colorVar = PRIORITY_COLOR_VAR[item.priority] || '--text-tertiary';
  const lineTotal = item.estimatedPrice * item.quantity;

  const row = document.createElement('div');
  row.className = 'money-card';
  row.style.opacity = item.bought ? '0.6' : '1';
  row.innerHTML = `
    <div class="detail-meta-item">
      <label style="display:flex;align-items:center;gap:var(--sp-2);cursor:pointer;flex:1">
        <input type="checkbox" id="chk-${item.id}" ${item.bought ? 'checked' : ''} style="width:20px;height:20px;flex-shrink:0" />
        <span class="goal-card__name" style="text-decoration:${item.bought ? 'line-through' : 'none'}">${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}</span>
      </label>
      <span class="chip" style="color:var(${colorVar});border-color:var(${colorVar})">${priorityInfo.label}</span>
    </div>
    <div class="detail-meta-item" style="margin-top:var(--sp-1)">
      <span class="category-tag">${item.category || ''}</span>
      <span class="detail-meta-item__value mono">${fmtAmount(lineTotal)}</span>
    </div>
    <div class="form-actions" style="margin-top:var(--sp-2)">
      <button type="button" class="chip" data-edit>${icons.edit}Modifier</button>
      <button type="button" class="chip" data-delete style="color:var(--danger-500)">${icons.trash}Supprimer</button>
    </div>
  `;
  row.querySelector(`#chk-${item.id}`).addEventListener('change', (e) => onToggle(item.id, e.target.checked));
  row.querySelector('[data-edit]').addEventListener('click', () => onEdit(item.id));
  row.querySelector('[data-delete]').addEventListener('click', () => onDelete(item.id, item.name));
  return row;
}

function deleteConfirmSheet(name, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer cet article ?</h2>
      <p class="confirm-sheet__desc">« ${name} » sera retiré de la liste d'achats.</p>
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

export function ShoppingListScreen() {
  const el = document.createElement('div');
  el.appendChild(MoneySubScreenHeader("Liste d'achats", 'achats'));

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  function rerender() {
    el.replaceWith(ShoppingListScreen());
  }

  const allItems = store.listShoppingItems();
  const summary = store.getShoppingSummary();

  const summaryCard = document.createElement('section');
  summaryCard.className = 'card';
  summaryCard.innerHTML = `
    <div class="detail-meta-grid">
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">${icons.cash}Total estimé</span>
        <span class="detail-meta-item__value mono">${fmtAmount(summary.totalEstimated)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">${icons.check}Total acheté</span>
        <span class="detail-meta-item__value mono" style="color:var(--success-500)">${fmtAmount(summary.totalBought)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">${icons.wallet}Restant</span>
        <span class="detail-meta-item__value mono">${fmtAmount(summary.totalRemaining)}</span>
      </div>
    </div>
  `;
  screen.appendChild(summaryCard);

  const filterRow = document.createElement('div');
  filterRow.className = 'tab-row mind-tab-row';
  filterRow.style.marginTop = 'var(--sp-3)';
  filterRow.innerHTML = `
    <button class="tab-btn ${filters.status === 'all' ? 'is-active' : ''}" data-status="all">Tous</button>
    <button class="tab-btn ${filters.status === 'todo' ? 'is-active' : ''}" data-status="todo">À acheter</button>
    <button class="tab-btn ${filters.status === 'bought' ? 'is-active' : ''}" data-status="bought">Achetés</button>
  `;
  screen.appendChild(filterRow);

  const priorityRow = document.createElement('div');
  priorityRow.className = 'category-picker';
  priorityRow.style.marginTop = 'var(--sp-2)';
  priorityRow.innerHTML = `
    <button type="button" class="category-picker-item ${filters.priority === 'all' ? 'is-selected' : ''}" data-priority="all"><span>Toutes priorités</span></button>
    ${store.SHOPPING_PRIORITIES.map((p) => `<button type="button" class="category-picker-item ${filters.priority === p.id ? 'is-selected' : ''}" data-priority="${p.id}"><span>${p.label}</span></button>`).join('')}
  `;
  screen.appendChild(priorityRow);

  const filtered = allItems.filter((it) => {
    if (filters.status === 'todo' && it.bought) return false;
    if (filters.status === 'bought' && !it.bought) return false;
    if (filters.priority !== 'all' && it.priority !== filters.priority) return false;
    return true;
  });

  const list = document.createElement('div');
  list.className = 'goal-list';
  list.style.marginTop = 'var(--sp-3)';
  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-6)">
        ${(icons.cart || icons.inbox).replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">Aucun article</h2>
        <p class="state-block__desc">${allItems.length === 0 ? 'Ajoute ton premier article à acheter.' : 'Aucun résultat pour ces filtres.'}</p>
      </div>`;
  } else {
    filtered.forEach((item) => list.appendChild(shoppingRow(
      item,
      (id, bought) => { store.setShoppingItemBought(id, bought); rerender(); },
      (id) => { editingId = id; rerender(); },
      (id, name) => {
        el.appendChild(deleteConfirmSheet(name, () => {
          store.deleteShoppingItem(id);
          rerender();
        }));
      },
    )));
  }
  screen.appendChild(list);

  const editingItem = editingId && editingId !== 'new' ? store.getShoppingItem(editingId) : null;

  if (editingId) {
    const formCard = document.createElement('section');
    formCard.className = 'money-card';
    formCard.style.marginTop = 'var(--sp-3)';
    formCard.innerHTML = `
      <div class="money-card__title">${editingItem ? 'Modifier' : 'Nouvel'} article</div>
      <form id="shop-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="f-shop-name">${icons.edit}Nom</label>
          <input class="form-input" type="text" id="f-shop-name" name="name" value="${editingItem?.name ?? ''}" placeholder="Ex: Casque" required />
        </div>
        <div class="form-group" style="margin-top:var(--sp-3);display:flex;gap:var(--sp-3)">
          <div style="flex:1">
            <label class="form-label" for="f-shop-qty">${icons.box}Quantité</label>
            <input class="form-input" type="number" min="1" id="f-shop-qty" name="quantity" value="${editingItem?.quantity ?? 1}" />
          </div>
          <div style="flex:2">
            <label class="form-label" for="f-shop-price">${icons.cash}Prix estimé (MGA)</label>
            <input class="form-input" type="number" min="0" id="f-shop-price" name="estimatedPrice" value="${editingItem?.estimatedPrice ?? ''}" placeholder="0" />
          </div>
        </div>
        <div class="form-group" style="margin-top:var(--sp-3)">
          <label class="form-label" for="f-shop-category">${icons.inbox}Catégorie</label>
          <input class="form-input" type="text" id="f-shop-category" name="category" value="${editingItem?.category ?? ''}" placeholder="Ex: Équipement" />
        </div>
        <div class="form-group" style="margin-top:var(--sp-3)">
          <label class="form-label" for="f-shop-priority">${icons.star}Priorité</label>
          <select class="form-input" id="f-shop-priority" name="priority">
            ${store.SHOPPING_PRIORITIES.map((p) => `<option value="${p.id}" ${(editingItem?.priority ?? 'medium') === p.id ? 'selected' : ''}>${p.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-top:var(--sp-3)">
          <label class="form-label" for="f-shop-notes">${icons.notes}Notes</label>
          <textarea class="form-input" id="f-shop-notes" name="notes" rows="2">${editingItem?.notes ?? ''}</textarea>
        </div>
        <div class="form-actions" style="margin-top:var(--sp-3)">
          <button type="button" class="btn-secondary" id="shop-cancel-btn">Annuler</button>
          <button type="submit" class="btn-primary">Enregistrer</button>
        </div>
      </form>
    `;
    screen.appendChild(formCard);

    formCard.querySelector('#shop-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const fields = {
        name: fd.get('name')?.toString(),
        quantity: fd.get('quantity'),
        estimatedPrice: fd.get('estimatedPrice'),
        category: fd.get('category')?.toString(),
        priority: fd.get('priority')?.toString(),
        notes: fd.get('notes')?.toString(),
      };
      if (!fields.name?.trim()) return;
      if (editingItem) {
        store.updateShoppingItem(editingItem.id, fields);
      } else {
        store.createShoppingItem(fields);
      }
      editingId = null;
      rerender();
    });
    formCard.querySelector('#shop-cancel-btn').addEventListener('click', () => { editingId = null; rerender(); });
  } else {
    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'btn-primary';
    fab.style.marginTop = 'var(--sp-3)';
    fab.innerHTML = `${icons.plus}Ajouter un article`;
    fab.addEventListener('click', () => { editingId = 'new'; rerender(); });
    screen.appendChild(fab);
  }

  el.appendChild(screen);

  filterRow.querySelectorAll('[data-status]').forEach((btn) => {
    btn.addEventListener('click', () => { filters.status = btn.dataset.status; rerender(); });
  });
  priorityRow.querySelectorAll('[data-priority]').forEach((btn) => {
    btn.addEventListener('click', () => { filters.priority = btn.dataset.priority; rerender(); });
  });

  return el;
}
