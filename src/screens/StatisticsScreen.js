import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { MoneySubScreenHeader } from '../components/MoneySubScreenHeader.js';
import { fmtAmount } from '../utils/moneyFormat.js';
import { sparkline } from './Home.js';

// État local (mémoire vive, pas persisté)
// windowDays : nombre de jours passé directement à store.getMoneyStats()/getBalanceHistory()
// (mêmes fonctions que MoneyHome — voir note en bas de fichier), donc les
// chiffres de Statistiques et du Dashboard restent toujours cohérents entre eux.
// 0 = tout l'historique. Pour "Cette année", on calcule le nombre de jours
// écoulés depuis le 1er janvier et on le passe telle quelle à ces mêmes fonctions.
let periodId = '30';

const PERIODS = [
  { id: '7', label: '7 jours', days: 7 },
  { id: '30', label: '30 jours', days: 30 },
  { id: '90', label: '90 jours', days: 90 },
  { id: '180', label: '6 mois', days: 180 },
  { id: '365', label: '1 an', days: 365 },
  { id: 'year', label: 'Cette année', days: null }, // calculé dynamiquement
  { id: '0', label: 'Tout', days: 0 },
];

function resolveDays(periodId) {
  const p = PERIODS.find((x) => x.id === periodId);
  if (!p) return 30;
  if (p.id === 'year') {
    const start = new Date(new Date().getFullYear(), 0, 1).getTime();
    return Math.max(1, Math.ceil((Date.now() - start) / 86400000));
  }
  return p.days;
}

function performanceColor(n) {
  if (n > 0) return 'var(--success-500)';
  if (n < 0) return 'var(--danger-500)';
  return 'var(--text-tertiary)';
}

function miniBarChart(entries, maxAbs, colorPos, colorNeg) {
  // entries: [{ label, value }]. Barres horizontales simples, sans dépendance externe.
  if (entries.length === 0) return '<p class="detail-desc">Aucune donnée sur cette période.</p>';
  return entries.map(({ label, value }) => {
    const pct = maxAbs ? Math.round((Math.abs(value) / maxAbs) * 100) : 0;
    const color = value >= 0 ? colorPos : colorNeg;
    return `
      <div style="margin-bottom:var(--sp-2)">
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">${label}</span>
          <span class="detail-meta-item__value mono">${fmtAmount(value)}</span>
        </div>
        <div class="progress-track" style="margin-top:2px">
          <div class="progress-fill" style="width:${pct}%; background:${color}"></div>
        </div>
      </div>`;
  }).join('');
}

