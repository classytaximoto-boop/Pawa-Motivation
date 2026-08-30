import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

/**
 * Formate un montant. Utilise store.formatMoney() (respecte les préférences
 * WalletSettings — séparateur de milliers, position du symbole) plutôt que
 * de recoder un formatage local par écran.
 */
export function fmtAmount(n) {
  return store.formatMoney(n);
}

export function fmtDate(iso, opts) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', opts || { day: '2-digit', month: 'short' });
}

/** Nom du compte d'une transaction, en tolérant les anciennes transactions
 * sans accountId (repli sur le compte par défaut réel de store, jamais une
 * chaîne codée en dur qui pourrait diverger de store.DEFAULT_ACCOUNT_ID). */
export function accountLabelFor(tx, accountsById) {
  const id = tx.accountId || store.DEFAULT_ACCOUNT_ID;
  return accountsById[id]?.name ?? 'Compte supprimé';
}

export function financialGoalCard(goal) {
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
 * Ligne de transaction cliquable (ouvre le formulaire de modification).
 * showAccount : afficher un chip avec le nom du compte (utile quand la vue
 * n'est pas déjà filtrée sur un seul compte).
 */
export function transactionRow(tx, accountsById, showAccount, categoryMap) {
  const row = document.createElement('button');
  row.className = 'card goal-card';
  row.style.textAlign = 'left';

  if (tx.type === 'transfer') {
    const fromLabel = accountLabelFor(tx, accountsById);
    const toLabel = accountsById[tx.toAccountId]?.name ?? 'Compte supprimé';
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
