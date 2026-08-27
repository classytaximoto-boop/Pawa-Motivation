import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AppHeader } from '../components/AppHeader.js';
import { goalCategories, goalCategoryMap, priorityLevels } from '../data/goalCategories.js';

const priorityMap = Object.fromEntries(priorityLevels.map((p) => [p.id, p]));

// État local de filtre (mémoire vive de l'écran, pas persistée)
let activeTab = 'active'; // active | paused | completed | all
let activeCategory = 'toutes';

function daysUntil(deadline) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline) - new Date()) / 86400000);
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

function projectCard(project) {
  const cat = goalCategoryMap[project.category] ?? goalCategoryMap.autre;
  const pr = priorityMap[project.priority] ?? priorityMap.moyenne;
  const days = daysUntil(project.deadline);
  const overdue = project.status === 'active' && days !== null && days < 0;

  const card = document.createElement('button');
  card.className = `card goal-card ${project.status === 'completed' ? 'is-completed' : ''}`;
  card.innerHTML = `
    <div class="goal-card__top">
      <div>
        <div class="goal-card__title-row">
          <span class="priority-dot" style="background:var(${pr.color})"></span>
          <span class="goal-card__name">${project.name}</span>
        </div>
        <div class="goal-card__meta-row">
          <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon]}${cat.label}</span>
          ${project.status === 'paused' ? '<span class="chip">En pause</span>' : ''}
        </div>
      </div>
      ${project.deadline ? `<span class="goal-card__deadline ${overdue ? 'is-overdue' : ''}">${deadlineLabel(project.deadline)}</span>` : ''}
    </div>
    <div class="goal-card__progress-row">
      <div class="progress-track"><div class="progress-fill" style="width:${project.progress}%"></div></div>
      <span class="goal-card__progress-pct mono">${project.progress}%</span>
    </div>
  `;
  card.addEventListener('click', () => router.navigate(`/projets/${project.id}`));
  return card;
}

export function ProjetsList() {
  const state = store.get();
  const el = document.createElement('div');
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen';

  const filtered = state.projects.filter((p) => {
    const tabOk = activeTab === 'all' ? true : p.status === activeTab;
    const catOk = activeCategory === 'toutes' ? true : p.category === activeCategory;
    return tabOk && catOk;
  });

  const activeCount = state.projects.filter((p) => p.status === 'active').length;
  const pausedCount = state.projects.filter((p) => p.status === 'paused').length;
  const completedCount = state.projects.filter((p) => p.status === 'completed').length;

  screen.innerHTML = `
    <div class="screen-title-row"><h1>Projets</h1></div>

    <div class="tab-row mind-tab-row" role="tablist">
      <button class="tab-btn ${activeTab === 'active' ? 'is-active' : ''}" data-tab="active">Actifs (${activeCount})</button>
      <button class="tab-btn ${activeTab === 'paused' ? 'is-active' : ''}" data-tab="paused">En pause (${pausedCount})</button>
      <button class="tab-btn ${activeTab === 'completed' ? 'is-active' : ''}" data-tab="completed">Terminés (${completedCount})</button>
      <button class="tab-btn ${activeTab === 'all' ? 'is-active' : ''}" data-tab="all">Historique</button>
    </div>

    <div class="category-scroll" id="cat-scroll">
      <button class="category-chip ${activeCategory === 'toutes' ? 'is-active' : ''}" data-cat="toutes">Toutes</button>
      ${goalCategories.map((c) => `
        <button class="category-chip ${activeCategory === c.id ? 'is-active' : ''}" data-cat="${c.id}">${icons[c.icon]}${c.label}</button>
      `).join('')}
    </div>

    <div class="goal-list" id="project-list"></div>
  `;

  const list = screen.querySelector('#project-list');
  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-8)">
        ${icons.folder.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">${state.projects.length === 0 ? 'Aucun projet pour le moment' : 'Rien ici pour l’instant'}</h2>
        <p class="state-block__desc">${state.projects.length === 0
          ? "Crée ton premier projet et suis sa progression."
          : 'Essaie un autre filtre ou une autre catégorie.'}</p>
      </div>`;
  } else {
    filtered
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((p) => list.appendChild(projectCard(p)));
  }

  screen.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      el.replaceWith(ProjetsList());
    });
  });

  screen.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      el.replaceWith(ProjetsList());
    });
  });

  el.appendChild(screen);

  const fab = document.createElement('div');
  fab.className = 'fab';
  fab.innerHTML = `<button class="fab-btn" aria-label="Nouveau projet">${icons.plus}</button>`;
  fab.querySelector('button').addEventListener('click', () => router.navigate('/projets/nouveau'));
  el.appendChild(fab);

  return el;
}
