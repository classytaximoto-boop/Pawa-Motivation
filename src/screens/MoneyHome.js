import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AppHeader } from '../components/AppHeader.js';
import { moneyCategoryMap } from '../data/moneyCategories.js';

// État local de filtre (mémoire vive de l'écran, pas persisté)
let activeTab = 'apercu'; // apercu | transactions | objectifs
let statsWindow = 30; // 0 = tout, 7, 30

function fmtAmount(n) {
  return `${Math.round(n).toLocaleString('fr-FR')} Ar`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function transactionRow(tx) {
  const cat = moneyCategoryMap[tx.category] ?? moneyCategoryMap.autre;
  const row = document.createElement('button');
  row.className = 'card goal-card';
  row.style.textAlign = 'left';
  row.innerHTML = `
    <div class="goal-card__top">
      <div>
        <div class="goal-card__title-row">
          <span class="goal-card__name">${tx.note || cat.label}</span>
        </div>
        <div class="goal-card__meta-row">
          <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon]}${cat.label}</span>
          <span class="chip">${fmtDate(tx.date)}</span>
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

export function MoneyHome() {
  const state = store.get();
  const stats = store.getMoneyStats(statsWindow);
  const transactions = store.listTransactions();
  const financialGoals = store.listFinancialGoals();

  const el = document.createElement('div');
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen';

  screen.innerHTML = `
    <div class="screen-title-row"><h1>Money</h1></div>

    <section class="card">
      <div class="progress-header">
        <span class="progress-header__title">Solde total</span>
        <span class="progress-header__value mono" style="color:${stats.balance >= 0 ? 'var(--success-500)' : 'var(--danger-500)'}">${fmtAmount(stats.balance)}</span>
      </div>
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

    <div class="tab-row mind-tab-row" role="tablist" id="section-tabs" style="margin-top:var(--sp-3)">
      <button class="tab-btn ${activeTab === 'apercu' ? 'is-active' : ''}" data-tab="apercu">Aperçu</button>
      <button class="tab-btn ${activeTab === 'transactions' ? 'is-active' : ''}" data-tab="transactions">Transactions</button>
      <button class="tab-btn ${activeTab === 'objectifs' ? 'is-active' : ''}" data-tab="objectifs">Objectifs</button>
    </div>

    <div id="money-section"></div>
  `;

  const section = screen.querySelector('#money-section');

  if (activeTab === 'apercu') {
    const catEntries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
    const catBlock = document.createElement('section');
    catBlock.className = 'card';
    catBlock.innerHTML = `
      <div class="detail-section-title">Dépenses par catégorie</div>
      ${catEntries.length === 0 ? `<p style="font-size:var(--fs-sm);color:var(--text-tertiary)">Aucune dépense sur cette période.</p>` : catEntries.map(([id, amount]) => {
        const cat = moneyCategoryMap[id] ?? moneyCategoryMap.autre;
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
      transactions.slice(0, 5).forEach((tx) => section.appendChild(transactionRow(tx)));
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
      transactions.forEach((tx) => list.appendChild(transactionRow(tx)));
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
