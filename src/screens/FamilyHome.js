import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AppHeader } from '../components/AppHeader.js';
import { priorityLevels } from '../data/goalCategories.js';

const priorityMap = Object.fromEntries(priorityLevels.map((p) => [p.id, p]));

// État local de filtre (mémoire vive de l'écran, pas persisté)
let activeTab = 'membres'; // membres | dates | projets

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysUntil(date) {
  return Math.ceil((date - new Date(new Date().toDateString())) / 86400000);
}

function memberCard(member) {
  const card = document.createElement('button');
  card.className = 'card goal-card';
  card.style.textAlign = 'left';
  card.innerHTML = `
    <div class="goal-card__top">
      <div>
        <div class="goal-card__title-row">
          <span class="goal-card__name">${member.name}</span>
        </div>
        <div class="goal-card__meta-row">
          ${member.relation ? `<span class="chip">${member.relation}</span>` : ''}
          ${member.birthday ? `<span class="chip">🎂 ${fmtDate(member.birthday)}</span>` : ''}
        </div>
      </div>
    </div>
  `;
  card.addEventListener('click', () => router.navigate(`/family/membres/${member.id}`));
  return card;
}

function upcomingDateRow(entry) {
  const row = document.createElement('div');
  row.className = 'card goal-card';
  const days = daysUntil(entry.date);
  const label = days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `Dans ${days}j`;
  row.innerHTML = `
    <div class="goal-card__top">
      <div>
        <div class="goal-card__title-row">
          <span class="goal-card__name">${entry.label} — ${entry.memberName}</span>
        </div>
        <div class="goal-card__meta-row">
          <span class="chip">${fmtDate(entry.date.toISOString())}</span>
        </div>
      </div>
      <span class="goal-card__deadline mono">${label}</span>
    </div>
  `;
  row.addEventListener('click', () => router.navigate(`/family/membres/${entry.memberId}`));
  return row;
}

function familyGoalCard(goal) {
  const pr = priorityMap[goal.priority] ?? priorityMap.moyenne;
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
          ${goal.deadline ? `<span class="chip">${fmtDate(goal.deadline)}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="goal-card__progress-row">
      <div class="progress-track"><div class="progress-fill" style="width:${goal.progress}%"></div></div>
      <span class="goal-card__progress-pct mono">${goal.progress}%</span>
    </div>
  `;
  card.addEventListener('click', () => router.navigate(`/family/projets/${goal.id}`));
  return card;
}

export function FamilyHome() {
  const members = store.listFamilyMembers();
  const upcoming = store.getUpcomingFamilyDates(60);
  const familyGoals = store.listFamilyGoals();

  const el = document.createElement('div');
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen';

  screen.innerHTML = `
    <div class="screen-title-row"><h1>Family</h1></div>

    <div class="tab-row mind-tab-row" role="tablist" id="section-tabs">
      <button class="tab-btn ${activeTab === 'membres' ? 'is-active' : ''}" data-tab="membres">Membres (${members.length})</button>
      <button class="tab-btn ${activeTab === 'dates' ? 'is-active' : ''}" data-tab="dates">Dates (${upcoming.length})</button>
      <button class="tab-btn ${activeTab === 'projets' ? 'is-active' : ''}" data-tab="projets">Projets (${familyGoals.length})</button>
    </div>

    <div class="goal-list" id="family-section"></div>
  `;

  const section = screen.querySelector('#family-section');

  if (activeTab === 'membres') {
    if (members.length === 0) {
      section.innerHTML = `
        <div class="state-block" style="padding-top: var(--sp-8)">
          ${icons.family.replace('<svg ', '<svg class="state-block__icon" ')}
          <h2 class="state-block__title">Aucun membre pour le moment</h2>
          <p class="state-block__desc">Ajoute les membres de ta famille et leurs dates importantes.</p>
        </div>`;
    } else {
      members.forEach((m) => section.appendChild(memberCard(m)));
    }
  } else if (activeTab === 'dates') {
    if (upcoming.length === 0) {
      section.innerHTML = `
        <div class="state-block" style="padding-top: var(--sp-8)">
          ${icons.family.replace('<svg ', '<svg class="state-block__icon" ')}
          <h2 class="state-block__title">Aucune date à venir</h2>
          <p class="state-block__desc">Ajoute un anniversaire ou une date importante à un membre.</p>
        </div>`;
    } else {
      upcoming.forEach((entry) => section.appendChild(upcomingDateRow(entry)));
    }
  } else if (activeTab === 'projets') {
    if (familyGoals.length === 0) {
      section.innerHTML = `
        <div class="state-block" style="padding-top: var(--sp-8)">
          ${icons.family.replace('<svg ', '<svg class="state-block__icon" ')}
          <h2 class="state-block__title">Aucun projet familial</h2>
          <p class="state-block__desc">Crée un projet et suis sa progression avec ta famille.</p>
        </div>`;
    } else {
      familyGoals.forEach((g) => section.appendChild(familyGoalCard(g)));
    }
  }

  screen.querySelectorAll('#section-tabs [data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      el.replaceWith(FamilyHome());
    });
  });

  el.appendChild(screen);

  const fab = document.createElement('div');
  fab.className = 'fab';
  fab.innerHTML = `<button class="fab-btn" aria-label="Ajouter">${icons.plus}</button>`;
  fab.querySelector('button').addEventListener('click', () => {
    if (activeTab === 'projets') router.navigate('/family/projets/nouveau');
    else router.navigate('/family/membres/nouveau');
  });
  el.appendChild(fab);

  return el;
}
