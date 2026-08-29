/**
 * Store minimaliste offline-first pour BOOST.
 * Toutes les données persistent en localStorage — aucune dépendance réseau.
 * Architecture volontairement simple : un objet d'état + souscripteurs.
 * Remplaçable plus tard par IndexedDB sans changer l'API publique.
 */

const STORAGE_KEY = 'boost:v1:state';

let idCounter = 0;
/** Génère un id unique même pour des appels synchrones dans la même milliseconde. */
function uid(prefix) {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}_${Math.random().toString(36).slice(2, 6)}`;
}

const defaultState = {
  user: {
    name: 'Champion',
    level: 1,
    levelName: 'BEGINNER',
    xp: 0,
    xpToNextLevel: 100,
    streak: 0,
    lastCheckIn: null,
  },
  mood: {
    current: null, // { emoji, label, energy, stress, date }
  },
  todayMissions: [
    { id: 'm1', text: 'Écrire 3 objectifs de la semaine', done: false, xp: 15 },
    { id: 'm2', text: '10 minutes de lecture ou audio motivant', done: false, xp: 10 },
    { id: 'm3', text: 'Faire le point sur ton "Pourquoi"', done: false, xp: 10 },
  ],
  mainGoalToday: {
    title: 'Définis ton objectif principal du jour',
    progress: 0,
  },
  overallProgress: 0,
  nextAction: null,
  whyStatement: 'Je fais tout ça pour devenir la personne capable de tenir ses promesses envers elle-même.',
  goals: [],
  goalProgressHistory: [], // { id, goalId, progress, date } — un point par changement réel de progress, alimente la courbe de progression sur Home
  emotions: [], // EmotionEntry[] — voir _recomputeCurrentMood()
  problems: [], // Problem[]
  leadershipScores: [], // LeadershipScore[]
  xpHistory: [], // XPHistory[] — { id, amount, source, label, date }
  projects: [], // Project[] — chaque Project embarque ses ProjectTask[]
  transactions: [], // MoneyTransaction[] — chaque transaction a un accountId (voir accounts) ; absent = rattachée implicitement au compte par défaut, voir _ensureDefaultAccount()
  financialGoals: [], // FinancialGoal[] — chaque FinancialGoal embarque ses apports (contributions)
  accounts: [], // MoneyAccount[] — { id, name, icon, createdAt } — voir _ensureDefaultAccount() pour la création auto du compte "Principal"
  categoryBudgets: [], // MoneyCategoryBudget[] — { id, category, monthlyLimit } — un seul par catégorie de dépense, voir setCategoryBudget()
  familyMembers: [], // FamilyMember[] — proches + dates importantes embarquées
  familyGoals: [], // FamilyGoal[] — sur le modèle Goal/Project, chaque FamilyGoal embarque ses étapes
  journalEntries: [], // JournalEntry[]
  secretNotes: [], // SecretNote[]
  mediaItems: [], // MediaItem[]
  habits: [], // Habit[]
  dailyReviews: [], // DailyReview[] — un par date (upsert par jour)
  weeklyReviews: [], // WeeklyReview[] — snapshots calculés + victoires/difficultés en texte libre
  traits: [], // Trait[] — auto-évaluation forces / faiblesses, voir personalDev.js
  skills: [], // Skill[] — compétences suivies avec niveau, voir personalDev.js
  businessPlan: {
    // Sections texte libres, clé = id de businessPlanSections
    sections: {},
    updatedAt: null,
  },
  businessMilestones: [], // BusinessMilestone[] — jalons "à atteindre / en cours / atteint"
  notificationPrefs: {
    // { [typeId]: { enabled, time, sound, vibrate } } — voir notificationTypes.js pour la liste des types et heures par défaut.
    morning_boost: { enabled: true, time: '07:00', sound: true, vibrate: true },
    morning_mission: { enabled: true, time: '07:15', sound: true, vibrate: true },
    goal_reminder: { enabled: true, time: '12:00', sound: true, vibrate: true },
    habit_reminder: { enabled: true, time: '18:00', sound: true, vibrate: true },
    evening_review: { enabled: true, time: '21:00', sound: true, vibrate: true },
    motivation: { enabled: false, time: '15:00', sound: true, vibrate: true },
    deadline: { enabled: true, time: '09:00', sound: true, vibrate: true },
    daily_reminder_morning: { enabled: true, time: '08:00', sound: true, vibrate: true },
    daily_summary_midday: { enabled: true, time: '13:00', sound: true, vibrate: true },
    daily_summary_evening: { enabled: true, time: '20:30', sound: true, vibrate: true },
  },
  notificationLog: [], // { id, typeId, label, date } — historique de ce qui a été (ou aurait dû être) notifié
  aiEnabled: true, // interrupteur global — si false, aucun appel IA n'est tenté, tout part directement en fallback local
  coachSettings: {
    style: 'direct', // 'direct' | 'calme' | 'militaire' | 'professionnel' | 'ami' | 'minimal'
    mainGoal: '',
    values: '',
    personalReasons: '',
    motivationPhrase: '',
    difficulty: 'normal', // 'doux' | 'normal' | 'exigeant'
  },
  onboarding: {
    completed: false,
    identity: '', // "Qui veux-tu devenir ?"
    mainGoal: '',
    why: '',
    focusAreas: [], // domaines à améliorer, ex: ['discipline', 'sante', 'finances', ...]
    coachStyle: 'direct',
    morningBoostTime: '07:00',
  },
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    // merge superficiel pour tolérer l'ajout de nouveaux champs par version
    return { ...structuredClone(defaultState), ...parsed };
  } catch (e) {
    console.warn('[store] lecture impossible, reset état par défaut', e);
    return structuredClone(defaultState);
  }
}

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[store] sauvegarde impossible (quota ?)', e);
  }
}

class Store {
  constructor() {
    this.state = load();
    this.listeners = new Set();
  }

  get() {
    return this.state;
  }

  /** Met à jour une portion de l'état et notifie les abonnés. */
  set(patch) {
    this.state = typeof patch === 'function'
      ? { ...this.state, ...patch(this.state) }
      : { ...this.state, ...patch };
    persist(this.state);
    this.listeners.forEach((fn) => fn(this.state));
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  toggleMission(id) {
    const mission = this.state.todayMissions.find((m) => m.id === id);
    const missions = this.state.todayMissions.map((m) =>
      m.id === id ? { ...m, done: !m.done } : m
    );
    const willBeDone = !mission.done;
    const delta = willBeDone ? mission.xp : -mission.xp;
    this.set({ todayMissions: missions });
    this.addXp(delta, 'mission', mission.text);
  }

  addXp(amount, source = 'autre', label = '') {
    let { xp, xpToNextLevel, level, levelName } = this.state.user;
    xp = Math.max(0, xp + amount);
    const levels = ['BEGINNER', 'STARTER', 'DISCIPLINED', 'BUILDER', 'PERFORMER', 'LEADER', 'MASTER'];
    while (xp >= xpToNextLevel && level < levels.length) {
      xp -= xpToNextLevel;
      level += 1;
      xpToNextLevel = Math.round(xpToNextLevel * 1.35);
      levelName = levels[level - 1] ?? levelName;
    }
    this.set({ user: { ...this.state.user, xp, xpToNextLevel, level, levelName } });
    if (amount !== 0) {
      const entry = {
        id: uid('xp'),
        amount,
        source, // mission | objectif | habitude | journal | projet | action | autre
        label: label || '',
        date: new Date().toISOString(),
      };
      this.set({ xpHistory: [entry, ...this.state.xpHistory] });
    }
  }

  /** Historique XP trié du plus récent au plus ancien. */
  listXpHistory() {
    return this.state.xpHistory
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /** Total d'XP jamais gagné (positifs uniquement) — distinct de l'XP courant dans le niveau. */
  getTotalXpEarned() {
    return this.state.xpHistory
      .filter((e) => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  /** Résumé XP courant : total, niveau, xp restant avant le niveau suivant, progression %. */
  getXpSummary() {
    const { xp, xpToNextLevel, level, levelName } = this.state.user;
    return {
      totalEarned: this.getTotalXpEarned(),
      xp,
      xpToNextLevel,
      xpRemaining: Math.max(0, xpToNextLevel - xp),
      level,
      levelName,
      progressPct: xpToNextLevel > 0 ? Math.round((xp / xpToNextLevel) * 100) : 0,
    };
  }

  /**
   * Prépare les 3 séries temporelles affichées sous forme de courbes sur Home :
   * XP cumulé, humeur (énergie moyenne du jour), progression des objectifs actifs.
   * Regroupe par jour (dayKey) pour lisser plusieurs événements dans la même
   * journée en un seul point. `days` borne la fenêtre affichée.
   */
  getHomeChartsData(days = 14) {
    const since = Date.now() - days * 86400000;

    // XP cumulé par jour, à partir de l'historique déjà tenu par addXp().
    const xpByDay = {};
    this.state.xpHistory
      .filter((e) => new Date(e.date).getTime() >= since)
      .forEach((e) => {
        const key = e.date.slice(0, 10);
        xpByDay[key] = (xpByDay[key] ?? 0) + e.amount;
      });
    const xpDays = Object.keys(xpByDay).sort();
    let running = 0;
    const xpSeries = xpDays.map((day) => {
      running += xpByDay[day];
      return { date: day, value: running };
    });

    // Énergie moyenne par jour, à partir des check-ins émotionnels (0-10, voir createEmotionEntry).
    const energyByDay = {};
    this.state.emotions
      .filter((e) => new Date(e.date).getTime() >= since && e.energy != null)
      .forEach((e) => {
        const key = e.date.slice(0, 10);
        (energyByDay[key] ??= []).push(e.energy);
      });
    const moodSeries = Object.keys(energyByDay)
      .sort()
      .map((day) => ({
        date: day,
        value: Math.round((energyByDay[day].reduce((a, b) => a + b, 0) / energyByDay[day].length) * 10) / 10,
      }));

    // Progression moyenne des objectifs actifs par jour, à partir de goalProgressHistory.
    const activeGoalIds = new Set(this.state.goals.filter((g) => g.status === 'active').map((g) => g.id));
    const progressByDay = {};
    this.state.goalProgressHistory
      .filter((h) => new Date(h.date).getTime() >= since && activeGoalIds.has(h.goalId))
      .forEach((h) => {
        const key = h.date.slice(0, 10);
        (progressByDay[key] ??= []).push(h.progress);
      });
    const goalSeries = Object.keys(progressByDay)
      .sort()
      .map((day) => ({
        date: day,
        value: Math.round(progressByDay[day].reduce((a, b) => a + b, 0) / progressByDay[day].length),
      }));

    return { xpSeries, moodSeries, goalSeries };
  }

  // ============================================================
  // OBJECTIFS — CRUD
  // ============================================================

  /** Crée un nouvel objectif et retourne son id. */
  createGoal(fields) {
    const id = uid('g');
    const goal = {
      id,
      name: fields.name?.trim() || 'Objectif sans nom',
      description: fields.description?.trim() || '',
      why: fields.why?.trim() || '',
      category: fields.category || 'autre',
      startDate: fields.startDate || new Date().toISOString().slice(0, 10),
      deadline: fields.deadline || '',
      priority: fields.priority || 'moyenne',
      budget: fields.budget ? Number(fields.budget) : null,
      progress: 0,
      status: 'active', // active | completed
      steps: [], // { id, text, done }
      actions: [], // { id, text, done }
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    this.set({ goals: [goal, ...this.state.goals] });
    return id;
  }

  updateGoal(id, patch) {
    const before = this.getGoal(id);
    this.set({
      goals: this.state.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    });
    // Un point d'historique par changement réel de progress (pas à chaque
    // updateGoal — beaucoup de patches ne touchent pas progress, ex.
    // renommer l'objectif). Centralisé ici plutôt que dans chaque appelant
    // (addGoalStep, toggleGoalStep, deleteGoalStep, markGoalCompleted) pour
    // ne pas dupliquer cette logique à 4 endroits.
    if (before && 'progress' in patch && patch.progress !== before.progress) {
      this.set({
        goalProgressHistory: [
          { id: uid('gph'), goalId: id, progress: patch.progress, date: new Date().toISOString() },
          ...this.state.goalProgressHistory,
        ],
      });
    }
  }

  deleteGoal(id) {
    this.set({
      goals: this.state.goals.filter((g) => g.id !== id),
      goalProgressHistory: this.state.goalProgressHistory.filter((h) => h.goalId !== id),
    });
  }

  getGoal(id) {
    return this.state.goals.find((g) => g.id === id) ?? null;
  }

  /** Recalcule la progression d'un objectif à partir de ses étapes. */
  _recomputeGoalProgress(goal) {
    if (!goal.steps.length) return goal.progress;
    const done = goal.steps.filter((s) => s.done).length;
    return Math.round((done / goal.steps.length) * 100);
  }

  addGoalStep(goalId, text) {
    const goal = this.getGoal(goalId);
    if (!goal || !text?.trim()) return;
    const steps = [...goal.steps, { id: uid('s'), text: text.trim(), done: false }];
    const progress = this._recomputeGoalProgress({ ...goal, steps });
    this.updateGoal(goalId, { steps, progress });
  }

  toggleGoalStep(goalId, stepId) {
    const goal = this.getGoal(goalId);
    if (!goal) return;
    const steps = goal.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s));
    const progress = this._recomputeGoalProgress({ ...goal, steps });
    const wasCompleted = goal.status === 'completed';
    const isNowComplete = progress === 100;
    this.updateGoal(goalId, {
      steps,
      progress,
      status: isNowComplete ? 'completed' : 'active',
      completedAt: isNowComplete ? (goal.completedAt ?? new Date().toISOString()) : null,
    });
    // Symétrique : l'XP n'est crédité qu'au premier passage à 100% et retiré
    // si on repasse sous 100% (empêche de farmer en décochant/recochant la
    // dernière étape en boucle — même logique que toggleMission).
    if (isNowComplete && !wasCompleted) this.addXp(30, 'objectif', goal.name);
    else if (!isNowComplete && wasCompleted) this.addXp(-30, 'objectif', goal.name);
  }

  deleteGoalStep(goalId, stepId) {
    const goal = this.getGoal(goalId);
    if (!goal) return;
    const steps = goal.steps.filter((s) => s.id !== stepId);
    const progress = this._recomputeGoalProgress({ ...goal, steps });
    const wasCompleted = goal.status === 'completed';
    const isNowComplete = steps.length > 0 && progress === 100;
    this.updateGoal(goalId, {
      steps,
      progress,
      status: isNowComplete ? 'completed' : (wasCompleted ? 'active' : goal.status),
      completedAt: isNowComplete ? goal.completedAt : (wasCompleted ? null : goal.completedAt),
    });
    // Symétrique à toggleGoalStep : supprimer l'étape qui bouclait les 100%
    // repasse l'objectif à actif et retire le bonus de complétion.
    if (wasCompleted && !isNowComplete) this.addXp(-30, 'objectif', goal.name);
  }

  addGoalAction(goalId, text) {
    const goal = this.getGoal(goalId);
    if (!goal || !text?.trim()) return;
    const actions = [...goal.actions, { id: uid('a'), text: text.trim(), done: false }];
    this.updateGoal(goalId, { actions });
  }

  toggleGoalAction(goalId, actionId) {
    const goal = this.getGoal(goalId);
    if (!goal) return;
    const actions = goal.actions.map((a) => (a.id === actionId ? { ...a, done: !a.done } : a));
    this.updateGoal(goalId, { actions });
  }

  deleteGoalAction(goalId, actionId) {
    const goal = this.getGoal(goalId);
    if (!goal) return;
    this.updateGoal(goalId, { actions: goal.actions.filter((a) => a.id !== actionId) });
  }

  markGoalCompleted(goalId, completed) {
    const goal = this.getGoal(goalId);
    if (!goal) return;
    const wasCompleted = goal.status === 'completed';
    this.updateGoal(goalId, {
      status: completed ? 'completed' : 'active',
      progress: completed ? 100 : goal.progress,
      completedAt: completed ? new Date().toISOString() : null,
    });
    // Ne crédite/retire l'XP que sur un vrai changement d'état — appeler
    // markGoalCompleted(true) deux fois de suite, ou combiner ce bouton
    // avec toggleGoalStep, ne doit jamais permettre de gagner l'XP deux fois.
    if (completed && !wasCompleted) this.addXp(30, 'objectif', goal.name);
    else if (!completed && wasCompleted) this.addXp(-30, 'objectif', goal.name);
  }

  checkInToday() {
    const today = new Date().toDateString();
    if (this.state.user.lastCheckIn === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const streak = this.state.user.lastCheckIn === yesterday ? this.state.user.streak + 1 : 1;
    this.set({ user: { ...this.state.user, streak, lastCheckIn: today } });
  }

  // ============================================================
  // ÉMOTIONS — CRUD + STATS (aucune IA, aucun diagnostic)
  // ============================================================

  /**
   * Crée une entrée EmotionEntry.
   * fields: { mood, motivation, energy, stress, intensity, cause, text, audio }
   * mood: id parmi moods.js (great|good|neutral|low|bad)
   * motivation/energy/stress/intensity: nombres 0-10
   */
  createEmotionEntry(fields) {
    const id = uid('e');
    const now = new Date().toISOString();
    const entry = {
      id,
      mood: fields.mood || 'neutral',
      motivation: fields.motivation != null ? Number(fields.motivation) : null,
      energy: fields.energy != null ? Number(fields.energy) : null,
      stress: fields.stress != null ? Number(fields.stress) : null,
      intensity: fields.intensity != null ? Number(fields.intensity) : null,
      cause: fields.cause?.trim() || '',
      text: fields.text?.trim() || '',
      audio: fields.audio || null, // réservé : chemin/blob audio local, non implémenté ici
      date: fields.date || now,
      createdAt: now,
      updatedAt: now,
    };
    this.set({ emotions: [entry, ...this.state.emotions] });
    this._syncCurrentMoodFromLatest();
    this.addXp(5, 'action', 'Check-in émotionnel');
    return id;
  }

  updateEmotionEntry(id, patch) {
    this.set({
      emotions: this.state.emotions.map((e) =>
        e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e
      ),
    });
    this._syncCurrentMoodFromLatest();
  }

  deleteEmotionEntry(id) {
    const entry = this.state.emotions.find((e) => e.id === id);
    this.set({ emotions: this.state.emotions.filter((e) => e.id !== id) });
    this._syncCurrentMoodFromLatest();
    // Retire le bonus de check-in : sans ça, créer puis supprimer une entrée
    // en boucle permettrait de farmer l'XP sans aucune limite naturelle
    // (contrairement à une habitude, un check-in émotionnel n'est pas
    // plafonné à une fois par jour).
    if (entry) this.addXp(-5, 'action', 'Check-in émotionnel supprimé');
  }

  getEmotionEntry(id) {
    return this.state.emotions.find((e) => e.id === id) ?? null;
  }

  /** Trie les entrées les plus récentes en premier. */
  listEmotionEntries() {
    return this.state.emotions
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /** Met à jour la pastille "État émotionnel actuel" du Home à partir de la dernière entrée. */
  _syncCurrentMoodFromLatest() {
    const latest = this.listEmotionEntries()[0];
    this.set({
      mood: {
        current: latest
          ? { emoji: latest.mood, label: latest.mood, energy: latest.energy, stress: latest.stress, date: latest.date }
          : null,
      },
    });
  }

  /**
   * Statistiques simples (moyennes, fréquences, tendance) sur une fenêtre de `days` jours.
   * Ce ne sont que des calculs arithmétiques — jamais un diagnostic psychologique.
   */
  getEmotionStats(days = 7) {
    const since = Date.now() - days * 86400000;
    const entries = this.state.emotions.filter((e) => new Date(e.date).getTime() >= since);

    const avg = (key) => {
      const vals = entries.map((e) => e[key]).filter((v) => v != null && !Number.isNaN(v));
      if (!vals.length) return null;
      return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    };

    const moodFrequency = entries.reduce((acc, e) => {
      acc[e.mood] = (acc[e.mood] ?? 0) + 1;
      return acc;
    }, {});

    // Série journalière (moyenne du jour) pour tracer une évolution simple.
    const byDay = new Map();
    entries.forEach((e) => {
      const day = e.date.slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(e);
    });
    const dailySeries = Array.from(byDay.entries())
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([day, list]) => ({
        day,
        motivation: avgOf(list, 'motivation'),
        stress: avgOf(list, 'stress'),
        energy: avgOf(list, 'energy'),
      }));

    return {
      days,
      count: entries.length,
      avgMotivation: avg('motivation'),
      avgStress: avg('stress'),
      avgEnergy: avg('energy'),
      avgIntensity: avg('intensity'),
      moodFrequency,
      dailySeries,
    };
  }

  // ============================================================
  // PROBLÈMES — CRUD
  // ============================================================

  /**
   * Crée un Problem.
   * fields: { title, importance, cause, emotion, solution, action, result, status }
   * importance: 'haute' | 'moyenne' | 'basse'
   * emotion: id parmi moods.js (optionnel, lien libre — pas une EmotionEntry référencée)
   * status: OPEN | IN_PROGRESS | SOLVED | ARCHIVED
   */
  createProblem(fields) {
    const id = uid('p');
    const now = new Date().toISOString();
    const problem = {
      id,
      title: fields.title?.trim() || 'Problème sans titre',
      importance: fields.importance || 'moyenne',
      cause: fields.cause?.trim() || '',
      emotion: fields.emotion || '',
      solution: fields.solution?.trim() || '',
      action: fields.action?.trim() || '',
      result: fields.result?.trim() || '',
      status: fields.status || 'OPEN',
      createdAt: now,
      updatedAt: now,
      solvedAt: null,
    };
    this.set({ problems: [problem, ...this.state.problems] });
    return id;
  }

  updateProblem(id, patch) {
    const problem = this.getProblem(id);
    if (!problem) return;
    const wasSolved = problem.status === 'SOLVED';
    const nextStatus = patch.status ?? problem.status;
    const nowSolved = nextStatus === 'SOLVED';
    this.set({
      problems: this.state.problems.map((p) => (p.id === id ? {
        ...p,
        ...patch,
        updatedAt: new Date().toISOString(),
        solvedAt: nowSolved ? (p.solvedAt ?? new Date().toISOString()) : (nowSolved === false ? null : p.solvedAt),
      } : p)),
    });
    if (nowSolved && !wasSolved) this.addXp(20, 'action', `Problème résolu : ${problem.title}`);
    else if (!nowSolved && wasSolved) this.addXp(-20, 'action', `Problème rouvert : ${problem.title}`);
  }

  deleteProblem(id) {
    this.set({ problems: this.state.problems.filter((p) => p.id !== id) });
  }

  getProblem(id) {
    return this.state.problems.find((p) => p.id === id) ?? null;
  }

  listProblems() {
    return this.state.problems
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // ============================================================
  // TRAITS — auto-évaluation forces / faiblesses (développement personnel)
  // ============================================================

  /** fields: { domain, category ('force'|'faiblesse'), note } */
  addTrait(fields) {
    const id = uid('tr');
    const now = new Date().toISOString();
    const trait = {
      id,
      domain: fields.domain?.trim() || 'Sans titre',
      category: fields.category === 'faiblesse' ? 'faiblesse' : 'force',
      note: fields.note?.trim() || '',
      createdAt: now,
    };
    this.set({ traits: [trait, ...this.state.traits] });
    return id;
  }

  updateTrait(id, patch) {
    this.set({ traits: this.state.traits.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  }

  deleteTrait(id) {
    this.set({ traits: this.state.traits.filter((t) => t.id !== id) });
  }

  listTraits() {
    return this.state.traits.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // ============================================================
  // SKILLS — compétences suivies (technique, business, juridique, ...)
  // ============================================================

  /** fields: { name, category, level (1-5), note } */
  addSkill(fields) {
    const id = uid('sk');
    const now = new Date().toISOString();
    const skill = {
      id,
      name: fields.name?.trim() || 'Sans titre',
      category: fields.category || 'autre',
      level: Math.min(5, Math.max(1, Number(fields.level) || 1)),
      note: fields.note?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };
    this.set({ skills: [skill, ...this.state.skills] });
    return id;
  }

  updateSkill(id, patch) {
    this.set({
      skills: this.state.skills.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s)),
    });
  }

  deleteSkill(id) {
    this.set({ skills: this.state.skills.filter((s) => s.id !== id) });
  }

  listSkills() {
    return this.state.skills.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  // ============================================================
  // BUSINESS PLAN — sections texte + jalons trackés
  // ============================================================

  updateBusinessPlanSection(sectionId, text) {
    this.set({
      businessPlan: {
        ...this.state.businessPlan,
        sections: { ...this.state.businessPlan.sections, [sectionId]: text },
        updatedAt: new Date().toISOString(),
      },
    });
  }

  /** fields: { title, targetDate, status } — status: 'a_atteindre' | 'en_cours' | 'atteint' */
  addBusinessMilestone(fields) {
    const id = uid('bm');
    const now = new Date().toISOString();
    const milestone = {
      id,
      title: fields.title?.trim() || 'Sans titre',
      targetDate: fields.targetDate || '',
      status: fields.status || 'a_atteindre',
      createdAt: now,
      reachedAt: null,
    };
    this.set({ businessMilestones: [milestone, ...this.state.businessMilestones] });
    return id;
  }

  updateBusinessMilestone(id, patch) {
    const m = this.state.businessMilestones.find((x) => x.id === id);
    if (!m) return;
    const nowReached = (patch.status ?? m.status) === 'atteint';
    const wasReached = m.status === 'atteint';
    this.set({
      businessMilestones: this.state.businessMilestones.map((x) => (x.id === id ? {
        ...x,
        ...patch,
        reachedAt: nowReached ? (x.reachedAt ?? new Date().toISOString()) : (nowReached === false ? null : x.reachedAt),
      } : x)),
    });
    if (nowReached && !wasReached) this.addXp(25, 'action', `Jalon business atteint : ${m.title}`);
  }

  deleteBusinessMilestone(id) {
    this.set({ businessMilestones: this.state.businessMilestones.filter((x) => x.id !== id) });
  }

  listBusinessMilestones() {
    return this.state.businessMilestones.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // ============================================================
  // LEADERSHIP — évaluations périodiques (10 dimensions)
  // ============================================================

  /**
   * Crée une LeadershipScore : une évaluation datée des 10 dimensions.
   * fields.scores : { discipline, communication, decision, responsabilite, confiance,
   *                    gestionTemps, gestionConflits, vision, gestionEmotionnelle, leadershipEquipe }
   * chaque valeur : nombre 0-10
   */
  createLeadershipScore(fields) {
    const id = uid('ls');
    const now = new Date().toISOString();
    const entry = {
      id,
      date: fields.date || now,
      scores: { ...fields.scores },
      note: fields.note?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };
    this.set({ leadershipScores: [entry, ...this.state.leadershipScores] });
    this.addXp(15, 'action', 'Évaluation leadership');
    return id;
  }

  updateLeadershipScore(id, patch) {
    this.set({
      leadershipScores: this.state.leadershipScores.map((s) =>
        s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s
      ),
    });
  }

  deleteLeadershipScore(id) {
    const entry = this.state.leadershipScores.find((s) => s.id === id);
    this.set({ leadershipScores: this.state.leadershipScores.filter((s) => s.id !== id) });
    // Symétrique à createLeadershipScore : sans ce retrait, créer puis
    // supprimer une évaluation en boucle permettrait de farmer l'XP.
    if (entry) this.addXp(-15, 'action', 'Évaluation leadership supprimée');
  }

  getLeadershipScore(id) {
    return this.state.leadershipScores.find((s) => s.id === id) ?? null;
  }

  listLeadershipScores() {
    return this.state.leadershipScores
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /** Dernière évaluation, ou null si aucune n'existe encore. */
  getLatestLeadershipScore() {
    return this.listLeadershipScores()[0] ?? null;
  }

  /**
   * Évolution moyenne par dimension entre la première et la dernière évaluation
   * disponibles (delta simple, aucune extrapolation).
   */
  getLeadershipTrend() {
    const list = this.listLeadershipScores().slice().reverse(); // plus ancien -> plus récent
    if (list.length < 2) return null;
    const first = list[0].scores;
    const last = list[list.length - 1].scores;
    const dims = Object.keys(last);
    const delta = {};
    dims.forEach((dim) => {
      if (first[dim] != null && last[dim] != null) {
        delta[dim] = Math.round((last[dim] - first[dim]) * 10) / 10;
      }
    });
    return { from: list[0].date, to: list[list.length - 1].date, delta };
  }

  // ============================================================
  // PROJETS — CRUD (Project + ProjectTask embarquées)
  // ============================================================

  createProject(fields) {
    const id = uid('proj');
    const now = new Date().toISOString();
    const project = {
      id,
      name: fields.name?.trim() || 'Projet sans nom',
      description: fields.description?.trim() || '',
      category: fields.category || 'autre',
      deadline: fields.deadline || '',
      priority: fields.priority || 'moyenne',
      budget: fields.budget ? Number(fields.budget) : null,
      status: 'active', // active | paused | completed
      progress: 0,
      tasks: [], // ProjectTask[] : { id, text, done }
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    this.set({ projects: [project, ...this.state.projects] });
    return id;
  }

  updateProject(id, patch) {
    this.set({
      projects: this.state.projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)),
    });
  }

  deleteProject(id) {
    this.set({ projects: this.state.projects.filter((p) => p.id !== id) });
  }

  getProject(id) {
    return this.state.projects.find((p) => p.id === id) ?? null;
  }

  listProjects() {
    return this.state.projects
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  _recomputeProjectProgress(project) {
    if (!project.tasks.length) return project.progress;
    const done = project.tasks.filter((t) => t.done).length;
    return Math.round((done / project.tasks.length) * 100);
  }

  addProjectTask(projectId, text) {
    const project = this.getProject(projectId);
    if (!project || !text?.trim()) return;
    const tasks = [...project.tasks, { id: uid('pt'), text: text.trim(), done: false }];
    const progress = this._recomputeProjectProgress({ ...project, tasks });
    this.updateProject(projectId, { tasks, progress });
  }

  toggleProjectTask(projectId, taskId) {
    const project = this.getProject(projectId);
    if (!project) return;
    const tasks = project.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
    const progress = this._recomputeProjectProgress({ ...project, tasks });
    const wasCompleted = project.status === 'completed';
    const isNowComplete = progress === 100;
    this.updateProject(projectId, {
      tasks,
      progress,
      status: isNowComplete ? 'completed' : (project.status === 'completed' ? 'active' : project.status),
      completedAt: isNowComplete ? (project.completedAt ?? new Date().toISOString()) : null,
    });
    if (isNowComplete && !wasCompleted) this.addXp(30, 'projet', project.name);
    else if (!isNowComplete && wasCompleted) this.addXp(-30, 'projet', project.name);
  }

  deleteProjectTask(projectId, taskId) {
    const project = this.getProject(projectId);
    if (!project) return;
    const tasks = project.tasks.filter((t) => t.id !== taskId);
    const progress = this._recomputeProjectProgress({ ...project, tasks });
    const wasCompleted = project.status === 'completed';
    const isNowComplete = tasks.length > 0 && progress === 100;
    this.updateProject(projectId, {
      tasks,
      progress,
      status: isNowComplete ? 'completed' : (wasCompleted ? 'active' : project.status),
    });
    if (wasCompleted && !isNowComplete) this.addXp(-30, 'projet', project.name);
  }

  setProjectStatus(projectId, status) {
    const project = this.getProject(projectId);
    if (!project) return;
    const wasCompleted = project.status === 'completed';
    const isNowComplete = status === 'completed';
    this.updateProject(projectId, {
      status,
      completedAt: isNowComplete ? (project.completedAt ?? new Date().toISOString()) : null,
    });
    if (isNowComplete && !wasCompleted) this.addXp(30, 'projet', project.name);
    else if (!isNowComplete && wasCompleted) this.addXp(-30, 'projet', project.name);
  }

  // ============================================================
  // MONEY — MoneyAccount (comptes multiples, ex. Espèces / Compte courant / Épargne)
  // ============================================================
  //
  // Rétrocompatibilité : avant l'introduction des comptes, une transaction
  // n'avait pas de accountId. Plutôt que de migrer en masse (risqué, écrit
  // sur disque au premier chargement), on garantit paresseusement qu'un
  // compte "Principal" existe dès qu'on consulte/modifie les comptes ou une
  // transaction, et toute transaction sans accountId est traitée comme
  // appartenant à ce compte par défaut — sans jamais réécrire les anciennes
  // transactions existantes.

  DEFAULT_ACCOUNT_ID = 'acc_default';

  /** Garantit qu'au moins un compte existe ("Principal"), sans écraser des comptes déjà créés. */
  _ensureDefaultAccount() {
    if (this.state.accounts.length > 0) return;
    const now = new Date().toISOString();
    this.set({
      accounts: [{ id: this.DEFAULT_ACCOUNT_ID, name: 'Principal', icon: 'wallet', createdAt: now }],
    });
  }

  /** Id de compte effectif d'une transaction, même si accountId est absent (anciennes transactions). */
  _effectiveAccountId(transaction) {
    return transaction.accountId || this.DEFAULT_ACCOUNT_ID;
  }

  createAccount(fields) {
    this._ensureDefaultAccount();
    const id = uid('acc');
    const account = {
      id,
      name: fields.name?.trim() || 'Nouveau compte',
      icon: fields.icon || 'wallet',
      createdAt: new Date().toISOString(),
    };
    this.set({ accounts: [...this.state.accounts, account] });
    return id;
  }

  updateAccount(id, patch) {
    this.set({
      accounts: this.state.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  }

  /**
   * Supprime un compte. Refuse de supprimer le dernier compte restant (il en
   * faut toujours au moins un). Les transactions de ce compte sont
   * réassignées au compte par défaut plutôt que supprimées.
   */
  deleteAccount(id) {
    this._ensureDefaultAccount();
    if (this.state.accounts.length <= 1) {
      return { ok: false, error: 'Impossible de supprimer le dernier compte restant.' };
    }
    const fallbackId = id === this.DEFAULT_ACCOUNT_ID
      ? (this.state.accounts.find((a) => a.id !== id)?.id ?? this.DEFAULT_ACCOUNT_ID)
      : this.DEFAULT_ACCOUNT_ID;
    this.set({
      accounts: this.state.accounts.filter((a) => a.id !== id),
      transactions: this.state.transactions.map((t) => (
        this._effectiveAccountId(t) === id ? { ...t, accountId: fallbackId } : t
      )),
    });
    return { ok: true };
  }

  getAccount(id) {
    this._ensureDefaultAccount();
    return this.state.accounts.find((a) => a.id === id) ?? null;
  }

  listAccounts() {
    this._ensureDefaultAccount();
    return this.state.accounts.slice();
  }

  /** Solde d'un compte : somme de ses transactions (revenus - dépenses), toutes périodes confondues. */
  getAccountBalance(id) {
    return this.state.transactions
      .filter((t) => this._effectiveAccountId(t) === id)
      .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
  }

  // ============================================================
  // MONEY — MoneyTransaction (CRUD) + stats
  // ============================================================

  /**
   * Crée une MoneyTransaction.
   * fields: { type, amount, category, note, date, accountId }
   * type: 'income' | 'expense'
   * accountId: optionnel — si absent, retombe sur le compte par défaut.
   */
  createTransaction(fields) {
    this._ensureDefaultAccount();
    const id = uid('tx');
    const now = new Date().toISOString();
    const transaction = {
      id,
      type: fields.type === 'income' ? 'income' : 'expense',
      amount: Math.abs(Number(fields.amount) || 0),
      category: fields.category || 'autre',
      note: fields.note?.trim() || '',
      date: fields.date || now.slice(0, 10),
      accountId: fields.accountId || this.DEFAULT_ACCOUNT_ID,
      createdAt: now,
      updatedAt: now,
    };
    this.set({ transactions: [transaction, ...this.state.transactions] });
    if (transaction.type === 'expense') {
      this.addXp(2, 'action', 'Dépense enregistrée');
    }
    return id;
  }

  updateTransaction(id, patch) {
    const before = this.getTransaction(id);
    this.set({
      transactions: this.state.transactions.map((t) => (t.id === id ? {
        ...t,
        ...patch,
        amount: patch.amount != null ? Math.abs(Number(patch.amount) || 0) : t.amount,
        updatedAt: new Date().toISOString(),
      } : t)),
    });
    // Si le type passe de/vers "expense" au fil d'une modification, ajuste le
    // bonus symétriquement (même logique que createTransaction/deleteTransaction).
    if (before && patch.type && patch.type !== before.type) {
      if (patch.type === 'expense') this.addXp(2, 'action', 'Dépense enregistrée');
      else if (before.type === 'expense') this.addXp(-2, 'action', 'Transaction modifiée (plus une dépense)');
    }
  }

  deleteTransaction(id) {
    const transaction = this.state.transactions.find((t) => t.id === id);
    this.set({ transactions: this.state.transactions.filter((t) => t.id !== id) });
    // Symétrique à createTransaction : retire le bonus si c'était une dépense,
    // pour ne pas permettre de farmer en créant/supprimant en boucle.
    if (transaction?.type === 'expense') this.addXp(-2, 'action', 'Dépense supprimée');
  }

  getTransaction(id) {
    return this.state.transactions.find((t) => t.id === id) ?? null;
  }

  /** Transactions triées, optionnellement filtrées par compte (accountId). */
  listTransactions(accountId = null) {
    const all = accountId
      ? this.state.transactions.filter((t) => this._effectiveAccountId(t) === accountId)
      : this.state.transactions;
    return all
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Résumé financier simple sur une fenêtre de `days` jours (0 = toutes les données) :
   * total entrées, total sorties, solde net, répartition par catégorie.
   * `accountId` optionnel : restreint tout le calcul (y compris le solde) à un seul compte.
   */
  getMoneyStats(days = 30, accountId = null) {
    const scoped = accountId
      ? this.state.transactions.filter((t) => this._effectiveAccountId(t) === accountId)
      : this.state.transactions;
    const entries = days > 0
      ? scoped.filter((t) => new Date(t.date).getTime() >= Date.now() - days * 86400000)
      : scoped;

    const totalIncome = entries.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = entries.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const byCategory = entries
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {});

    // Solde toutes périodes confondues (pas seulement la fenêtre), du champ scoped.
    const balance = scoped.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);

    return {
      days,
      count: entries.length,
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      balance,
      byCategory,
    };
  }

  // ============================================================
  // MONEY — MoneyCategoryBudget (limite mensuelle par catégorie de dépense)
  // ============================================================

  /** Crée ou met à jour la limite mensuelle d'une catégorie (une seule entrée par catégorie). */
  setCategoryBudget(category, monthlyLimit) {
    const limit = Math.max(0, Number(monthlyLimit) || 0);
    const existing = this.state.categoryBudgets.find((b) => b.category === category);
    if (existing) {
      this.set({
        categoryBudgets: this.state.categoryBudgets.map((b) => (
          b.category === category ? { ...b, monthlyLimit: limit } : b
        )),
      });
      return existing.id;
    }
    const id = uid('bud');
    this.set({ categoryBudgets: [...this.state.categoryBudgets, { id, category, monthlyLimit: limit }] });
    return id;
  }

  deleteCategoryBudget(category) {
    this.set({ categoryBudgets: this.state.categoryBudgets.filter((b) => b.category !== category) });
  }

  listCategoryBudgets() {
    return this.state.categoryBudgets.slice();
  }

  /**
   * Progression de chaque budget défini sur le mois calendaire en cours :
   * dépensé, limite, % utilisé (plafonné à 999 pour l'affichage), dépassé ou non.
   */
  getBudgetProgress() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const spentByCategory = this.state.transactions
      .filter((t) => t.type === 'expense' && new Date(t.date).getTime() >= monthStart)
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {});
    return this.state.categoryBudgets
      .filter((b) => b.monthlyLimit > 0)
      .map((b) => {
        const spent = spentByCategory[b.category] ?? 0;
        const pct = Math.min(999, Math.round((spent / b.monthlyLimit) * 100));
        return {
          category: b.category,
          monthlyLimit: b.monthlyLimit,
          spent,
          pct,
          isOver: spent > b.monthlyLimit,
        };
      });
  }

  /**
   * Solde total cumulé par jour sur `days` jours, pour la sparkline de MoneyHome.
   * Même pattern que getHomeChartsData() : un point par jour où au moins une
   * transaction existe, valeur = solde cumulé de toutes les transactions
   * jusqu'à ce jour inclus (pas seulement celles de la fenêtre), pour que la
   * courbe reflète le vrai solde et non une variation isolée de la période.
   * `days` = 0 : couvre toute l'historique des transactions.
   */
  getBalanceHistory(days = 30) {
    const all = this.state.transactions.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    if (!all.length) return [];
    const since = days > 0 ? Date.now() - days * 86400000 : -Infinity;

    // Solde cumulé de départ = tout ce qui précède la fenêtre affichée.
    let running = 0;
    const byDay = {};
    all.forEach((t) => {
      const delta = t.type === 'income' ? t.amount : -t.amount;
      running += delta;
      const dayTime = new Date(t.date).getTime();
      if (dayTime >= since) {
        const key = t.date.slice(0, 10);
        byDay[key] = running;
      }
    });

    return Object.keys(byDay)
      .sort()
      .map((day) => ({ date: day, value: byDay[day] }));
  }

  // ============================================================
  // MONEY — FinancialGoal (CRUD, sur le modèle de Goal/GoalStep)
  // ============================================================

  /**
   * Crée un FinancialGoal.
   * fields: { name, description, category, targetAmount, deadline, priority }
   */
  createFinancialGoal(fields) {
    const id = uid('fg');
    const now = new Date().toISOString();
    const goal = {
      id,
      name: fields.name?.trim() || 'Objectif financier sans nom',
      description: fields.description?.trim() || '',
      category: fields.category || 'argent',
      targetAmount: Number(fields.targetAmount) || 0,
      deadline: fields.deadline || '',
      priority: fields.priority || 'moyenne',
      currentAmount: 0,
      progress: 0,
      status: 'active', // active | completed
      contributions: [], // { id, amount, note, date }
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    this.set({ financialGoals: [goal, ...this.state.financialGoals] });
    return id;
  }

  updateFinancialGoal(id, patch) {
    this.set({
      financialGoals: this.state.financialGoals.map((g) => (g.id === id ? { ...g, ...patch, updatedAt: new Date().toISOString() } : g)),
    });
  }

  deleteFinancialGoal(id) {
    this.set({ financialGoals: this.state.financialGoals.filter((g) => g.id !== id) });
  }

  getFinancialGoal(id) {
    return this.state.financialGoals.find((g) => g.id === id) ?? null;
  }

  listFinancialGoals() {
    return this.state.financialGoals
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  _recomputeFinancialGoalProgress(goal) {
    if (!goal.targetAmount) return goal.progress;
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  }

  addFinancialGoalContribution(goalId, amount, note = '') {
    const goal = this.getFinancialGoal(goalId);
    const value = Number(amount);
    if (!goal || !value) return;
    const contribution = { id: uid('fc'), amount: value, note: note?.trim() || '', date: new Date().toISOString() };
    const contributions = [contribution, ...goal.contributions];
    const currentAmount = Math.max(0, goal.currentAmount + value);
    const progress = this._recomputeFinancialGoalProgress({ ...goal, currentAmount });
    const wasCompleted = goal.status === 'completed';
    const isNowComplete = progress === 100;
    this.updateFinancialGoal(goalId, {
      contributions,
      currentAmount,
      progress,
      status: isNowComplete ? 'completed' : 'active',
      completedAt: isNowComplete ? (goal.completedAt ?? new Date().toISOString()) : null,
    });
    if (isNowComplete && !wasCompleted) this.addXp(30, 'action', `Objectif financier atteint : ${goal.name}`);
  }

  deleteFinancialGoalContribution(goalId, contributionId) {
    const goal = this.getFinancialGoal(goalId);
    if (!goal) return;
    const removed = goal.contributions.find((c) => c.id === contributionId);
    if (!removed) return;
    const contributions = goal.contributions.filter((c) => c.id !== contributionId);
    const currentAmount = Math.max(0, goal.currentAmount - removed.amount);
    const progress = this._recomputeFinancialGoalProgress({ ...goal, currentAmount });
    const wasCompleted = goal.status === 'completed';
    const isNowComplete = progress === 100;
    this.updateFinancialGoal(goalId, {
      contributions,
      currentAmount,
      progress,
      status: isNowComplete ? 'completed' : 'active',
      completedAt: isNowComplete ? (goal.completedAt ?? new Date().toISOString()) : null,
    });
    // Symétrique à addFinancialGoalContribution : si la suppression de cette
    // contribution fait repasser l'objectif sous 100%, le bonus est retiré.
    if (!isNowComplete && wasCompleted) this.addXp(-30, 'action', `Objectif financier rouvert : ${goal.name}`);
  }

  // ============================================================
  // FAMILY — FamilyMember (CRUD, dates importantes embarquées)
  // ============================================================

  /**
   * Crée un FamilyMember.
   * fields: { name, relation, birthday, notes }
   * relation: libre (conjoint, enfant, parent, frère/sœur, autre...)
   */
  createFamilyMember(fields) {
    const id = uid('fm');
    const now = new Date().toISOString();
    const member = {
      id,
      name: fields.name?.trim() || 'Membre sans nom',
      relation: fields.relation?.trim() || '',
      birthday: fields.birthday || '', // YYYY-MM-DD, année optionnelle côté UI
      notes: fields.notes?.trim() || '',
      importantDates: [], // { id, label, date } — anniversaires de mariage, fêtes, etc.
      createdAt: now,
      updatedAt: now,
    };
    this.set({ familyMembers: [member, ...this.state.familyMembers] });
    return id;
  }

  updateFamilyMember(id, patch) {
    this.set({
      familyMembers: this.state.familyMembers.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m)),
    });
  }

  deleteFamilyMember(id) {
    this.set({ familyMembers: this.state.familyMembers.filter((m) => m.id !== id) });
  }

  getFamilyMember(id) {
    return this.state.familyMembers.find((m) => m.id === id) ?? null;
  }

  listFamilyMembers() {
    return this.state.familyMembers
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  addFamilyMemberDate(memberId, label, date) {
    const member = this.getFamilyMember(memberId);
    if (!member || !label?.trim() || !date) return;
    const importantDates = [...member.importantDates, { id: uid('fd'), label: label.trim(), date }];
    this.updateFamilyMember(memberId, { importantDates });
  }

  deleteFamilyMemberDate(memberId, dateId) {
    const member = this.getFamilyMember(memberId);
    if (!member) return;
    this.updateFamilyMember(memberId, { importantDates: member.importantDates.filter((d) => d.id !== dateId) });
  }

  /**
   * Prochaines dates importantes tous membres confondus (anniversaires + dates ajoutées),
   * triées par proximité dans l'année en cours, sur une fenêtre de `days` jours.
   */
  getUpcomingFamilyDates(days = 30) {
    const today = new Date();
    const results = [];

    const nextOccurrence = (isoDate) => {
      if (!isoDate) return null;
      const d = new Date(isoDate);
      const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      if (next < new Date(today.toDateString())) next.setFullYear(next.getFullYear() + 1);
      return next;
    };

    this.state.familyMembers.forEach((m) => {
      if (m.birthday) {
        const next = nextOccurrence(m.birthday);
        results.push({ memberId: m.id, memberName: m.name, label: 'Anniversaire', date: next, sourceDate: m.birthday });
      }
      m.importantDates.forEach((d) => {
        const next = nextOccurrence(d.date);
        results.push({ memberId: m.id, memberName: m.name, label: d.label, date: next, sourceDate: d.date });
      });
    });

    const withinWindow = results.filter((r) => r.date && (r.date - today) / 86400000 <= days);
    return withinWindow.sort((a, b) => a.date - b.date);
  }

  // ============================================================
  // FAMILY — FamilyGoal (CRUD, sur le modèle exact de Project/ProjectTask)
  // ============================================================

  createFamilyGoal(fields) {
    const id = uid('famg');
    const now = new Date().toISOString();
    const goal = {
      id,
      name: fields.name?.trim() || 'Projet familial sans nom',
      description: fields.description?.trim() || '',
      deadline: fields.deadline || '',
      priority: fields.priority || 'moyenne',
      budget: fields.budget ? Number(fields.budget) : null,
      status: 'active', // active | completed
      progress: 0,
      steps: [], // { id, text, done }
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    this.set({ familyGoals: [goal, ...this.state.familyGoals] });
    return id;
  }

  updateFamilyGoal(id, patch) {
    this.set({
      familyGoals: this.state.familyGoals.map((g) => (g.id === id ? { ...g, ...patch, updatedAt: new Date().toISOString() } : g)),
    });
  }

  deleteFamilyGoal(id) {
    this.set({ familyGoals: this.state.familyGoals.filter((g) => g.id !== id) });
  }

  getFamilyGoal(id) {
    return this.state.familyGoals.find((g) => g.id === id) ?? null;
  }

  listFamilyGoals() {
    return this.state.familyGoals
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  _recomputeFamilyGoalProgress(goal) {
    if (!goal.steps.length) return goal.progress;
    const done = goal.steps.filter((s) => s.done).length;
    return Math.round((done / goal.steps.length) * 100);
  }

  addFamilyGoalStep(goalId, text) {
    const goal = this.getFamilyGoal(goalId);
    if (!goal || !text?.trim()) return;
    const steps = [...goal.steps, { id: uid('fgs'), text: text.trim(), done: false }];
    const progress = this._recomputeFamilyGoalProgress({ ...goal, steps });
    this.updateFamilyGoal(goalId, { steps, progress });
  }

  toggleFamilyGoalStep(goalId, stepId) {
    const goal = this.getFamilyGoal(goalId);
    if (!goal) return;
    const steps = goal.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s));
    const progress = this._recomputeFamilyGoalProgress({ ...goal, steps });
    const wasCompleted = goal.status === 'completed';
    const isNowComplete = progress === 100;
    this.updateFamilyGoal(goalId, {
      steps,
      progress,
      status: isNowComplete ? 'completed' : 'active',
      completedAt: isNowComplete ? (goal.completedAt ?? new Date().toISOString()) : null,
    });
    if (isNowComplete && !wasCompleted) this.addXp(30, 'action', `Projet familial atteint : ${goal.name}`);
    else if (!isNowComplete && wasCompleted) this.addXp(-30, 'action', `Projet familial rouvert : ${goal.name}`);
  }

  deleteFamilyGoalStep(goalId, stepId) {
    const goal = this.getFamilyGoal(goalId);
    if (!goal) return;
    const steps = goal.steps.filter((s) => s.id !== stepId);
    const progress = this._recomputeFamilyGoalProgress({ ...goal, steps });
    const wasCompleted = goal.status === 'completed';
    const isNowComplete = steps.length > 0 && progress === 100;
    this.updateFamilyGoal(goalId, {
      steps,
      progress,
      status: isNowComplete ? 'completed' : (wasCompleted ? 'active' : goal.status),
      completedAt: isNowComplete ? goal.completedAt : (wasCompleted ? null : goal.completedAt),
    });
    if (wasCompleted && !isNowComplete) this.addXp(-30, 'action', `Projet familial rouvert : ${goal.name}`);
  }

  // ============================================================
  // JOURNAL — JournalEntry (CRUD)
  // ============================================================

  /**
   * Crée une JournalEntry.
   * fields: { title, text, category, date }
   * category: libre par défaut, classement thématique simple (libre | victoire | apprentissage | idee | gratitude | autre)
   */
  createJournalEntry(fields) {
    const id = uid('j');
    const now = new Date().toISOString();
    const entry = {
      id,
      title: fields.title?.trim() || '',
      text: fields.text?.trim() || '',
      category: fields.category || 'libre',
      media: fields.media || null, // réservé : référence photo/audio/vidéo locale, non implémenté ici
      date: fields.date || now,
      createdAt: now,
      updatedAt: now,
    };
    this.set({ journalEntries: [entry, ...this.state.journalEntries] });
    this.addXp(10, 'journal', entry.title || 'Entrée de journal');
    return id;
  }

  updateJournalEntry(id, patch) {
    this.set({
      journalEntries: this.state.journalEntries.map((e) =>
        e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e
      ),
    });
  }

  deleteJournalEntry(id) {
    const entry = this.state.journalEntries.find((e) => e.id === id);
    this.set({ journalEntries: this.state.journalEntries.filter((e) => e.id !== id) });
    // Symétrique à createJournalEntry : évite de farmer en créant/supprimant en boucle.
    if (entry) this.addXp(-10, 'journal', entry.title || 'Entrée de journal supprimée');
  }

  getJournalEntry(id) {
    return this.state.journalEntries.find((e) => e.id === id) ?? null;
  }

  listJournalEntries() {
    return this.state.journalEntries
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // ============================================================
  // SECRET — SecretNote (CRUD)
  // ============================================================

  /**
   * Crée une SecretNote.
   * fields: { title, text } — title/text sont ici déjà des payloads chiffrés
   * ({ iv, cipher }, voir secretStorage.js), jamais du texte en clair. Le
   * store ne fait aucun chiffrement lui-même : il stocke tel quel ce qu'on
   * lui donne, exactement comme pour toute autre donnée. C'est à l'écran
   * (SecretForm) d'appeler encryptText() avant de créer/modifier une note.
   * Pas de catégorie, pas d'XP associé : espace confidentiel, pas gamifié.
   */
  createSecretNote(fields) {
    const id = uid('sn');
    const now = new Date().toISOString();
    const note = {
      id,
      title: fields.title ?? null,
      text: fields.text ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.set({ secretNotes: [note, ...this.state.secretNotes] });
    return id;
  }

  updateSecretNote(id, patch) {
    this.set({
      secretNotes: this.state.secretNotes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
      ),
    });
  }

  deleteSecretNote(id) {
    this.set({ secretNotes: this.state.secretNotes.filter((n) => n.id !== id) });
  }

  getSecretNote(id) {
    return this.state.secretNotes.find((n) => n.id === id) ?? null;
  }

  listSecretNotes() {
    return this.state.secretNotes
      .slice()
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  // ============================================================
  // MEDIA — MediaItem (CRUD)
  // ============================================================

  /**
   * Crée un MediaItem.
   * fields: { title, category, playlist, url, notes, consumed, favorite, mediaFileId }
   * category: video | audio | article | livre | autre (voir mediaCategories.js) — détermine le lecteur.
   * playlist: morning_motivation | focus | ... (voir mediaPlaylists.js) — le contexte d'usage, optionnel.
   * url: lien externe optionnel.
   * mediaFileId: référence vers un fichier local stocké dans IndexedDB (voir mediaStorage.js), optionnel.
   * Un MediaItem a soit une url, soit un mediaFileId, soit ni l'un ni l'autre (ex. livre/article sans lien).
   */
  createMediaItem(fields) {
    const id = uid('md');
    const now = new Date().toISOString();
    const item = {
      id,
      title: fields.title?.trim() || '',
      category: fields.category || 'autre',
      playlist: fields.playlist || '',
      url: fields.url?.trim() || '',
      mediaFileId: fields.mediaFileId || null,
      notes: fields.notes?.trim() || '',
      consumed: !!fields.consumed,
      favorite: !!fields.favorite,
      createdAt: now,
      updatedAt: now,
    };
    this.set({ mediaItems: [item, ...this.state.mediaItems] });
    this.addXp(5, 'media', item.title || 'Média ajouté');
    return id;
  }

  updateMediaItem(id, patch) {
    this.set({
      mediaItems: this.state.mediaItems.map((m) =>
        m.id === id ? { ...m, ...patch, updatedAt: new Date().toISOString() } : m
      ),
    });
  }

  deleteMediaItem(id) {
    const item = this.state.mediaItems.find((m) => m.id === id);
    this.set({ mediaItems: this.state.mediaItems.filter((m) => m.id !== id) });
    // Symétrique à createMediaItem : évite de farmer en créant/supprimant en boucle.
    if (item) this.addXp(-5, 'media', `Média supprimé : ${item.title || 'média'}`);
  }

  getMediaItem(id) {
    return this.state.mediaItems.find((m) => m.id === id) ?? null;
  }

  listMediaItems() {
    return this.state.mediaItems
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /** Marque un MediaItem comme consommé/vu, avec petit bonus XP à la première bascule. */
  toggleMediaConsumed(id) {
    const item = this.getMediaItem(id);
    if (!item) return;
    const consumed = !item.consumed;
    this.updateMediaItem(id, { consumed });
    if (consumed) this.addXp(5, 'media', `Terminé : ${item.title || 'média'}`);
    else this.addXp(-5, 'media', `Marqué non-terminé : ${item.title || 'média'}`);
  }

  /** Bascule le statut favori d'un MediaItem (pas d'XP associé — juste du tri). */
  toggleMediaFavorite(id) {
    const item = this.getMediaItem(id);
    if (!item) return;
    this.updateMediaItem(id, { favorite: !item.favorite });
  }

  /** Médias favoris, plus récents en premier. */
  listFavoriteMedia() {
    return this.listMediaItems().filter((m) => m.favorite);
  }

  /** Médias d'une playlist donnée (voir mediaPlaylists.js), plus récents en premier. */
  listMediaByPlaylist(playlistId) {
    return this.listMediaItems().filter((m) => m.playlist === playlistId);
  }

  // ============================================================
  // HABIT — Habit (CRUD + suivi quotidien)
  // ============================================================

  /**
   * Crée une Habit.
   * fields: { name, icon, frequency }
   * frequency: quotidien | hebdo (informatif seulement ; le suivi reste jour par jour)
   */
  createHabit(fields) {
    const id = uid('h');
    const now = new Date().toISOString();
    const habit = {
      id,
      name: fields.name?.trim() || 'Habitude sans nom',
      icon: fields.icon || 'flame',
      frequency: fields.frequency || 'quotidien',
      completions: [], // dates (toDateString) où l'habitude a été faite
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    this.set({ habits: [habit, ...this.state.habits] });
    return id;
  }

  updateHabit(id, patch) {
    this.set({
      habits: this.state.habits.map((h) =>
        h.id === id ? { ...h, ...patch, updatedAt: new Date().toISOString() } : h
      ),
    });
  }

  deleteHabit(id) {
    this.set({ habits: this.state.habits.filter((h) => h.id !== id) });
  }

  getHabit(id) {
    return this.state.habits.find((h) => h.id === id) ?? null;
  }

  listHabits() {
    return this.state.habits
      .slice()
      .filter((h) => !h.archived)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  archiveHabit(id, archived = true) {
    this.updateHabit(id, { archived });
  }

  /** true si l'habitude a été cochée aujourd'hui. */
  isHabitDoneToday(habit) {
    const today = new Date().toDateString();
    return habit.completions.includes(today);
  }

  /** Bascule le check du jour pour une habitude et recalcule sa série (streak). */
  toggleHabitToday(id) {
    const habit = this.getHabit(id);
    if (!habit) return;
    const today = new Date().toDateString();
    const doneToday = habit.completions.includes(today);
    const completions = doneToday
      ? habit.completions.filter((d) => d !== today)
      : [...habit.completions, today];
    this.updateHabit(id, { completions });
    // Symétrique comme toggleMission : décocher retire l'XP du jour, pour
    // ne pas permettre de farmer en cochant/décochant en boucle.
    if (!doneToday) this.addXp(8, 'habitude', habit.name);
    else this.addXp(-8, 'habitude', habit.name);
  }

  /** Série actuelle (jours consécutifs jusqu'à aujourd'hui inclus) d'une habitude. */
  getHabitStreak(habit) {
    const days = new Set(habit.completions);
    let streak = 0;
    let cursor = new Date();
    // Si pas fait aujourd'hui, la série se compte à partir d'hier (le jour courant reste "en attente").
    if (!days.has(cursor.toDateString())) {
      cursor = new Date(Date.now() - 86400000);
    }
    while (days.has(cursor.toDateString())) {
      streak += 1;
      cursor = new Date(cursor.getTime() - 86400000);
    }
    return streak;
  }

  // ============================================================
  // DAILY REVIEW — rapport du soir (un par jour, upsert)
  // ============================================================

  /** Clé du jour au format YYYY-MM-DD, en heure locale. */
  todayKey(date = new Date()) {
    const d = new Date(date);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 10);
  }

  /**
   * Calcule un instantané de la journée à partir des autres modules,
   * pour pré-remplir un DailyReview (l'utilisateur garde la main pour tout corriger).
   */
  getDailySnapshot(dayKey) {
    const missionsDone = this.state.todayMissions.filter((m) => m.done).length;
    const missionsTotal = this.state.todayMissions.length;

    const todaysEmotions = this.state.emotions.filter((e) => e.date.slice(0, 10) === dayKey);
    const last = todaysEmotions[0] ?? null;

    const goalsAdvanced = this.state.goals.filter((g) => (g.completedAt ?? '').slice(0, 10) === dayKey).length;
    const projectsAdvanced = this.state.projects.filter((p) => (p.updatedAt ?? '').slice(0, 10) === dayKey).length;

    return {
      missionsDone,
      missionsTotal,
      goalsAdvanced,
      projectsAdvanced,
      mood: last?.mood ?? null,
      motivation: last?.motivation ?? null,
      energy: last?.energy ?? null,
      stress: last?.stress ?? null,
    };
  }

  /**
   * Crée ou met à jour le DailyReview du jour (un seul par date — upsert).
   * fields: { victory, problem, learned, tomorrow, ...champs du snapshot si l'utilisateur les corrige }
   */
  saveDailyReview(fields, date = new Date()) {
    const dayKey = this.todayKey(date);
    const existing = this.state.dailyReviews.find((r) => r.day === dayKey);
    const snapshot = this.getDailySnapshot(dayKey);
    const now = new Date().toISOString();

    const review = {
      id: existing?.id ?? uid('dr'),
      day: dayKey,
      missionsDone: fields.missionsDone ?? snapshot.missionsDone,
      missionsTotal: fields.missionsTotal ?? snapshot.missionsTotal,
      goalsAdvanced: fields.goalsAdvanced ?? snapshot.goalsAdvanced,
      projectsAdvanced: fields.projectsAdvanced ?? snapshot.projectsAdvanced,
      mood: fields.mood ?? snapshot.mood,
      motivation: fields.motivation ?? snapshot.motivation,
      energy: fields.energy ?? snapshot.energy,
      stress: fields.stress ?? snapshot.stress,
      victory: fields.victory?.trim() ?? existing?.victory ?? '',
      problem: fields.problem?.trim() ?? existing?.problem ?? '',
      learned: fields.learned?.trim() ?? existing?.learned ?? '',
      tomorrow: fields.tomorrow?.trim() ?? existing?.tomorrow ?? '',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const dailyReviews = existing
      ? this.state.dailyReviews.map((r) => (r.id === existing.id ? review : r))
      : [review, ...this.state.dailyReviews];
    this.set({ dailyReviews });
    if (!existing) this.addXp(10, 'action', 'Rapport quotidien complété');
    return review.id;
  }

  deleteDailyReview(id) {
    const existing = this.state.dailyReviews.find((r) => r.id === id);
    this.set({ dailyReviews: this.state.dailyReviews.filter((r) => r.id !== id) });
    // Symétrique au bonus de première complétion (voir saveDailyReview) —
    // pas encore exposé dans l'UI aujourd'hui, mais évite une fuite XP
    // silencieuse si un écran de suppression de rapport est ajouté plus tard.
    if (existing) this.addXp(-10, 'action', 'Rapport quotidien supprimé');
  }

  getDailyReview(id) {
    return this.state.dailyReviews.find((r) => r.id === id) ?? null;
  }

  getDailyReviewByDay(dayKey = this.todayKey()) {
    return this.state.dailyReviews.find((r) => r.day === dayKey) ?? null;
  }

  listDailyReviews() {
    return this.state.dailyReviews
      .slice()
      .sort((a, b) => (a.day < b.day ? 1 : -1));
  }

  // ============================================================
  // WEEKLY REVIEW — rapport hebdomadaire (calculé + notes libres)
  // ============================================================

  /**
   * Calcule le bilan des 7 derniers jours (glissant) à partir des autres modules.
   * Aucune saisie manuelle requise pour ces chiffres — seuls victoires/difficultés sont libres.
   */
  getWeeklySnapshot() {
    const since = Date.now() - 7 * 86400000;
    const isRecent = (iso) => !!iso && new Date(iso).getTime() >= since;

    const goalsCompleted = this.state.goals.filter((g) => isRecent(g.completedAt)).length;
    const missionsCompleted = this.state.dailyReviews
      .filter((r) => new Date(r.day).getTime() >= since)
      .reduce((sum, r) => sum + (r.missionsDone || 0), 0);

    const activeProjects = this.state.projects.filter((p) => p.status !== 'completed');
    const avgProjectProgress = activeProjects.length
      ? Math.round(activeProjects.reduce((s, p) => s + p.progress, 0) / activeProjects.length)
      : null;

    const recentContributions = this.state.financialGoals.flatMap((g) => g.contributions.filter((c) => isRecent(c.date)));
    const financialProgress = recentContributions.reduce((s, c) => s + c.amount, 0);

    const emotionStats = this.getEmotionStats(7);

    const habits = this.listHabits();
    const habitsCompletions = habits.reduce(
      (sum, h) => sum + h.completions.filter((d) => new Date(d).getTime() >= since).length,
      0
    );

    return {
      goalsCompleted,
      missionsCompleted,
      avgProjectProgress,
      financialProgress,
      avgMotivation: emotionStats.avgMotivation,
      habitsCompletions,
      habitsCount: habits.length,
    };
  }

  /**
   * Crée un WeeklyReview (un instantané figé au moment de l'enregistrement).
   * fields: { victories, difficulties }
   */
  saveWeeklyReview(fields, date = new Date()) {
    const snapshot = this.getWeeklySnapshot();
    const now = new Date().toISOString();
    const review = {
      id: uid('wr'),
      weekOf: this.todayKey(date),
      ...snapshot,
      victories: fields.victories?.trim() || '',
      difficulties: fields.difficulties?.trim() || '',
      createdAt: now,
    };
    this.set({ weeklyReviews: [review, ...this.state.weeklyReviews] });
    this.addXp(20, 'action', 'Rapport hebdomadaire complété');
    return review.id;
  }

  deleteWeeklyReview(id) {
    const existing = this.state.weeklyReviews.find((r) => r.id === id);
    this.set({ weeklyReviews: this.state.weeklyReviews.filter((r) => r.id !== id) });
    if (existing) this.addXp(-20, 'action', 'Rapport hebdomadaire supprimé');
  }

  getWeeklyReview(id) {
    return this.state.weeklyReviews.find((r) => r.id === id) ?? null;
  }

  listWeeklyReviews() {
    return this.state.weeklyReviews
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // ============================================================
  // RÉCAP QUOTIDIEN — données rassemblées pour le rappel du matin et
  // le récap du soir (notifications + popup à l'ouverture de l'app).
  // ============================================================
  //
  // Ne recalcule rien de nouveau : uniquement des données déjà présentes
  // ailleurs dans le store (objectifs, argent, skills, habitudes, XP),
  // réunies en une seule vue. 100% offline, aucun appel IA requis.

  /**
   * Rassemble l'état du jour pour affichage (popup) ou notification (texte court) :
   * objectifs touchés aujourd'hui, argent du jour, XP/apprentissages, habitudes
   * cochées, skills mis à jour, victoires récentes, streak, motivation courante.
   */
  getDailySummaryData(date = new Date()) {
    const dayKey = this.todayKey(date);
    const isToday = (iso) => !!iso && iso.slice(0, 10) === dayKey;

    const xpToday = this.state.xpHistory.filter((e) => isToday(e.date));
    const xpEarnedToday = xpToday.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);

    const goalsTouchedToday = this.state.goals.filter(
      (g) => isToday(g.completedAt) || isToday(g.createdAt)
    );
    const activeGoals = this.state.goals.filter((g) => g.status === 'active');

    const moneyToday = this.getMoneyStats(1);
    const savedTotal = this.state.financialGoals.reduce((s, g) => s + (g.currentAmount || 0), 0);

    const habitsToday = this.listHabits();
    const habitsDone = habitsToday.filter((h) => this.isHabitDoneToday(h));

    const skillsUpdatedToday = this.state.skills.filter((s) => isToday(s.updatedAt));

    const missionsDone = this.state.todayMissions.filter((m) => m.done);

    return {
      dayKey,
      motivation: this.state.mood?.current ?? null,
      streak: this.state.user.streak,
      xpSummary: this.getXpSummary(),
      xpEarnedToday,
      xpSourcesToday: xpToday.map((e) => ({ source: e.source, label: e.label, amount: e.amount })),
      missions: { done: missionsDone.length, total: this.state.todayMissions.length },
      goals: {
        activeCount: activeGoals.length,
        touchedToday: goalsTouchedToday.map((g) => ({ id: g.id, name: g.name, progress: g.progress, status: g.status })),
        nextAction: this.state.nextAction,
      },
      money: {
        todayIncome: moneyToday.totalIncome,
        todayExpense: moneyToday.totalExpense,
        todayNet: moneyToday.net,
        balance: moneyToday.balance,
        savedTotal,
      },
      habits: {
        total: habitsToday.length,
        doneToday: habitsDone.length,
        remaining: habitsToday.filter((h) => !this.isHabitDoneToday(h)).map((h) => h.name),
      },
      skills: {
        updatedToday: skillsUpdatedToday.map((s) => ({ name: s.name, level: s.level })),
      },
      victories: this.getRecentVictories(3),
    };
  }

  /** Texte court (notification) résumant l'état du jour, réutilisé pour les récaps midi et soir. */
  _buildSummaryLabel(prefix = 'Aujourd\'hui') {
    const d = this.getDailySummaryData();
    const parts = [];
    if (d.goals.touchedToday.length) parts.push(`${d.goals.touchedToday.length} objectif(s) avancé(s)`);
    if (d.habits.doneToday > 0) parts.push(`${d.habits.doneToday}/${d.habits.total} habitude(s) tenue(s)`);
    if (d.xpEarnedToday > 0) parts.push(`+${d.xpEarnedToday} XP`);
    if (d.money.todayIncome > 0 || d.money.todayExpense > 0) parts.push(`argent du jour : +${d.money.todayIncome} / -${d.money.todayExpense}`);
    if (!parts.length) return 'Ta journée est prête à être résumée — ouvre BOOST pour ton récap.';
    return `${prefix} : ${parts.join(' · ')}.`;
  }

  /** Texte court (notification) résumant le récap du soir à partir des données du jour. */
  _buildEveningSummaryLabel() {
    return this._buildSummaryLabel('Aujourd\'hui');
  }

  /** Texte court (notification) résumant le récap du midi à partir des données de la journée en cours. */
  _buildMiddaySummaryLabel() {
    return this._buildSummaryLabel('Ce midi');
  }

  /** Texte court (notification) du rappel du matin, personnalisé si possible. */
  _buildMorningReminderLabel() {
    const d = this.getDailySummaryData();
    if (d.streak > 0) return `Jour ${d.streak} de ta série — où en es-tu, quel est ton focus aujourd'hui ?`;
    return 'Nouveau jour : ton projet, ta motivation, ton focus — fais le point.';
  }

  // ============================================================
  // NOTIFICATIONS — préparation locale (activer/désactiver + heure par type)
  // ============================================================
  //
  // Limite volontairement assumée : sans serveur de push, un navigateur/PWA
  // ne peut pas réveiller l'app pour notifier en arrière-plan de façon fiable.
  // Ce qui suit prépare tout le nécessaire (permission, préférences, horaires,
  // détection "c'est l'heure") et déclenche une vraie Notification native
  // quand l'app est ouverte au bon moment. Une vraie planification hors-ligne
  // demanderait un Push API + serveur, hors périmètre ici.

  /**
   * Renvoie les préférences de notification, en garantissant que chaque
   * entrée a bien `sound`/`vibrate` même si elle vient d'une sauvegarde
   * antérieure à l'ajout de ces réglages (le merge au chargement est
   * superficiel au niveau racine, donc un notificationPrefs déjà présent
   * dans localStorage écrase entièrement celui par défaut, anciennes clés
   * comprises). Comblé ici à la lecture, sans migration destructive.
   */
  getNotificationPrefs() {
    const prefs = this.state.notificationPrefs;
    const filled = {};
    Object.entries(prefs).forEach(([typeId, pref]) => {
      filled[typeId] = {
        sound: true,
        vibrate: true,
        ...pref,
      };
    });
    return filled;
  }

  setNotificationPref(typeId, patch) {
    this.set({
      notificationPrefs: {
        ...this.state.notificationPrefs,
        [typeId]: { ...this.state.notificationPrefs[typeId], ...patch },
      },
    });
  }

  toggleNotificationType(typeId) {
    const current = this.state.notificationPrefs[typeId];
    if (!current) return;
    this.setNotificationPref(typeId, { enabled: !current.enabled });
  }

  /** État de la permission navigateur pour les notifications natives. */
  getNotificationPermission() {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission; // default | granted | denied
  }

  /** Demande la permission navigateur (doit être appelé depuis un geste utilisateur). */
  async requestNotificationPermission() {
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission === 'default') {
      return Notification.requestPermission();
    }
    return Notification.permission;
  }

  /**
   * Vérifie les types activés dont l'heure est atteinte et pas encore notifiés aujourd'hui,
   * et déclenche une Notification native si la permission est accordée.
   * À appeler périodiquement pendant que l'app est ouverte (voir main.js).
   */
  checkDueNotifications() {
    if (this.getNotificationPermission() !== 'granted') return;
    const now = new Date();
    const dayKey = this.todayKey(now);
    const hhmm = now.toTimeString().slice(0, 5);

    Object.entries(this.state.notificationPrefs).forEach(([typeId, pref]) => {
      if (!pref.enabled) return;
      if (pref.time > hhmm) return; // pas encore l'heure
      const alreadySent = this.state.notificationLog.some((n) => n.typeId === typeId && n.date.slice(0, 10) === dayKey);
      if (alreadySent) return;
      this._fireNotification(typeId);
    });
  }

  _fireNotification(typeId) {
    const label = this._notificationLabel(typeId);
    const pref = this.getNotificationPrefs()[typeId] || {};
    try {
      new Notification('BOOST', { body: label, tag: typeId });
    } catch {
      // Environnement sans support (ex. certains navigateurs mobiles) — on garde la trace quand même.
    }
    if (pref.vibrate !== false) this._vibrate();
    if (pref.sound !== false) this._playNotificationSound();
    this.set({
      notificationLog: [
        { id: uid('nt'), typeId, label, date: new Date().toISOString() },
        ...this.state.notificationLog,
      ],
    });
  }

  /** Vibration courte via l'API Vibration — no-op silencieux si non supportée (ex. iOS Safari, PC). */
  /** Déclenche une vibration de test immédiate (ex. clic sur le toggle Vibration dans Profil). */
  testVibrate() {
    this._vibrate();
  }

  /** Joue le bip de test immédiat (ex. clic sur le toggle Son dans Profil). */
  testSound() {
    this._playNotificationSound();
  }

  _vibrate() {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([200, 100, 200]);
      }
    } catch {
      // navigator.vibrate peut lever dans de rares environnements — on ignore, purement cosmétique.
    }
  }

  /**
   * Bip généré via Web Audio (aucun fichier audio à héberger/charger).
   * Deux notes courtes montantes, volume modéré. no-op silencieux si
   * AudioContext n'est pas disponible ou si l'appel échoue (ex. contexte
   * suspendu par une politique d'autoplay — la notification reste utile
   * même sans son dans ce cas).
   */
  _playNotificationSound() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const playTone = (freq, startAt, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + startAt);
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + startAt + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startAt);
        osc.stop(ctx.currentTime + startAt + duration + 0.02);
      };
      playTone(880, 0, 0.12);
      playTone(1174.66, 0.14, 0.16);
      // Referme le contexte une fois les deux notes jouées pour ne pas laisser
      // trainer un AudioContext par notification (limite du navigateur atteinte sinon).
      setTimeout(() => ctx.close().catch(() => {}), 500);
    } catch {
      // Environnement sans Web Audio ou contexte bloqué — silence, pas bloquant.
    }
  }

  /**
   * Marque le récap du matin/soir comme vu pour aujourd'hui, sur le même
   * notificationLog que les notifications natives (même règle "une fois par
   * jour" dans checkDueNotifications). N'émet pas de Notification native :
   * appelé quand la popup vient d'être affichée et fermée dans l'app elle-même,
   * donc une notification serait redondante avec ce que l'utilisateur vient de voir.
   */
  markDailySummarySeen(typeId, summaryData) {
    const label = this._notificationLabel(typeId);
    this.set({
      notificationLog: [
        { id: uid('nt'), typeId, label, date: new Date().toISOString() },
        ...this.state.notificationLog,
      ],
    });
    return summaryData;
  }

  /** Message par défaut d'un type de notification (peut être enrichi avec les données du jour). */
  _notificationLabel(typeId) {
    if (typeId === 'daily_reminder_morning') return this._buildMorningReminderLabel();
    if (typeId === 'daily_summary_midday') return this._buildMiddaySummaryLabel();
    if (typeId === 'daily_summary_evening') return this._buildEveningSummaryLabel();
    const labels = {
      morning_boost: 'Une nouvelle journée pour devenir la personne que tu veux être.',
      morning_mission: 'Tes 3 missions du jour sont prêtes.',
      goal_reminder: 'Un objectif actif t’attend — avance d’un pas aujourd’hui.',
      habit_reminder: 'Il te reste une habitude à cocher aujourd’hui.',
      evening_review: 'Prends deux minutes pour ton rapport quotidien.',
      motivation: 'Petite pause motivation.',
      deadline: 'Une échéance approche — vérifie tes objectifs et projets.',
    };
    return labels[typeId] || 'BOOST';
  }

  listNotificationLog() {
    return this.state.notificationLog
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 50);
  }

  // ============================================================
  // BOOST ME — sélection adaptative selon l'état de l'utilisateur
  // ============================================================
  //
  // Règles du prompt, dans cet ordre de priorité (la première qui matche
  // gagne) : motivation faible, stress élevé, deadline proche, objectif
  // bloqué, bonne motivation. Par défaut (pas assez de signal), une
  // citation générique. Le contenu réel (texte de citation, etc.) est
  // laissé à l'écran appelant — cette méthode ne renvoie qu'un type + le
  // contexte nécessaire pour l'afficher, sans dépendance à data/quotes.js.

  /** Objectifs actifs, non bloqués, triés par deadline la plus proche en premier. */
  _activeGoalsSortedByDeadline() {
    return this.state.goals
      .filter((g) => g.status === 'active' && g.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  /** Un objectif est considéré "bloqué" s'il n'a progressé récemment sur aucune étape/action et a un peu d'ancienneté. */
  _findStuckGoal() {
    const active = this.state.goals.filter((g) => g.status === 'active');
    return active.find((g) => {
      const hasSteps = g.steps.length > 0;
      const allStepsUndone = hasSteps && g.steps.every((s) => !s.done);
      const oldEnough = Date.now() - new Date(g.createdAt).getTime() > 3 * 86400000; // 3 jours
      return hasSteps && allStepsUndone && oldEnough && g.progress === 0;
    }) ?? null;
  }

  /**
   * Détermine le type de contenu Boost Me le plus pertinent maintenant.
   * Renvoie { type, data } où type ∈
   *   'low_motivation' | 'high_stress' | 'deadline' | 'stuck_goal' | 'high_motivation' | 'default'
   */
  getBoostSuggestion() {
    const stats = this.getEmotionStats(3); // signal récent, pas juste le jour même
    const latestMotivation = stats.avgMotivation;
    const latestStress = stats.avgStress;

    if (latestMotivation != null && latestMotivation <= 3) {
      return {
        type: 'low_motivation',
        data: {
          message: 'Un petit pas suffit aujourd\'hui. Pas besoin de tout, juste une action.',
          suggestedAction: this.state.todayMissions.find((m) => !m.done) ?? null,
        },
      };
    }

    if (latestStress != null && latestStress >= 7) {
      return {
        type: 'high_stress',
        data: {
          message: 'Respire. Une seule chose à la fois — le reste peut attendre.',
          suggestedAction: this.state.todayMissions.find((m) => !m.done) ?? null,
        },
      };
    }

    const upcoming = this._activeGoalsSortedByDeadline()[0];
    if (upcoming) {
      const daysLeft = Math.ceil((new Date(upcoming.deadline) - Date.now()) / 86400000);
      if (daysLeft >= 0 && daysLeft <= 3) {
        return {
          type: 'deadline',
          data: {
            goal: upcoming,
            daysLeft,
            message: `« ${upcoming.name} » approche de son échéance.`,
          },
        };
      }
    }

    const stuck = this._findStuckGoal();
    if (stuck) {
      return {
        type: 'stuck_goal',
        data: {
          goal: stuck,
          message: `« ${stuck.name} » n'a pas avancé depuis un moment. Et si tu cochais juste la première étape ?`,
          nextStep: stuck.steps.find((s) => !s.done) ?? null,
        },
      };
    }

    if (latestMotivation != null && latestMotivation >= 7) {
      return {
        type: 'high_motivation',
        data: {
          message: 'Tu es en forme — profites-en pour viser plus haut aujourd\'hui.',
          suggestedAction: this.state.todayMissions.find((m) => !m.done) ?? null,
        },
      };
    }

    return { type: 'default', data: {} };
  }

  // ============================================================
  // MODE "JE VEUX ABANDONNER" — données rassemblées pour l'écran dédié
  // ============================================================
  //
  // Rien n'est recalculé côté IA ici : uniquement des données déjà présentes
  // ailleurs dans le store, réunies dans une seule vue pour l'écran
  // AbandonMode. Doit fonctionner à 100% offline (aucun appel IA requis).

  /** Jusqu'à N victoires les plus récentes, toutes sources confondues (objectifs atteints, rapports quotidiens, hebdo). */
  getRecentVictories(limit = 5) {
    const fromGoals = this.state.goals
      .filter((g) => g.status === 'completed' && g.completedAt)
      .map((g) => ({ text: g.name, date: g.completedAt, source: 'objectif' }));
    const fromDaily = this.state.dailyReviews
      .filter((r) => r.victory)
      .map((r) => ({ text: r.victory, date: r.createdAt || r.day, source: 'rapport du jour' }));
    const fromWeekly = this.state.weeklyReviews
      .filter((r) => r.victories)
      .map((r) => ({ text: r.victories, date: r.createdAt, source: 'rapport hebdo' }));
    return [...fromGoals, ...fromDaily, ...fromWeekly]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }

  /**
   * Rassemble tout ce dont l'écran "Je veux abandonner" a besoin, en un seul appel :
   * raisons initiales (why global + why par objectif actif), objectifs, progrès,
   * victoires récentes, et le nombre d'enregistrements personnels disponibles
   * (le tirage du fichier audio lui-même reste géré par voiceStorage.js, asynchrone).
   */
  getAbandonModeData() {
    const activeGoals = this.state.goals.filter((g) => g.status === 'active');
    return {
      whyStatement: this.state.whyStatement,
      goalReasons: activeGoals.filter((g) => g.why).map((g) => ({ goalName: g.name, why: g.why })),
      goals: activeGoals.map((g) => ({
        id: g.id,
        name: g.name,
        progress: g.progress,
        stepsDone: g.steps.filter((s) => s.done).length,
        stepsTotal: g.steps.length,
        nextStep: g.steps.find((s) => !s.done)?.text ?? null,
      })),
      xpSummary: this.getXpSummary(),
      streak: this.state.user.streak,
      victories: this.getRecentVictories(5),
    };
  }

  // ============================================================
  // IA — activation globale et personnalisation du coach
  // ============================================================

  isAIEnabled() {
    return this.state.aiEnabled !== false;
  }

  setAIEnabled(enabled) {
    this.set({ aiEnabled: !!enabled });
  }

  getCoachSettings() {
    return this.state.coachSettings;
  }

  updateCoachSettings(patch) {
    this.set({ coachSettings: { ...this.state.coachSettings, ...patch } });
  }

  // ============================================================
  // ONBOARDING — parcours de première ouverture
  // ============================================================

  getOnboarding() {
    return this.state.onboarding;
  }

  isOnboardingComplete() {
    return !!this.state.onboarding?.completed;
  }

  /** Enregistre les réponses de l'onboarding et répercute les choix pertinents sur le reste de l'état (why global, style de coach, heure du Morning Boost). */
  completeOnboarding(fields) {
    const onboarding = {
      ...this.state.onboarding,
      ...fields,
      completed: true,
    };
    const patch = { onboarding };
    if (fields.why) {
      patch.whyStatement = fields.why;
    }
    if (fields.coachStyle) {
      patch.coachSettings = {
        ...this.state.coachSettings,
        style: fields.coachStyle,
        mainGoal: fields.mainGoal || this.state.coachSettings.mainGoal,
        personalReasons: fields.why || this.state.coachSettings.personalReasons,
      };
    }
    if (fields.morningBoostTime) {
      patch.notificationPrefs = {
        ...this.state.notificationPrefs,
        morning_boost: { ...this.state.notificationPrefs.morning_boost, time: fields.morningBoostTime, enabled: true },
      };
    }
    this.set(patch);
  }

  // ============================================================
  // SAUVEGARDE — export / import / suppression complète
  // ============================================================
  //
  // La "sauvegarde locale" est déjà assurée en continu par persist() sur
  // chaque set() : tout vit dans localStorage. Ce qui manque et qu'on ajoute
  // ici, c'est la portabilité (sortir les données de l'appareil, les
  // remettre) et le droit à l'oubli (tout effacer). Pas de dépendance
  // réseau : export = fichier JSON téléchargé, import = fichier JSON relu.

  /** Sérialise l'état actuel avec un peu de métadonnées, prêt à être téléchargé. */
  exportData() {
    const payload = {
      app: 'boost',
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      state: this.state,
    };
    return JSON.stringify(payload, null, 2);
  }

  /** Déclenche le téléchargement du fichier d'export via une balise <a> éphémère. */
  downloadBackup() {
    const json = this.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateSuffix = this.todayKey();
    const a = document.createElement('a');
    a.href = url;
    a.download = `boost-sauvegarde-${dateSuffix}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Valide qu'un texte JSON ressemble à un export BOOST, sans l'appliquer.
   * Renvoie { ok: true, state } ou { ok: false, error }.
   */
  parseBackup(jsonText) {
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return { ok: false, error: "Fichier illisible : ce n'est pas un JSON valide." };
    }
    const state = parsed?.state && typeof parsed.state === 'object' ? parsed.state : parsed;
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      return { ok: false, error: 'Structure inattendue : ce fichier ne ressemble pas à une sauvegarde BOOST.' };
    }
    const hasKnownKey = Object.keys(defaultState).some((k) => k in state);
    if (!hasKnownKey) {
      return { ok: false, error: 'Aucune donnée BOOST reconnue dans ce fichier.' };
    }
    return { ok: true, state };
  }

  /**
   * Remplace l'état courant par celui d'une sauvegarde (fusionné sur les valeurs
   * par défaut, comme au chargement, pour tolérer un export d'une version antérieure).
   * Écrase définitivement les données actuelles — à confirmer côté écran.
   */
  restoreBackup(jsonText) {
    const result = this.parseBackup(jsonText);
    if (!result.ok) return result;
    const merged = { ...structuredClone(defaultState), ...result.state };
    this.state = merged;
    persist(this.state);
    this.listeners.forEach((fn) => fn(this.state));
    return { ok: true };
  }

  /** Efface toutes les données locales et repart sur l'état par défaut. Irréversible. */
  eraseAllData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('[store] suppression impossible', e);
    }
    this.state = structuredClone(defaultState);
    this.listeners.forEach((fn) => fn(this.state));
  }
}

/** Moyenne d'une clé numérique sur une liste d'entrées, arrondie à 1 décimale. */
function avgOf(list, key) {
  const vals = list.map((e) => e[key]).filter((v) => v != null && !Number.isNaN(v));
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export const store = new Store();
