/**
 * AIService — couche abstraite unique pour toutes les fonctions IA de BOOST.
 *
 * Pourquoi une couche abstraite : l'app ne doit jamais dépendre directement
 * d'un fournisseur IA précis. Tous les écrans appellent AIService.<fonction>,
 * jamais un provider directement. Changer de fournisseur (Gemini → autre)
 * se fait dans aiProviders.js sans toucher aux écrans.
 *
 * Sécurité :
 * - Aucune clé API ici ni dans aiProviders.js — voir aiProviders.js pour le
 *   détail (tout passe par un backend proxy externe).
 * - secretNotes n'entre jamais dans un contexte IA — voir aiContext.js, seul
 *   point de sélection des données envoyées.
 * - Chaque fonction ne reçoit que le contexte minimal nécessaire (principe
 *   de minimisation), jamais un dump complet de l'état utilisateur.
 *
 * Gestion des erreurs (exigée par le prompt) :
 * - Pas d'Internet → réponse locale immédiate, l'app n'est jamais bloquée.
 * - API/backend indisponible → message standard + les données de
 *   l'utilisateur restent accessibles (rien n'est perdu, rien n'est bloqué).
 * - Dans les deux cas, `ok: false` est renvoyé pour que l'écran puisse
 *   proposer "réessayer plus tard" sans relancer automatiquement.
 *
 * Cadre clinique (exigé par le prompt) :
 * - Jamais de diagnostic médical ou psychologique.
 * - Sur des sujets graves, orienter vers une aide professionnelle.
 * - Pour l'analyse d'expériences difficiles, cadrer comme une réflexion sur
 *   des thèmes récurrents, jamais comme une affirmation ("tu as un
 *   traumatisme" est interdit) — voir SAFETY_PREAMBLE et le prompt dédié.
 */

import { providers, activeProviderId } from './aiProviders.js';
import * as ctx from './aiContext.js';
import { store } from './store.js';

const PROFESSIONAL_HELP_NOTE =
  "Si un sujet est difficile à porter seul·e, en parler à un professionnel (médecin, psychologue, ligne d'écoute) peut vraiment aider.";

/** Préambule envoyé avec chaque appel — encadre le comportement du modèle côté prompt, pas seulement côté UI. */
const SAFETY_PREAMBLE =
  "Tu es un assistant de développement personnel dans l'app BOOST. " +
  "Tu n'es pas un professionnel de santé : ne pose jamais de diagnostic médical ou psychologique, " +
  "n'utilise jamais de formulation du type \"tu as un trauma/une dépression/un trouble\". " +
  "Décris des observations à partir des données fournies (ex. \"un thème récurrent autour de...\"), " +
  "jamais des certitudes sur l'état de la personne. " +
  "Pour tout sujet grave (idées noires, détresse forte, violence), recommande explicitement de chercher " +
  "une aide professionnelle, en plus de ta réponse. Reste concis, concret, orienté action.";

const COACH_STYLE_LABELS = {
  direct: 'Direct : franc, sans détour, va droit au but.',
  calme: 'Calme : posé, rassurant, sans urgence artificielle.',
  militaire: 'Militaire : strict, discipline, exigeant, phrases courtes.',
  professionnel: 'Professionnel : neutre, factuel, vocabulaire posé.',
  ami: 'Ami : chaleureux, proche, tutoiement complice.',
  minimal: "Minimal : va à l'essentiel, réponses très courtes.",
};

const COACH_DIFFICULTY_LABELS = {
  doux: 'Doux : bienveillant, encourage même les petits progrès.',
  normal: 'Normal : équilibré entre exigence et bienveillance.',
  exigeant: "Exigeant : pousse davantage, ne se satisfait pas du minimum.",
};

/** Traduit les préférences de coachSettings en instruction de style pour le prompt — n'affecte jamais le cadre de sécurité (SAFETY_PREAMBLE) qui reste appliqué dans tous les cas. */
function coachStyleInstruction(prefs) {
  if (!prefs) return '';
  const parts = [];
  if (prefs.style && COACH_STYLE_LABELS[prefs.style]) parts.push(`Style de coaching demandé — ${COACH_STYLE_LABELS[prefs.style]}`);
  if (prefs.difficulty && COACH_DIFFICULTY_LABELS[prefs.difficulty]) parts.push(`Niveau d'exigence — ${COACH_DIFFICULTY_LABELS[prefs.difficulty]}`);
  if (prefs.mainGoal) parts.push(`Objectif principal de la personne : ${prefs.mainGoal}.`);
  if (prefs.values) parts.push(`Ses valeurs : ${prefs.values}.`);
  if (prefs.personalReasons) parts.push(`Ses raisons personnelles : ${prefs.personalReasons}.`);
  if (prefs.motivationPhrase) parts.push(`Sa phrase de motivation : « ${prefs.motivationPhrase} ».`);
  return parts.join(' ');
}

