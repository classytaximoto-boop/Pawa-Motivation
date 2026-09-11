import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';

function timeGreeting() {
  const h = new Date().getHours();
  if (h >= 22 || h < 5) return 'Bonne nuit';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

import { router } from '../utils/router.js';
import { quoteOfTheDay } from '../data/quotes.js';
import { pickMoodSummaryPhrase, noCheckinTodayPhrase } from '../data/moodSummaryPhrases.js';

/**
 * HOME DASHBOARD — reproduction du layout de référence (sidebar + hero +
 * 5 métriques + XP + Boost Me + Today's Focus + Recent Activity + Quick
 * Stats + Core Values + Development).
 *
 * SOURCE DE VÉRITÉ DES DONNÉES : uniquement les systèmes existants du
 * store (voir utils/store.js). Aucune donnée n'est inventée ici — quand
 * une métrique de la référence n'a pas d'équivalent direct dans le
 * store, elle est dérivée d'un calcul explicite documenté en commentaire
 * juste au-dessus, jamais codée en dur.
 *
 * Correspondance :
 *   Energy          -> dernière valeur `energy` d'un check-in émotionnel (0-10)
 *   Motivation      -> dernière valeur `motivation` d'un check-in émotionnel (0-10)
 *   Accomplishments -> store.listAccomplishments() (ce mois)
 *   Confidence      -> store.getAccomplishmentStats().avgConfidence (0-10 -> %)
 *   Self-Esteem     -> store.getAccomplishmentStats().avgSelfEsteem (0-10 -> %)
 *   XP / Level      -> store.getXpSummary()
 *   Boost Me        -> store.getBoostMeEvidence() (preuves réelles Confidence/Self-Esteem)
 *   Today's Focus   -> premier objectif actif (state.goals status === 'active')
 *   Recent Activity -> store.listXpHistory() (les 5 plus récents)
 *   Quick Stats     -> tâches/objectifs/compétences/streak réels, toutes les
 *                      4 tuiles avec un delta honnête "vs last month" :
 *                        - Tasks completed -> store.getTasksCompletedMonthDelta()
 *                          (agendaTasks.doneAt) ; la valeur affichée est le total
 *                          de tâches complétées CE MOIS (plus les missions du jour,
 *                          pour rester cohérente avec le delta qui la compare)
 *                        - Goals achieved  -> store.getGoalCompletionMonthDelta()
 *                          (goals.completedAt)
 *                        - New skills      -> store.getNewSkillsMonthDelta()
 *                          (skills.createdAt)
 *                        - Streak          -> store.getStreakMonthDelta()
 *                          (streakHistory, alimenté par checkInToday() depuis
 *                          cette fonctionnalité) ; lastMonth/delta valent `null`
 *                          tant qu'aucun point antérieur au mois courant n'existe
 *                          encore — la tuile affiche alors un état neutre plutôt
 *                          qu'un delta inventé
 *   Core Values     -> valeurs fixes de l'app (pas de système dédié dans le
 *                      store à ce stade — voir HANDOFF.md section G)
 *   Development     -> store.listSkills() + getConfidenceStats() + getSelfEsteemStats()
 *   Header avatar  -> photo réelle de l'utilisateur (public/profile/pawa-portrait.png),
 *                     fichier fourni par l'utilisateur, copié tel quel (aucun
 *                     pixel modifié), cadrage géré uniquement en CSS (object-fit/
 *                     object-position) — voir HANDOFF.md section I pour la règle
 *                     impérative (jamais de génération/édition d'image de visage réel)
 *   Hero portrait  -> même fichier, en fond du Hero avec overlay dégradé pour la
 *                     lisibilité du texte (voir .dash-hero__portrait dans dashboard.css)
 */

/**
 * Génère une mini-courbe SVG (sparkline) à partir d'une série [{date, value}].
 * Pas de librairie de charting : un simple <polyline> suffit pour ce format
 * compact, cohérent avec le reste du projet (pas de dépendance ajoutée).
 * Renvoie un message "pas encore de données" si la série est vide.
 *
 * Réintégrée ici car MoneyHome.js importe `sparkline` depuis Home.js —
 * dépendance croisée existante à conserver telle quelle (voir HANDOFF).
 */
export function sparkline(series, color, emptyLabel) {
  if (!series.length) {
    return `<p class="detail-desc" style="margin-top:var(--sp-1)">${emptyLabel}</p>`;
  }
  const width = 280;
  const height = 60;
  const padding = 4;
  const values = series.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // évite une division par zéro si tous les points sont égaux
  const stepX = series.length > 1 ? (width - padding * 2) / (series.length - 1) : 0;
  const points = series.map((p, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((p.value - min) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = series[series.length - 1];
  const first = series[0];
  return `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:${height}px; display:block; margin-top:var(--sp-2)" preserveAspectRatio="none">
      <polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <div class="goal-card__meta-row" style="margin-top:var(--sp-1)">
      <span class="chip" style="font-size:var(--fs-sm)">${fmtShortDate(first.date)}</span>
      <span class="chip" style="font-size:var(--fs-sm)">${fmtShortDate(last.date)} · ${last.value}</span>
    </div>`;
}

/** Formatte une date ISO (YYYY-MM-DD) en libellé court français (ex. "29 août"). */
function fmtShortDate(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function pct(value, max = 10) {
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

/**
 * Rendu partagé de la ligne "+N vs last month" d'une tuile Quick Stats.
 * `delta` === null signifie "pas encore assez d'historique pour comparer"
 * (voir store.getStreakMonthDelta()) -> aucune ligne inventée, on masque
 * simplement la ligne plutôt que d'afficher un delta faux.
 */
function deltaLine(delta) {
  if (delta == null) return '';
  const cls = delta > 0 ? ' quick-stat-tile__delta--up' : delta < 0 ? ' quick-stat-tile__delta--down' : '';
  const text = delta > 0 ? `+${delta}` : `${delta}`;
  return `<div class="quick-stat-tile__delta${cls}">${text} vs last month</div>`;
}

function energyStateLabel(value) {
  if (value == null) return 'Pas de donnée';
  if (value >= 7) return 'Good';
  if (value >= 4) return 'Moyen';
  return 'Low';
}

function motivationStateLabel(value) {
  if (value == null) return 'Pas de donnée';
  if (value >= 7) return 'High';
  if (value >= 4) return 'Moyenne';
  return 'Low';
}

function confidenceStateLabel(value) {
  if (value == null) return 'Pas de donnée';
  if (value >= 70) return 'Strong';
  if (value >= 40) return 'Growing';
  return 'Building';
}

function selfEsteemStateLabel(value) {
  if (value == null) return 'Pas de donnée';
  if (value >= 70) return 'Strong';
  if (value >= 40) return 'Growing';
  return 'Building';
}

function metricCard({ icon, color, gradientTo, name, valueLabel, pctValue, state, action }) {
  const fillBg = gradientTo ? `linear-gradient(90deg, ${color}, ${gradientTo})` : color;
  return `
    <button class="metric-card" data-metric="${action}">
      <span class="metric-card__icon" style="background:${color}">
        <span style="color:#fff; display:flex">${icon}</span>
      </span>
      <span class="metric-card__body">
        <span class="metric-card__top">
          <span class="metric-card__name" style="color:${color}">${name}</span>
          <span class="metric-card__value">${valueLabel}</span>
        </span>
        <span class="metric-card__track"><span class="metric-card__fill" style="width:${pctValue}%; background:${fillBg}"></span></span>
        <span class="metric-card__state">${state}</span>
      </span>
    </button>`;
}

const ACTIVITY_META = {
  mission: { label: 'Mission complétée', icon: icons.check, color: 'var(--dash-green)' },
  objectif: { label: 'Progression objectif', icon: icons.target, color: 'var(--dash-yellow)' },
  habitude: { label: 'Habitude tenue', icon: icons.flame, color: 'var(--dash-pink)' },
  projet: { label: 'Tâche de projet', icon: icons.folder, color: 'var(--dash-blue)' },
  journal: { label: 'Journal', icon: icons.notes, color: 'var(--dash-cyan)' },
  action: { label: 'Action', icon: icons.sparkles, color: 'var(--dash-purple)' },
  autre: { label: 'Activité', icon: icons.star, color: 'var(--dash-blue-light)' },
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}j`;
}

function activityRow(entry) {
  const meta = ACTIVITY_META[entry.source] || ACTIVITY_META.autre;
  const sign = entry.amount >= 0 ? '+' : '';
  return `
    <div class="activity-row">
      <span class="activity-row__icon" style="background:${meta.color}">
        <span style="color:#fff; display:flex">${meta.icon}</span>
      </span>
      <span class="activity-row__body">
        <div class="activity-row__title" style="color:${meta.color}">${meta.label}</div>
        <div class="activity-row__desc">${entry.label || ''}</div>
      </span>
      <span class="activity-row__right">
        <div class="activity-row__xp">${sign}${entry.amount} XP</div>
        <div class="activity-row__time">${timeAgo(entry.date)}</div>
      </span>
    </div>`;
}

// Valeurs fixes des "Core Values" affichées sur Home — l'app n'a pas
// encore de système dédié de valeurs personnalisables (voir HANDOFF.md,
// section G, pour la marche à suivre si ce système doit être créé).
const CORE_VALUES = [
  { label: 'Discipline', icon: icons.shield, color: 'var(--dash-blue)' },
  { label: 'Growth', icon: icons.graduationCap, color: 'var(--dash-green)' },
  { label: 'Freedom', icon: icons.compass, color: 'var(--dash-cyan)' },
  { label: 'Contribution', icon: icons.heart, color: 'var(--dash-pink)' },
];


function actionRow({ icon, color, type, id = '', title, description, xp, done = false }) {
  return `
    <button class="dash-action-row ${done ? 'is-done' : ''}" data-action-type="${type}" ${id ? `data-action-id="${id}"` : ''}>
      <span class="dash-action-icon" style="background:${color}">${icon}</span>
      <span class="dash-action-body">
        <span class="dash-action-title" style="color:${color}">${title}</span>
        <span class="dash-action-desc">${description}</span>
      </span>
      <span class="dash-action-xp">+${xp} XP</span>
      <span class="dash-action-chevron">${icons.chevronRight}</span>
    </button>`;
}

export function Home() {
  const state = store.get();
  const xp = store.getXpSummary();
  const accStats = store.getAccomplishmentStats();
  const confStats = store.getConfidenceStats();
  const esteemStats = store.getSelfEsteemStats();
  const boostEvidence = store.getBoostMeEvidence();
  const skills = store.listSkills();
  const xpHistory = store.listXpHistory();
  const activeGoals = state.goals.filter((g) => g.status === 'active');
  const focusGoal = activeGoals[0] || null;
  const goalDelta = store.getGoalCompletionMonthDelta();
  const tasksDelta = store.getTasksCompletedMonthDelta();
  const skillsDelta = store.getNewSkillsMonthDelta();
  const streakDelta = store.getStreakMonthDelta();

  // Accomplishments "ce mois" — calcul explicite, pas de champ dédié dans le store.
  const now = new Date();
  const accomplishmentsThisMonth = state.accomplishments.filter((a) => {
    const d = new Date(a.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const latestEmotion = state.emotions[0] || null;
  const energyVal = latestEmotion?.energy ?? null;
  const motivationVal = latestEmotion?.motivation ?? null;
  const todayMoodSummary = store.getTodayMoodSummary();
  const moodSummaryText = todayMoodSummary.count
    ? pickMoodSummaryPhrase(todayMoodSummary.dominantMood)
    : noCheckinTodayPhrase;

  const confidencePct = accStats.count ? pct(accStats.avgConfidence) : null;
  const selfEsteemPct = accStats.count ? pct(accStats.avgSelfEsteem) : null;

  const today = new Date();
  const dateLabel = today.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const el = document.createElement('div');
  el.className = 'dashboard';
  // Sidebar, overlay et bouton hamburger sont désormais montés une seule
  // fois au niveau global (voir main.js) et partagés par tous les écrans
  // — Home ne monte plus sa propre instance pour éviter un doublon.

  const main = document.createElement('main');
  main.className = 'dash-main';
  // Le bloc Home est volontairement construit autour de la hiérarchie de
  // la maquette fournie : hero/photo -> métriques -> XP -> actions -> développement.
  const firstMissions = state.todayMissions.slice(0, 2);
  const firstHabit = store.listHabits().find((h) => !h.archived);
  const actionItems = [
    state.dailyLesson ? {
      type: 'lesson', icon: icons.sparkles, color: 'var(--dash-purple)',
      title: 'Action', description: `Leçon : ${state.dailyLesson.title}`,
      xp: state.dailyLesson.xp ?? 15, done: !!state.dailyLessonRead,
    } : null,
    ...firstMissions.map((m) => ({
      type: 'mission', id: m.id, icon: icons.check, color: 'var(--dash-green)',
      title: 'Mission complétée', description: m.text, xp: m.xp, done: !!m.done,
    })),
    {
      type: 'checkin', icon: icons.sparkles, color: 'var(--dash-purple)',
      title: 'Action', description: 'Check-in émotionnel', xp: 5,
      done: state.user.lastCheckIn === new Date().toISOString().slice(0, 10),
    },
    firstHabit ? {
      type: 'habit', id: firstHabit.id, icon: icons.flame, color: 'var(--dash-pink)',
      title: 'Habitude tenue', description: firstHabit.name, xp: 8,
      done: store.isHabitDoneToday(firstHabit),
    } : null,
  ].filter(Boolean);

  const actionMarkup = actionItems.map(actionRow).join('');

  main.innerHTML = `
    <header class="dash-header">
      <div class="dash-header__left">
        <span class="dash-header__sun">${icons.sun}</span>
        <div>
          <h1 class="dash-header__title">${timeGreeting()}, ${state.user.name}</h1>
          <p class="dash-header__subtitle">Small steps. Big results.</p>
        </div>
      </div>
      <div class="dash-header__right">
        <span class="dash-header__date">${dateLabel}</span>
        <button class="dash-header__bell" id="dash-bell-btn" aria-label="Notifications">
          ${icons.inbox}
          ${activeGoals.length ? `<span class="dash-header__bell-badge">${activeGoals.length}</span>` : ''}
        </button>
        <span class="dash-header__avatar">
          <span class="dash-header__avatar-img">
            <img src="./profile/pawa-portrait.png" alt="${state.user.name}">
          </span>
          <span class="dash-header__avatar-status"></span>
        </span>
      </div>
    </header>

    <div class="dash-content">
      <section class="dash-hero dash-hero--reference" aria-label="Tableau de bord principal">
        <div class="dash-hero__photo">
          <img src="./profile/pawa-portrait.png" alt="${state.user.name}">
        </div>
        <div class="dash-hero__overlay"></div>

        <div class="dash-hero__content">
          <div class="dash-hero__quote">
            <p class="dash-hero__quote-text">"${state.whyStatement}"</p>
            <p class="dash-hero__quote-author">${state.user.name}</p>
          </div>

          <div class="dash-hero__metrics">
            ${metricCard({
              icon: icons.bolt, color: 'var(--dash-green)', gradientTo: 'var(--dash-cyan)', name: 'Energy',
              valueLabel: energyVal != null ? `${pct(energyVal)}%` : '—',
              pctValue: energyVal != null ? pct(energyVal) : 0,
              state: energyStateLabel(energyVal), action: 'energy',
            })}
            ${metricCard({
              icon: icons.flame, color: 'var(--dash-yellow)', gradientTo: 'var(--dash-pink)', name: 'Motivation',
              valueLabel: motivationVal != null ? `${pct(motivationVal)}%` : '—',
              pctValue: motivationVal != null ? pct(motivationVal) : 0,
              state: motivationStateLabel(motivationVal), action: 'motivation',
            })}
            ${metricCard({
              icon: icons.star, color: 'var(--dash-purple)', gradientTo: 'var(--dash-pink)', name: 'Accomplishments',
              valueLabel: `${accomplishmentsThisMonth}`,
              pctValue: Math.min(100, accomplishmentsThisMonth * 10),
              state: 'This month', action: 'accomplishments',
            })}
            ${metricCard({
              icon: icons.shieldCheck, color: 'var(--dash-blue)', gradientTo: 'var(--dash-cyan)', name: 'Confidence',
              valueLabel: confidencePct != null ? `${confidencePct}%` : '—',
              pctValue: confidencePct ?? 0,
              state: confidenceStateLabel(confidencePct), action: 'confidence',
            })}
            ${metricCard({
              icon: icons.heartFill, color: 'var(--dash-pink)', gradientTo: 'var(--dash-purple)', name: 'Self-Esteem',
              valueLabel: selfEsteemPct != null ? `${selfEsteemPct}%` : '—',
              pctValue: selfEsteemPct ?? 0,
              state: selfEsteemStateLabel(selfEsteemPct), action: 'self-esteem',
            })}
          </div>
        </div>

        <button class="dash-hero__xp" id="dash-xp-card" aria-label="Progression XP">
          <span class="dash-hero__xp-badge"><b>Lv ${xp.level}</b><span>${xp.levelName}</span></span>
          <span class="dash-hero__xp-body">
            <span class="dash-hero__xp-top">
              <span class="dash-hero__xp-label">Total XP</span>
              <span class="dash-hero__xp-value">${xp.xp.toLocaleString()} / ${xp.xpToNextLevel.toLocaleString()}</span>
            </span>
            <span class="dash-hero__xp-track"><span class="dash-hero__xp-fill" style="width:${xp.progressPct}%"></span></span>
            <span class="dash-hero__xp-next">Next level: ${xp.xpRemaining} XP</span>
          </span>
        </button>
      </section>

      <section class="dash-card dash-mood-summary" aria-label="Ta journée aujourd'hui">
        <div class="dash-card__head">
          <h2 class="dash-card__head-title">${icons.mind}Ta journée aujourd'hui</h2>
        </div>
        <p class="dash-mood-summary__text">${moodSummaryText}</p>
        ${!todayMoodSummary.count ? `
          <button type="button" class="btn-secondary dash-mood-summary__cta" id="dash-mood-checkin-btn">Faire un check-in</button>
        ` : ''}
      </section>

      <section class="dash-actions" aria-label="Actions du jour">
        <div class="dash-section-title">
          <h2>Action</h2>
        </div>
        <div class="dash-action-list">${actionMarkup}</div>
      </section>

      <section class="dash-card dash-development-reference" aria-label="Your Development">
        <div class="dash-card__head">
          <h2 class="dash-card__head-title">${icons.graduationCap}Your Development</h2>
        </div>
        <p class="dev-card__sub">Skills, evidence and progress. You're building a stronger you.</p>
        <div class="dev-grid dev-grid--reference">
          <button class="dev-tile" id="dev-skills-tile">
            <div class="dev-tile__top"><span class="dev-tile__icon" style="background:var(--dash-blue)"><span style="color:#fff;display:flex">${icons.graduationCap}</span></span>Skills</div>
            <div class="dev-tile__value">${skills.length}</div>
          </button>
          <button class="dev-tile" id="dev-evidence-tile">
            <div class="dev-tile__top"><span class="dev-tile__icon" style="background:var(--dash-cyan)"><span style="color:#fff;display:flex">${icons.notes}</span></span>Evidence</div>
            <div class="dev-tile__value">${confStats.total + esteemStats.total}</div>
          </button>
        </div>
      </section>

      <div class="dash-desktop-details">
        <section class="dash-card" aria-label="Recent Activity">
          <div class="dash-card__head">
            <h2 class="dash-card__head-title">${icons.barChart}Recent Activity</h2>
            <button class="dash-card__view-all" id="activity-view-all-btn">View all &gt;</button>
          </div>
          ${xpHistory.length ? xpHistory.slice(0, 5).map(activityRow).join('') : `<p class="dash-empty">Aucune activité pour l'instant.</p>`}
        </section>

        <section class="dash-card" aria-label="Quick Stats">
          <div class="dash-card__head">
            <h2 class="dash-card__head-title">${icons.sliders}Quick Stats</h2>
            <span class="dash-card__period">This month⌄</span>
          </div>
          <div class="quick-stats-grid">
            <div class="quick-stat-tile"><div class="quick-stat-tile__label"><span class="quick-stat-tile__icon" style="background:var(--dash-blue)"><span style="color:#fff;display:flex">${icons.checkCircle}</span></span>Tasks completed</div><div class="quick-stat-tile__value">${tasksDelta.thisMonth}</div>${deltaLine(tasksDelta.delta)}</div>
            <div class="quick-stat-tile"><div class="quick-stat-tile__label"><span class="quick-stat-tile__icon" style="background:var(--dash-green)"><span style="color:#fff;display:flex">${icons.target}</span></span>Goals achieved</div><div class="quick-stat-tile__value">${state.goals.filter((g) => g.status === 'completed').length}</div>${deltaLine(goalDelta.delta)}</div>
            <div class="quick-stat-tile"><div class="quick-stat-tile__label"><span class="quick-stat-tile__icon" style="background:var(--dash-purple)"><span style="color:#fff;display:flex">${icons.graduationCap}</span></span>New skills</div><div class="quick-stat-tile__value">${skills.length}</div>${deltaLine(skillsDelta.delta)}</div>
            <div class="quick-stat-tile"><div class="quick-stat-tile__label"><span class="quick-stat-tile__icon" style="background:var(--dash-pink)"><span style="color:#fff;display:flex">${icons.flame}</span></span>Streak</div><div class="quick-stat-tile__value">${state.user.streak}j</div>${deltaLine(streakDelta.delta)}</div>
          </div>
        </section>

        <section class="dash-card core-values-card" aria-label="Your Core Values">
          <div class="dash-card__head"><h2 class="dash-card__head-title">${icons.compass}Your Core Values</h2></div>
          <div class="core-values-grid">${CORE_VALUES.map((v) => `<div class="core-value-tile"><span class="core-value-tile__icon" style="background:${v.color}"><span style="color:#fff;display:flex">${v.icon}</span></span><span class="core-value-tile__label">${v.label}</span></div>`).join('')}</div>
        </section>
      </div>

      <section class="dash-card dash-right-extra" aria-label="Boost Me and Today's Focus">
        <div class="dash-right">
          <section class="boost-me-card">
            <h2 class="boost-me-card__title">${icons.bolt}Boost Me</h2>
            <p class="boost-me-card__lead">You don't need more motivation.<br/>You need to remember your evidence.</p>
            <div class="boost-me-card__proof-label">Recent proof of your progress:</div>
            ${boostEvidence && boostEvidence.proofs.length ? `<ul class="boost-me-card__proofs">${boostEvidence.proofs.map((p) => `<li><span class="boost-me-card__proof-icon">${icons.check}</span><span>${p}</span></li>`).join('')}</ul>` : `<p class="boost-me-card__empty">Complète une action pour commencer à construire tes preuves.</p>`}
            <button class="dash-btn-gradient" id="boost-show-more-btn">Show me more</button>
          </section>
          <section class="dash-card">
            <h2 class="today-focus-card__title">${icons.target}Today's Focus</h2>
            ${focusGoal ? `<button class="today-focus-card__task" id="focus-goal-btn"><span>${focusGoal.name}</span>${icons.chevronRight}</button><div class="today-focus-card__track"><span class="today-focus-card__fill" style="width:${focusGoal.progress}%"></span></div>` : `<p class="today-focus-card__empty">Aucun objectif actif — ajoute un objectif pour définir ton focus du jour.</p>`}
          </section>
        </div>
      </section>
    </div>
  `;

  el.appendChild(main);

  // ---------------- Interactions ----------------
  main.querySelectorAll('[data-metric]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.metric;
      if (target === 'accomplishments' || target === 'confidence' || target === 'self-esteem') {
        router.navigate('/developpement');
      } else if (target === 'energy' || target === 'motivation') {
        router.navigate('/mind');
      }
    });
  });

  main.querySelector('#dash-xp-card')?.addEventListener('click', () => router.navigate('/profile'));
  main.querySelector('#dash-mood-checkin-btn')?.addEventListener('click', () => router.navigate('/mind'));
  main.querySelector('#boost-show-more-btn')?.addEventListener('click', () => router.navigate('/developpement'));
  main.querySelector('#focus-goal-btn')?.addEventListener('click', () => {
    if (focusGoal) router.navigate(`/objectifs/${focusGoal.id}`);
  });
  main.querySelector('#activity-view-all-btn')?.addEventListener('click', () => router.navigate('/rapports'));
  main.querySelector('#dash-bell-btn')?.addEventListener('click', () => router.navigate('/rapports'));

  main.querySelectorAll('.dash-action-row').forEach((row) => {
    row.addEventListener('click', () => {
      const type = row.dataset.actionType;
      const id = row.dataset.actionId;
      if (type === 'lesson') store.markDailyLessonRead();
      if (type === 'mission' && id) store.toggleMission(id);
      if (type === 'checkin') store.checkInToday();
      if (type === 'habit' && id) store.toggleHabitToday(id);
      router._resolve();
    });
  });

  ['dev-skills-tile', 'dev-evidence-tile'].forEach((id) => {
    main.querySelector(`#${id}`)?.addEventListener('click', () => router.navigate('/developpement'));
  });

  return el;
}

// Conservé pour compatibilité future du hero (citation dynamique) — non
// utilisé activement dans ce rendu mais laissé disponible sans casser
// d'éventuels imports ailleurs dans l'app.
export { quoteOfTheDay };
