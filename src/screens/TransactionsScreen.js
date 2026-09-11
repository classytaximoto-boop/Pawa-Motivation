import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { MoneySubScreenHeader } from '../components/MoneySubScreenHeader.js';
import { fmtAmount, transactionRow } from '../utils/moneyFormat.js';

// Filtres (mémoire vive de l'écran, pas persistés)
let filters = {
  search: '',
  accountId: 'all',
  category: 'all',
  type: 'all', // all | income | expense | transfer
  period: 'all', // all | 7 | 30 | 90 | year
};

function periodStartMs(period) {
  const now = new Date();
  if (period === '7') return now.getTime() - 7 * 24 * 3600 * 1000;
  if (period === '30') return now.getTime() - 30 * 24 * 3600 * 1000;
  if (period === '90') return now.getTime() - 90 * 24 * 3600 * 1000;
  if (period === 'year') return new Date(now.getFullYear(), 0, 1).getTime();
  return null; // 'all'
}

function matchesFilters(tx, categoryMap) {
  if (filters.type !== 'all' && tx.type !== filters.type) return false;
  if (filters.accountId !== 'all') {
    const belongsToAccount = store._effectiveAccountId(tx) === filters.accountId || tx.toAccountId === filters.accountId;
    if (!belongsToAccount) return false;
  }
  if (filters.category !== 'all' && tx.category !== filters.category) return false;
  const start = periodStartMs(filters.period);
  if (start !== null && new Date(tx.date).getTime() < start) return false;
  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    const cat = categoryMap[tx.category] ?? categoryMap.autre;
    const haystack = `${tx.note || ''} ${cat?.label || ''}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export function TransactionsScreen() {
  const el = document.createElement('div');
  el.appendChild(MoneySubScreenHeader('Transactions', 'transactions'));

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  const accounts = store.listAccounts();
  const accountsById = Object.fromEntries(accounts.map((a) => [a.id, a]));
  const categoryMap = store.getCategoryMap();
  const allCategories = [...(store.state.moneyCategories?.expense ?? []), ...(store.state.moneyCategories?.income ?? [])];
  const allTransactions = store.listTransactions();

  function renderList() {
    const currentFiltered = allTransactions.filter((tx) => matchesFilters(tx, categoryMap));
    resultCount.textContent = `${currentFiltered.length} transaction${currentFiltered.length !== 1 ? 's' : ''}`;
    list.innerHTML = '';
    if (currentFiltered.length === 0) {
      list.innerHTML = `
        <div class="state-block" style="padding-top: var(--sp-8)">
          ${icons.wallet.replace('<svg ', '<svg class="state-block__icon" ')}
          <h2 class="state-block__title">Aucune transaction</h2>
          <p class="state-block__desc">Aucun résultat pour ces filtres.</p>
        </div>`;
    } else {
      currentFiltered.forEach((tx) => list.appendChild(transactionRow(tx, accountsById, filters.accountId === 'all', categoryMap)));
    }
  }

  const filterCard = document.createElement('section');
  filterCard.className = 'money-card';
  filterCard.innerHTML = `
    <div class="form-group">
      <input class="form-input" type="search" id="f-search" placeholder="Rechercher (note, catégorie)…" value="${filters.search}" />
    </div>
    <div class="form-group" style="margin-top:var(--sp-3)">
      <div class="category-picker" id="type-picker">
        <button type="button" class="category-picker-item ${filters.type === 'all' ? 'is-selected' : ''}" data-type="all"><span>Toutes</span></button>
        <button type="button" class="category-picker-item ${filters.type === 'income' ? 'is-selected' : ''}" data-type="income"><span>Entrées</span></button>
        <button type="button" class="category-picker-item ${filters.type === 'expense' ? 'is-selected' : ''}" data-type="expense"><span>Sorties</span></button>
        <button type="button" class="category-picker-item ${filters.type === 'transfer' ? 'is-selected' : ''}" data-type="transfer"><span>${icons.transfer}Transferts</span></button>
      </div>
    </div>
    <div class="form-group" style="margin-top:var(--sp-3)">
      <label class="form-label" for="f-account">Compte</label>
      <select class="form-input" id="f-account">
        <option value="all" ${filters.accountId === 'all' ? 'selected' : ''}>Tous les comptes</option>
        ${accounts.map((a) => `<option value="${a.id}" ${filters.accountId === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group" style="margin-top:var(--sp-3)">
      <label class="form-label" for="f-category">Catégorie</label>
      <select class="form-input" id="f-category">
        <option value="all" ${filters.category === 'all' ? 'selected' : ''}>Toutes les catégories</option>
        ${allCategories.map((c) => `<option value="${c.id}" ${filters.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
      </select>
    </div>
    <div class="form-group" style="margin-top:var(--sp-3)">
      <label class="form-label" for="f-period">Période</label>
      <select class="form-input" id="f-period">
        <option value="all" ${filters.period === 'all' ? 'selected' : ''}>Tout</option>
        <option value="7" ${filters.period === '7' ? 'selected' : ''}>7 derniers jours</option>
        <option value="30" ${filters.period === '30' ? 'selected' : ''}>30 derniers jours</option>
        <option value="90" ${filters.period === '90' ? 'selected' : ''}>90 derniers jours</option>
        <option value="year" ${filters.period === 'year' ? 'selected' : ''}>Cette année</option>
      </select>
    </div>
  `;
  screen.appendChild(filterCard);

  const resultCount = document.createElement('p');
  resultCount.className = 'detail-desc';
  screen.appendChild(resultCount);

  const list = document.createElement('div');
  list.className = 'goal-list';
  screen.appendChild(list);
  renderList();

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'btn-primary';
  fab.style.marginTop = 'var(--sp-2)';
  fab.innerHTML = `${icons.plus}Nouvelle transaction`;
  fab.addEventListener('click', () => router.navigate('/money/transaction/nouveau'));
  screen.appendChild(fab);

  el.appendChild(screen);

  filterCard.querySelector('#f-search').addEventListener('input', (e) => {
    filters.search = e.target.value;
    renderList();
  });
  filterCard.querySelectorAll('#type-picker [data-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      filters.type = btn.dataset.type;
      filterCard.querySelectorAll('#type-picker [data-type]').forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      renderList();
    });
  });
  filterCard.querySelector('#f-account').addEventListener('change', (e) => { filters.accountId = e.target.value; renderList(); });
  filterCard.querySelector('#f-category').addEventListener('change', (e) => { filters.category = e.target.value; renderList(); });
  filterCard.querySelector('#f-period').addEventListener('change', (e) => { filters.period = e.target.value; renderList(); });

  return el;
}
