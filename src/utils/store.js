/**
 * Store minimaliste offline-first pour BOOST.
 * Toutes les données persistent en localStorage — aucune dépendance réseau.
 * Architecture volontairement simple : un objet d'état + souscripteurs.
 * Remplaçable plus tard par IndexedDB sans changer l'API publique.
 */

import { expenseCategories as defaultExpenseCategories, incomeCategories as defaultIncomeCategories } from '../data/moneyCategories.js';
import { pickRandomMissions } from '../data/dailyMissions.js';


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
  // Valeurs de secours au tout premier lancement (avant que _ensureTodayMissions()
  // ne les régénère). todayMissionsDate reste null pour forcer un premier tirage
  // aléatoire dès la première lecture — voir _ensureTodayMissions() plus bas.
  todayMissions: [
    { id: 'm1', text: 'Écrire 3 objectifs de la semaine', done: false, xp: 15 },
    { id: 'm2', text: '10 minutes de lecture ou audio motivant', done: false, xp: 10 },
    { id: 'm3', text: 'Faire le point sur ton "Pourquoi"', done: false, xp: 10 },
  ],
  todayMissionsDate: null, // 'YYYY-MM-DD' — date à laquelle todayMissions a été tiré ; voir _ensureTodayMissions()
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
  debts: [], // Debt[] — dettes/prêts entre particuliers, chaque Debt embarque ses remboursements (repayments) ; voir MONEY — Debt plus bas
  scheduledPayments: [], // ScheduledPayment[] — paiements planifiés/récurrents (loyer, abonnements, salaire, ...) ; voir MONEY — ScheduledPayment plus bas
  accounts: [], // MoneyAccount[] — { id, name, icon, createdAt } — voir _ensureDefaultAccount() pour la création auto du compte "Principal"
  categoryBudgets: [], // MoneyCategoryBudget[] — { id, category, monthlyLimit } — un seul par catégorie de dépense, voir setCategoryBudget()
  // MoneyCategory personnalisées : { expense: MoneyCategory[], income: MoneyCategory[] }
  // MoneyCategory: { id, label, icon, color, subcategories: [{ id, label }] }
  // null tant que l'utilisateur n'a jamais ouvert l'écran Catégories — voir _ensureMoneyCategories()
  // qui initialise paresseusement depuis moneyCategories.js (mêmes id, pour rester compatible
  // avec les transactions déjà enregistrées) sans jamais écraser une personnalisation existante.
  moneyCategories: null,
  // WalletSettings — préférences propres au module Money (distinct des
  // préférences générales BOOST). Multi-devises non géré pour l'instant :
  // currency reste fixe à 'MGA'. Les couleurs revenus/dépenses ne sont pas
  // encore personnalisables (voir WalletSettingsScreen.js) : elles restent
  // câblées sur --success-500 / --danger-500 dans les styles CSS.
  walletSettings: {
    currency: 'MGA', // fixe pour l'instant — lecture seule côté UI
    thousandsSeparator: 'space', // 'space' | 'comma' | 'dot' | 'none'
    symbolPosition: 'after', // 'before' | 'after'
    budgetMonthStartDay: 1, // 1-28 — jour du mois où repart le calcul des budgets mensuels (getBudgetProgress)
  },
  investments: [], // Investment[] — { id, name, type, initialAmount, currentValue, date, accountId, notes, valueHistory, createdAt, updatedAt } — voir MONEY — Investment plus bas
  shoppingItems: [], // ShoppingItem[] — { id, name, quantity, estimatedPrice, category, priority, bought, date, notes } — voir MONEY — ShoppingItem plus bas
  warranties: [], // Warranty[] — { id, product, category, purchaseDate, purchasePrice, seller, expiryDate, reference, notes } — voir MONEY — Warranty plus bas
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
    // Rappel unique pour tous les paiements planifiés (voir MONEY — ScheduledPayment) : un seul
    // type ici, pas un par paiement, pour rester compatible avec la structure fixe attendue
    // ailleurs (Profil, checkDueNotifications). Le déclenchement réel (y a-t-il un paiement dont
    // le rappel tombe aujourd'hui) est décidé dans _notificationLabel/checkDueNotifications.
    scheduled_payment_reminder: { enabled: true, time: '08:30', sound: true, vibrate: true },
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
  agendaTasks: [], // AgendaTask[] — { id, date (YYYY-MM-DD), hour (0-23), duration (heures, >=1), title, note, priority (bool), done, doneAt, createdAt }
  agendaXp: {
    xp: 0,
    totalEarned: 0,
  },
};

