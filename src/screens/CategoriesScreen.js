import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

// Sous-ensemble d'icônes pertinentes pour des catégories financières
// (le catalogue complet d'icons.js contient aussi des icônes sans rapport,
// ex. lock, mic, fingerprint — non proposées ici pour ne pas noyer le choix).
const CATEGORY_ICON_CHOICES = [
  'home', 'inbox', 'compass', 'bolt', 'star', 'mind', 'family', 'volume',
  'notes', 'target', 'bank', 'piggyBank', 'media', 'heart', 'wallet', 'box',
  'briefcase', 'cash', 'creditCard', 'mobileMoney', 'sparkles',
];

// État local de l'écran (mémoire vive, pas persisté)
let activeType = 'expense'; // 'expense' | 'income'
let editingCategoryId = null; // 'new' pour une création, id existant, ou null
let pendingIcon = null;
let expandedCategoryId = null; // catégorie dont les sous-catégories sont dépliées
let addingSubcategoryFor = null; // id de catégorie en cours d'ajout de sous-catégorie

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

function categoryFormHtml(existing) {
  const selectedIcon = pendingIcon || existing?.icon || CATEGORY_ICON_CHOICES[0];
  return `
    <form id="category-form" class="card" style="margin-bottom:var(--sp-3)" novalidate>
      <div class="form-group">
        <label class="form-label" for="f-cat-label">${icons.edit}Nom</label>
        <input class="form-input" id="f-cat-label" name="label" placeholder="Ex. Abonnements" value="${existing?.label ?? ''}" required />
      </div>
      <div class="form-group" style="margin-top:var(--sp-4)">
        <label class="form-label">${icons.sparkles}Icône</label>
        <div class="category-picker" id="cat-icon-picker">
          ${CATEGORY_ICON_CHOICES.map((iconId) => `
            <button type="button" class="category-picker-item ${selectedIcon === iconId ? 'is-selected' : ''}" data-icon="${iconId}">
              ${icons[iconId]}
            </button>`).join('')}
        </div>
      </div>
      <div class="form-actions" style="margin-top:var(--sp-4)">
        <button type="button" class="btn-secondary" id="cat-cancel-btn">Annuler</button>
        <button type="submit" class="btn-primary">${existing ? 'Enregistrer' : 'Ajouter'}</button>
      </div>
    </form>
  `;
}

function subcategoryFormHtml(category, existingSub) {
  return `
    <form id="subcategory-form" style="margin-top:var(--sp-2)">
      <div class="form-group">
        <input class="form-input" id="f-subcat-label" name="label" placeholder="Nom de la sous-catégorie" value="${existingSub?.label ?? ''}" required />
      </div>
      <div class="form-actions" style="margin-top:var(--sp-2)">
        <button type="button" class="btn-secondary" id="subcat-cancel-btn">Annuler</button>
        <button type="submit" class="btn-primary">${existingSub ? 'Enregistrer' : 'Ajouter'}</button>
      </div>
    </form>
  `;
}

function categoryRow(category, type) {
  const isExpanded = expandedCategoryId === category.id;
  const isAddingSub = addingSubcategoryFor === category.id;
  const row = document.createElement('div');
  row.className = 'card goal-card';
  row.innerHTML = `
    <div class="goal-card__top">
      <button type="button" class="goal-card__title-row" data-expand="${category.id}" style="background:none;border:none;cursor:pointer;text-align:left;padding:0">
        <span class="category-tag" style="color:var(${category.color || '--text-tertiary'})">${icons[category.icon] || icons.inbox}${category.label}</span>
      </button>
      <span class="chip">${category.subcategories?.length ?? 0} sous-catégorie(s)</span>
    </div>
    <div class="form-actions" style="margin-top:var(--sp-3)">
      <button type="button" class="chip" data-edit="${category.id}">${icons.edit}Modifier</button>
      <button type="button" class="chip" data-delete="${category.id}" style="color:var(--danger-500)">${icons.trash}Supprimer</button>
      <button type="button" class="chip" data-toggle-sub="${category.id}">${icons.plus}Sous-catégories</button>
    </div>
    ${isExpanded ? `
      <div id="subcat-list-${category.id}" style="margin-top:var(--sp-3)">
        ${(category.subcategories || []).map((s) => `
          <div class="detail-meta-item" style="margin-bottom:var(--sp-2)">
            <span>${s.label}</span>
            <span class="form-actions" style="gap:var(--sp-2)">
              <button type="button" class="chip" data-edit-sub="${s.id}" data-parent="${category.id}">${icons.edit}</button>
              <button type="button" class="chip" data-delete-sub="${s.id}" data-parent="${category.id}" style="color:var(--danger-500)">${icons.trash}</button>
            </span>
          </div>
        `).join('') || `<p style="font-size:var(--fs-sm);color:var(--text-tertiary)">Aucune sous-catégorie.</p>`}
        ${isAddingSub ? subcategoryFormHtml(category) : `<button type="button" class="chip" data-add-sub="${category.id}">${icons.plus}Ajouter une sous-catégorie</button>`}
      </div>
    ` : ''}
  `;
  return row;
}

