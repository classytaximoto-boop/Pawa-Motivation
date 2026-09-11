/**
 * Sélecteurs de contexte pour l'IA.
 *
 * RÈGLE NON NÉGOCIABLE : secretNotes n'est JAMAIS lu ni référencé ici, sous
 * aucune forme (ni le texte, ni le titre, ni même le nombre de notes). Le
 * contenu Secret ne doit jamais être envoyé automatiquement à une API IA —
 * ce fichier est le seul point de passage des données vers l'IA, donc c'est
 * ici que cette garantie doit tenir, pas juste dans un commentaire ailleurs.
 *
 * Deuxième règle : minimisation. Chaque fonction IA ne reçoit que ce dont
 * elle a besoin, jamais un dump complet de l'état. Une fonction qui analyse
 * le journal ne voit pas les transactions financières, par exemple.
 */

import { store } from './store.js';
import { moodMap } from '../data/moods.js';
import { journalCategoryMap } from '../data/journalCategories.js';

/** Réduit une entrée émotionnelle à ce qui est utile à l'IA (pas d'id interne). */
function slimEmotion(e) {
  return {
    mood: moodMap[e.mood]?.label ?? e.mood,
    motivation: e.motivation,
    energy: e.energy,
    stress: e.stress,
    cause: e.cause || undefined,
    text: e.text || undefined,
    date: e.date,
  };
}

function slimJournalEntry(e) {
  return {
    category: journalCategoryMap[e.category]?.label ?? e.category,
    title: e.title || undefined,
    text: e.text,
    date: e.date,
  };
}

function slimGoal(g) {
  return {
    name: g.name,
    category: g.category,
    why: g.why || undefined,
    progress: g.progress,
    status: g.status,
    deadline: g.deadline || undefined,
    stepsTotal: g.steps.length,
    stepsDone: g.steps.filter((s) => s.done).length,
  };
}

function slimProject(p) {
  return {
    name: p.name,
    status: p.status,
    progress: p.progress,
    tasksTotal: p.tasks?.length ?? 0,
    tasksDone: p.tasks?.filter((t) => t.done).length ?? 0,
  };
}

function slimHabit(h) {
  return {
    name: h.name,
    frequency: h.frequency,
    streak: store.getHabitStreak(h),
    archived: !!h.archived,
  };
}

function slimProblem(p) {
  return {
    title: p.title,
    importance: p.importance,
    status: p.status,
    cause: p.cause || undefined,
  };
}

/**
 * 1. Analyse du journal — entrées récentes, texte inclus (c'est le sujet
 *    même de l'analyse), jamais Secret.
 */
export function contextForJournalAnalysis(days = 30) {
  const since = Date.now() - days * 86400000;
  const entries = store.listJournalEntries().filter((e) => new Date(e.date).getTime() >= since);
  return { entries: entries.map(slimJournalEntry) };
}

/**
 * 2. Analyse des tendances émotionnelles — stats déjà agrégées côté store
 *    (getEmotionStats fait déjà ce calcul, sans IA) + série récente brute
 *    pour que l'IA puisse commenter une tendance, pas juste une moyenne.
 */
export function contextForEmotionalTrends(days = 30) {
  const stats = store.getEmotionStats(days);
  const since = Date.now() - days * 86400000;
  const recent = store.state.emotions
    .filter((e) => new Date(e.date).getTime() >= since)
    .map(slimEmotion);
  return { stats, recentEntries: recent };
}

/** 3. Analyse des problèmes — liste des problèmes ouverts/en cours, pas les archivés/résolus anciens. */
export function contextForProblemsAnalysis() {
  const problems = store.listProblems().filter((p) => p.status === 'OPEN' || p.status === 'IN_PROGRESS');
  return { problems: problems.map(slimProblem) };
}

/** 4. Création d'actions quotidiennes — objectifs actifs + mission du jour + humeur courante. */
export function contextForDailyActions() {
  const state = store.get();
  return {
    activeGoals: state.goals.filter((g) => g.status === 'active').map(slimGoal),
    todayMissions: state.todayMissions.map((m) => ({ text: m.text, done: m.done })),
    currentMood: state.mood.current ? moodMap[state.mood.current.emoji]?.label : undefined,
  };
}

/** 5. Décomposition d'un objectif — un seul objectif ciblé, avec ses étapes existantes. */
export function contextForGoalBreakdown(goalId) {
  const goal = store.getGoal(goalId);
  if (!goal) return null;
  return {
    goal: {
      name: goal.name,
      description: goal.description || undefined,
      why: goal.why || undefined,
      category: goal.category,
      deadline: goal.deadline || undefined,
      existingSteps: goal.steps.map((s) => ({ text: s.text, done: s.done })),
    },
  };
}

