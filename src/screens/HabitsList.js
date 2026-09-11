import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AppHeader } from '../components/AppHeader.js';

function habitCard(habit, rerender) {
  const doneToday = store.isHabitDoneToday(habit);
  const streak = store.getHabitStreak(habit);

  const card = document.createElement('div');
  card.className = `card goal-card ${doneToday ? 'is-done' : ''}`;
  card.innerHTML = `
    <div class="goal-card__top">
      <span class="mission-checkbox" style="width:24px;height:24px;flex-shrink:0">${icons.check}</span>
      <div style="flex:1">
        <div class="goal-card__title-row">
          ${icons[habit.icon] || icons.flame}
          <span class="goal-card__name">${habit.name}</span>
        </div>
        <div class="goal-card__meta-row">
          <span class="chip">${icons.flame}${streak} jour${streak > 1 ? 's' : ''} de suite</span>
          <span class="chip">${habit.frequency === 'hebdo' ? 'Hebdo' : 'Quotidien'}</span>
        </div>
      </div>
    </div>
  `;
  card.querySelector('.mission-checkbox').addEventListener('click', (e) => {
    e.stopPropagation();
    store.toggleHabitToday(habit.id);
    rerender();
  });
  card.addEventListener('click', () => router.navigate(`/habitudes/${habit.id}`));
  return card;
}

export function HabitsList() {
  const rerender = () => {
    const fresh = HabitsList();
    el.replaceWith(fresh);
  };

  const habits = store.listHabits();
  const doneCount = habits.filter((h) => store.isHabitDoneToday(h)).length;

  const el = document.createElement('div');
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen';

  screen.innerHTML = `
    <div class="screen-title-row"><h1>Habitudes</h1></div>
    ${habits.length ? `<p class="detail-desc" style="margin-bottom:var(--sp-3)">${doneCount}/${habits.length} faites aujourd'hui</p>` : ''}
    <div class="goal-list" id="habits-list"></div>
  `;

  const list = screen.querySelector('#habits-list');
  if (habits.length === 0) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-8)">
        ${icons.flame.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">Aucune habitude pour le moment</h2>
        <p class="state-block__desc">Crée ta première habitude à tenir chaque jour.</p>
      </div>`;
  } else {
    habits.forEach((h) => list.appendChild(habitCard(h, rerender)));
  }

  el.appendChild(screen);

  const fab = document.createElement('div');
  fab.className = 'fab';
  fab.innerHTML = `<button class="fab-btn" aria-label="Nouvelle habitude">${icons.plus}</button>`;
  fab.querySelector('button').addEventListener('click', () => router.navigate('/habitudes/nouveau'));
  el.appendChild(fab);

  return el;
}
