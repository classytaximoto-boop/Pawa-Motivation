import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { sparkline } from './Home.js';

// État local de filtre (mémoire vive de l'écran, pas persisté)
let activeTab = 'apercu'; // apercu | transactions | objectifs
let statsWindow = 30; // 0 = tout, 7, 30
let activeAccountId = 'all'; // 'all' = tous les comptes, sinon l'id d'un compte précis
let addingBudgetFor = null; // id de catégorie en cours d'édition dans le mini-formulaire budget, ou null si fermé

function fmtAmount(n) {
  return `${Math.round(n).toLocaleString('fr-FR')} MGA`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

/** Nom du compte d'une transaction, en tolérant les anciennes transactions sans accountId. */
function accountLabelFor(tx, accountsById) {
  const id = tx.accountId || 'acc_default';
  return accountsById[id]?.name ?? 'Principal';
}

function transactionRow(tx, accountsById, showAccount, categoryMap) {
  const row = document.createElement('button');
  row.className = 'card goal-card';
  row.style.textAlign = 'left';

  if (tx.type === 'transfer') {
    const fromLabel = accountLabelFor(tx, accountsById);
    const toLabel = accountsById[tx.toAccountId]?.name ?? 'Principal';
    row.innerHTML = `
      <div class="goal-card__top">
        <div>
          <div class="goal-card__title-row">
            <span class="goal-card__name">${tx.note || 'Transfert'}</span>
          </div>
          <div class="goal-card__meta-row">
            <span class="category-tag">${icons.transfer}De ${fromLabel} vers ${toLabel}</span>
            <span class="chip">${fmtDate(tx.date)}</span>
          </div>
        </div>
        <span class="goal-card__deadline mono">${fmtAmount(tx.amount)}</span>
      </div>
    `;
    row.addEventListener('click', () => router.navigate(`/money/transaction/${tx.id}/modifier`));
    return row;
  }

  const cat = categoryMap[tx.category] ?? categoryMap.autre;
  const subcat = tx.subcategory ? cat.subcategories?.find((s) => s.id === tx.subcategory) : null;
  row.innerHTML = `
    <div class="goal-card__top">
      <div>
        <div class="goal-card__title-row">
          <span class="goal-card__name">${tx.note || cat.label}</span>
        </div>
        <div class="goal-card__meta-row">
          <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon]}${cat.label}${subcat ? ` · ${subcat.label}` : ''}</span>
          <span class="chip">${fmtDate(tx.date)}</span>
          ${showAccount ? `<span class="chip">${accountLabelFor(tx, accountsById)}</span>` : ''}
        </div>
      </div>
      <span class="goal-card__deadline mono" style="color:${tx.type === 'income' ? 'var(--success-500)' : 'var(--danger-500)'}">
        ${tx.type === 'income' ? '+' : '−'}${fmtAmount(tx.amount)}
      </span>
    </div>
  `;
  row.addEventListener('click', () => router.navigate(`/money/transaction/${tx.id}/modifier`));
  return row;
}

function financialGoalCard(goal) {
  const card = document.createElement('button');
  card.className = `card goal-card ${goal.status === 'completed' ? 'is-completed' : ''}`;
  card.innerHTML = `
    <div class="goal-card__top">
      <div>
        <div class="goal-card__title-row">
          <span class="goal-card__name">${goal.name}</span>
        </div>
        <div class="goal-card__meta-row">
          <span class="chip mono">${fmtAmount(goal.currentAmount)} / ${fmtAmount(goal.targetAmount)}</span>
        </div>
      </div>
    </div>
    <div class="goal-card__progress-row">
      <div class="progress-track"><div class="progress-fill" style="width:${goal.progress}%"></div></div>
      <span class="goal-card__progress-pct mono">${goal.progress}%</span>
    </div>
  `;
  card.addEventListener('click', () => router.navigate(`/money/objectifs/${goal.id}`));
  return card;
}

/**
 * Cadre "Outils" : accès aux écrans annexes de Money (Comptes, Catégories,
 * Dettes, Planifiés, Statistiques). Rendu en grille qui enveloppe naturellement
 * (2-3 colonnes selon la largeur) — jamais en ligne unique non-wrappée, pour
 * ne jamais forcer de défilement horizontal, quel que soit le nombre d'entrées.
 */
function moneyToolsGrid() {
  const tools = [
    { id: 'accounts', icon: 'bank', label: 'Comptes', path: '/money/comptes' },
    { id: 'categories', icon: 'sliders', label: 'Catégories', path: '/money/categories' },
    { id: 'debts', icon: 'handshakeOut', label: 'Dettes', path: '/money/dettes' },
    { id: 'scheduled', icon: 'calendar', label: 'Planifiés', path: '/money/paiements-planifies' },
    { id: 'stats', icon: 'barChart', label: 'Statistiques', path: '/money/statistiques' },
  ];

  const wrap = document.createElement('section');
  wrap.className = 'money-tools-grid';
  wrap.innerHTML = tools.map((t) => `
    <button type="button" class="money-tool-card" data-path="${t.path}">
      <span class="money-tool-card__icon">${icons[t.icon] || ''}</span>
      <span class="money-tool-card__label">${t.label}</span>
    </button>
  `).join('');

  wrap.querySelectorAll('[data-path]').forEach((btn) => {
    btn.addEventListener('click', () => router.navigate(btn.dataset.path));
  });

  return wrap;
}

export function MoneyHome() {
  const accounts = store.listAccounts();
  const accountsById = Object.fromEntries(accounts.map((a) => [a.id, a]));

  // 'all' filtre nulle part ; sinon on restreint tout aux stats/transactions de ce compte.
  const scopedAccountId = activeAccountId === 'all' ? null : activeAccountId;
  const stats = store.getMoneyStats(statsWindow, scopedAccountId);
  const transactions = store.listTransactions(scopedAccountId);
  const financialGoals = store.listFinancialGoals();
  const budgetProgress = store.getBudgetProgress();
  const balanceHistory = store.getBalanceHistory(statsWindow);
  const categoryMap = store.getCategoryMap();
  const expenseCategories = store.listCategories('expense');

  const el = document.createElement('div');

  // En-tête dédié Money — même schéma que AgendaScreen : un titre + une seule
  // puce de statut (solde), jamais une rangée de boutons non-wrappée.
  const header = document.createElement('header');
  header.className = 'screen-header';
  header.innerHTML = `
    <h1 class="screen-header__title">Money</h1>
    <div class="chip mono" style="color:${stats.balance >= 0 ? 'var(--success-500)' : 'var(--danger-500)'};border-color:${stats.balance >= 0 ? 'var(--success-500)' : 'var(--danger-500)'}">${fmtAmount(stats.balance)}</div>
  `;
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  const accountTabsHtml = accounts.length > 1
    ? `
    <div class="tab-row mind-tab-row" role="tablist" id="account-tabs" style="margin-top:var(--sp-3)">
      <button class="tab-btn ${activeAccountId === 'all' ? 'is-active' : ''}" data-account="all">Tous</button>
      ${accounts.map((a) => `<button class="tab-btn ${activeAccountId === a.id ? 'is-active' : ''}" data-account="${a.id}">${icons[a.icon] || ''}${a.name}</button>`).join('')}
    </div>` : '';

  const accountsSummaryHtml = accounts.length > 1
    ? `
    <section class="card" style="margin-top:var(--sp-3)">
      <div class="detail-section-title">Comptes</div>
      ${accounts.map((a) => {
        const bal = store.getAccountBalance(a.id);
        return `
        <div class="detail-meta-item" style="margin-bottom:var(--sp-2)">
          <span class="category-tag">${icons[a.icon] || ''}${a.name}</span>
          <span class="detail-meta-item__value mono" style="color:${bal >= 0 ? 'var(--text-primary)' : 'var(--danger-500)'}">${fmtAmount(bal)}</span>
        </div>`;
      }).join('')}
    </section>` : '';

  screen.innerHTML = `
    <section class="card">
      <div class="progress-header">
        <span class="progress-header__title">${scopedAccountId ? `Solde · ${accountsById[scopedAccountId]?.name ?? ''}` : 'Solde total'}</span>
        <span class="progress-header__value mono" style="color:${stats.balance >= 0 ? 'var(--success-500)' : 'var(--danger-500)'}">${fmtAmount(stats.balance)}</span>
      </div>
      ${sparkline(balanceHistory, stats.balance >= 0 ? 'var(--success-500)' : 'var(--danger-500)', "Pas encore assez de transactions pour tracer une tendance.")}
      <div class="detail-meta-grid" style="margin-top:var(--sp-3)">
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Entrées (${statsWindow || 'tout'}${statsWindow ? 'j' : ''})</span>
          <span class="detail-meta-item__value" style="color:var(--success-500)">${fmtAmount(stats.totalIncome)}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Sorties (${statsWindow || 'tout'}${statsWindow ? 'j' : ''})</span>
          <span class="detail-meta-item__value" style="color:var(--danger-500)">${fmtAmount(stats.totalExpense)}</span>
        </div>
      </div>
    </section>

    <div class="tab-row mind-tab-row" role="tablist" id="window-tabs">
      <button class="tab-btn ${statsWindow === 7 ? 'is-active' : ''}" data-win="7">7j</button>
      <button class="tab-btn ${statsWindow === 30 ? 'is-active' : ''}" data-win="30">30j</button>
      <button class="tab-btn ${statsWindow === 0 ? 'is-active' : ''}" data-win="0">Tout</button>
    </div>

    ${accountTabsHtml}

    <div class="tab-row mind-tab-row" role="tablist" id="section-tabs" style="margin-top:var(--sp-3)">
      <button class="tab-btn ${activeTab === 'apercu' ? 'is-active' : ''}" data-tab="apercu">Aperçu</button>
      <button class="tab-btn ${activeTab === 'transactions' ? 'is-active' : ''}" data-tab="transactions">Transactions</button>
      <button class="tab-btn ${activeTab === 'objectifs' ? 'is-active' : ''}" data-tab="objectifs">Objectifs</button>
    </div>

    <div id="money-section"></div>
  `;

  const section = screen.querySelector('#money-section');

  if (activeTab === 'apercu') {
    if (scopedAccountId === null && accountsSummaryHtml) {
      section.insertAdjacentHTML('beforeend', accountsSummaryHtml);
    }

    // Outils Money (Comptes / Catégories / Dettes / Planifiés / Statistiques) —
    // grille qui enveloppe, plus jamais une rangée de chips non-wrappée dans le header.
    const toolsTitle = document.createElement('div');
    toolsTitle.className = 'detail-section-title';
    toolsTitle.textContent = 'Gérer';
    section.appendChild(toolsTitle);
    section.appendChild(moneyToolsGrid());

    const budgetedCategoryIds = new Set(budgetProgress.map((b) => b.category));
    const availableForNewBudget = expenseCategories.filter((c) => !budgetedCategoryIds.has(c.id));

    const budgetBlock = document.createElement('section');
    budgetBlock.className = 'card';
    budgetBlock.innerHTML = `
      <div class="detail-section-title">Budgets du mois</div>
      ${budgetProgress.length === 0 ? `<p style="font-size:var(--fs-sm);color:var(--text-tertiary)">Aucun budget défini pour l'instant.</p>` : budgetProgress.map((b) => {
        const cat = categoryMap[b.category] ?? categoryMap.autre;
        const barColor = b.isOver ? 'var(--danger-500)' : 'var(--success-500)';
        return `
        <div style="margin-bottom:var(--sp-3)">
          <div class="detail-meta-item">
            <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon]}${cat.label}</span>
            <span class="detail-meta-item__value mono" style="color:${b.isOver ? 'var(--danger-500)' : 'var(--text-primary)'}">
              ${fmtAmount(b.spent)} / ${fmtAmount(b.monthlyLimit)}
            </span>
          </div>
          <div class="progress-track" style="margin-top:var(--sp-1)">
            <div class="progress-fill" style="width:${Math.min(100, b.pct)}%; background:${barColor}"></div>
          </div>
          ${b.isOver ? `<p class="detail-desc" style="color:var(--danger-500);margin-top:var(--sp-1)">Budget dépassé (${b.pct}%)</p>` : ''}
        </div>`;
      }).join('')}
      ${availableForNewBudget.length > 0 ? (
        addingBudgetFor
          ? `
          <form id="budget-form" novalidate style="margin-top:var(--sp-2)">
            <div class="form-group">
              <label class="form-label" for="f-budget-category">Catégorie</label>
              <select class="form-input" id="f-budget-category" name="category">
                ${availableForNewBudget.map((c) => `<option value="${c.id}" ${addingBudgetFor === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin-top:var(--sp-3)">
              <label class="form-label" for="f-budget-limit">Limite mensuelle (Ar)</label>
              <input class="form-input" type="number" min="0" id="f-budget-limit" name="monthlyLimit" placeholder="0" required />
            </div>
            <div class="form-actions" style="margin-top:var(--sp-3)">
              <button type="button" class="btn-secondary" id="budget-cancel-btn">Annuler</button>
              <button type="submit" class="btn-primary">Enregistrer</button>
            </div>
          </form>`
          : `<button type="button" class="chip" id="add-budget-btn" style="margin-top:var(--sp-2)">${icons.plus}Ajouter un budget</button>`
      ) : ''}
    `;
    section.appendChild(budgetBlock);

    const addBudgetBtn = budgetBlock.querySelector('#add-budget-btn');
    if (addBudgetBtn) {
      addBudgetBtn.addEventListener('click', () => {
        addingBudgetFor = availableForNewBudget[0].id;
        el.replaceWith(MoneyHome());
      });
    }

    const budgetCancelBtn = budgetBlock.querySelector('#budget-cancel-btn');
    if (budgetCancelBtn) {
      budgetCancelBtn.addEventListener('click', () => {
        addingBudgetFor = null;
        el.replaceWith(MoneyHome());
      });
    }

    const budgetForm = budgetBlock.querySelector('#budget-form');
    if (budgetForm) {
      budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const category = formData.get('category')?.toString();
        const monthlyLimit = Number(formData.get('monthlyLimit'));
        if (!category || !monthlyLimit || monthlyLimit <= 0) return;
        store.setCategoryBudget(category, monthlyLimit);
        addingBudgetFor = null;
        el.replaceWith(MoneyHome());
      });
    }

    const catEntries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
    const catBlock = document.createElement('section');
    catBlock.className = 'card';
    catBlock.innerHTML = `
      <div class="detail-section-title">Dépenses par catégorie</div>
      ${catEntries.length === 0 ? `<p style="font-size:var(--fs-sm);color:var(--text-tertiary)">Aucune dépense sur cette période.</p>` : catEntries.map(([id, amount]) => {
        const cat = categoryMap[id] ?? categoryMap.autre;
        const pct = stats.totalExpense ? Math.round((amount / stats.totalExpense) * 100) : 0;
        return `
        <div class="detail-meta-item" style="margin-bottom:var(--sp-2)">
          <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon]}${cat.label}</span>
          <span class="detail-meta-item__value mono">${fmtAmount(amount)} <span style="color:var(--text-tertiary)">(${pct}%)</span></span>
        </div>`;
      }).join('')}
    `;
    section.appendChild(catBlock);

    const recentTitle = document.createElement('div');
    recentTitle.className = 'detail-section-title';
    recentTitle.style.marginTop = 'var(--sp-4)';
    recentTitle.textContent = 'Transactions récentes';
    section.appendChild(recentTitle);

    if (transactions.length === 0) {
      section.innerHTML += `
        <div class="state-block" style="padding-top: var(--sp-6)">
          ${icons.wallet.replace('<svg ', '<svg class="state-block__icon" ')}
          <h2 class="state-block__title">Aucune transaction</h2>
          <p class="state-block__desc">Ajoute ta première entrée ou dépense.</p>
        </div>`;
    } else {
      transactions.slice(0, 5).forEach((tx) => section.appendChild(transactionRow(tx, accountsById, activeAccountId === 'all', categoryMap)));
    }
  } else if (activeTab === 'transactions') {
    const list = document.createElement('div');
    list.className = 'goal-list';
    if (transactions.length === 0) {
      list.innerHTML = `
        <div class="state-block" style="padding-top: var(--sp-8)">
          ${icons.wallet.replace('<svg ', '<svg class="state-block__icon" ')}
          <h2 class="state-block__title">Aucune transaction</h2>
          <p class="state-block__desc">Ajoute ton premier revenu ou dépense.</p>
        </div>`;
    } else {
      transactions.forEach((tx) => list.appendChild(transactionRow(tx, accountsById, activeAccountId === 'all', categoryMap)));
    }
    section.appendChild(list);
  } else if (activeTab === 'objectifs') {
    const list = document.createElement('div');
    list.className = 'goal-list';
    if (financialGoals.length === 0) {
      list.innerHTML = `
        <div class="state-block" style="padding-top: var(--sp-8)">
          ${icons.target.replace('<svg ', '<svg class="state-block__icon" ')}
          <h2 class="state-block__title">Aucun objectif financier</h2>
          <p class="state-block__desc">Crée un objectif d'épargne et suis ta progression.</p>
        </div>`;
    } else {
      financialGoals.forEach((g) => list.appendChild(financialGoalCard(g)));
    }
    section.appendChild(list);
  }

  screen.querySelectorAll('#window-tabs [data-win]').forEach((btn) => {
    btn.addEventListener('click', () => {
      statsWindow = Number(btn.dataset.win);
      el.replaceWith(MoneyHome());
    });
  });

  screen.querySelectorAll('#account-tabs [data-account]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeAccountId = btn.dataset.account;
      el.replaceWith(MoneyHome());
    });
  });

  screen.querySelectorAll('#section-tabs [data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      el.replaceWith(MoneyHome());
    });
  });

  el.appendChild(screen);

  const fab = document.createElement('div');
  fab.className = 'fab';
  fab.innerHTML = `<button class="fab-btn" aria-label="Ajouter">${icons.plus}</button>`;
  fab.querySelector('button').addEventListener('click', () => {
    router.navigate(activeTab === 'objectifs' ? '/money/objectifs/nouveau' : '/money/transaction/nouveau');
  });
  el.appendChild(fab);

  return el;
}