/** 6. Résumé quotidien — snapshot du jour déjà calculé par le store. */
export function contextForDailySummary(dayKey) {
  return { snapshot: store.getDailySnapshot(dayKey ?? store.todayKey()) };
}

/** 7. Résumé hebdomadaire — snapshot de semaine déjà calculé par le store. */
export function contextForWeeklySummary() {
  return { snapshot: store.getWeeklySnapshot() };
}

/**
 * 7b. Rapport quotidien IA (enrichi) — victoire/difficulté déjà saisies par
 * l'utilisateur (si le rapport du jour existe) + snapshot chiffré + tendance
 * émotionnelle récente, pour que l'IA synthétise sans tout réinventer.
 */
export function contextForDailyAIReport(dayKey) {
  const key = dayKey ?? store.todayKey();
  const snapshot = store.getDailySnapshot(key);
  const existingReview = store.getDailyReviewByDay(key);
  const emotionTrend = store.getEmotionStats(3);
  const activeGoals = store.state.goals.filter((g) => g.status === 'active').slice(0, 5).map(slimGoal);
  return {
    day: key,
    snapshot,
    userVictory: existingReview?.victory || undefined,
    userProblem: existingReview?.problem || undefined,
    recentEmotionTrend: emotionTrend,
    activeGoals,
  };
}

/**
 * 7c. Rapport hebdomadaire IA (enrichi) — snapshot des 7 jours + victoires/
 * difficultés libres déjà saisies (si un rapport hebdo existe) + habitudes +
 * problèmes ouverts + dernier score de leadership, pour couvrir les domaines
 * demandés (objectifs, missions, projets, habitudes, humeur, stress, énergie,
 * motivation, problèmes, leadership) sans dupliquer les calculs.
 */
export function contextForWeeklyAIReport() {
  const snapshot = store.getWeeklySnapshot();
  const latestWeekly = store.listWeeklyReviews()[0];
  const habits = store.state.habits.filter((h) => !h.archived).map(slimHabit);
  const openProblems = store.listProblems().filter((p) => p.status === 'OPEN' || p.status === 'IN_PROGRESS').map(slimProblem);
  return {
    snapshot,
    userVictories: latestWeekly?.victories || undefined,
    userDifficulties: latestWeekly?.difficulties || undefined,
    habits,
    openProblems,
    latestLeadership: store.getLatestLeadershipScore(),
  };
}

/** 8. Motivation personnalisée — même logique de signal que Boost Me, pour rester cohérent. */
export function contextForPersonalizedMotivation() {
  const suggestion = store.getBoostSuggestion();
  const stats = store.getEmotionStats(3);
  return { suggestionType: suggestion.type, recentStats: stats };
}

/** 9. Coach conversationnel — vue d'ensemble large mais volontairement compacte (résumés, pas tout le détail). */
export function contextForCoach() {
  const state = store.get();
  return {
    user: { level: state.user.level, levelName: state.user.levelName, streak: state.user.streak },
    whyStatement: state.whyStatement,
    coachPreferences: state.coachSettings, // style souhaité, objectif, valeurs, raisons, phrase, difficulté — voir Profil
    activeGoals: state.goals.filter((g) => g.status === 'active').slice(0, 8).map(slimGoal),
    activeProjects: state.projects.filter((p) => p.status === 'active').slice(0, 5).map(slimProject),
    habits: state.habits.filter((h) => !h.archived).slice(0, 8).map(slimHabit),
    recentEmotionStats: store.getEmotionStats(7),
    recentJournal: store.listJournalEntries().slice(0, 5).map(slimJournalEntry),
    openProblems: store.listProblems().filter((p) => p.status === 'OPEN').slice(0, 5).map(slimProblem),
    // secretNotes volontairement absent — jamais transmis, même en partie.
  };
}

/** 10. Suggestions de progression — leadership + tendance globale, pour repérer où pousser ensuite. */
export function contextForProgressSuggestions() {
  return {
    latestLeadership: store.getLatestLeadershipScore(),
    leadershipTrend: store.getLeadershipTrend(),
    xpSummary: store.getXpSummary(),
    activeGoals: store.state.goals.filter((g) => g.status === 'active').map(slimGoal),
  };
}

/** Analyse d'expériences difficiles (trauma) — journal + émotions négatives récurrentes, cadré comme réflexion. */
export function contextForDifficultExperiencesAnalysis(days = 90) {
  const since = Date.now() - days * 86400000;
  const journal = store.listJournalEntries().filter((e) => new Date(e.date).getTime() >= since);
  const emotions = store.state.emotions.filter(
    (e) => new Date(e.date).getTime() >= since && ['low', 'bad'].includes(e.mood)
  );
  return {
    journalEntries: journal.map(slimJournalEntry),
    lowMoodEntries: emotions.map(slimEmotion),
  };
}