export function CategoriesScreen() {
  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">Catégories</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/money'));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  const categories = store.listCategories(activeType);
  const existing = editingCategoryId && editingCategoryId !== 'new'
    ? categories.find((c) => c.id === editingCategoryId) ?? null
    : null;

  let formHtml = '';
  if (editingCategoryId === 'new' || existing) {
    formHtml = categoryFormHtml(existing);
  } else {
    formHtml = `<button type="button" class="chip" id="add-category-btn" style="margin-bottom:var(--sp-3)">${icons.plus}Ajouter une catégorie</button>`;
  }

  screen.innerHTML = `
    <div class="tab-row mind-tab-row" role="tablist" id="type-tabs">
      <button class="tab-btn ${activeType === 'expense' ? 'is-active' : ''}" data-type="expense">Dépenses</button>
      <button class="tab-btn ${activeType === 'income' ? 'is-active' : ''}" data-type="income">Revenus</button>
    </div>
    <div style="margin-top:var(--sp-3)">${formHtml}</div>
    <div id="categories-list" class="goal-list"></div>
  `;

  const list = screen.querySelector('#categories-list');
  categories.forEach((c) => list.appendChild(categoryRow(c, activeType)));

  el.appendChild(screen);

  function rerender() {
    el.replaceWith(CategoriesScreen());
  }

  screen.querySelectorAll('#type-tabs [data-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeType = btn.dataset.type;
      editingCategoryId = null;
      pendingIcon = null;
      expandedCategoryId = null;
      addingSubcategoryFor = null;
      rerender();
    });
  });

  const addBtn = screen.querySelector('#add-category-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      editingCategoryId = 'new';
      pendingIcon = null;
      rerender();
    });
  }

  const form = screen.querySelector('#category-form');
  if (form) {
    form.querySelectorAll('#cat-icon-picker [data-icon]').forEach((btn) => {
      btn.addEventListener('click', () => {
        pendingIcon = btn.dataset.icon;
        rerender();
      });
    });
    form.querySelector('#cat-cancel-btn').addEventListener('click', () => {
      editingCategoryId = null;
      pendingIcon = null;
      rerender();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const label = formData.get('label')?.toString() ?? '';
      if (!label.trim()) return;
      const icon = pendingIcon || existing?.icon || CATEGORY_ICON_CHOICES[0];
      if (existing) {
        store.updateCategory(activeType, existing.id, { label, icon });
      } else {
        store.createCategory(activeType, { label, icon });
      }
      editingCategoryId = null;
      pendingIcon = null;
      rerender();
    });
  }

  list.querySelectorAll('[data-expand]').forEach((btn) => {
    btn.addEventListener('click', () => {
      expandedCategoryId = expandedCategoryId === btn.dataset.expand ? null : btn.dataset.expand;
      addingSubcategoryFor = null;
      rerender();
    });
  });

  list.querySelectorAll('[data-toggle-sub]').forEach((btn) => {
    btn.addEventListener('click', () => {
      expandedCategoryId = btn.dataset.toggleSub;
      rerender();
    });
  });

  list.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingCategoryId = btn.dataset.edit;
      pendingIcon = null;
      rerender();
    });
  });

  list.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const category = categories.find((c) => c.id === btn.dataset.delete);
      if (!category) return;
      el.appendChild(deleteConfirmSheet(
        'Supprimer cette catégorie ?',
        `« ${category.label} » sera supprimée. Les transactions existantes seront réattribuées à « Autre ». Cette opération est irréversible.`,
        () => {
          const result = store.deleteCategory(activeType, category.id);
          if (!result.ok) {
            alert(result.error);
            return;
          }
          rerender();
        },
      ));
    });
  });

  list.querySelectorAll('[data-add-sub]').forEach((btn) => {
    btn.addEventListener('click', () => {
      addingSubcategoryFor = btn.dataset.addSub;
      rerender();
    });
  });

  const subForm = screen.querySelector('#subcategory-form');
  if (subForm) {
    subForm.querySelector('#subcat-cancel-btn').addEventListener('click', () => {
      addingSubcategoryFor = null;
      rerender();
    });
    subForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const label = formData.get('label')?.toString() ?? '';
      if (!label.trim()) return;
      store.createSubcategory(activeType, addingSubcategoryFor, label);
      addingSubcategoryFor = null;
      rerender();
    });
  }

  list.querySelectorAll('[data-edit-sub]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const newLabel = prompt('Nouveau nom de la sous-catégorie :');
      if (newLabel && newLabel.trim()) {
        store.updateSubcategory(activeType, btn.dataset.parent, btn.dataset.editSub, newLabel);
        rerender();
      }
    });
  });

  list.querySelectorAll('[data-delete-sub]').forEach((btn) => {
    btn.addEventListener('click', () => {
      el.appendChild(deleteConfirmSheet(
        'Supprimer cette sous-catégorie ?',
        'Les transactions qui l\'utilisent garderont leur catégorie principale. Cette opération est irréversible.',
        () => {
          store.deleteSubcategory(activeType, btn.dataset.parent, btn.dataset.deleteSub);
          rerender();
        },
      ));
    });
  });

  return el;
}
