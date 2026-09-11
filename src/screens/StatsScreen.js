import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { sparkline } from './Home.js';

// État local de l'écran (mémoire vive, pas persisté)
let activeSubTab = 'categories'; // categories | evolution | comparaison
let filterAccountId = null; // null = tous les comptes
let filterCategoryId = null; // null = toutes les catégories
let periodView = 'month'; // week | month | year | custom
let customStart = null; // YYYY-MM-DD, utilisé si periodView === 'custom'
let customEnd = null;
let compareMonthAOffset = 0; // décalage en mois par rapport au mois courant (0 = mois courant)
let compareMonthBOffset = -1; // par défaut : mois précédent

function fmtAmount(n) {
  return `${Math.round(n).toLocaleString('fr-FR')} MGA`;
}

function fmtMonthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function monthOffsetToYearMonth(offset) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/** Barre de comparaison horizontale simple (deux valeurs, même échelle) — SVG natif, même esprit que sparkline. */
function comparisonBar(labelA, valueA, labelB, valueB, color) {
  const max = Math.max(valueA, valueB, 1);
  const pctA = Math.round((valueA / max) * 100);
  const pctB = Math.round((valueB / max) * 100);
  return `
    <div style="margin-bottom:var(--sp-3)">
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">${labelA}</span>
        <span class="detail-meta-item__value mono">${fmtAmount(valueA)}</span>
      </div>
      <div class="progress-track" style="margin-top:var(--sp-1)"><div class="progress-fill" style="width:${pctA}%; background:${color}"></div></div>
      <div class="detail-meta-item" style="margin-top:var(--sp-2)">
        <span class="detail-meta-item__label">${labelB}</span>
        <span class="detail-meta-item__value mono">${fmtAmount(valueB)}</span>
      </div>
      <div class="progress-track" style="margin-top:var(--sp-1)"><div class="progress-fill" style="width:${pctB}%; background:${color}; opacity:0.5"></div></div>
    </div>`;
}

