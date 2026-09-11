import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { MoneySubScreenHeader } from '../components/MoneySubScreenHeader.js';
import { fmtAmount, fmtDate } from '../utils/moneyFormat.js';

// État local (mémoire vive, pas persisté)
let filters = { status: 'all' }; // all | active | expiring_soon | expired
let sortBy = 'expiry_asc'; // expiry_asc | newest | oldest
let editingId = null;
let viewingId = null;

const STATUS_LABEL = { active: 'Active', expiring_soon: 'Expire bientôt', expired: 'Expirée' };
const STATUS_COLOR_VAR = { active: '--success-500', expiring_soon: '--warning-500', expired: '--danger-500' };

function daysLeftLabel(warranty) {
  const days = store.getWarrantyDaysLeft(warranty);
  if (days === null) return 'Sans échéance';
  if (days < 0) return `Expirée depuis ${Math.abs(days)} j`;
  if (days === 0) return "Expire aujourd'hui";
  return `${days} j restants`;
}

function warrantyCard(w, onView, onEdit, onDelete) {
  const status = store.getWarrantyStatus(w);
  const colorVar = STATUS_COLOR_VAR[status];
  const card = document.createElement('div');
  card.className = 'money-card';
  card.style.cursor = 'pointer';
  card.innerHTML = `
    <div class="detail-meta-item">
      <span class="category-tag">${icons.shield || icons.inbox}${w.product}</span>
      <span class="chip" style="color:var(${colorVar});border-color:var(${colorVar})">${STATUS_LABEL[status]}</span>
    </div>
    <div class="detail-meta-grid" style="margin-top:var(--sp-2)">
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">${icons.cash}Prix</span>
        <span class="detail-meta-item__value mono">${fmtAmount(w.purchasePrice)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">${icons.calendar}Achat</span>
        <span class="detail-meta-item__value">${fmtDate(w.purchaseDate)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">${icons.clock}Expiration</span>
        <span class="detail-meta-item__value">${w.expiryDate ? fmtDate(w.expiryDate) : '—'}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">${icons.clock}Temps restant</span>
        <span class="detail-meta-item__value" style="color:var(${colorVar})">${daysLeftLabel(w)}</span>
      </div>
    </div>
    <div class="form-actions" style="margin-top:var(--sp-3)">
      <button type="button" class="chip" data-view>${icons.eye || ''}Voir</button>
      <button type="button" class="chip" data-edit>${icons.edit}Modifier</button>
      <button type="button" class="chip" data-delete style="color:var(--danger-500)">${icons.trash}Supprimer</button>
    </div>
  `;
  card.querySelector('[data-view]').addEventListener('click', (e) => { e.stopPropagation(); onView(w.id); });
  card.querySelector('[data-edit]').addEventListener('click', (e) => { e.stopPropagation(); onEdit(w.id); });
  card.querySelector('[data-delete]').addEventListener('click', (e) => { e.stopPropagation(); onDelete(w.id, w.product); });
  card.addEventListener('click', () => onView(w.id));
  return card;
}

