import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AppHeader } from '../components/AppHeader.js';
import { moodMap } from '../data/moods.js';

function fmtDay(dayKey) {
  return new Date(dayKey).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
}

function reviewCard(review) {
  const mood = review.mood ? moodMap[review.mood] : null;
  const card = document.createElement('div');
  card.className = 'card goal-card';
  card.innerHTML = `
    <div class="goal-card__top">
      <div>
        <div class="goal-card__title-row">
          <span class="goal-card__name" style="text-transform:capitalize">${fmtDay(review.day)}</span>
        </div>
        <div class="goal-card__meta-row">
          <span class="chip">Missions ${review.missionsDone}/${review.missionsTotal}</span>
          ${mood ? `<span class="chip">${mood.emoji} ${mood.label}</span>` : ''}
        </div>
      </div>
    </div>
    ${review.victory ? `<p class="detail-desc" style="margin-top:var(--sp-2)">🏆 ${review.victory}</p>` : ''}
  `;
  return card;
}

export function ReportsHome() {
  const dailyReviews = store.listDailyReviews();
  const todayKey = store.todayKey();
  const hasToday = dailyReviews.some((r) => r.day === todayKey);

  const el = document.createElement('div');
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen';

  screen.innerHTML = `
    <div class="screen-title-row"><h1>Rapports</h1></div>

    <div class="card" style="display:flex;flex-direction:column;gap:var(--sp-3)">
      <button type="button" class="btn-primary" id="daily-btn">${hasToday ? 'Modifier le rapport du jour' : 'Faire le rapport du jour'}</button>
      <button type="button" class="btn-secondary" id="weekly-btn">Rapport hebdomadaire</button>
    </div>

    <div class="card__label" style="margin-top: var(--sp-6)">Historique quotidien</div>
    <div class="goal-list" id="daily-history"></div>
  `;

  const list = screen.querySelector('#daily-history');
  if (dailyReviews.length === 0) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-6)">
        ${icons.notes.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">Aucun rapport pour le moment</h2>
        <p class="state-block__desc">Termine ta journée par un rapport, chaque soir.</p>
      </div>`;
  } else {
    dailyReviews.forEach((r) => list.appendChild(reviewCard(r)));
  }

  screen.querySelector('#daily-btn').addEventListener('click', () => router.navigate('/rapports/jour'));
  screen.querySelector('#weekly-btn').addEventListener('click', () => router.navigate('/rapports/semaine'));

  el.appendChild(screen);
  return el;
}