function filtersBlock(accounts, categoryMap) {
  const allExpenseCategories = store.listCategories('expense');
  const allIncomeCategories = store.listCategories('income');
  return `
    <section class="card">
      <div class="detail-section-title">Filtres</div>
      <div class="form-group">
        <label class="form-label" for="f-filter-account">Compte</label>
        <select class="form-input" id="f-filter-account">
          <option value="">Tous les comptes</option>
          ${accounts.map((a) => `<option value="${a.id}" ${filterAccountId === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-top:var(--sp-3)">
        <label class="form-label" for="f-filter-category">Catégorie</label>
        <select class="form-input" id="f-filter-category">
          <option value="">Toutes les catégories</option>
          <optgroup label="Dépenses">
            ${allExpenseCategories.map((c) => `<option value="${c.id}" ${filterCategoryId === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
          </optgroup>
          <optgroup label="Revenus">
            ${allIncomeCategories.map((c) => `<option value="${c.id}" ${filterCategoryId === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
          </optgroup>
        </select>
      </div>
    </section>
  `;
}

function categoryListHtml(title, byCategory, categoryMap, total, color) {
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  return `
    <section class="card">
      <div class="detail-section-title">${title}</div>
      ${entries.length === 0 ? `<p style="font-size:var(--fs-sm);color:var(--text-tertiary)">Aucune donnée sur cette période.</p>` : entries.map(([id, amount]) => {
        const cat = categoryMap[id] ?? categoryMap.autre;
        const pct = total ? Math.round((amount / total) * 100) : 0;
        return `
          <div style="margin-bottom:var(--sp-2)">
            <div class="detail-meta-item">
              <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon]}${cat.label}</span>
              <span class="detail-meta-item__value mono">${fmtAmount(amount)} <span style="color:var(--text-tertiary)">(${pct}%)</span></span>
            </div>
            <div class="progress-track" style="margin-top:var(--sp-1)">
              <div class="progress-fill" style="width:${pct}%; background:${color}"></div>
            </div>
          </div>`;
      }).join('')}
    </section>
  `;
}

function periodRangeFor(view) {
  const now = new Date();
  if (view === 'week') {
    const d = new Date(now);
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(d);
    start.setDate(d.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { startDate: store.todayKey(start), endDate: store.todayKey(end) };
  }
  if (view === 'year') {
    return { startDate: `${now.getFullYear()}-01-01`, endDate: `${now.getFullYear()}-12-31` };
  }
  if (view === 'custom') {
    return { startDate: customStart || null, endDate: customEnd || null };
  }
  // 'month' par défaut
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: store.todayKey(start), endDate: store.todayKey(end) };
}

function renderCategoriesTab(container, accounts, categoryMap) {
  const range = periodRangeFor(periodView);
  const stats = store.getFilteredMoneyStats({
    accountId: filterAccountId,
    categoryId: filterCategoryId,
    startDate: range.startDate,
    endDate: range.endDate,
  });

  container.innerHTML = `
    <div class="tab-row mind-tab-row" role="tablist" id="period-tabs">
      <button class="tab-btn ${periodView === 'week' ? 'is-active' : ''}" data-period="week">Semaine</button>
      <button class="tab-btn ${periodView === 'month' ? 'is-active' : ''}" data-period="month">Mois</button>
      <button class="tab-btn ${periodView === 'year' ? 'is-active' : ''}" data-period="year">Année</button>
      <button class="tab-btn ${periodView === 'custom' ? 'is-active' : ''}" data-period="custom">Personnalisé</button>
    </div>

    ${periodView === 'custom' ? `
    <div class="card" style="margin-top:var(--sp-3)">
      <div class="form-group">
        <label class="form-label" for="f-custom-start">Du</label>
        <input class="form-input" type="date" id="f-custom-start" value="${customStart ?? ''}" />
      </div>
      <div class="form-group" style="margin-top:var(--sp-2)">
        <label class="form-label" for="f-custom-end">Au</label>
        <input class="form-input" type="date" id="f-custom-end" value="${customEnd ?? ''}" />
      </div>
    </div>` : ''}

    <section class="card" style="margin-top:var(--sp-3)">
      <div class="detail-meta-grid">
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Entrées</span>
          <span class="detail-meta-item__value" style="color:var(--success-500)">${fmtAmount(stats.totalIncome)}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Sorties</span>
          <span class="detail-meta-item__value" style="color:var(--danger-500)">${fmtAmount(stats.totalExpense)}</span>
        </div>
      </div>
    </section>

    <div id="stats-category-lists"></div>
  `;

  const lists = container.querySelector('#stats-category-lists');
  lists.insertAdjacentHTML('beforeend', categoryListHtml('Dépenses par catégorie', stats.byCategoryExpense, categoryMap, stats.totalExpense, 'var(--danger-500)'));
  lists.insertAdjacentHTML('beforeend', categoryListHtml('Revenus par catégorie', stats.byCategoryIncome, categoryMap, stats.totalIncome, 'var(--success-500)'));

  container.querySelectorAll('#period-tabs [data-period]').forEach((btn) => {
    btn.addEventListener('click', () => {
      periodView = btn.dataset.period;
      renderCategoriesTab(container, accounts, categoryMap);
    });
  });

  const startInput = container.querySelector('#f-custom-start');
  const endInput = container.querySelector('#f-custom-end');
  if (startInput && endInput) {
    startInput.addEventListener('change', () => {
      customStart = startInput.value || null;
      renderCategoriesTab(container, accounts, categoryMap);
    });
    endInput.addEventListener('change', () => {
      customEnd = endInput.value || null;
      renderCategoriesTab(container, accounts, categoryMap);
    });
  }
}

function renderEvolutionTab(container) {
  const range = periodRangeFor(periodView === 'custom' ? 'custom' : periodView);
  const history = store.getBalanceHistoryRange(range.startDate, range.endDate, filterAccountId);
  const lastValue = history.length ? history[history.length - 1].value : 0;

  container.innerHTML = `
    <div class="tab-row mind-tab-row" role="tablist" id="evolution-period-tabs">
      <button class="tab-btn ${periodView === 'week' ? 'is-active' : ''}" data-period="week">Semaine</button>
      <button class="tab-btn ${periodView === 'month' ? 'is-active' : ''}" data-period="month">Mois</button>
      <button class="tab-btn ${periodView === 'year' ? 'is-active' : ''}" data-period="year">Année</button>
      <button class="tab-btn ${periodView === 'custom' ? 'is-active' : ''}" data-period="custom">Personnalisé</button>
    </div>

    ${periodView === 'custom' ? `
    <div class="card" style="margin-top:var(--sp-3)">
      <div class="form-group">
        <label class="form-label" for="f-evo-start">Du</label>
        <input class="form-input" type="date" id="f-evo-start" value="${customStart ?? ''}" />
      </div>
      <div class="form-group" style="margin-top:var(--sp-2)">
        <label class="form-label" for="f-evo-end">Au</label>
        <input class="form-input" type="date" id="f-evo-end" value="${customEnd ?? ''}" />
      </div>
    </div>` : ''}

    <section class="card" style="margin-top:var(--sp-3)">
      <div class="progress-header">
        <span class="progress-header__title">${filterAccountId ? 'Solde du compte' : 'Solde total'}</span>
        <span class="progress-header__value mono" style="color:${lastValue >= 0 ? 'var(--success-500)' : 'var(--danger-500)'}">${fmtAmount(lastValue)}</span>
      </div>
      ${sparkline(history, lastValue >= 0 ? 'var(--success-500)' : 'var(--danger-500)', "Pas assez de transactions sur cette période pour tracer une tendance.")}
    </section>
  `;

  container.querySelectorAll('#evolution-period-tabs [data-period]').forEach((btn) => {
    btn.addEventListener('click', () => {
      periodView = btn.dataset.period;
      renderEvolutionTab(container);
    });
  });

  const startInput = container.querySelector('#f-evo-start');
  const endInput = container.querySelector('#f-evo-end');
  if (startInput && endInput) {
    startInput.addEventListener('change', () => {
      customStart = startInput.value || null;
      renderEvolutionTab(container);
    });
    endInput.addEventListener('change', () => {
      customEnd = endInput.value || null;
      renderEvolutionTab(container);
    });
  }
}

function renderComparisonTab(container, categoryMap) {
  const monthA = monthOffsetToYearMonth(compareMonthAOffset);
  const monthB = monthOffsetToYearMonth(compareMonthBOffset);
  const comparison = store.getMonthComparison(monthA, monthB, filterAccountId);

  const expenseComparison = store.getCategoryComparison(
    'expense',
    { startDate: comparison.a.start, endDate: comparison.a.end },
    { startDate: comparison.b.start, endDate: comparison.b.end },
    filterAccountId,
  );

  container.innerHTML = `
    <section class="card">
      <div class="detail-section-title">Mois comparés</div>
      <div class="form-group">
        <label class="form-label" for="f-month-a">Mois A</label>
        <select class="form-input" id="f-month-a">
          ${Array.from({ length: 13 }, (_, i) => -i).map((offset) => {
            const { year, month } = monthOffsetToYearMonth(offset);
            return `<option value="${offset}" ${compareMonthAOffset === offset ? 'selected' : ''}>${fmtMonthLabel(year, month)}</option>`;
          }).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-top:var(--sp-2)">
        <label class="form-label" for="f-month-b">Mois B</label>
        <select class="form-input" id="f-month-b">
          ${Array.from({ length: 13 }, (_, i) => -i).map((offset) => {
            const { year, month } = monthOffsetToYearMonth(offset);
            return `<option value="${offset}" ${compareMonthBOffset === offset ? 'selected' : ''}>${fmtMonthLabel(year, month)}</option>`;
          }).join('')}
        </select>
      </div>
    </section>

    <section class="card" style="margin-top:var(--sp-3)">
      <div class="detail-section-title">Entrées</div>
      ${comparisonBar(fmtMonthLabel(monthA.year, monthA.month), comparison.a.totalIncome, fmtMonthLabel(monthB.year, monthB.month), comparison.b.totalIncome, 'var(--success-500)')}
      <p class="detail-desc">${comparison.deltaIncome >= 0 ? '+' : ''}${fmtAmount(comparison.deltaIncome)}${comparison.pctIncome != null ? ` (${comparison.pctIncome >= 0 ? '+' : ''}${comparison.pctIncome}%)` : ''}</p>
    </section>

    <section class="card" style="margin-top:var(--sp-3)">
      <div class="detail-section-title">Sorties</div>
      ${comparisonBar(fmtMonthLabel(monthA.year, monthA.month), comparison.a.totalExpense, fmtMonthLabel(monthB.year, monthB.month), comparison.b.totalExpense, 'var(--danger-500)')}
      <p class="detail-desc">${comparison.deltaExpense >= 0 ? '+' : ''}${fmtAmount(comparison.deltaExpense)}${comparison.pctExpense != null ? ` (${comparison.pctExpense >= 0 ? '+' : ''}${comparison.pctExpense}%)` : ''}</p>
    </section>

    <section class="card" style="margin-top:var(--sp-3)">
      <div class="detail-section-title">Solde net</div>
      <div class="detail-meta-grid">
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">${fmtMonthLabel(monthA.year, monthA.month)}</span>
          <span class="detail-meta-item__value mono" style="color:${comparison.a.net >= 0 ? 'var(--success-500)' : 'var(--danger-500)'}">${fmtAmount(comparison.a.net)}</span>
        </div>
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">${fmtMonthLabel(monthB.year, monthB.month)}</span>
          <span class="detail-meta-item__value mono" style="color:${comparison.b.net >= 0 ? 'var(--success-500)' : 'var(--danger-500)'}">${fmtAmount(comparison.b.net)}</span>
        </div>
      </div>
    </section>

    <section class="card" style="margin-top:var(--sp-3)">
      <div class="detail-section-title">Catégories qui ont le plus varié (dépenses)</div>
      ${expenseComparison.length === 0 ? `<p style="font-size:var(--fs-sm);color:var(--text-tertiary)">Aucune dépense sur ces deux mois.</p>` : expenseComparison.slice(0, 8).map((c) => {
        const cat = categoryMap[c.category] ?? categoryMap.autre;
        return `
          <div class="detail-meta-item" style="margin-bottom:var(--sp-2)">
            <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon]}${cat.label}</span>
            <span class="detail-meta-item__value mono" style="color:${c.delta > 0 ? 'var(--danger-500)' : c.delta < 0 ? 'var(--success-500)' : 'var(--text-tertiary)'}">
              ${c.delta >= 0 ? '+' : ''}${fmtAmount(c.delta)}
            </span>
          </div>`;
      }).join('')}
    </section>
  `;

  container.querySelector('#f-month-a').addEventListener('change', (e) => {
    compareMonthAOffset = Number(e.target.value);
    renderComparisonTab(container, categoryMap);
  });
  container.querySelector('#f-month-b').addEventListener('change', (e) => {
    compareMonthBOffset = Number(e.target.value);
    renderComparisonTab(container, categoryMap);
  });
}

export function StatsScreen() {
  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">Statistiques</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/money'));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  const accounts = store.listAccounts();
  const categoryMap = store.getCategoryMap();

  screen.innerHTML = `
    <div id="stats-filters"></div>

    <div class="tab-row mind-tab-row" role="tablist" id="stats-subtabs" style="margin-top:var(--sp-3)">
      <button class="tab-btn ${activeSubTab === 'categories' ? 'is-active' : ''}" data-subtab="categories">Catégories</button>
      <button class="tab-btn ${activeSubTab === 'evolution' ? 'is-active' : ''}" data-subtab="evolution">Évolution</button>
      <button class="tab-btn ${activeSubTab === 'comparaison' ? 'is-active' : ''}" data-subtab="comparaison">Comparaison</button>
    </div>

    <div id="stats-content" style="margin-top:var(--sp-3)"></div>
  `;

  screen.querySelector('#stats-filters').insertAdjacentHTML('beforeend', filtersBlock(accounts, categoryMap));
  screen.querySelector('#f-filter-account').addEventListener('change', (e) => {
    filterAccountId = e.target.value || null;
    renderActiveSubTab();
  });
  screen.querySelector('#f-filter-category').addEventListener('change', (e) => {
    filterCategoryId = e.target.value || null;
    renderActiveSubTab();
  });

  const content = screen.querySelector('#stats-content');

  function renderActiveSubTab() {
    if (activeSubTab === 'categories') renderCategoriesTab(content, accounts, categoryMap);
    else if (activeSubTab === 'evolution') renderEvolutionTab(content);
    else if (activeSubTab === 'comparaison') renderComparisonTab(content, categoryMap);
  }
  renderActiveSubTab();

  screen.querySelectorAll('#stats-subtabs [data-subtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeSubTab = btn.dataset.subtab;
      screen.querySelectorAll('#stats-subtabs [data-subtab]').forEach((b) => b.classList.toggle('is-active', b.dataset.subtab === activeSubTab));
      renderActiveSubTab();
    });
  });

  el.appendChild(screen);
  return el;
}
