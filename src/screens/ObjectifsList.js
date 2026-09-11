import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AppHeader } from '../components/AppHeader.js';
import { goalCategories, goalCategoryMap, priorityLevels } from '../data/goalCategories.js';

const priorityMap = Object.fromEntries(priorityLevels.map((p) => [p.id, p]));

// État local de filtre (mémoire vive de l'écran, pas persistée)
let activeTab = 'active'; // active | completed | all
let activeCategory = 'toutes';

function daysUntil(deadline) {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  return diff;
}

function deadlineLabel(deadline) {
  if (!deadline) return '';
  const days = daysUntil(deadline);
  if (days === null) return '';
  if (days < 0) return `En retard de ${Math.abs(days)}j`;
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return `Dans ${days}j`;
}

function goalCard(goal) {
  const cat = goalCategoryMap[goal.category] ?? goalCategoryMap.autre;
  const pr = priorityMap[goal.priority] ?? priorityMap.moyenne;
  const days = daysUntil(goal.deadline);
  const overdue = goal.status === 'active' && days !== null && days < 0;

  const card = document.createElement('button');
  card.className = `card goal-card ${goal.status === 'completed' ? 'is-completed' : ''}`;
  card.innerHTML = `
    <div class="goal-card__top">
      <div>
        <div class="goal-card__title-row">
          <span class="priority-dot" style="background:var(${pr.color})"></span>
          <span class="goal-card__name">${goal.name}</span>
        </div>
        <div class="goal-card__meta-row">
          <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon]}${cat.label}</span>
        </div>
      </div>
      ${goal.deadline ? `<span class="goal-card__deadline ${overdue ? 'is-overdue' : ''}">${deadlineLabel(goal.deadline)}</span>` : ''}
    </div>
    <div class="goal-card__progress-row">
      <div class="progress-track"><div class="progress-fill" style="width:${goal.progress}%"></div></div>
      <span class="goal-card__progress-pct mono">${goal.progress}%</span>
    </div>
  `;
  card.addEventListener('click', () => router.navigate(`/objectifs/${goal.id}`));
  return card;
}

export function ObjectifsList() {
  const state = store.get();
  const el = document.createElement('div');
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen';

  const filtered = state.goals.filter((g) => {
    const tabOk = activeTab === 'all' ? true : g.status === activeTab;
    const catOk = activeCategory === 'toutes' ? true : g.category === activeCategory;
    return tabOk && catOk;
  });

  const activeCount = state.goals.filter((g) => g.status === 'active').length;
  const completedCount = state.goals.filter((g) => g.status === 'completed').length;

  screen.innerHTML = `
    <div class="screen-title-row"><h1>Objectifs</h1></div>

    <div class="tab-row" role="tablist">
      <button class="tab-btn ${activeTab === 'active' ? 'is-active' : ''}" data-tab="active">Actifs (${activeCount})</button>
      <button class="tab-btn ${activeTab === 'completed' ? 'is-active' : ''}" data-tab="completed">Terminés (${completedCount})</button>
      <button class="tab-btn ${activeTab === 'all' ? 'is-active' : ''}" data-tab="all">Historique</button>
    </div>

    <div class="category-scroll" id="cat-scroll">
      <button class="category-chip ${activeCategory === 'toutes' ? 'is-active' : ''}" data-cat="toutes">Toutes</button>
      ${goalCategories.map((c) => `
        <button class="category-chip ${activeCategory === c.id ? 'is-active' : ''}" data-cat="${c.id}">${icons[c.icon]}${c.label}</button>
      `).join('')}
    </div>

    <div class="goal-list" id="goal-list"></div>
  `;

  const list = screen.querySelector('#goal-list');
  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-8)">
        ${icons.target.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">${state.goals.length === 0 ? 'Aucun objectif pour le moment' : 'Rien ici pour l’instant'}</h2>
        <p class="state-block__desc">${state.goals.length === 0
          ? "Crée ton premier objectif et commence à suivre ta progression."
          : 'Essaie un autre filtre ou une autre catégorie.'}</p>
      </div>`;
  } else {
    filtered
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((g) => list.appendChild(goalCard(g)));
  }

  screen.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      el.replaceWith(ObjectifsList());
    });
  });

  screen.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      el.replaceWith(ObjectifsList());
    });
  });

  el.appendChild(screen);

  const fab = document.createElement('div');
  fab.className = 'fab';
  fab.innerHTML = `<button class="fab-btn" aria-label="Nouvel objectif">${icons.plus}</button>`;
  fab.querySelector('button').addEventListener('click', () => router.navigate('/objectifs/nouveau'));
  el.appendChild(fab);

  return el;
}