export function StatisticsScreen() {
  const el = document.createElement('div');
  el.appendChild(MoneySubScreenHeader('Statistiques', 'statistiques'));

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  function rerender() {
    el.replaceWith(StatisticsScreen());
  }

  const days = resolveDays(periodId);

  // --- Toutes les données proviennent des mêmes fonctions store que MoneyHome (Dashboard) ---
  const stats = store.getMoneyStats(days); // { totalIncome, totalExpense, net, balance, byCategory, count }
  const balanceHistory = store.getBalanceHistory(days);
  const categoryMap = store.getCategoryMap();
  const budgetProgress = store.getBudgetProgress();
  const debts = store.listDebts();
  const debtsSummary = store.getDebtsSummary();
  const financialGoals = store.listFinancialGoals();
  const investmentsSummary = store.getInvestmentsSummary();
  const investments = store.getInvestments();

  // Épargne = net positif de la période (entrées - sorties), cohérent avec
  // la définition déjà utilisée pour le solde ailleurs dans Money. Si négatif,
  // il n'y a pas eu d'épargne sur la période (affiché à 0, jamais un nombre négatif trompeur).
  const savings = Math.max(0, stats.net);

  // Période sélecteur
  const periodRow = document.createElement('div');
  periodRow.className = 'tab-row mind-tab-row';
  periodRow.style.overflowX = 'auto';
  periodRow.innerHTML = PERIODS.map((p) => `<button class="tab-btn ${periodId === p.id ? 'is-active' : ''}" data-period="${p.id}">${p.label}</button>`).join('');
  screen.appendChild(periodRow);

  // 1-4 : Entrées / Sorties / Solde / Épargne
  const overviewCard = document.createElement('section');
  overviewCard.className = 'card';
  overviewCard.style.marginTop = 'var(--sp-3)';
  overviewCard.innerHTML = `
    <div class="progress-header">
      <span class="progress-header__title">${icons.wallet}Solde</span>
      <span class="progress-header__value mono" style="color:${stats.balance >= 0 ? 'var(--success-500)' : 'var(--danger-500)'}">${fmtAmount(stats.balance)}</span>
    </div>
    ${sparkline(balanceHistory, stats.balance >= 0 ? 'var(--success-500)' : 'var(--danger-500)', "Pas encore assez de transactions pour tracer une tendance.")}
    <div class="detail-meta-grid" style="margin-top:var(--sp-3)">
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">${icons.cash}Entrées</span>
        <span class="detail-meta-item__value mono" style="color:var(--success-500)">${fmtAmount(stats.totalIncome)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">${icons.creditCard}Sorties</span>
        <span class="detail-meta-item__value mono" style="color:var(--danger-500)">${fmtAmount(stats.totalExpense)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">${icons.piggyBank}Épargne (période)</span>
        <span class="detail-meta-item__value mono" style="color:var(--success-500)">${fmtAmount(savings)}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">${icons.transfer}Transactions</span>
        <span class="detail-meta-item__value mono">${stats.count}</span>
      </div>
    </div>
  `;
  screen.appendChild(overviewCard);

  // 5 : Dépenses par catégorie
  const catEntries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
  const catCard = document.createElement('section');
  catCard.className = 'card';
  catCard.style.marginTop = 'var(--sp-3)';
  catCard.innerHTML = `
    <div class="detail-section-title">${icons.inbox}Dépenses par catégorie</div>
    <div style="margin-top:var(--sp-2)">
      ${catEntries.length === 0 ? '<p class="detail-desc">Aucune dépense sur cette période.</p>' : catEntries.map(([id, amount]) => {
        const cat = categoryMap[id] ?? categoryMap.autre;
        const pct = stats.totalExpense ? Math.round((amount / stats.totalExpense) * 100) : 0;
        return `
          <div style="margin-bottom:var(--sp-2)">
            <div class="detail-meta-item">
              <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon] || ''}${cat.label}</span>
              <span class="detail-meta-item__value mono">${fmtAmount(amount)} <span style="color:var(--text-tertiary)">(${pct}%)</span></span>
            </div>
            <div class="progress-track" style="margin-top:2px">
              <div class="progress-fill" style="width:${pct}%; background:var(${cat.color})"></div>
            </div>
          </div>`;
      }).join('')}
    </div>
  `;
  screen.appendChild(catCard);

  // 6-7 : Évolution entrées/sorties (par mois, sur la période) + évolution du solde (déjà couvert par sparkline ci-dessus)
  const monthlyBuckets = {};
  store.listTransactions().forEach((t) => {
    if (t.type === 'transfer') return;
    const tTime = new Date(t.date).getTime();
    if (days > 0 && tTime < Date.now() - days * 86400000) return;
    const key = t.date.slice(0, 7); // YYYY-MM
    if (!monthlyBuckets[key]) monthlyBuckets[key] = { income: 0, expense: 0 };
    monthlyBuckets[key][t.type] += t.amount;
  });
  const monthKeys = Object.keys(monthlyBuckets).sort();
  const evolutionCard = document.createElement('section');
  evolutionCard.className = 'card';
  evolutionCard.style.marginTop = 'var(--sp-3)';
  evolutionCard.innerHTML = `
    <div class="detail-section-title">${icons.compass}Évolution entrées / sorties</div>
    <div style="margin-top:var(--sp-2)">
      ${monthKeys.length === 0 ? '<p class="detail-desc">Aucune donnée sur cette période.</p>' : monthKeys.map((key) => {
        const b = monthlyBuckets[key];
        const label = new Date(`${key}-01`).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        const maxVal = Math.max(b.income, b.expense, 1);
        return `
          <div style="margin-bottom:var(--sp-3)">
            <span class="detail-meta-item__label">${label}</span>
            <div class="detail-meta-item" style="margin-top:2px">
              <span class="chip">${icons.cash}Entrées</span>
              <span class="detail-meta-item__value mono" style="color:var(--success-500)">${fmtAmount(b.income)}</span>
            </div>
            <div class="progress-track" style="margin-top:2px"><div class="progress-fill" style="width:${Math.round((b.income / maxVal) * 100)}%; background:var(--success-500)"></div></div>
            <div class="detail-meta-item" style="margin-top:var(--sp-1)">
              <span class="chip">${icons.creditCard}Sorties</span>
              <span class="detail-meta-item__value mono" style="color:var(--danger-500)">${fmtAmount(b.expense)}</span>
            </div>
            <div class="progress-track" style="margin-top:2px"><div class="progress-fill" style="width:${Math.round((b.expense / maxVal) * 100)}%; background:var(--danger-500)"></div></div>
          </div>`;
      }).join('')}
    </div>
  `;
  screen.appendChild(evolutionCard);

  // 8 : Budgets
  const budgetCard = document.createElement('section');
  budgetCard.className = 'card';
  budgetCard.style.marginTop = 'var(--sp-3)';
  budgetCard.innerHTML = `
    <div class="detail-section-title">${icons.piggyBank}Budgets (mois en cours)</div>
    <div style="margin-top:var(--sp-2)">
      ${budgetProgress.length === 0 ? '<p class="detail-desc">Aucun budget défini.</p>' : budgetProgress.map((b) => {
        const cat = categoryMap[b.category] ?? categoryMap.autre;
        const color = b.isOver ? 'var(--danger-500)' : b.status === 'warning' ? 'var(--warning-500)' : 'var(--success-500)';
        return `
          <div class="detail-meta-item" style="margin-bottom:var(--sp-2)">
            <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon] || ''}${cat.label}</span>
            <span class="detail-meta-item__value mono" style="color:${color}">${fmtAmount(b.spent)} / ${fmtAmount(b.monthlyLimit)}</span>
          </div>`;
      }).join('')}
    </div>
  `;
  screen.appendChild(budgetCard);

  // 9 : Dettes
  const debtsCard = document.createElement('section');
  debtsCard.className = 'card';
  debtsCard.style.marginTop = 'var(--sp-3)';
  debtsCard.innerHTML = `
    <div class="detail-section-title">${icons.handshakeOut}Dettes</div>
    <div class="detail-meta-grid" style="margin-top:var(--sp-2)">
      <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.handshakeOut}Prêté (restant dû)</span><span class="detail-meta-item__value mono">${fmtAmount(debtsSummary.totalLent)}</span></div>
      <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.handshakeIn}Emprunté (restant dû)</span><span class="detail-meta-item__value mono">${fmtAmount(debtsSummary.totalBorrowed)}</span></div>
      <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.alertTriangle}En retard</span><span class="detail-meta-item__value mono" style="color:${debtsSummary.lateCount > 0 ? 'var(--danger-500)' : 'var(--text-primary)'}">${debtsSummary.lateCount}</span></div>
      <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.inbox}Total dettes</span><span class="detail-meta-item__value mono">${debts.length}</span></div>
    </div>
  `;
  screen.appendChild(debtsCard);

  // 10 : Objectifs
  const goalsCard = document.createElement('section');
  goalsCard.className = 'card';
  goalsCard.style.marginTop = 'var(--sp-3)';
  const activeGoals = financialGoals.filter((g) => g.status === 'active');
  const completedGoals = financialGoals.filter((g) => g.status === 'completed');
  goalsCard.innerHTML = `
    <div class="detail-section-title">${icons.target}Objectifs financiers</div>
    <div class="detail-meta-grid" style="margin-top:var(--sp-2)">
      <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.flame}Actifs</span><span class="detail-meta-item__value mono">${activeGoals.length}</span></div>
      <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.check}Atteints</span><span class="detail-meta-item__value mono" style="color:var(--success-500)">${completedGoals.length}</span></div>
    </div>
    ${financialGoals.length === 0 ? '<p class="detail-desc" style="margin-top:var(--sp-2)">Aucun objectif financier.</p>' : `
    <div style="margin-top:var(--sp-2)">
      ${financialGoals.slice(0, 5).map((g) => `
        <div style="margin-bottom:var(--sp-2)">
          <div class="detail-meta-item"><span class="detail-meta-item__label">${g.name}</span><span class="detail-meta-item__value mono">${g.progress}%</span></div>
          <div class="progress-track" style="margin-top:2px"><div class="progress-fill" style="width:${g.progress}%"></div></div>
        </div>`).join('')}
    </div>`}
  `;
  screen.appendChild(goalsCard);

  // 11 : Investissements
  const invCard = document.createElement('section');
  invCard.className = 'card';
  invCard.style.marginTop = 'var(--sp-3)';
  invCard.innerHTML = `
    <div class="detail-section-title">${icons.briefcase}Investissements</div>
    <div class="detail-meta-grid" style="margin-top:var(--sp-2)">
      <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.cash}Capital total</span><span class="detail-meta-item__value mono">${fmtAmount(investmentsSummary.totalInitial)}</span></div>
      <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.wallet}Valeur actuelle</span><span class="detail-meta-item__value mono">${fmtAmount(investmentsSummary.totalCurrent)}</span></div>
      <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.bolt}Gain/Perte</span><span class="detail-meta-item__value mono" style="color:${performanceColor(investmentsSummary.totalGain)}">${investmentsSummary.totalGain >= 0 ? '+' : ''}${fmtAmount(investmentsSummary.totalGain)}</span></div>
      <div class="detail-meta-item"><span class="detail-meta-item__label">${icons.compass}Performance globale</span><span class="detail-meta-item__value mono" style="color:${performanceColor(investmentsSummary.globalPerformance)}">${investmentsSummary.globalPerformance >= 0 ? '+' : ''}${Math.round(investmentsSummary.globalPerformance * 10) / 10}%</span></div>
    </div>
    ${investments.length === 0 ? '<p class="detail-desc" style="margin-top:var(--sp-2)">Aucun investissement.</p>' : `
    <div style="margin-top:var(--sp-2)">
      ${investments.slice(0, 5).map((inv) => {
        const perf = store.getInvestmentPerformance(inv);
        return `
        <div class="detail-meta-item" style="margin-bottom:var(--sp-1)">
          <span class="category-tag">${inv.name}</span>
          <span class="detail-meta-item__value mono" style="color:${performanceColor(perf)}">${perf >= 0 ? '+' : ''}${Math.round(perf * 10) / 10}%</span>
        </div>`;
      }).join('')}
    </div>`}
  `;
  screen.appendChild(invCard);

  el.appendChild(screen);

  periodRow.querySelectorAll('[data-period]').forEach((btn) => {
    btn.addEventListener('click', () => { periodId = btn.dataset.period; rerender(); });
  });

  return el;
}
