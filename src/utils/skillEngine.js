// Skill Engine — détection de compétences pertinentes à partir d'une action
// réelle (objectif, projet, habitude, mission complétés) et calcul du niveau
// à partir de l'XP cumulé. Fonctions pures, aucune dépendance au store :
// testable isolément, et le store reste la seule source de vérité de l'état.

import { skillCategories } from '../data/personalDev.js';
import { getDevelopmentSkill } from '../data/developmentSkills.js';

export const skillDictionary = [
  { name: 'Mécanique', category: 'technique', keywords: ['moto', 'reparer', 'réparer', 'reparation', 'réparation', 'voiture', 'mecanique', 'mécanique', 'panne', 'bricolage', 'entretien'] },
  { name: 'Informatique', category: 'technique', keywords: ['code', 'coder', 'programmation', 'ordinateur', 'logiciel', 'app', 'site web', 'bug', 'informatique'] },
  { name: 'Résolution de problèmes', category: 'technique', keywords: ['probleme', 'problème', 'resoudre', 'résoudre', 'panne', 'bloque', 'bloqué', 'solution'] },
  { name: 'Force physique', category: 'autre', keywords: ['sport', 'muscu', 'musculation', 'gym', 'entrainement', 'entraînement', 'course', 'courir', 'fitness'] },
  { name: 'Discipline', category: 'autre', keywords: ['routine', 'discipline', 'habitude', 'régularité', 'regularite', 'tous les jours'] },
  { name: 'Consistance', category: 'autre', keywords: ['streak', 'serie', 'série', 'chaque jour', 'quotidien'] },
  { name: 'Communication', category: 'relationnel', keywords: ['presentation', 'présentation', 'discours', 'parler', 'expliquer', 'reunion', 'réunion', 'appel', 'client'] },
  { name: 'Prise de parole en public', category: 'relationnel', keywords: ['public', 'audience', 'discours', 'presentation', 'présentation'] },
  { name: 'Écoute', category: 'relationnel', keywords: ['ecoute', 'écoute', 'ecouter', 'écouter'] },
  { name: 'Business', category: 'business', keywords: ['entreprise', 'business', 'client', 'vente', 'vendre', 'produit', 'marche', 'marché'] },
  { name: 'Leadership', category: 'business', keywords: ['equipe', 'équipe', 'diriger', 'leadership', 'manager', 'gerer', 'gérer'] },
  { name: 'Prise de décision', category: 'business', keywords: ['decision', 'décision', 'choix', 'decider', 'décider'] },
  { name: 'Négociation', category: 'business', keywords: ['negociation', 'négociation', 'negocier', 'négocier', 'accord'] },
  { name: 'Gestion financière', category: 'autre', keywords: ['budget', 'argent', 'epargne', 'épargne', 'dette', 'facture', 'paiement'] },
  { name: 'Gestion du temps', category: 'autre', keywords: ['planning', 'organisation', 'temps', 'agenda', 'deadline', 'delai', 'délai'] },
  { name: 'Résilience', category: 'autre', keywords: ['echec', 'échec', 'difficile', 'malgre', 'malgré', 'recommence', 'recommencé', 'abandon'] },
  { name: 'Créativité', category: 'autre', keywords: ['creation', 'création', 'creer', 'créer', 'idee', 'idée', 'design'] },
];

const CATEGORY_IDS = new Set(skillCategories.map((c) => c.id));

function norm(text) {
  return (text || '').toLowerCase();
}

export function detectSkillsForCompletion(source, label, max = 3) {
  const text = norm(label);
  const matches = skillDictionary.filter((entry) =>
    entry.keywords.some((kw) => text.includes(kw))
  );

  if (matches.length === 0) {
    const fallback = {
      habitude: ['Discipline', 'Consistance'],
      objectif: ['Prise de décision'],
      projet: ['Résolution de problèmes'],
      mission: ['Discipline'],
    }[source] || [];
    return fallback
      .map((name) => skillDictionary.find((e) => e.name === name))
      .filter(Boolean)
      .slice(0, max)
      .map((e) => ({ name: e.name, category: e.category }));
  }

  return matches.slice(0, max).map((e) => ({ name: e.name, category: e.category }));
}

// ---------------------------------------------------------------
// Development Impact — résolution des skills choisis explicitement par
// l'utilisateur dans le tiroir "Qu'est-ce que cette tâche développe ?"
// (voir data/developmentSkills.js). Séparé de detectSkillsForCompletion
// (qui, lui, DEVINE à partir du titre quand rien n'a été choisi) : ici on
// se contente de résoudre des ids connus vers le format {name, category}
// déjà utilisé par creditSkillXp/splitXpAcrossSkills — aucun nouveau
// système XP, on branche juste une source d'entrée supplémentaire sur le
// même moteur.
// ---------------------------------------------------------------

/**
 * Résout task.development.skills (tableau d'ids du catalogue
 * data/developmentSkills.js) vers le format [{name, category}] attendu par
 * creditSkillXp. Les ids inconnus (ancien catalogue, faute de frappe
 * impossible côté UI mais robustesse quand même) sont ignorés en silence.
 * `primarySkillId`, si fourni et présent dans la liste, est placé en tête
 * du tableau retourné : combiné à splitXpAcrossSkills (pondération
 * dégressive 0.5/0.3/0.2), la compétence principale reçoit alors le plus
 * d'XP — voir §8 du cahier des charges ("Primary Skill / Secondary Skills").
 */
export function resolveDevelopmentSkills(skillIds, primarySkillId = null) {
  if (!Array.isArray(skillIds) || skillIds.length === 0) return [];
  const resolved = skillIds
    .map((id) => getDevelopmentSkill(id))
    .filter(Boolean)
    .map((s) => ({ name: s.label, category: s.engineCategory || 'autre', skillId: s.id, selfEsteem: s.selfEsteem || null }));

  if (primarySkillId) {
    const idx = resolved.findIndex((s) => s.skillId === primarySkillId);
    if (idx > 0) {
      const [primary] = resolved.splice(idx, 1);
      resolved.unshift(primary);
    }
  }
  return resolved;
}

export function splitXpAcrossSkills(totalXp, skillCount) {
  if (skillCount <= 0) return [];
  const weights = [0.5, 0.3, 0.2].slice(0, skillCount);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => Math.max(1, Math.round((totalXp * w) / weightSum)));
}

const LEVEL_THRESHOLDS = [0, 40, 120, 280, 600];

export function xpToLevel(xp) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function xpToNextSkillLevel(xp) {
  const level = xpToLevel(xp);
  if (level >= LEVEL_THRESHOLDS.length) return null;
  return LEVEL_THRESHOLDS[level] - xp;
}

export function classifyDifficulty(xpAmount) {
  if (xpAmount >= 50) return 'milestone';
  if (xpAmount >= 25) return 'major';
  if (xpAmount >= 10) return 'meaningful';
  return 'minor';
}

export function isKnownSkillCategory(id) {
  return CATEGORY_IDS.has(id);
}