function currentProvider() {
  return providers[activeProviderId];
}

function isOnline() {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

/**
 * Point d'entrée bas niveau commun à toutes les fonctions IA.
 * Renvoie toujours { ok, text?, source, error? } — jamais une exception qui
 * remonterait jusqu'à l'écran et bloquerait l'UI.
 */
async function callAI(task, context, prompt, localFallback) {
  if (!store.isAIEnabled()) {
    return {
      ok: false,
      source: 'local',
      text: localFallback,
      error: 'ai_disabled',
    };
  }

  if (!isOnline()) {
    return {
      ok: false,
      source: 'local',
      text: localFallback,
      error: 'offline',
    };
  }

  const provider = currentProvider();
  if (!provider.isConfigured()) {
    // Pas d'erreur affichée comme un "bug" — c'est un état normal tant que
    // le backend IA n'est pas déployé. On sert le fallback local directement.
    return {
      ok: false,
      source: 'local',
      text: localFallback,
      error: 'not_configured',
    };
  }

  try {
    const result = await provider.complete({ task, context, prompt: `${SAFETY_PREAMBLE}\n\n${prompt}` });
    return { ok: true, source: activeProviderId, text: result.text };
  } catch (e) {
    console.warn('[AIService] appel IA échoué', task, e);
    return {
      ok: false,
      source: 'local',
      text: localFallback,
      error: 'api_unavailable',
    };
  }
}

/** Message standard exigé par le prompt quand l'API est indisponible (mais pas offline). */
export const API_UNAVAILABLE_MESSAGE = 'Le coach IA est temporairement indisponible. Tes données restent accessibles.';

export const AIService = {
  // ============================================================
  // 1. Analyse du journal
  // ============================================================
  async analyzeJournal(days = 30) {
    const context = ctx.contextForJournalAnalysis(days);
    if (!context.entries.length) {
      return { ok: false, source: 'local', text: 'Pas encore assez d\'entrées de journal pour une analyse. Écris quelques lignes régulièrement, puis reviens ici.' };
    }
    const local = `${context.entries.length} entrée(s) de journal sur ${days} jours. Analyse détaillée disponible dès que le coach IA est joignable.`;
    return callAI(
      'journal_analysis',
      context,
      "Analyse ces entrées de journal : identifie les thèmes récurrents, les préoccupations et l'évolution générale. Reste factuel, pas de diagnostic.",
      local
    );
  },

  // ============================================================
  // 2. Analyse des tendances émotionnelles
  // ============================================================
  async analyzeEmotionalTrends(days = 30) {
    const context = ctx.contextForEmotionalTrends(days);
    if (!context.stats.count) {
      return { ok: false, source: 'local', text: "Pas encore de check-ins émotionnels sur cette période." };
    }
    const s = context.stats;
    const local = `Sur ${days} jours : motivation moyenne ${s.avgMotivation ?? '–'}/10, stress moyen ${s.avgStress ?? '–'}/10, énergie moyenne ${s.avgEnergy ?? '–'}/10 (${s.count} check-in${s.count > 1 ? 's' : ''}).`;
    return callAI(
      'emotional_trends',
      context,
      "À partir de ces statistiques et entrées émotionnelles, décris la tendance générale (amélioration, stabilité, dégradation) et les déclencheurs rapportés le cas échéant. Pas de diagnostic.",
      local
    );
  },

  // ============================================================
  // 3. Analyse des problèmes
  // ============================================================
  async analyzeProblems() {
    const context = ctx.contextForProblemsAnalysis();
    if (!context.problems.length) {
      return { ok: false, source: 'local', text: "Aucun problème ouvert en ce moment — rien à analyser." };
    }
    const local = `${context.problems.length} problème(s) ouvert(s) ou en cours. Analyse détaillée disponible dès que le coach IA est joignable.`;
    return callAI(
      'problems_analysis',
      context,
      "Analyse ces problèmes ouverts : y a-t-il un point commun (cause, contexte) ? Quel semble le plus urgent à traiter et pourquoi ?",
      local
    );
  },

  // ============================================================
  // 4. Création d'actions quotidiennes
  // ============================================================
  async suggestDailyActions() {
    const context = ctx.contextForDailyActions();
    const undone = context.todayMissions.filter((m) => !m.done).length;
    const local = undone
      ? `Il reste ${undone} mission${undone > 1 ? 's' : ''} du jour à faire — commence par la plus courte.`
      : "Missions du jour terminées. Avance d'une étape sur un objectif actif si tu as encore de l'énergie.";
    return callAI(
      'daily_actions',
      context,
      "Propose 2 à 3 actions concrètes et réalisables aujourd'hui, en cohérence avec les objectifs actifs et l'humeur actuelle.",
      local
    );
  },

  // ============================================================
  // 5. Décomposition d'un objectif
  // ============================================================
  async breakDownGoal(goalId) {
    const context = ctx.contextForGoalBreakdown(goalId);
    if (!context) {
      return { ok: false, source: 'local', text: 'Objectif introuvable.' };
    }
    const local = `Ajoute manuellement 2 à 3 étapes concrètes à « ${context.goal.name} » en attendant le coach IA — la première étape la plus petite possible aide à démarrer.`;
    return callAI(
      'goal_breakdown',
      context,
      "Décompose cet objectif en 3 à 6 étapes concrètes et actionnables, dans un ordre logique, sans dupliquer les étapes déjà existantes.",
      local
    );
  },

  // ============================================================
  // 6. Résumé quotidien
  // ============================================================
  async summarizeDay(dayKey) {
    const context = ctx.contextForDailySummary(dayKey);
    const s = context.snapshot;
    const local = `${s.missionsDone}/${s.missionsTotal} missions faites aujourd'hui${s.mood ? `, humeur : ${s.mood}` : ''}.`;
    return callAI(
      'daily_summary',
      context,
      "Résume cette journée en 2-3 phrases motivantes et honnêtes, à partir de ce snapshot chiffré.",
      local
    );
  },

  // ============================================================
  // 7. Résumé hebdomadaire
  // ============================================================
  async summarizeWeek() {
    const context = ctx.contextForWeeklySummary();
    const local = "Résumé de la semaine disponible dans l'onglet Rapports en attendant le coach IA.";
    return callAI(
      'weekly_summary',
      context,
      "Résume cette semaine à partir du snapshot fourni : ce qui a avancé, ce qui a stagné, une piste concrète pour la semaine prochaine.",
      local
    );
  },

  // ============================================================
  // 7b. RAPPORT QUOTIDIEN IA — structuré (résumé, victoire, difficulté,
  // tendance émotionnelle, objectif avancé, prochaine priorité, message)
  // ============================================================
  //
  // Renvoie toujours un objet `report` exploitable même sans IA (fallback
  // local rempli à partir des données déjà connues), en plus de { ok, text }
  // pour rester cohérent avec le reste de l'AIService.
  async generateDailyAIReport(dayKey) {
    const context = ctx.contextForDailyAIReport(dayKey);
    const s = context.snapshot;

    const localReport = {
      summary: `${s.missionsDone}/${s.missionsTotal} mission(s) faite(s)${s.mood ? `, humeur : ${s.mood}` : ''}.`,
      victory: context.userVictory || (s.goalsAdvanced > 0 ? `${s.goalsAdvanced} objectif(s) avancé(s) aujourd'hui.` : 'Avoir tenu ta routine.'),
      difficulty: context.userProblem || 'Aucune difficulté notée pour l\'instant.',
      emotionalTrend: context.recentEmotionTrend.count
        ? `Motivation moyenne récente : ${context.recentEmotionTrend.avgMotivation ?? '—'}/10.`
        : 'Pas assez de check-ins récents pour dégager une tendance.',
      goalAdvanced: context.activeGoals[0]?.name ?? null,
      nextPriority: context.activeGoals[0]
        ? `Avancer sur « ${context.activeGoals[0].name} ».`
        : 'Définis un objectif actif pour avoir une priorité claire demain.',
      motivationMessage: 'Une journée n\'est jamais parfaite — elle compte quand même. Continue.',
    };

    if (!store.isAIEnabled() || !isOnline() || !currentProvider().isConfigured()) {
      return { ok: false, source: 'local', text: localReport.summary, report: localReport, error: !store.isAIEnabled() ? 'ai_disabled' : undefined };
    }

    const prompt =
      "Génère un rapport quotidien à partir du contexte fourni. Réponds UNIQUEMENT en JSON valide, sans texte autour, avec exactement ces clés : " +
      '{"summary": string, "victory": string, "difficulty": string, "emotionalTrend": string, "goalAdvanced": string|null, "nextPriority": string, "motivationMessage": string}. ' +
      "Chaque valeur : 1 phrase courte, concrète, honnête. \"emotionalTrend\" décrit une tendance (amélioration/stabilité/dégradation), jamais un diagnostic. \"motivationMessage\" est direct et orienté action, sans flatterie ni culpabilisation.";

    const result = await callAI('daily_ai_report', context, prompt, localReport.summary);
    if (!result.ok) return { ...result, report: localReport };

    try {
      const parsed = JSON.parse(result.text.trim().replace(/^```json\s*|\s*```$/g, ''));
      return { ok: true, source: result.source, text: parsed.summary ?? result.text, report: { ...localReport, ...parsed } };
    } catch {
      // La réponse IA n'était pas du JSON exploitable — on retombe sur le rapport local plutôt que de planter l'écran.
      return { ok: false, source: 'local', text: localReport.summary, report: localReport, error: 'invalid_ai_json' };
    }
  },

  // ============================================================
  // 7c. RAPPORT HEBDOMADAIRE IA — structuré (progrès, blocages, habitudes
  // positives/négatives, domaines à surveiller, priorité de la semaine suivante)
  // ============================================================
  async generateWeeklyAIReport() {
    const context = ctx.contextForWeeklyAIReport();
    const s = context.snapshot;

    const positiveHabits = context.habits.filter((h) => h.streak >= 3).map((h) => h.name);
    const negativeHabits = context.habits.filter((h) => h.streak === 0).map((h) => h.name);

    const localReport = {
      progress: context.userVictories || `${s.goalsCompleted} objectif(s) atteint(s), ${s.missionsCompleted} mission(s) accomplie(s) cette semaine.`,
      blockers: context.userDifficulties || (context.openProblems.length ? `${context.openProblems.length} problème(s) encore ouvert(s).` : 'Aucun blocage notable signalé.'),
      positiveHabits: positiveHabits.length ? positiveHabits : [],
      negativeHabits: negativeHabits.length ? negativeHabits : [],
      attentionAreas: s.avgMotivation != null && s.avgMotivation <= 4 ? ['motivation'] : [],
      nextWeekPriority: context.openProblems[0]?.title
        ? `Traiter en priorité : ${context.openProblems[0].title}.`
        : 'Choisis une seule priorité claire pour la semaine prochaine.',
      disclaimer: "Cette analyse est un simple bilan d'activité, pas un diagnostic médical ou psychologique.",
    };

    if (!store.isAIEnabled() || !isOnline() || !currentProvider().isConfigured()) {
      return { ok: false, source: 'local', text: localReport.progress, report: localReport, error: !store.isAIEnabled() ? 'ai_disabled' : undefined };
    }

    const prompt =
      "Génère un rapport hebdomadaire à partir du contexte fourni (objectifs, missions, projets, habitudes, humeur, stress, énergie, motivation, problèmes, leadership). " +
      "Réponds UNIQUEMENT en JSON valide, sans texte autour, avec exactement ces clés : " +
      '{"progress": string, "blockers": string, "positiveHabits": string[], "negativeHabits": string[], "attentionAreas": string[], "nextWeekPriority": string}. ' +
      "Ne présente jamais ceci comme un diagnostic médical ou psychologique — reste factuel et orienté action.";

    const result = await callAI('weekly_ai_report', context, prompt, localReport.progress);
    if (!result.ok) return { ...result, report: localReport };

    try {
      const parsed = JSON.parse(result.text.trim().replace(/^```json\s*|\s*```$/g, ''));
      return {
        ok: true,
        source: result.source,
        text: parsed.progress ?? result.text,
        report: { ...localReport, ...parsed, disclaimer: localReport.disclaimer },
      };
    } catch {
      return { ok: false, source: 'local', text: localReport.progress, report: localReport, error: 'invalid_ai_json' };
    }
  },

  // ============================================================
  // 8. Motivation personnalisée
  // ============================================================
  async personalizedMotivation() {
    const context = ctx.contextForPersonalizedMotivation();
    const local = 'Un pas suffit aujourd\'hui. Reviens à ta mission la plus simple et commence par elle.';
    return callAI(
      'personalized_motivation',
      context,
      "Donne un message de motivation court (2-3 phrases), personnalisé à cette situation, sans généralité vide.",
      local
    );
  },

  // ============================================================
  // 9. Coach conversationnel — "MON COACH"
  // ============================================================
  /**
   * history: [{ role: 'user'|'assistant', text }] — historique court de la
   * conversation en cours, tenu côté écran (non persisté par défaut).
   */
  async coachReply(userMessage, history = []) {
    const context = ctx.contextForCoach();
    const local = API_UNAVAILABLE_MESSAGE;
    const historyText = history
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'Utilisateur' : 'Coach'}: ${m.text}`)
      .join('\n');
    const styleHint = coachStyleInstruction(context.coachPreferences);
    const prompt = `${styleHint}\n\n${historyText ? `${historyText}\n` : ''}Utilisateur: ${userMessage}\n\nRéponds en tant que coach, en t'appuyant sur le contexte fourni si pertinent.`;
    return callAI('coach_conversation', context, prompt, local);
  },

  // ============================================================
  // 10. Suggestions de progression
  // ============================================================
  async suggestProgress() {
    const context = ctx.contextForProgressSuggestions();
    const local = "Consulte l'onglet Leadership pour voir tes dimensions les plus faibles et travailler celle-ci en priorité.";
    return callAI(
      'progress_suggestions',
      context,
      "À partir de ces scores de leadership, XP et objectifs actifs, suggère 1 à 2 axes de progression prioritaires et une action concrète pour chacun.",
      local
    );
  },

  // ============================================================
  // Analyse d'expériences difficiles — « Analyse de mes expériences difficiles »
  // ============================================================
  //
  // Jamais de phrase du type "Tu as un traumatisme". Toujours cadré comme
  // une observation de motif récurrent dans ce que la personne a écrit,
  // présentée comme une réflexion, pas un diagnostic — voir SAFETY_PREAMBLE.
  async analyzeDifficultExperiences(days = 90) {
    const context = ctx.contextForDifficultExperiencesAnalysis(days);
    if (!context.journalEntries.length && !context.lowMoodEntries.length) {
      return {
        ok: false,
        source: 'local',
        text: "Pas assez d'entrées sur cette période pour dégager un thème. Ce n'est pas un problème — reviens quand tu auras écrit davantage.",
      };
    }
    const local = `${API_UNAVAILABLE_MESSAGE} ${PROFESSIONAL_HELP_NOTE}`;
    const result = await callAI(
      'difficult_experiences_analysis',
      context,
      "À partir du journal et des moments de bas moral, si un thème récurrent apparaît, présente-le comme une réflexion (\"Ton journal fait apparaître un thème récurrent autour de...\"), jamais comme un diagnostic. N'utilise jamais l'expression \"tu as un traumatisme\" ni aucun équivalent. Termine toujours en recommandant d'en parler à un professionnel si le sujet est difficile à porter seul·e.",
      local
    );
    // Le rappel professionnel est systématique ici, même sur une réponse IA réussie.
    if (result.ok && !result.text.includes(PROFESSIONAL_HELP_NOTE)) {
      result.text = `${result.text}\n\n${PROFESSIONAL_HELP_NOTE}`;
    }
    return result;
  },
};

/** Utilitaire pour les écrans : vrai si le backend IA est configuré (indépendamment du réseau à l'instant T). */
export function isAIConfigured() {
  return currentProvider().isConfigured();
}

/** Utilitaire pour les écrans : vrai si l'utilisateur n'a pas désactivé l'IA dans ses paramètres. */
export function isAIEnabled() {
  return store.isAIEnabled();
}

// Réexporté pour permettre à un écran de proposer directement le boost adaptatif
// existant à côté de la motivation générée par IA, sans dupliquer la logique.
export function getLocalBoostSuggestion() {
  return store.getBoostSuggestion();
}
