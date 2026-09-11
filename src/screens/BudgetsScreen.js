import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { MoneySubScreenHeader } from '../components/MoneySubScreenHeader.js';

// État local de l'écran (mémoire vive, pas persisté)
let editingCategory = null; // id de catégorie en cours d'édition (formulaire ouvert), ou null

function fmtAmount(n) {
  return `${Math.round(n).toLocaleString('fr-FR')} MGA`;
}

const STATUS_LABEL = { normal: 'Normal', warning: 'Attention', over: 'Dépassé' };
const STATUS_COLOR_VAR = { normal: '--success-500', warning: '--warning-500', over: '--danger-500' };

function budgetCard(progress, categoryMap, onEdit, onDelete) {
  const cat = categoryMap[progress.category] ?? categoryMap.autre;
  const colorVar = STATUS_COLOR_VAR[progress.status];
  const card = document.createElement('div');
  card.className = 'money-card';
  card.innerHTML = `
    <div class="detail-meta-item">
      <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon] || icons.inbox}${cat.label}</span>
      <span class="chip" style="color:var(${colorVar});border-color:var(${colorVar})">${STATUS_LABEL[progress.status]}</span>
    </div>
    <div class="progress-track" style="margin-top:var(--sp-2)">
      <div class="progress-fill" style="width:${Math.min(100, progress.pct)}%; background:var(${colorVar})"></div>
    </div>
    <div class="detail-meta-grid" style="margin-top:var(--sp-2)">
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">${icons.cash}Dépensé</span>
        <span class="detail-meta-item__value mono">${fmtAmount(progress.spent)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">${icons.piggyBank}Budget</span>
        <span class="detail-meta-item__value mono">${fmtAmount(progress.monthlyLimit)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">${icons.wallet}Restant</span>
        <span class="detail-meta-item__value mono" style="color:${progress.status === 'over' ? 'var(--danger-500)' : 'var(--text-primary)'}">${fmtAmount(progress.remaining)}</span>
      </div>
    </div>
    <div class="form-actions" style="margin-top:var(--sp-3)">
      <button type="button" class="chip" data-edit>${icons.edit}Modifier</button>
      <button type="button" class="chip" data-delete style="color:var(--danger-500)">${icons.trash}Supprimer</button>
    </div>
  `;
  card.querySelector('[data-edit]').addEventListener('click', () => onEdit(progress.category));
  card.querySelector('[data-delete]').addEventListener('click', () => onDelete(progress.category, cat.label));
  return card;
}

function deleteConfirmSheet(categoryLabel, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer ce budget ?</h2>
      <p class="confirm-sheet__desc">Le budget « ${categoryLabel} » sera supprimé. Les transactions déjà enregistrées ne sont pas affectées.</p>
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

export function BudgetsScreen() {
  const el = document.createElement('div');
  el.appendChild(MoneySubScreenHeader('Budgets', 'budgets'));

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  function rerender() {
    el.replaceWith(BudgetsScreen());
  }

  const categoryMap = store.getCategoryMap();
  const progress = store.getBudgetProgress();
  const budgetedCategoryIds = new Set(progress.map((p) => p.category));
  const expenseCategories = store.state.moneyCategories?.expense ?? [];
  const availableForNew = expenseCategories.filter((c) => !budgetedCategoryIds.has(c.id));

  const list = document.createElement('div');
  list.className = 'goal-list';
  if (progress.length === 0) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-8)">
        ${icons.piggyBank ? icons.piggyBank.replace('<svg ', '<svg class="state-block__icon" ') : ''}
        <h2 class="state-block__title">Aucun budget défini</h2>
        <p class="state-block__desc">Fixe une limite mensuelle par catégorie de dépense pour suivre ton budget.</p>
      </div>`;
  } else {
    progress.forEach((p) => list.appendChild(budgetCard(
      p,
      categoryMap,
      (category) => { editingCategory = category; rerender(); },
      (category, label) => {
        el.appendChild(deleteConfirmSheet(label, () => {
          store.deleteCategoryBudget(category);
          rerender();
        }));
      },
    )));
  }
  screen.appendChild(list);

  // Formulaire d'ajout/modification — un seul formulaire, réutilisé pour créer
  // (editingCategory = null, sélection de catégorie libre parmi celles sans
  // budget) et pour modifier (editingCategory fixé, catégorie verrouillée).
  const formCard = document.createElement('section');
  formCard.className = 'money-card';
  const editingBudget = editingCategory ? progress.find((p) => p.category === editingCategory) : null;
  const editingCatInfo = editingCategory ? categoryMap[editingCategory] : null;

  if (editingCategory) {
    formCard.innerHTML = `
      <div class="money-card__title">Modifier le budget — ${editingCatInfo?.label ?? ''}</div>
      <form id="budget-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="f-budget-limit">${icons.piggyBank}Limite mensuelle (MGA)</label>
          <input class="form-input" type="number" min="0" id="f-budget-limit" name="monthlyLimit" value="${editingBudget?.monthlyLimit ?? ''}" placeholder="0" required />
        </div>
        <div class="form-actions" style="margin-top:var(--sp-3)">
          <button type="button" class="btn-secondary" id="budget-cancel-btn">Annuler</button>
          <button type="submit" class="btn-primary">Enregistrer</button>
        </div>
      </form>
    `;
  } else if (availableForNew.length > 0) {
    formCard.innerHTML = `
      <div class="money-card__title">Ajouter un budget</div>
      <form id="budget-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="f-budget-category">${icons.inbox}Catégorie</label>
          <select class="form-input" id="f-budget-category" name="category">
            ${availableForNew.map((c) => `<option value="${c.id}">${c.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-top:var(--sp-3)">
          <label class="form-label" for="f-budget-limit">${icons.piggyBank}Limite mensuelle (MGA)</label>
          <input class="form-input" type="number" min="0" id="f-budget-limit" name="monthlyLimit" placeholder="0" required />
        </div>
        <div class="form-actions" style="margin-top:var(--sp-3)">
          <button type="submit" class="btn-primary">${icons.plus}Ajouter</button>
        </div>
      </form>
    `;
  } else {
    formCard.innerHTML = `<p class="detail-desc">Toutes les catégories de dépense ont déjà un budget.</p>`;
  }
  screen.appendChild(formCard);

  const form = formCard.querySelector('#budget-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const category = editingCategory || formData.get('category')?.toString();
      const monthlyLimit = Number(formData.get('monthlyLimit'));
      if (!category || !monthlyLimit || monthlyLimit <= 0) return;
      store.setCategoryBudget(category, monthlyLimit);
      editingCategory = null;
      rerender();
    });
  }
  const cancelBtn = formCard.querySelector('#budget-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => { editingCategory = null; rerender(); });
  }

  el.appendChild(screen);
  return el;
}
