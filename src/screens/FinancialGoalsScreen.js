import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { MoneySubScreenHeader } from '../components/MoneySubScreenHeader.js';
import { financialGoalCard } from '../utils/moneyFormat.js';

export function FinancialGoalsScreen() {
  const el = document.createElement('div');
  el.appendChild(MoneySubScreenHeader('Objectifs', 'objectifs'));

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  const goals = store.listFinancialGoals();
  const list = document.createElement('div');
  list.className = 'goal-list';
  if (goals.length === 0) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-8)">
        ${icons.target.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">Aucun objectif financier</h2>
        <p class="state-block__desc">Crée un objectif d'épargne et suis ta progression.</p>
      </div>`;
  } else {
    goals.forEach((g) => list.appendChild(financialGoalCard(g)));
  }
  screen.appendChild(list);

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'btn-primary';
  fab.style.marginTop = 'var(--sp-2)';
  fab.innerHTML = `${icons.plus}Nouvel objectif`;
  fab.addEventListener('click', () => router.navigate('/money/objectifs/nouveau'));
  screen.appendChild(fab);

  el.appendChild(screen);
  return el;
}