function deleteConfirmSheet(name, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer cette garantie ?</h2>
      <p class="confirm-sheet__desc">La garantie « ${name} » sera définitivement supprimée.</p>
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

function warrantyDetailView(w, onBack) {
  const status = store.getWarrantyStatus(w);
  const colorVar = STATUS_COLOR_VAR[status];
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <button type="button" class="money-btn-ghost" id="back-btn">${icons.arrowLeft || '←'} Retour</button>
    <section class="card" style="margin-top:var(--sp-3)">
      <div class="detail-section-title">${w.product}</div>
      <span class="chip" style="color:var(${colorVar});border-color:var(${colorVar})">${STATUS_LABEL[status]}</span>
      <div class="detail-meta-grid" style="margin-top:var(--sp-3)">
        <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.inbox}Catégorie</span><span class="detail-meta-item__value">${w.category || '—'}</span></div>
        <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.bank}Vendeur</span><span class="detail-meta-item__value">${w.seller || '—'}</span></div>
        <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.cash}Prix d'achat</span><span class="detail-meta-item__value mono">${fmtAmount(w.purchasePrice)}</span></div>
        <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.calendar}Date d'achat</span><span class="detail-meta-item__value">${fmtDate(w.purchaseDate, { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
        <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.clock}Expiration</span><span class="detail-meta-item__value">${w.expiryDate ? fmtDate(w.expiryDate, { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</span></div>
        <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.clock}Temps restant</span><span class="detail-meta-item__value" style="color:var(${colorVar})">${daysLeftLabel(w)}</span></div>
        <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.sliders}Référence</span><span class="detail-meta-item__value">${w.reference || '—'}</span></div>
      </div>
      ${w.notes ? `<p class="detail-desc" style="margin-top:var(--sp-3)">${w.notes}</p>` : ''}
    </section>
  `;
  wrap.querySelector('#back-btn').addEventListener('click', onBack);
  return wrap;
}

export function WarrantiesScreen() {
  const el = document.createElement('div');
  el.appendChild(MoneySubScreenHeader('Garanties', 'garanties'));

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  function rerender() {
    el.replaceWith(WarrantiesScreen());
  }

  if (viewingId) {
    const w = store.getWarranty(viewingId);
    if (w) {
      screen.appendChild(warrantyDetailView(w, () => { viewingId = null; rerender(); }));
      el.appendChild(screen);
      return el;
    }
    viewingId = null;
  }

  const allWarranties = store.listWarranties();
  const summary = store.getWarrantiesSummary();

  const summaryCard = document.createElement('section');
  summaryCard.className = 'card';
  summaryCard.innerHTML = `
    <div class="detail-meta-grid">
      <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.shield}Total</span><span class="detail-meta-item__value mono">${summary.total}</span></div>
      <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.shieldCheck}Actives</span><span class="detail-meta-item__value mono" style="color:var(--success-500)">${summary.active}</span></div>
      <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.clock}Expire bientôt</span><span class="detail-meta-item__value mono" style="color:var(--warning-500)">${summary.expiringSoon}</span></div>
      <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.alertTriangle}Expirées</span><span class="detail-meta-item__value mono" style="color:var(--danger-500)">${summary.expired}</span></div>
    </div>
  `;
  screen.appendChild(summaryCard);

  const filterRow = document.createElement('div');
  filterRow.className = 'tab-row mind-tab-row';
  filterRow.style.marginTop = 'var(--sp-3)';
  filterRow.innerHTML = `
    <button class="tab-btn ${filters.status === 'all' ? 'is-active' : ''}" data-status="all">Toutes</button>
    <button class="tab-btn ${filters.status === 'active' ? 'is-active' : ''}" data-status="active">Actives</button>
    <button class="tab-btn ${filters.status === 'expiring_soon' ? 'is-active' : ''}" data-status="expiring_soon">Expire bientôt</button>
    <button class="tab-btn ${filters.status === 'expired' ? 'is-active' : ''}" data-status="expired">Expirées</button>
  `;
  screen.appendChild(filterRow);

  const sortGroup = document.createElement('div');
  sortGroup.className = 'form-group';
  sortGroup.style.marginTop = 'var(--sp-2)';
  sortGroup.innerHTML = `
    <select class="form-input" id="f-sort">
      <option value="expiry_asc" ${sortBy === 'expiry_asc' ? 'selected' : ''}>Trier par : Expiration proche</option>
      <option value="newest" ${sortBy === 'newest' ? 'selected' : ''}>Trier par : Plus récente</option>
      <option value="oldest" ${sortBy === 'oldest' ? 'selected' : ''}>Trier par : Plus ancienne</option>
    </select>
  `;
  screen.appendChild(sortGroup);

  let filtered = allWarranties.filter((w) => filters.status === 'all' || store.getWarrantyStatus(w) === filters.status);
  if (sortBy === 'expiry_asc') {
    filtered = filtered.slice().sort((a, b) => {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });
  } else if (sortBy === 'newest') {
    filtered = filtered.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'oldest') {
    filtered = filtered.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  const list = document.createElement('div');
  list.className = 'goal-list';
  list.style.marginTop = 'var(--sp-3)';
  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-6)">
        ${(icons.shield || icons.inbox).replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">Aucune garantie</h2>
        <p class="state-block__desc">${allWarranties.length === 0 ? 'Ajoute la garantie d\'un produit pour suivre son échéance.' : 'Aucun résultat pour ce filtre.'}</p>
      </div>`;
  } else {
    filtered.forEach((w) => list.appendChild(warrantyCard(
      w,
      (id) => { viewingId = id; rerender(); },
      (id) => { editingId = id; rerender(); },
      (id, name) => {
        el.appendChild(deleteConfirmSheet(name, () => {
          store.deleteWarranty(id);
          rerender();
        }));
      },
    )));
  }
  screen.appendChild(list);

  const editingWarranty = editingId && editingId !== 'new' ? store.getWarranty(editingId) : null;

  if (editingId) {
    const formCard = document.createElement('section');
    formCard.className = 'money-card';
    formCard.style.marginTop = 'var(--sp-3)';
    formCard.innerHTML = `
      <div class="money-card__title">${editingWarranty ? 'Modifier' : 'Nouvelle'} garantie</div>
      <form id="war-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="f-war-product">${icons.box}Produit</label>
          <input class="form-input" type="text" id="f-war-product" name="product" value="${editingWarranty?.product ?? ''}" placeholder="Ex: Ordinateur portable" required />
        </div>
        <div class="form-group" style="margin-top:var(--sp-3)">
          <label class="form-label" for="f-war-category">${icons.inbox}Catégorie</label>
          <input class="form-input" type="text" id="f-war-category" name="category" value="${editingWarranty?.category ?? ''}" placeholder="Ex: Électronique" />
        </div>
        <div class="form-group" style="margin-top:var(--sp-3);display:flex;gap:var(--sp-3)">
          <div style="flex:1">
            <label class="form-label" for="f-war-purchase-date">${icons.calendar}Date d'achat</label>
            <input class="form-input" type="date" id="f-war-purchase-date" name="purchaseDate" value="${editingWarranty?.purchaseDate ?? new Date().toISOString().slice(0, 10)}" />
          </div>
          <div style="flex:1">
            <label class="form-label" for="f-war-price">${icons.cash}Prix d'achat (MGA)</label>
            <input class="form-input" type="number" min="0" id="f-war-price" name="purchasePrice" value="${editingWarranty?.purchasePrice ?? ''}" placeholder="0" />
          </div>
        </div>
        <div class="form-group" style="margin-top:var(--sp-3)">
          <label class="form-label" for="f-war-seller">${icons.bank}Vendeur</label>
          <input class="form-input" type="text" id="f-war-seller" name="seller" value="${editingWarranty?.seller ?? ''}" placeholder="Ex: Jumbo Score" />
        </div>
        <div class="form-group" style="margin-top:var(--sp-3)">
          <label class="form-label" for="f-war-expiry">${icons.clock}Date de fin de garantie</label>
          <input class="form-input" type="date" id="f-war-expiry" name="expiryDate" value="${editingWarranty?.expiryDate ?? ''}" />
        </div>
        <div class="form-group" style="margin-top:var(--sp-3)">
          <label class="form-label" for="f-war-ref">${icons.sliders}Référence</label>
          <input class="form-input" type="text" id="f-war-ref" name="reference" value="${editingWarranty?.reference ?? ''}" placeholder="N° de série, facture..." />
        </div>
        <div class="form-group" style="margin-top:var(--sp-3)">
          <label class="form-label" for="f-war-notes">${icons.notes}Notes</label>
          <textarea class="form-input" id="f-war-notes" name="notes" rows="2">${editingWarranty?.notes ?? ''}</textarea>
        </div>
        <div class="form-actions" style="margin-top:var(--sp-3)">
          <button type="button" class="btn-secondary" id="war-cancel-btn">Annuler</button>
          <button type="submit" class="btn-primary">Enregistrer</button>
        </div>
      </form>
    `;
    screen.appendChild(formCard);

    formCard.querySelector('#war-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const fields = {
        product: fd.get('product')?.toString(),
        category: fd.get('category')?.toString(),
        purchaseDate: fd.get('purchaseDate')?.toString(),
        purchasePrice: fd.get('purchasePrice'),
        seller: fd.get('seller')?.toString(),
        expiryDate: fd.get('expiryDate')?.toString(),
        reference: fd.get('reference')?.toString(),
        notes: fd.get('notes')?.toString(),
      };
      if (!fields.product?.trim()) return;
      if (editingWarranty) {
        store.updateWarranty(editingWarranty.id, fields);
      } else {
        store.createWarranty(fields);
      }
      editingId = null;
      rerender();
    });
    formCard.querySelector('#war-cancel-btn').addEventListener('click', () => { editingId = null; rerender(); });
  } else {
    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'btn-primary';
    fab.style.marginTop = 'var(--sp-3)';
    fab.innerHTML = `${icons.plus}Nouvelle garantie`;
    fab.addEventListener('click', () => { editingId = 'new'; rerender(); });
    screen.appendChild(fab);
  }

  el.appendChild(screen);

  filterRow.querySelectorAll('[data-status]').forEach((btn) => {
    btn.addEventListener('click', () => { filters.status = btn.dataset.status; rerender(); });
  });
  sortGroup.querySelector('#f-sort').addEventListener('change', (e) => { sortBy = e.target.value; rerender(); });

  return el;
}