// Clés d'état appartenant exclusivement au module Money/Wallet. Utilisé par
// resetWalletData() (réinitialisation ciblée) et exportMoneyCSV() : source
// unique de vérité pour "qu'est-ce qui appartient à Wallet", pour ne jamais
// en oublier une ni en toucher une hors périmètre lors d'un ajout futur.
const MONEY_STATE_KEYS = [
  'accounts',
  'transactions',
  'moneyCategories',
  'categoryBudgets',
  'financialGoals',
  'debts',
  'scheduledPayments',
  'walletSettings',
  'investments',
  'shoppingItems',
  'warranties',
];

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
    this._ensureTodayMissions();
  }

  /**
   * Régénère les 3 missions du jour par tirage aléatoire dans le pool
   * (voir data/dailyMissions.js) dès que la date du jour change par rapport
   * à todayMissionsDate. Idempotent : appelée plusieurs fois le même jour,
   * elle ne touche à rien tant que la date n'a pas changé — donc jamais de
   * perte de progression (done) en cours de journée.
   * Appelée au chargement (constructor) et défensivement dans get(), pour
   * couvrir le cas où l'app resterait ouverte en continu à cheval sur minuit.
   */
  _ensureTodayMissions() {
    const todayKey = new Date().toISOString().slice(0, 10);
    if (this.state.todayMissionsDate === todayKey) return;

    const picked = pickRandomMissions(3);
    const todayMissions = picked.map((m, i) => ({
      id: `m_${todayKey}_${i}`,
      text: m.text,
      xp: m.xp,
      done: false,
    }));

    this.state = { ...this.state, todayMissions, todayMissionsDate: todayKey };
    persist(this.state);
  }

  get() {
    this._ensureTodayMissions();
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

  // ============================================================
  // AGENDA — tâches planifiées par heure + XP séparé
  // ============================================================

  /**
   * Liste les tâches d'un jour donné (YYYY-MM-DD), triées par ordre manuel
   * si défini (champ `order`), puis par heure de début en repli.
   * Rétrocompatibilité : les tâches sans `order` (créées avant l'ajout du
   * réordonnancement) sont traitées comme `order = Infinity` et retombent
   * naturellement en fin de tri par heure, sans jamais planter ni perdre
   * de tâches.
   */
  getAgendaTasksForDate(dateKey) {
    return this.state.agendaTasks
      .filter((t) => t.date === dateKey)
      .sort((a, b) => {
        const oa = typeof a.order === 'number' ? a.order : Infinity;
        const ob = typeof b.order === 'number' ? b.order : Infinity;
        if (oa !== ob) return oa - ob;
        return this.getAgendaTaskRange(a).startMin - this.getAgendaTaskRange(b).startMin;
      });
  }

  /** Tâches marquées prioritaires pour un jour donné, triées par heure. */
  getAgendaPriorityTasksForDate(dateKey) {
    return this.getAgendaTasksForDate(dateKey).filter((t) => t.priority);
  }

  /**
   * Résumé "accomplissements" du jour : nb de tâches faites / total,
   * XP gagné aujourd'hui, et un message de motivation adapté à la progression.
   */
  getAgendaDaySummary(dateKey) {
    const tasks = this.getAgendaTasksForDate(dateKey);
    const done = tasks.filter((t) => t.done).length;
    const total = tasks.length;
    const xpToday = tasks
      .filter((t) => t.done)
      .reduce((sum) => sum + 10, 0);
    let message;
    if (total === 0) {
      message = 'Aucune tâche pour ce jour pour le moment.';
    } else if (done === 0) {
      message = 'Aucune tâche terminée pour l’instant — à toi de jouer.';
    } else if (done === total) {
      message = 'Journée complète ! Toutes les tâches sont faites.';
    } else {
      message = `${done} sur ${total} tâches terminées, continue comme ça.`;
    }
    return { done, total, xpToday, message };
  }

  /**
   * Crée une tâche planifiée avec une plage horaire libre à la minute près.
   * startMin/endMin = minutes depuis minuit (0-1439), endMin > startMin, ne dépasse pas 1440 (minuit).
   * hour/duration sont conservés en dérivé (arrondis à l'heure) pour rester compatibles avec
   * tout le code existant qui filtre/trie encore par heure entière (recherche, export, etc.) —
   * ne jamais les supprimer sans grep préalable de toutes leurs utilisations.
   * Rétrocompatibilité : si startMin/endMin ne sont pas fournis (ancien appelant), on les
   * dérive de hour/duration comme avant.
   */
  addAgendaTask({ date, hour, duration = 1, startMin, endMin, title, note = '', priority = false }) {
    const h = Number(hour);
    const dur = Math.max(1, Number(duration) || 1);
    const sMin = startMin != null ? Math.max(0, Math.min(1439, Number(startMin))) : h * 60;
    const eMin = endMin != null ? Math.max(sMin + 1, Math.min(1440, Number(endMin))) : sMin + dur * 60;
    // Nouvelle tâche placée en dernier dans l'ordre manuel du jour : on prend
    // le plus grand `order` existant pour cette date (en ignorant les tâches
    // sans order, cf. rétrocompat) et on incrémente de 1.
    const dayOrders = this.state.agendaTasks
      .filter((t) => t.date === date && typeof t.order === 'number')
      .map((t) => t.order);
    const nextOrder = dayOrders.length > 0 ? Math.max(...dayOrders) + 1 : 0;
    const task = {
      id: uid('agenda'),
      date,
      hour: Math.floor(sMin / 60),
      duration: Math.max(1, Math.round((eMin - sMin) / 60)),
      startMin: sMin,
      endMin: eMin,
      title: title.trim(),
      note: note.trim(),
      priority: !!priority,
      order: nextOrder,
      done: false,
      doneAt: null,
      createdAt: new Date().toISOString(),
    };
    this.set({ agendaTasks: [...this.state.agendaTasks, task] });
    return task;
  }

  /**
   * Renvoie {startMin, endMin} pour une tâche, en migrant à la volée les tâches
   * créées avant l'ajout de la plage horaire libre (qui n'ont que hour/duration).
   * Ne modifie pas l'état — usage lecture seule côté écran.
   */
  getAgendaTaskRange(task) {
    if (task.startMin != null && task.endMin != null) {
      return { startMin: task.startMin, endMin: task.endMin };
    }
    const h = Number(task.hour) || 0;
    const dur = Math.max(1, Number(task.duration) || 1);
    return { startMin: h * 60, endMin: Math.min(1440, h * 60 + dur * 60) };
  }

  updateAgendaTask(id, patch) {
    this.set({
      agendaTasks: this.state.agendaTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  }

  deleteAgendaTask(id) {
    this.set({ agendaTasks: this.state.agendaTasks.filter((t) => t.id !== id) });
  }

  /**
   * Déplace une tâche d'un cran vers le haut (-1) ou le bas (+1) dans l'ordre
   * manuel des tâches du même jour. Ne touche qu'aux tâches de cette date —
   * jamais celles des autres jours. Attribue un `order` normalisé (0,1,2…)
   * à toutes les tâches du jour à cette occasion, ce qui migre en douceur
   * les anciennes tâches sans `order` (rétrocompatibilité) sans jamais en
   * perdre ni en dupliquer.
   */
  moveAgendaTask(id, direction) {
    const task = this.state.agendaTasks.find((t) => t.id === id);
    if (!task) return;
    const dayTasks = this.getAgendaTasksForDate(task.date); // déjà triée par order/heure
    const idx = dayTasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= dayTasks.length) return; // déjà en haut/bas
    const reordered = dayTasks.slice();
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);
    const orderById = new Map(reordered.map((t, i) => [t.id, i]));
    this.set({
      agendaTasks: this.state.agendaTasks.map((t) =>
        orderById.has(t.id) ? { ...t, order: orderById.get(t.id) } : t
      ),
    });
  }

  /**
   * Marque une tâche comme terminée (ou annule si déjà faite) et ajuste l'XP
   * Agenda en conséquence. Renvoie { justCompleted, xpGained } pour que
   * l'écran sache s'il doit afficher le message de félicitations.
   */
  toggleAgendaTask(id) {
    const task = this.state.agendaTasks.find((t) => t.id === id);
    if (!task) return { justCompleted: false, xpGained: 0 };
    const willBeDone = !task.done;
    const xpGained = 10;
    this.updateAgendaTask(id, {
      done: willBeDone,
      doneAt: willBeDone ? new Date().toISOString() : null,
    });
    this.addAgendaXp(willBeDone ? xpGained : -xpGained);
    return { justCompleted: willBeDone, xpGained: willBeDone ? xpGained : 0 };
  }

  /** XP Agenda — système totalement séparé de l'XP global (user.xp). */
  addAgendaXp(amount) {
    const current = this.state.agendaXp ?? { xp: 0, totalEarned: 0 };
    const xp = Math.max(0, current.xp + amount);
    const totalEarned = amount > 0 ? current.totalEarned + amount : current.totalEarned;
    this.set({ agendaXp: { xp, totalEarned } });
  }

  getAgendaXpSummary() {
    return this.state.agendaXp ?? { xp: 0, totalEarned: 0 };
  }

  /**
   * Recherche dans l'historique des tâches Agenda (toutes dates confondues)
   * par mot-clé sur le titre ou la note.
   */
  searchAgendaHistory(query) {
    const q = query.trim().toLowerCase();
    const sorted = (arr) =>
      arr
        .slice()
        .sort((a, b) => (a.date + String(a.hour).padStart(2, '0')).localeCompare(b.date + String(b.hour).padStart(2, '0')))
        .reverse();
    if (!q) return sorted(this.state.agendaTasks);
    return sorted(
      this.state.agendaTasks.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.note || '').toLowerCase().includes(q)
      )
    );
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
  // MONEY — MoneyCategory (catégories & sous-catégories personnalisables)
  // ============================================================
  //
  // Rétrocompatibilité : moneyCategories.js reste la source des catégories
  // par défaut (mêmes id qu'avant), pour que les transactions déjà
  // enregistrées continuent de matcher. `state.moneyCategories` ne
  // s'initialise qu'à la première utilisation (_ensureMoneyCategories),
  // sans jamais écraser une personnalisation déjà faite par l'utilisateur.

  _defaultMoneyCategories() {
    const toCategory = (c) => ({ ...c, subcategories: [] });
    return {
      expense: defaultExpenseCategories.map(toCategory),
      income: defaultIncomeCategories.map(toCategory),
    };
  }

  _ensureMoneyCategories() {
    if (this.state.moneyCategories) return;
    this.set({ moneyCategories: this._defaultMoneyCategories() });
  }

  /** Catégories effectives d'un type ('expense' | 'income'), personnalisées ou par défaut. */
  listCategories(type) {
    this._ensureMoneyCategories();
    return this.state.moneyCategories[type]?.slice() ?? [];
  }

  getCategory(type, categoryId) {
    return this.listCategories(type).find((c) => c.id === categoryId) ?? null;
  }

  /** Carte id → catégorie, tous types confondus (équivalent personnalisé de moneyCategoryMap). */
  getCategoryMap() {
    this._ensureMoneyCategories();
    const all = [...this.state.moneyCategories.expense, ...this.state.moneyCategories.income];
    return Object.fromEntries(all.map((c) => [c.id, c]));
  }

  createCategory(type, fields) {
    this._ensureMoneyCategories();
    const id = uid('cat');
    const category = {
      id,
      label: fields.label?.trim() || 'Nouvelle catégorie',
      icon: fields.icon || 'inbox',
      color: fields.color || '--text-tertiary',
      subcategories: [],
    };
    this.set({
      moneyCategories: {
        ...this.state.moneyCategories,
        [type]: [...this.state.moneyCategories[type], category],
      },
    });
    return id;
  }

  updateCategory(type, categoryId, patch) {
    this._ensureMoneyCategories();
    this.set({
      moneyCategories: {
        ...this.state.moneyCategories,
        [type]: this.state.moneyCategories[type].map((c) => (c.id === categoryId ? { ...c, ...patch } : c)),
      },
    });
  }

  /**
   * Supprime une catégorie. Les transactions qui la référencent sont
   * réassignées à 'autre' (jamais supprimées) plutôt que laissées orphelines.
   * Refuse de supprimer 'autre' elle-même (catégorie de repli obligatoire).
   */
  deleteCategory(type, categoryId) {
    this._ensureMoneyCategories();
    if (categoryId === 'autre') {
      return { ok: false, error: "Impossible de supprimer la catégorie 'Autre'." };
    }
    this.set({
      moneyCategories: {
        ...this.state.moneyCategories,
        [type]: this.state.moneyCategories[type].filter((c) => c.id !== categoryId),
      },
      transactions: this.state.transactions.map((t) => (
        t.category === categoryId ? { ...t, category: 'autre' } : t
      )),
    });
    return { ok: true };
  }

  /** Réordonne les catégories d'un type selon une liste d'ids déjà dans l'ordre voulu. */
  reorderCategories(type, orderedIds) {
    this._ensureMoneyCategories();
    const byId = Object.fromEntries(this.state.moneyCategories[type].map((c) => [c.id, c]));
    const reordered = orderedIds.map((id) => byId[id]).filter(Boolean);
    // Sécurité : si la liste fournie omet des catégories existantes, on les
    // rajoute à la fin plutôt que de les perdre silencieusement.
    const missing = this.state.moneyCategories[type].filter((c) => !orderedIds.includes(c.id));
    this.set({
      moneyCategories: { ...this.state.moneyCategories, [type]: [...reordered, ...missing] },
    });
  }

  createSubcategory(type, categoryId, label) {
    this._ensureMoneyCategories();
    const id = uid('subcat');
    this.set({
      moneyCategories: {
        ...this.state.moneyCategories,
        [type]: this.state.moneyCategories[type].map((c) => (
          c.id === categoryId
            ? { ...c, subcategories: [...c.subcategories, { id, label: label?.trim() || 'Nouvelle sous-catégorie' }] }
            : c
        )),
      },
    });
    return id;
  }

  updateSubcategory(type, categoryId, subcategoryId, label) {
    this._ensureMoneyCategories();
    this.set({
      moneyCategories: {
        ...this.state.moneyCategories,
        [type]: this.state.moneyCategories[type].map((c) => (
          c.id === categoryId
            ? { ...c, subcategories: c.subcategories.map((s) => (s.id === subcategoryId ? { ...s, label: label?.trim() || s.label } : s)) }
            : c
        )),
      },
    });
  }

  /** Supprime une sous-catégorie. Les transactions qui la référencent gardent leur catégorie parente, juste sans sous-catégorie. */
  deleteSubcategory(type, categoryId, subcategoryId) {
    this._ensureMoneyCategories();
    this.set({
      moneyCategories: {
        ...this.state.moneyCategories,
        [type]: this.state.moneyCategories[type].map((c) => (
          c.id === categoryId
            ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== subcategoryId) }
            : c
        )),
      },
      transactions: this.state.transactions.map((t) => (
        t.subcategory === subcategoryId ? { ...t, subcategory: null } : t
      )),
    });
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

  /**
   * Catalogue des types de compte proposés à la création. `type` est stocké
   * sur le compte ; `icon` et `label` par défaut en découlent mais restent
   * personnalisables (voir createAccount/updateAccount).
   */
  ACCOUNT_TYPES = [
    { id: 'cash', label: 'Espèces', icon: 'cash' },
    { id: 'bank', label: 'Banque', icon: 'bank' },
    { id: 'mvola', label: 'MVola', icon: 'mobileMoney' },
    { id: 'orange_money', label: 'Orange Money', icon: 'mobileMoney' },
    { id: 'airtel_money', label: 'Airtel Money', icon: 'mobileMoney' },
    { id: 'savings', label: 'Épargne', icon: 'piggyBank' },
    { id: 'card', label: 'Carte', icon: 'creditCard' },
    { id: 'investment', label: 'Investissement', icon: 'briefcase' },
    { id: 'other', label: 'Autre', icon: 'box' },
  ];

  /** Type de compte par défaut/inconnu (comptes créés avant l'introduction de `type`). */
  DEFAULT_ACCOUNT_TYPE = 'other';

  getAccountTypeInfo(typeId) {
    return this.ACCOUNT_TYPES.find((t) => t.id === typeId) ?? this.ACCOUNT_TYPES.find((t) => t.id === this.DEFAULT_ACCOUNT_TYPE);
  }

  /** Garantit qu'au moins un compte existe ("Principal"), sans écraser des comptes déjà créés. */
  _ensureDefaultAccount() {
    if (this.state.accounts.length > 0) return;
    const now = new Date().toISOString();
    this.set({
      accounts: [{ id: this.DEFAULT_ACCOUNT_ID, name: 'Principal', type: 'cash', icon: 'cash', createdAt: now }],
    });
  }

  /** Id de compte effectif d'une transaction, même si accountId est absent (anciennes transactions). */
  _effectiveAccountId(transaction) {
    return transaction.accountId || this.DEFAULT_ACCOUNT_ID;
  }

  /**
   * Crée un compte. fields: { name, type, icon }
   * type: un id de ACCOUNT_TYPES (facultatif — retombe sur DEFAULT_ACCOUNT_TYPE).
   * icon: facultatif — si absent, reprend l'icône par défaut du type.
   * name: facultatif — si absent, reprend le libellé par défaut du type.
   */
  createAccount(fields) {
    this._ensureDefaultAccount();
    const id = uid('acc');
    const typeInfo = this.getAccountTypeInfo(fields.type);
    const account = {
      id,
      name: fields.name?.trim() || typeInfo.label,
      type: typeInfo.id,
      icon: fields.icon || typeInfo.icon,
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

  /** Type effectif d'un compte, même pour les comptes créés avant l'introduction de `type`. */
  _effectiveAccountType(account) {
    return account.type || this.DEFAULT_ACCOUNT_TYPE;
  }

  /**
   * Nombre de transactions liées à un compte (source, destination d'un
   * transfert, ou anciennes transactions sans accountId si `id` est le compte
   * par défaut). Utilisé par l'écran Comptes pour proposer un choix explicite
   * avant suppression (voir deleteAccount ci-dessous).
   */
  countAccountTransactions(id) {
    return this.state.transactions.filter(
      (t) => this._effectiveAccountId(t) === id || t.toAccountId === id,
    ).length;
  }

  /**
   * Supprime un compte. Refuse de supprimer le dernier compte restant (il en
   * faut toujours au moins un).
   *
   * fields.mode détermine ce qu'il advient des transactions de ce compte :
   *   - 'reassign' (défaut) : réassignées à un AUTRE compte réellement existant.
   *   - 'delete' : supprimées avec le compte.
   *
   * BUGFIX : l'ancienne version réassignait toujours vers DEFAULT_ACCOUNT_ID
   * codé en dur, y compris quand ce compte par défaut avait déjà été supprimé
   * lui-même — les transactions se retrouvaient alors rattachées à un id de
   * compte qui n'existe plus dans `accounts` (compte fantôme) : invisibles
   * dans tous les soldes par compte, tout en restant comptées dans le solde
   * total, ce qui donnait l'impression d'argent qui apparaît/disparaît. Le
   * fallback est maintenant toujours choisi parmi les comptes qui existeront
   * réellement après la suppression, et _ensureDefaultAccount() est rappelé
   * après coup pour ne jamais laisser l'app sans aucun compte.
   */
  deleteAccount(id, fields = {}) {
    this._ensureDefaultAccount();
    if (this.state.accounts.length <= 1) {
      return { ok: false, error: 'Impossible de supprimer le dernier compte restant.' };
    }
    const remainingAccounts = this.state.accounts.filter((a) => a.id !== id);
    const mode = fields.mode === 'delete' ? 'delete' : 'reassign';

    if (mode === 'delete') {
      this.set({
        accounts: remainingAccounts,
        transactions: this.state.transactions.filter(
          (t) => this._effectiveAccountId(t) !== id && t.toAccountId !== id,
        ),
        // FinancialGoal n'a pas encore de champ accountId (prévu pour une
        // phase ultérieure — "compte associé" à l'objectif) ; ce mapping est
        // sans effet aujourd'hui mais évite un id orphelin dès que ce champ
        // existera, sans qu'il faille revenir corriger deleteAccount.
        financialGoals: this.state.financialGoals.map((g) => (g.accountId === id ? { ...g, accountId: null } : g)),
      });
      this._ensureDefaultAccount();
      return { ok: true };
    }

    // 'reassign' : le compte de repli doit être un compte qui existera
    // vraiment après la suppression — jamais un id codé en dur qui pourrait
    // ne plus exister (voir bugfix ci-dessus).
    const fallbackId = remainingAccounts[0]?.id;
    if (!fallbackId) {
      // Ne devrait pas arriver (garde-fou length<=1 plus haut), mais on refuse
      // plutôt que de produire un fallback invalide.
      return { ok: false, error: 'Impossible de supprimer le dernier compte restant.' };
    }
    this.set({
      accounts: remainingAccounts,
      transactions: this.state.transactions
        .map((t) => {
          const reassignedAccountId = this._effectiveAccountId(t) === id ? fallbackId : t.accountId;
          const reassignedToAccountId = t.toAccountId === id ? fallbackId : t.toAccountId;
          if (reassignedAccountId === t.accountId && reassignedToAccountId === t.toAccountId) return t;
          return { ...t, accountId: reassignedAccountId, toAccountId: reassignedToAccountId };
        })
        // Un transfert dont la source et la destination coïncideraient après
        // réassignation (les deux comptes d'origine supprimés/fusionnés vers le
        // même compte de repli) n'a plus de sens : on le retire plutôt que de
        // laisser une transaction invalide.
        .filter((t) => !(t.type === 'transfer' && t.accountId === t.toAccountId)),
      // Voir remarque équivalente dans le mode 'delete' ci-dessus.
      financialGoals: this.state.financialGoals.map((g) => (g.accountId === id ? { ...g, accountId: fallbackId } : g)),
    });
    return { ok: true };
  }


  getAccount(id) {
    this._ensureDefaultAccount();
    return this.state.accounts.find((a) => a.id === id) ?? null;
  }

  /** Comptes tels que stockés, mais avec `type`/`icon` garantis (comptes créés avant l'introduction de `type`). */
  listAccounts() {
    this._ensureDefaultAccount();
    return this.state.accounts.map((a) => {
      const type = this._effectiveAccountType(a);
      return { ...a, type, icon: a.icon || this.getAccountTypeInfo(type).icon };
    });
  }

  /**
   * Solde d'un compte : revenus - dépenses, plus transferts entrants - transferts
   * sortants, toutes périodes confondues. Un transfert ne compte jamais comme
   * revenu ou dépense (voir getMoneyStats), il ne fait que déplacer le solde
   * d'un compte à l'autre.
   */
  getAccountBalance(id) {
    return this.state.transactions.reduce((s, t) => {
      if (t.type === 'transfer') {
        if (this._effectiveAccountId(t) === id) return s - t.amount;
        if (t.toAccountId === id) return s + t.amount;
        return s;
      }
      if (this._effectiveAccountId(t) !== id) return s;
      return s + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
  }

  // ============================================================
  // MONEY — MoneyTransaction (CRUD) + stats
  // ============================================================

  /**
   * Crée une MoneyTransaction.
   * fields: { type, amount, category, subcategory, note, date, accountId, toAccountId }
   * type: 'income' | 'expense' | 'transfer'
   * subcategory: optionnel — id d'une sous-catégorie de `category`, ou absent. Sans objet pour un transfert.
   * accountId: optionnel — si absent, retombe sur le compte par défaut. Pour un transfert, c'est le compte source.
   * toAccountId: requis si type === 'transfer' — le compte destination. Doit être différent de accountId.
   * Retourne l'id créé, ou null si un transfert est invalide (comptes source/destination identiques ou destination manquante).
   */
  createTransaction(fields) {
    this._ensureDefaultAccount();
    const type = ['income', 'expense', 'transfer'].includes(fields.type) ? fields.type : 'expense';
    const accountId = fields.accountId || this.DEFAULT_ACCOUNT_ID;

    if (type === 'transfer') {
      const toAccountId = fields.toAccountId || null;
      if (!toAccountId || toAccountId === accountId) return null;
      const id = uid('tx');
      const now = new Date().toISOString();
      const transaction = {
        id,
        type: 'transfer',
        amount: Math.abs(Number(fields.amount) || 0),
        category: null,
        subcategory: null,
        note: fields.note?.trim() || '',
        date: fields.date || now.slice(0, 10),
        accountId,
        toAccountId,
        createdAt: now,
        updatedAt: now,
      };
      this.set({ transactions: [transaction, ...this.state.transactions] });
      return id;
    }

    const id = uid('tx');
    const now = new Date().toISOString();
    const transaction = {
      id,
      type,
      amount: Math.abs(Number(fields.amount) || 0),
      category: fields.category || 'autre',
      subcategory: fields.subcategory || null,
      note: fields.note?.trim() || '',
      date: fields.date || now.slice(0, 10),
      accountId,
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
    if (!before) return;
    const nextType = patch.type ?? before.type;
    const nextAccountId = patch.accountId ?? before.accountId;
    const nextToAccountId = patch.toAccountId ?? before.toAccountId;
    // Un transfert doit toujours avoir deux comptes distincts — refuse silencieusement
    // une modification qui rendrait la transaction incohérente plutôt que de la corrompre.
    if (nextType === 'transfer' && (!nextToAccountId || nextToAccountId === nextAccountId)) return;
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

  /** Transactions triées, optionnellement filtrées par compte (source, destination, ou classique). */
  listTransactions(accountId = null) {
    const all = accountId
      ? this.state.transactions.filter((t) => this._effectiveAccountId(t) === accountId || t.toAccountId === accountId)
      : this.state.transactions;
    return all
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Résumé financier simple sur une fenêtre de `days` jours (0 = toutes les données) :
   * total entrées, total sorties, solde net, répartition par catégorie.
   * `accountId` optionnel : restreint tout le calcul (y compris le solde) à un seul compte.
   * Un transfert n'est jamais compté comme revenu/dépense (voir totalIncome/totalExpense/byCategory/count),
   * mais impacte bien le solde du ou des comptes concernés.
   */
  getMoneyStats(days = 30, accountId = null) {
    const scoped = accountId
      ? this.state.transactions.filter((t) => this._effectiveAccountId(t) === accountId || t.toAccountId === accountId)
      : this.state.transactions;
    const entries = days > 0
      ? scoped.filter((t) => new Date(t.date).getTime() >= Date.now() - days * 86400000)
      : scoped;

    const totalIncome = entries.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = entries.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    // Ne compte que les vraies transactions (revenu/dépense) — un transfert n'en est pas une.
    const nonTransferCount = entries.filter((t) => t.type !== 'transfer').length;

    const byCategory = entries
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {});

    // Solde toutes périodes confondues (pas seulement la fenêtre), du champ scoped.
    const balance = accountId != null
      ? this.getAccountBalance(accountId)
      : scoped.reduce((s, t) => s + (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0), 0);

    return {
      days,
      count: nonTransferCount,
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
  /**
   * Début de la "période budgétaire" en cours, selon walletSettings.budgetMonthStartDay
   * (par défaut le 1er du mois calendaire). Si le jour configuré n'est pas encore
   * atteint ce mois-ci, la période a commencé le mois précédent à ce même jour.
   */
  _budgetPeriodStart(now = new Date()) {
    const day = Math.min(28, Math.max(1, Number(this.state.walletSettings?.budgetMonthStartDay) || 1));
    const candidate = new Date(now.getFullYear(), now.getMonth(), day);
    if (candidate.getTime() > now.getTime()) {
      return new Date(now.getFullYear(), now.getMonth() - 1, day).getTime();
    }
    return candidate.getTime();
  }

  getBudgetProgress() {
    const monthStart = this._budgetPeriodStart();
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
        const isOver = spent > b.monthlyLimit;
        // 'attention' à 85% du budget consommé (seuil arbitraire mais documenté
        // ici en un seul endroit, pour que tout écran qui affiche un statut de
        // budget ait exactement le même comportement).
        const status = isOver ? 'over' : pct >= 85 ? 'warning' : 'normal';
        return {
          category: b.category,
          monthlyLimit: b.monthlyLimit,
          spent,
          remaining: Math.max(0, b.monthlyLimit - spent),
          pct,
          isOver,
          status, // 'normal' | 'warning' | 'over'
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
  /**
   * Historique du solde total cumulé (tous comptes confondus), jour par jour.
   * Un transfert ne change pas le solde total (il ne fait que déplacer l'argent
   * d'un compte à l'autre), donc il n'entre pas dans le cumul ci-dessous.
   */
  getBalanceHistory(days = 30) {
    const all = this.state.transactions.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    if (!all.length) return [];
    const since = days > 0 ? Date.now() - days * 86400000 : -Infinity;

    // Solde cumulé de départ = tout ce qui précède la fenêtre affichée.
    let running = 0;
    const byDay = {};
    all.forEach((t) => {
      if (t.type === 'transfer') return;
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
  // MONEY — Statistiques avancées (catégories, périodes, comparaisons)
  // ============================================================
  //
  // Tout le calcul reste ici, dans le store : StatsScreen.js ne fait
  // qu'afficher ce que ces méthodes renvoient. Comme partout ailleurs dans
  // Money, un transfert (type 'transfer') n'est jamais compté comme un
  // revenu/dépense ni ventilé par catégorie (il n'a d'ailleurs pas de
  // catégorie), mais il impacte bien le solde d'un compte donné — voir
  // getBalanceHistoryRange(accountId) plus bas pour la vue "par compte" où
  // les transferts sont inclus, contrairement à getBalanceHistory() (solde
  // total) où ils s'annulent par construction et sont donc exclus.

  /**
   * Ventilation par catégorie ET par type (dépense/revenu), sur les
   * transactions déjà filtrées par l'appelant (fenêtre de dates + compte).
   * Contrairement à getMoneyStats().byCategory (dépenses uniquement, conservé
   * tel quel pour ne pas casser MoneyHome), celle-ci couvre aussi les revenus.
   */
  _breakdownByCategory(entries) {
    const byCategoryExpense = entries
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {});
    const byCategoryIncome = entries
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {});
    return { byCategoryExpense, byCategoryIncome };
  }

  /**
   * Transactions filtrées combinées compte + catégorie + fenêtre de dates
   * libres (startDate/endDate au format YYYY-MM-DD, toutes deux optionnelles).
   * accountId et categoryId sont optionnels (null = pas de filtre sur cet axe).
   * Un transfert n'a pas de catégorie : il est exclu dès qu'un filtre catégorie
   * est actif, mais reste inclus si categoryId est null (pertinent pour un
   * filtre par compte seul, où le transfert impacte bien ce compte).
   */
  _filterTransactions({ accountId = null, categoryId = null, startDate = null, endDate = null } = {}) {
    return this.state.transactions.filter((t) => {
      if (accountId && this._effectiveAccountId(t) !== accountId && t.toAccountId !== accountId) return false;
      if (categoryId && t.category !== categoryId) return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });
  }

  /**
   * Statistiques combinées, filtrées par compte ET/OU catégorie ET/OU fenêtre
   * de dates libres en même temps (les trois filtres sont indépendants et
   * cumulables). Complète getMoneyStats() (qui reste inchangée) avec
   * byCategoryIncome et un filtre catégorie que getMoneyStats() n'a pas.
   * fields: { accountId, categoryId, startDate, endDate }
   */
  getFilteredMoneyStats(fields = {}) {
    const entries = this._filterTransactions(fields);
    const totalIncome = entries.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = entries.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const nonTransferCount = entries.filter((t) => t.type !== 'transfer').length;
    const { byCategoryExpense, byCategoryIncome } = this._breakdownByCategory(entries);
    return {
      count: nonTransferCount,
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      byCategoryExpense,
      byCategoryIncome,
    };
  }

  /**
   * Historique du solde cumulé jour par jour sur une fenêtre de dates libres
   * (startDate/endDate au format YYYY-MM-DD, toutes deux optionnelles — comme
   * getBalanceHistory, une borne absente couvre depuis/jusqu'au bout de
   * l'historique). accountId optionnel : restreint le cumul au solde de ce
   * seul compte, transferts entrants/sortants inclus (voir getAccountBalance),
   * contrairement au solde total où ils s'annulent et sont exclus.
   */
  getBalanceHistoryRange(startDate = null, endDate = null, accountId = null) {
    const all = this.state.transactions.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    if (!all.length) return [];

    let running = 0;
    const byDay = {};
    all.forEach((t) => {
      let delta = 0;
      if (accountId) {
        if (t.type === 'transfer') {
          if (this._effectiveAccountId(t) === accountId) delta = -t.amount;
          else if (t.toAccountId === accountId) delta = t.amount;
          else return;
        } else {
          if (this._effectiveAccountId(t) !== accountId) return;
          delta = t.type === 'income' ? t.amount : -t.amount;
        }
      } else {
        if (t.type === 'transfer') return; // s'annule toujours au niveau du solde total, voir getBalanceHistory
        delta = t.type === 'income' ? t.amount : -t.amount;
      }
      running += delta;
      if ((!startDate || t.date >= startDate) && (!endDate || t.date <= endDate)) {
        byDay[t.date.slice(0, 10)] = running;
      }
    });

    return Object.keys(byDay)
      .sort()
      .map((day) => ({ date: day, value: byDay[day] }));
  }

  /** Bornes YYYY-MM-DD [start, end] d'un mois calendaire donné (0-indexé comme Date.getMonth()). */
  _monthRange(year, month) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0); // dernier jour du mois
    return { start: this.todayKey(start), end: this.todayKey(end) };
  }

  /** Bornes YYYY-MM-DD [start, end] de la semaine calendaire (lundi-dimanche) contenant `date`. */
  _weekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay(); // 0 = dimanche
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(d);
    start.setDate(d.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: this.todayKey(start), end: this.todayKey(end) };
  }

  /** Bornes YYYY-MM-DD [start, end] de l'année calendaire contenant `date`. */
  _yearRange(date = new Date()) {
    const year = date.getFullYear();
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }

  /**
   * Stats sur une période calendaire complète : 'week' | 'month' | 'year',
   * ancrée sur `date` (aujourd'hui par défaut). Vient compléter la fenêtre
   * en jours glissants de getMoneyStats (7j/30j/tout) par des périodes
   * calendaires exactes. accountId/categoryId optionnels, cumulables.
   */
  getPeriodStats(period = 'month', date = new Date(), { accountId = null, categoryId = null } = {}) {
    const range = period === 'week' ? this._weekRange(date) : period === 'year' ? this._yearRange(date) : this._monthRange(date.getFullYear(), date.getMonth());
    return {
      period,
      ...range,
      ...this.getFilteredMoneyStats({ accountId, categoryId, startDate: range.start, endDate: range.end }),
    };
  }

  /**
   * Compare deux mois calendaires (par défaut : mois courant vs précédent).
   * monthA/monthB : { year, month } (month 0-indexé) — si omis, monthA = mois
   * courant et monthB = mois précédent. accountId optionnel, cumulable.
   * Renvoie les stats des deux mois plus des deltas (absolu + %, null si le
   * mois de référence B vaut 0, pour éviter une division par zéro trompeuse).
   */
  getMonthComparison(monthA = null, monthB = null, accountId = null) {
    const now = new Date();
    const a = monthA ?? { year: now.getFullYear(), month: now.getMonth() };
    const prevDate = new Date(a.year, a.month - 1, 1);
    const b = monthB ?? { year: prevDate.getFullYear(), month: prevDate.getMonth() };

    const rangeA = this._monthRange(a.year, a.month);
    const rangeB = this._monthRange(b.year, b.month);
    const statsA = this.getFilteredMoneyStats({ accountId, startDate: rangeA.start, endDate: rangeA.end });
    const statsB = this.getFilteredMoneyStats({ accountId, startDate: rangeB.start, endDate: rangeB.end });

    const pctDelta = (valA, valB) => (valB ? Math.round(((valA - valB) / valB) * 100) : null);

    return {
      a: { year: a.year, month: a.month, ...rangeA, ...statsA },
      b: { year: b.year, month: b.month, ...rangeB, ...statsB },
      deltaIncome: statsA.totalIncome - statsB.totalIncome,
      deltaExpense: statsA.totalExpense - statsB.totalExpense,
      deltaNet: statsA.net - statsB.net,
      pctIncome: pctDelta(statsA.totalIncome, statsB.totalIncome),
      pctExpense: pctDelta(statsA.totalExpense, statsB.totalExpense),
    };
  }

  /**
   * Répartition par catégorie comparée entre deux mêmes fenêtres de dates
   * (utile pour "quelle catégorie a le plus varié"). type: 'expense' | 'income'.
   * Renvoie un tableau trié par |delta| décroissant, une entrée par catégorie
   * apparue dans au moins une des deux périodes.
   */
  getCategoryComparison(type, rangeA, rangeB, accountId = null) {
    const key = type === 'income' ? 'byCategoryIncome' : 'byCategoryExpense';
    const statsA = this.getFilteredMoneyStats({ accountId, startDate: rangeA.startDate, endDate: rangeA.endDate })[key];
    const statsB = this.getFilteredMoneyStats({ accountId, startDate: rangeB.startDate, endDate: rangeB.endDate })[key];
    const ids = new Set([...Object.keys(statsA), ...Object.keys(statsB)]);
    return Array.from(ids)
      .map((id) => {
        const amountA = statsA[id] ?? 0;
        const amountB = statsB[id] ?? 0;
        return { category: id, amountA, amountB, delta: amountA - amountB };
      })
      .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
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
  // MONEY — Debt (dettes / prêts entre particuliers, CRUD + remboursements)
  // ============================================================
  //
  // Deux sens possibles (direction) :
  //   'lent'     — "J'ai prêté" : argent prêté à quelqu'un, on attend un remboursement.
  //   'borrowed' — "On m'a prêté" : argent emprunté à quelqu'un, on doit rembourser.
  // Le statut stocké ne connaît que 'active' | 'completed' (comme FinancialGoal) ;
  // 'partial' et 'late' sont toujours dérivés à la volée par getDebtComputedStatus(),
  // jamais écrits en dur, pour rester exacts même si la deadline passe sans qu'on
  // rouvre l'app. Un remboursement peut optionnellement être rattaché à un compte :
  // dans ce cas on passe par createTransaction() (voir addDebtRepayment) plutôt que
  // de toucher au solde nous-mêmes, pour ne jamais dupliquer cette logique.

  DEBT_DIRECTIONS = [
    { id: 'lent', label: "J'ai prêté" },
    { id: 'borrowed', label: 'On m\'a prêté' },
  ];

  getDebtDirectionInfo(directionId) {
    return this.DEBT_DIRECTIONS.find((d) => d.id === directionId) ?? this.DEBT_DIRECTIONS[0];
  }

  /**
   * Crée une Debt.
   * fields: { direction, person, amount, date, dueDate, note }
   * direction: 'lent' | 'borrowed' (par défaut 'lent' si absent/invalide)
   */
  createDebt(fields) {
    const id = uid('debt');
    const now = new Date().toISOString();
    const direction = this.DEBT_DIRECTIONS.some((d) => d.id === fields.direction) ? fields.direction : 'lent';
    const debt = {
      id,
      direction,
      person: fields.person?.trim() || 'Sans nom',
      amount: Math.max(0, Number(fields.amount) || 0),
      date: fields.date || now.slice(0, 10),
      dueDate: fields.dueDate || '',
      note: fields.note?.trim() || '',
      status: 'active', // active | completed — voir getDebtComputedStatus() pour l'affichage réel (Actif / Partiel / Remboursé / En retard)
      repayments: [], // { id, amount, date, note, accountId }
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    this.set({ debts: [debt, ...this.state.debts] });
    return id;
  }

  updateDebt(id, patch) {
    this.set({
      debts: this.state.debts.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d)),
    });
  }

  /**
   * Supprime une dette. Les remboursements déjà liés à un compte (voir
   * addDebtRepayment) ont créé une MoneyTransaction indépendante : elle n'est
   * jamais supprimée automatiquement, pour ne pas faire disparaître un
   * mouvement d'argent réel du solde du compte.
   */
  deleteDebt(id) {
    this.set({ debts: this.state.debts.filter((d) => d.id !== id) });
  }

  getDebt(id) {
    return this.state.debts.find((d) => d.id === id) ?? null;
  }

  listDebts() {
    return this.state.debts
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /** Somme des remboursements déjà enregistrés pour une dette. */
  _debtRepaidAmount(debt) {
    return debt.repayments.reduce((s, r) => s + r.amount, 0);
  }

  /** Solde restant dû, jamais négatif. */
  getDebtRemainingAmount(debt) {
    return Math.max(0, debt.amount - this._debtRepaidAmount(debt));
  }

  /**
   * Statut affiché, toujours recalculé (jamais stocké) :
   * 'late' si échéance dépassée et solde restant > 0 (prioritaire sur 'partial'),
   * sinon 'completed' si solde restant à 0, 'partial' si un remboursement partiel
   * existe déjà, 'active' sinon.
   */
  getDebtComputedStatus(debt) {
    const remaining = this.getDebtRemainingAmount(debt);
    if (remaining <= 0) return 'completed';
    const isLate = !!debt.dueDate && new Date(debt.dueDate).getTime() < new Date(this.todayKey()).getTime();
    if (isLate) return 'late';
    if (this._debtRepaidAmount(debt) > 0) return 'partial';
    return 'active';
  }

  DEBT_STATUS_LABELS = {
    active: 'Actif',
    partial: 'Partiel',
    completed: 'Remboursé',
    late: 'En retard',
  };

  /**
   * Ajoute un remboursement (apport) à une dette, sur le modèle exact des
   * contributions de FinancialGoal. amount > 0 requis.
   * fields: { amount, date, note, accountId } — accountId est optionnel : si fourni,
   * crée aussi une MoneyTransaction réelle sur ce compte (voir plus bas) plutôt que
   * de ne toucher qu'au solde restant de la dette.
   *   direction 'lent'     (on nous rembourse)  → transaction de type 'income' sur ce compte.
   *   direction 'borrowed' (on rembourse)        → transaction de type 'expense' sur ce compte.
   */
  addDebtRepayment(debtId, fields) {
    const debt = this.getDebt(debtId);
    const amount = Number(fields?.amount);
    if (!debt || !amount || amount <= 0) return null;

    let transactionId = null;
    if (fields.accountId) {
      transactionId = this.createTransaction({
        type: debt.direction === 'lent' ? 'income' : 'expense',
        amount,
        category: 'autre',
        note: fields.note?.trim() || `Remboursement · ${debt.person}`,
        date: fields.date || undefined,
        accountId: fields.accountId,
      });
    }

    const repayment = {
      id: uid('rep'),
      amount,
      date: fields.date || new Date().toISOString().slice(0, 10),
      note: fields.note?.trim() || '',
      accountId: fields.accountId || null,
      transactionId,
    };
    const repayments = [repayment, ...debt.repayments];
    const wasCompleted = this.getDebtComputedStatus(debt) === 'completed';
    const isNowComplete = this.getDebtRemainingAmount({ ...debt, repayments }) <= 0;
    this.updateDebt(debtId, {
      repayments,
      status: isNowComplete ? 'completed' : 'active',
      completedAt: isNowComplete ? (debt.completedAt ?? new Date().toISOString()) : null,
    });
    if (isNowComplete && !wasCompleted) this.addXp(15, 'action', `Dette soldée : ${debt.person}`);
    return repayment.id;
  }

  /**
   * Supprime un remboursement. La MoneyTransaction éventuellement créée par
   * addDebtRepayment n'est jamais supprimée automatiquement (même logique que
   * deleteDebt) : à faire séparément depuis l'écran Transactions si besoin.
   */
  deleteDebtRepayment(debtId, repaymentId) {
    const debt = this.getDebt(debtId);
    if (!debt) return;
    const removed = debt.repayments.find((r) => r.id === repaymentId);
    if (!removed) return;
    const repayments = debt.repayments.filter((r) => r.id !== repaymentId);
    const wasCompleted = this.getDebtComputedStatus(debt) === 'completed';
    const isNowComplete = this.getDebtRemainingAmount({ ...debt, repayments }) <= 0;
    this.updateDebt(debtId, {
      repayments,
      status: isNowComplete ? 'completed' : 'active',
      completedAt: isNowComplete ? (debt.completedAt ?? new Date().toISOString()) : null,
    });
    if (!isNowComplete && wasCompleted) this.addXp(-15, 'action', `Dette rouverte : ${debt.person}`);
  }

  /**
   * Dettes filtrées par direction ('lent' | 'borrowed' | null = toutes) et/ou
   * statut calculé ('active' | 'partial' | 'completed' | 'late' | null = tous).
   */
  listDebtsFiltered(direction = null, status = null) {
    return this.listDebts().filter((d) => {
      if (direction && d.direction !== direction) return false;
      if (status && this.getDebtComputedStatus(d) !== status) return false;
      return true;
    });
  }

  /** Totaux utiles pour un résumé rapide : montant restant dû par direction, toutes dettes actives/partielles/en retard confondues. */
  getDebtsSummary() {
    const open = this.state.debts.filter((d) => this.getDebtRemainingAmount(d) > 0);
    const totalLent = open.filter((d) => d.direction === 'lent').reduce((s, d) => s + this.getDebtRemainingAmount(d), 0);
    const totalBorrowed = open.filter((d) => d.direction === 'borrowed').reduce((s, d) => s + this.getDebtRemainingAmount(d), 0);
    const lateCount = open.filter((d) => this.getDebtComputedStatus(d) === 'late').length;
    return { totalLent, totalBorrowed, lateCount };
  }

  // ============================================================
  // MONEY — Investment (positions réelles, distinctes du type de compte 'investment')
  // ============================================================
  //
  // Un MoneyAccount de type 'investment' représente un compte financier (ex:
  // "Compte titres"). Un Investment représente une position/placement réel
  // (ex: 50 actions X, un appartement, une part de business), avec un capital
  // investi et une valeur actuelle qui divergent dans le temps. accountId est
  // optionnel : un investissement n'est pas forcément rattaché à un compte
  // suivi dans Wallet (ex: business personnel, immobilier).

  INVESTMENT_TYPES = [
    { id: 'stocks', label: 'Actions' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'realestate', label: 'Immobilier' },
    { id: 'business', label: 'Business' },
    { id: 'savings', label: 'Épargne/Placement' },
    { id: 'bonds', label: 'Obligations' },
    { id: 'funds', label: 'Fonds' },
    { id: 'other', label: 'Autre' },
  ];

  getInvestmentTypeInfo(typeId) {
    return this.INVESTMENT_TYPES.find((t) => t.id === typeId) ?? this.INVESTMENT_TYPES[this.INVESTMENT_TYPES.length - 1];
  }

  /**
   * Crée un Investment.
   * fields: { name, type, initialAmount, currentValue, date, accountId, notes }
   * Si currentValue est omis, on part du principe qu'aucune évolution n'a
   * encore été constatée : currentValue = initialAmount (gain 0, jamais une
   * valeur inventée).
   */
  createInvestment(fields) {
    const id = uid('inv');
    const now = new Date().toISOString();
    const initialAmount = Math.max(0, Number(fields.initialAmount) || 0);
    const currentValue = fields.currentValue != null && fields.currentValue !== ''
      ? Math.max(0, Number(fields.currentValue) || 0)
      : initialAmount;
    const investment = {
      id,
      name: fields.name?.trim() || 'Investissement sans nom',
      type: this.INVESTMENT_TYPES.some((t) => t.id === fields.type) ? fields.type : 'other',
      initialAmount,
      currentValue,
      date: fields.date || now.slice(0, 10),
      accountId: fields.accountId || null,
      notes: fields.notes?.trim() || '',
      // Historique de valeur — un point ajouté uniquement quand l'utilisateur
      // met à jour currentValue via updateInvestment (voir plus bas). Vide à
      // la création : pas de faux historique fabriqué.
      valueHistory: [{ id: uid('ivh'), value: currentValue, date: now }],
      createdAt: now,
      updatedAt: now,
    };
    this.set({ investments: [investment, ...this.state.investments] });
    return id;
  }

  /**
   * Met à jour un Investment. Si patch.currentValue change réellement la
   * valeur par rapport à l'existant, un point est ajouté à valueHistory —
   * c'est la seule façon dont l'historique grandit (jamais de génération
   * automatique de points intermédiaires).
   */
  updateInvestment(id, patch) {
    const existing = this.getInvestment(id);
    if (!existing) return;
    const next = { ...patch };
    if (next.currentValue != null) {
      next.currentValue = Math.max(0, Number(next.currentValue) || 0);
      if (next.currentValue !== existing.currentValue) {
        next.valueHistory = [
          ...existing.valueHistory,
          { id: uid('ivh'), value: next.currentValue, date: new Date().toISOString() },
        ];
      }
    }
    if (next.initialAmount != null) next.initialAmount = Math.max(0, Number(next.initialAmount) || 0);
    this.set({
      investments: this.state.investments.map((inv) => (inv.id === id ? { ...inv, ...next, updatedAt: new Date().toISOString() } : inv)),
    });
  }

  deleteInvestment(id) {
    this.set({ investments: this.state.investments.filter((inv) => inv.id !== id) });
  }

  getInvestment(id) {
    return this.state.investments.find((inv) => inv.id === id) ?? null;
  }

  getInvestments() {
    return this.state.investments
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /** Gain/perte en valeur absolue : valeur actuelle - capital investi. */
  getInvestmentGain(investment) {
    return investment.currentValue - investment.initialAmount;
  }

  /** Performance en % : ((valeur actuelle - capital investi) / capital investi) × 100. 0 si capital investi = 0 (division impossible, pas une perte infinie). */
  getInvestmentPerformance(investment) {
    if (!investment.initialAmount) return 0;
    return ((investment.currentValue - investment.initialAmount) / investment.initialAmount) * 100;
  }

  /**
   * Résumé global de tous les investissements : capital total, valeur
   * actuelle totale, gain/perte total, et performance globale calculée sur
   * les totaux réels (pas une moyenne des performances individuelles, qui
   * fausserait le résultat si les montants investis diffèrent beaucoup).
   */
  getInvestmentsSummary() {
    const list = this.state.investments;
    const totalInitial = list.reduce((s, inv) => s + inv.initialAmount, 0);
    const totalCurrent = list.reduce((s, inv) => s + inv.currentValue, 0);
    const totalGain = totalCurrent - totalInitial;
    const globalPerformance = totalInitial ? (totalGain / totalInitial) * 100 : 0;
    return { totalInitial, totalCurrent, totalGain, globalPerformance, count: list.length };
  }

  // ============================================================
  // MONEY — ShoppingItem (liste d'achats)
  // ============================================================

  SHOPPING_PRIORITIES = [
    { id: 'high', label: 'Haute' },
    { id: 'medium', label: 'Moyenne' },
    { id: 'low', label: 'Basse' },
  ];

  getShoppingPriorityInfo(priorityId) {
    return this.SHOPPING_PRIORITIES.find((p) => p.id === priorityId) ?? this.SHOPPING_PRIORITIES[1];
  }

  /**
   * Crée un ShoppingItem.
   * fields: { name, quantity, estimatedPrice, category, priority, date, notes }
   */
  createShoppingItem(fields) {
    const id = uid('shop');
    const now = new Date().toISOString();
    const item = {
      id,
      name: fields.name?.trim() || 'Article sans nom',
      quantity: Math.max(1, Math.round(Number(fields.quantity)) || 1),
      estimatedPrice: Math.max(0, Number(fields.estimatedPrice) || 0),
      category: fields.category?.trim() || '',
      priority: this.SHOPPING_PRIORITIES.some((p) => p.id === fields.priority) ? fields.priority : 'medium',
      bought: false,
      date: fields.date || now.slice(0, 10),
      notes: fields.notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
      boughtAt: null,
    };
    this.set({ shoppingItems: [item, ...this.state.shoppingItems] });
    return id;
  }

  updateShoppingItem(id, patch) {
    const next = { ...patch };
    if (next.quantity != null) next.quantity = Math.max(1, Math.round(Number(next.quantity)) || 1);
    if (next.estimatedPrice != null) next.estimatedPrice = Math.max(0, Number(next.estimatedPrice) || 0);
    this.set({
      shoppingItems: this.state.shoppingItems.map((it) => (it.id === id ? { ...it, ...next, updatedAt: new Date().toISOString() } : it)),
    });
  }

  deleteShoppingItem(id) {
    this.set({ shoppingItems: this.state.shoppingItems.filter((it) => it.id !== id) });
  }

  getShoppingItem(id) {
    return this.state.shoppingItems.find((it) => it.id === id) ?? null;
  }

  listShoppingItems() {
    return this.state.shoppingItems
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  setShoppingItemBought(id, bought) {
    this.updateShoppingItem(id, { bought, boughtAt: bought ? new Date().toISOString() : null });
  }

  /** Totaux estimé / acheté / restant, basés sur prix × quantité de chaque article. */
  getShoppingSummary() {
    const list = this.state.shoppingItems;
    const lineTotal = (it) => it.estimatedPrice * it.quantity;
    const totalEstimated = list.reduce((s, it) => s + lineTotal(it), 0);
    const totalBought = list.filter((it) => it.bought).reduce((s, it) => s + lineTotal(it), 0);
    const totalRemaining = totalEstimated - totalBought;
    return { totalEstimated, totalBought, totalRemaining, count: list.length };
  }

  // ============================================================
  // MONEY — Warranty (garanties de produits)
  // ============================================================

  /**
   * Statut dérivé à la volée à partir de expiryDate (jamais écrit en dur,
   * même logique que getDebtComputedStatus) : 'expired' si la date est
   * dépassée, 'expiring_soon' si elle tombe dans les 30 prochains jours,
   * sinon 'active'.
   */
  getWarrantyStatus(warranty) {
    if (!warranty.expiryDate) return 'active';
    const daysLeft = Math.ceil((new Date(warranty.expiryDate).getTime() - Date.now()) / 86400000);
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'expiring_soon';
    return 'active';
  }

  /** Jours restants avant expiration (négatif si déjà expirée). */
  getWarrantyDaysLeft(warranty) {
    if (!warranty.expiryDate) return null;
    return Math.ceil((new Date(warranty.expiryDate).getTime() - Date.now()) / 86400000);
  }

  /**
   * Crée une Warranty.
   * fields: { product, category, purchaseDate, purchasePrice, seller, expiryDate, reference, notes }
   */
  createWarranty(fields) {
    const id = uid('war');
    const now = new Date().toISOString();
    const warranty = {
      id,
      product: fields.product?.trim() || 'Produit sans nom',
      category: fields.category?.trim() || '',
      purchaseDate: fields.purchaseDate || now.slice(0, 10),
      purchasePrice: Math.max(0, Number(fields.purchasePrice) || 0),
      seller: fields.seller?.trim() || '',
      expiryDate: fields.expiryDate || '',
      reference: fields.reference?.trim() || '',
      notes: fields.notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };
    this.set({ warranties: [warranty, ...this.state.warranties] });
    return id;
  }

  updateWarranty(id, patch) {
    this.set({
      warranties: this.state.warranties.map((w) => (w.id === id ? { ...w, ...patch, updatedAt: new Date().toISOString() } : w)),
    });
  }

  deleteWarranty(id) {
    this.set({ warranties: this.state.warranties.filter((w) => w.id !== id) });
  }

  getWarranty(id) {
    return this.state.warranties.find((w) => w.id === id) ?? null;
  }

  listWarranties() {
    return this.state.warranties
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /** Compte par statut, utile pour les filtres/badges de WarrantiesScreen. */
  getWarrantiesSummary() {
    const list = this.state.warranties;
    return {
      total: list.length,
      active: list.filter((w) => this.getWarrantyStatus(w) === 'active').length,
      expiringSoon: list.filter((w) => this.getWarrantyStatus(w) === 'expiring_soon').length,
      expired: list.filter((w) => this.getWarrantyStatus(w) === 'expired').length,
    };
  }

  // ============================================================
  // MONEY — ScheduledPayment (paiements planifiés / récurrents)
  // ============================================================
  //
  // Un paiement planifié est un modèle réutilisable (loyer, internet,
  // salaire, ...) qui NE crée jamais de MoneyTransaction tout seul : il faut
  // que l'utilisateur confirme explicitement l'échéance due (voir
  // confirmScheduledPayment) pour qu'une transaction réelle soit créée via
  // createTransaction(), exactement comme si elle avait été saisie à la
  // main. C'est volontaire : aucune automatisation silencieuse qui viendrait
  // fausser les soldes de comptes sans que l'utilisateur l'ait vu passer.
  //
  // `autoCreate` (false par défaut, voir createScheduledPayment) est le seul
  // interrupteur qui change ce comportement : s'il est activé sur un
  // paiement précis, checkDueScheduledPayments() (à appeler périodiquement,
  // même esprit que checkDueNotifications côté main.js) confirme
  // automatiquement ce paiement dès qu'il est dû, sans action utilisateur.
  // Chaque paiement garde son propre `autoCreate` : rien n'est automatique
  // globalement, seulement là où c'est explicitement choisi.

  SCHEDULED_PAYMENT_FREQUENCIES = [
    { id: 'once', label: 'Unique' },
    { id: 'weekly', label: 'Hebdomadaire' },
    { id: 'monthly', label: 'Mensuelle' },
    { id: 'yearly', label: 'Annuelle' },
  ];

  getScheduledPaymentFrequencyInfo(id) {
    return this.SCHEDULED_PAYMENT_FREQUENCIES.find((f) => f.id === id) ?? this.SCHEDULED_PAYMENT_FREQUENCIES[2];
  }

  /**
   * Crée un ScheduledPayment.
   * fields: { name, type, amount, accountId, category, subcategory, frequency, nextDueDate, reminderDays, autoCreate }
   * type: 'income' | 'expense'. category : id d'une catégorie existante (voir listCategories),
   * cohérente avec `type` — même logique de repli que createTransaction ('autre' si absent).
   */
  createScheduledPayment(fields) {
    this._ensureDefaultAccount();
    const id = uid('sp');
    const now = new Date().toISOString();
    const type = fields.type === 'income' ? 'income' : 'expense';
    const frequency = this.SCHEDULED_PAYMENT_FREQUENCIES.some((f) => f.id === fields.frequency) ? fields.frequency : 'monthly';
    const payment = {
      id,
      name: fields.name?.trim() || 'Paiement planifié',
      type,
      amount: Math.max(0, Number(fields.amount) || 0),
      accountId: fields.accountId || this.DEFAULT_ACCOUNT_ID,
      category: fields.category || 'autre',
      subcategory: fields.subcategory || null,
      frequency,
      nextDueDate: fields.nextDueDate || now.slice(0, 10),
      reminderDays: Math.max(0, Number(fields.reminderDays) || 0),
      active: fields.active !== false,
      // Désactivé par défaut : voir note en tête de section. Ne bascule jamais tout seul.
      autoCreate: fields.autoCreate === true,
      history: [], // { id, transactionId, date, amount } — une entrée par confirmation, voir confirmScheduledPayment
      createdAt: now,
      updatedAt: now,
    };
    this.set({ scheduledPayments: [payment, ...this.state.scheduledPayments] });
    return id;
  }

  updateScheduledPayment(id, patch) {
    this.set({
      scheduledPayments: this.state.scheduledPayments.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)),
    });
  }

  /** Supprime un paiement planifié. Les transactions déjà créées par confirmScheduledPayment restent (jamais supprimées rétroactivement). */
  deleteScheduledPayment(id) {
    this.set({ scheduledPayments: this.state.scheduledPayments.filter((p) => p.id !== id) });
  }

  getScheduledPayment(id) {
    return this.state.scheduledPayments.find((p) => p.id === id) ?? null;
  }

  listScheduledPayments() {
    return this.state.scheduledPayments
      .slice()
      .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));
  }

  toggleScheduledPaymentActive(id) {
    const payment = this.getScheduledPayment(id);
    if (!payment) return;
    this.updateScheduledPayment(id, { active: !payment.active });
  }

  /** Prochaine échéance après confirmation, selon la fréquence. 'once' n'a pas de suite (voir confirmScheduledPayment). */
  _advanceDueDate(dateStr, frequency) {
    const d = new Date(dateStr);
    if (frequency === 'weekly') d.setDate(d.getDate() + 7);
    else if (frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1); // 'monthly' par défaut
    return d.toISOString().slice(0, 10);
  }

  /** Paiements actifs dont l'échéance est aujourd'hui ou déjà passée. */
  getDueScheduledPayments() {
    const todayTime = new Date(this.todayKey()).getTime();
    return this.listScheduledPayments().filter((p) => p.active && new Date(p.nextDueDate).getTime() <= todayTime);
  }

  /** Paiements actifs dont le rappel (reminderDays avant l'échéance) tombe aujourd'hui ou est dépassé, mais pas encore dus. */
  getUpcomingScheduledPaymentReminders() {
    const todayTime = new Date(this.todayKey()).getTime();
    return this.listScheduledPayments().filter((p) => {
      if (!p.active) return false;
      const dueTime = new Date(p.nextDueDate).getTime();
      if (dueTime <= todayTime) return false; // déjà dû, couvert par getDueScheduledPayments
      const reminderTime = dueTime - p.reminderDays * 86400000;
      return reminderTime <= todayTime;
    });
  }

  /**
   * Confirme une échéance due : crée la MoneyTransaction réelle via
   * createTransaction() (aucune logique de solde dupliquée ici), archive la
   * confirmation dans `history`, puis avance nextDueDate selon la fréquence.
   * Une fréquence 'once' désactive le paiement après confirmation plutôt que
   * de le faire disparaître (garde son historique visible).
   * overrides: { amount, date, accountId } — optionnel, pour ajuster ponctuellement
   * un montant ou un compte sans modifier le modèle du paiement planifié.
   */
  confirmScheduledPayment(id, overrides = {}) {
    const payment = this.getScheduledPayment(id);
    if (!payment) return null;
    const amount = overrides.amount != null ? Number(overrides.amount) : payment.amount;
    if (!amount || amount <= 0) return null;
    const date = overrides.date || payment.nextDueDate;
    const accountId = overrides.accountId || payment.accountId;

    const transactionId = this.createTransaction({
      type: payment.type,
      amount,
      category: payment.category,
      subcategory: payment.subcategory,
      note: payment.name,
      date,
      accountId,
    });
    if (!transactionId) return null;

    const entry = { id: uid('sph'), transactionId, date, amount };
    const isOnce = payment.frequency === 'once';
    this.updateScheduledPayment(id, {
      history: [entry, ...payment.history],
      nextDueDate: isOnce ? payment.nextDueDate : this._advanceDueDate(payment.nextDueDate, payment.frequency),
      active: isOnce ? false : payment.active,
    });
    return transactionId;
  }

  /**
   * À appeler périodiquement (même esprit que checkDueNotifications côté main.js) :
   * confirme automatiquement tout paiement dû qui a explicitement `autoCreate: true`.
   * Les paiements dus sans autoCreate ne sont jamais touchés ici — ils attendent une
   * confirmation manuelle depuis ScheduledPaymentsScreen.
   */
  checkDueScheduledPayments() {
    this.getDueScheduledPayments()
      .filter((p) => p.autoCreate)
      .forEach((p) => this.confirmScheduledPayment(p.id));
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
      // Cas particulier : ce type n'est pertinent que s'il y a réellement un rappel de
      // paiement planifié à signaler aujourd'hui (voir getUpcomingScheduledPaymentReminders /
      // getDueScheduledPayments) — contrairement aux autres types, toujours pertinents une fois l'heure passée.
      if (typeId === 'scheduled_payment_reminder' && this.getUpcomingScheduledPaymentReminders().length === 0 && this.getDueScheduledPayments().length === 0) return;
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
      scheduled_payment_reminder: 'Un paiement planifié arrive à échéance — vérifie tes paiements planifiés.',
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
  // WALLET SETTINGS — préférences Money + export CSV + reset ciblé
  // ============================================================
  //
  // Distinct de la section SAUVEGARDE plus bas : ici, tout est scopé au
  // module Money (voir MONEY_STATE_KEYS). L'export/import JSON global de
  // toute l'app (exportData/downloadBackup/restoreBackup/eraseAllData)
  // n'est ni modifié ni remplacé par ce qui suit.

  getWalletSettings() {
    return { ...this.state.walletSettings };
  }

  /** Met à jour une partie des WalletSettings. patch: sous-ensemble de { thousandsSeparator, symbolPosition, budgetMonthStartDay }. currency n'est volontairement pas modifiable ici (fixe à 'MGA' tant que le multi-devises n'est pas géré). */
  updateWalletSettings(patch) {
    const next = { ...this.state.walletSettings, ...patch };
    if (patch.budgetMonthStartDay != null) {
      next.budgetMonthStartDay = Math.min(28, Math.max(1, Number(patch.budgetMonthStartDay) || 1));
    }
    next.currency = 'MGA';
    this.set({ walletSettings: next });
  }

  /** Formate un montant selon walletSettings (séparateur de milliers + position du symbole). */
  formatMoney(n) {
    const settings = this.state.walletSettings || defaultState.walletSettings;
    const rounded = Math.round(Number(n) || 0);
    const sign = rounded < 0 ? '-' : '';
    const digits = String(Math.abs(rounded));
    let grouped;
    switch (settings.thousandsSeparator) {
      case 'comma':
        grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        break;
      case 'dot':
        grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        break;
      case 'none':
        grouped = digits;
        break;
      case 'space':
      default:
        grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        break;
    }
    const amount = `${sign}${grouped}`;
    return settings.symbolPosition === 'before' ? `${settings.currency} ${amount}` : `${amount} ${settings.currency}`;
  }

  /** Échappe une valeur pour une cellule CSV (RFC 4180 simplifié : guillemets doublés, entourage si nécessaire). */
  _csvCell(value) {
    const s = value == null ? '' : String(value);
    if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  _csvSection(title, headers, rows) {
    const lines = [`# ${title}`, headers.map((h) => this._csvCell(h)).join(';')];
    rows.forEach((row) => lines.push(row.map((cell) => this._csvCell(cell)).join(';')));
    return lines.join('\n');
  }

  /**
   * Construit un export CSV (texte, plusieurs sections séparées par une ligne
   * vide et un en-tête "# Section") couvrant uniquement les données Money :
   * comptes, transactions, catégories, budgets, objectifs financiers, dettes,
   * paiements planifiés. Distinct de exportData() (JSON, toute l'app) plus bas.
   */
  exportMoneyCSV() {
    this._ensureDefaultAccount();
    this._ensureMoneyCategories();
    const accountsById = Object.fromEntries(this.state.accounts.map((a) => [a.id, a]));
    const categoryMap = this.getCategoryMap();
    const sections = [];

    sections.push(this._csvSection(
      'Comptes',
      ['id', 'nom', 'type', 'solde'],
      this.listAccounts().map((a) => [a.id, a.name, a.type, this.getAccountBalance(a.id)]),
    ));

    sections.push(this._csvSection(
      'Transactions',
      ['id', 'date', 'type', 'montant', 'categorie', 'sous_categorie', 'compte', 'compte_destination', 'note'],
      this.listTransactions().map((t) => [
        t.id,
        t.date,
        t.type,
        t.amount,
        t.type === 'transfer' ? '' : (categoryMap[t.category]?.label ?? t.category ?? ''),
        t.subcategory || '',
        accountsById[this._effectiveAccountId(t)]?.name ?? '',
        t.type === 'transfer' ? (accountsById[t.toAccountId]?.name ?? '') : '',
        t.note || '',
      ]),
    ));

    const allCategories = [
      ...this.state.moneyCategories.expense.map((c) => ({ ...c, type: 'expense' })),
      ...this.state.moneyCategories.income.map((c) => ({ ...c, type: 'income' })),
    ];
    sections.push(this._csvSection(
      'Categories',
      ['id', 'type', 'libelle', 'sous_categories'],
      allCategories.map((c) => [c.id, c.type, c.label, (c.subcategories || []).map((s) => s.label).join(', ')]),
    ));

    sections.push(this._csvSection(
      'Budgets',
      ['categorie', 'limite_mensuelle'],
      this.state.categoryBudgets.map((b) => [categoryMap[b.category]?.label ?? b.category, b.monthlyLimit]),
    ));

    sections.push(this._csvSection(
      'Objectifs financiers',
      ['id', 'nom', 'montant_actuel', 'montant_cible', 'progression_pct', 'statut', 'echeance'],
      this.listFinancialGoals().map((g) => [g.id, g.name, g.currentAmount, g.targetAmount, g.progress, g.status, g.deadline || '']),
    ));

    if (this.state.debts.length > 0) {
      sections.push(this._csvSection(
        'Dettes',
        ['id', 'direction', 'personne', 'montant', 'rembourse', 'restant', 'statut', 'date', 'echeance'],
        this.listDebts().map((d) => [
          d.id,
          this.getDebtDirectionInfo(d.direction).label,
          d.person,
          d.amount,
          this._debtRepaidAmount(d),
          this.getDebtRemainingAmount(d),
          this.getDebtComputedStatus(d),
          d.date,
          d.dueDate || '',
        ]),
      ));
    }

    if (this.state.scheduledPayments.length > 0) {
      sections.push(this._csvSection(
        'Paiements planifies',
        ['id', 'nom', 'type', 'montant', 'frequence', 'prochaine_echeance', 'actif'],
        this.listScheduledPayments().map((p) => [
          p.id,
          p.name,
          p.type,
          p.amount,
          this.getScheduledPaymentFrequencyInfo(p.frequency).label ?? p.frequency,
          p.nextDueDate,
          p.active ? 'oui' : 'non',
        ]),
      ));
    }

    if (this.state.investments.length > 0) {
      sections.push(this._csvSection(
        'Investissements',
        ['id', 'nom', 'type', 'capital_investi', 'valeur_actuelle', 'gain_perte', 'performance_pct', 'date', 'compte', 'notes'],
        this.getInvestments().map((inv) => [
          inv.id,
          inv.name,
          this.getInvestmentTypeInfo(inv.type).label,
          inv.initialAmount,
          inv.currentValue,
          this.getInvestmentGain(inv),
          Math.round(this.getInvestmentPerformance(inv) * 100) / 100,
          inv.date,
          inv.accountId ? (accountsById[inv.accountId]?.name ?? '') : '',
          inv.notes || '',
        ]),
      ));
    }

    if (this.state.shoppingItems.length > 0) {
      sections.push(this._csvSection(
        'Liste d\'achats',
        ['id', 'nom', 'quantite', 'prix_estime', 'categorie', 'priorite', 'statut', 'date', 'notes'],
        this.listShoppingItems().map((it) => [
          it.id,
          it.name,
          it.quantity,
          it.estimatedPrice,
          it.category || '',
          this.getShoppingPriorityInfo(it.priority).label,
          it.bought ? 'Acheté' : 'À acheter',
          it.date,
          it.notes || '',
        ]),
      ));
    }

    if (this.state.warranties.length > 0) {
      const warrantyStatusLabel = { active: 'Active', expiring_soon: 'Expire bientôt', expired: 'Expirée' };
      sections.push(this._csvSection(
        'Garanties',
        ['id', 'produit', 'categorie', 'date_achat', 'prix_achat', 'vendeur', 'expiration', 'reference', 'statut', 'notes'],
        this.listWarranties().map((w) => [
          w.id,
          w.product,
          w.category || '',
          w.purchaseDate,
          w.purchasePrice,
          w.seller || '',
          w.expiryDate || '',
          w.reference || '',
          warrantyStatusLabel[this.getWarrantyStatus(w)],
          w.notes || '',
        ]),
      ));
    }

    // BOM UTF-8 pour qu'Excel détecte correctement l'encodage à l'ouverture.
    return `\uFEFF${sections.join('\n\n')}\n`;
  }

  /** Déclenche le téléchargement du CSV Money via une balise <a> éphémère. */
  downloadMoneyCSV() {
    const csv = this.exportMoneyCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boost-wallet-${this.todayKey()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Réinitialise UNIQUEMENT les données Wallet (voir MONEY_STATE_KEYS) :
   * comptes, transactions, catégories personnalisées, budgets, objectifs
   * financiers, dettes, paiements planifiés, et walletSettings. Ne touche à
   * aucune autre clé de l'état (objectifs de vie, projets, habitudes, etc.).
   * Irréversible — la double confirmation est à la charge de l'écran appelant.
   */
  resetWalletData() {
    const patch = {};
    MONEY_STATE_KEYS.forEach((key) => {
      patch[key] = structuredClone(defaultState[key]);
    });
    this.set(patch);
    this._ensureDefaultAccount();
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
