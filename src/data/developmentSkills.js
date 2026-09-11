// Development Impact — catalogue fixe utilisé par le tiroir "Qu'est-ce que
// cette tâche développe ?" (Tasks Agenda, et réutilisable plus tard pour
// Goals/Habits/Projects/Challenges/Achievements — voir store.recordEvidenceFromCompletion).
//
// Structure volontairement à 2 niveaux, comme demandé :
//   CATEGORY (regroupement d'affichage, uniquement pour organiser le tiroir)
//     → SKILLS (ce que l'utilisateur coche réellement)
//
// Chaque skill a :
//   - id            : identifiant stable stocké dans task.development.skills
//   - label         : libellé affiché (FR, cohérent avec le reste de l'app)
//   - engineCategory: catégorie du Skill Engine existant (voir data/personalDev.js
//                     skillCategories) — sert à ranger la compétence créditée au
//                     bon endroit dans l'écran Development, sans créer de
//                     deuxième système de catégories.
//   - selfEsteem    : dimension Self-Esteem associée (optionnelle) — voir
//                     data/selfEsteemTriggers.js pour les types existants.
//                     Absent = cette compétence n'alimente jamais Self-Esteem
//                     automatiquement (règle §7 : les compétences seules ne
//                     doivent pas suffire).
//
// IMPORTANT : ne jamais renommer/supprimer un id existant une fois livré —
// il est stocké tel quel dans les tâches déjà créées par les utilisateurs.

export const developmentCategories = [
  {
    id: 'physical',
    label: 'Physique',
    skills: [
      { id: 'strength', label: 'Force', engineCategory: 'autre' },
      { id: 'endurance', label: 'Endurance', engineCategory: 'autre' },
      { id: 'discipline', label: 'Discipline', engineCategory: 'autre', selfEsteem: 'promise_kept' },
    ],
  },
  {
    id: 'technical',
    label: 'Technique',
    skills: [
      { id: 'mechanics', label: 'Mécanique', engineCategory: 'technique' },
      { id: 'technology', label: 'Technologie', engineCategory: 'technique' },
      { id: 'electronics', label: 'Électronique', engineCategory: 'technique' },
      { id: 'problem_solving', label: 'Résolution de problèmes', engineCategory: 'technique' },
    ],
  },
  {
    id: 'intellectual',
    label: 'Intellectuel',
    skills: [
      { id: 'learning', label: 'Apprentissage', engineCategory: 'autre' },
      { id: 'critical_thinking', label: 'Esprit critique', engineCategory: 'autre' },
      { id: 'memory', label: 'Mémoire', engineCategory: 'autre' },
      { id: 'creativity', label: 'Créativité', engineCategory: 'autre' },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    skills: [
      { id: 'communication', label: 'Communication', engineCategory: 'relationnel' },
      { id: 'public_speaking', label: 'Prise de parole en public', engineCategory: 'relationnel' },
      { id: 'negotiation', label: 'Négociation', engineCategory: 'business' },
      { id: 'english', label: 'Anglais', engineCategory: 'langue' },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    skills: [
      { id: 'sales', label: 'Vente', engineCategory: 'business' },
      { id: 'financial_management', label: 'Gestion financière', engineCategory: 'business' },
      { id: 'entrepreneurship', label: 'Entrepreneuriat', engineCategory: 'business' },
      { id: 'decision_making', label: 'Prise de décision', engineCategory: 'business' },
    ],
  },
  {
    id: 'leadership',
    label: 'Leadership',
    skills: [
      { id: 'leadership', label: 'Leadership', engineCategory: 'business' },
      { id: 'responsibility', label: 'Responsabilité', engineCategory: 'autre', selfEsteem: 'responsibility' },
      { id: 'teamwork', label: "Travail d'équipe", engineCategory: 'relationnel' },
    ],
  },
  {
    id: 'life_skills',
    label: 'Compétences de vie',
    skills: [
      { id: 'cooking', label: 'Cuisine', engineCategory: 'autre' },
      { id: 'driving', label: 'Conduite', engineCategory: 'autre' },
      { id: 'navigation', label: 'Navigation / orientation', engineCategory: 'autre' },
      { id: 'self_reliance', label: 'Autonomie', engineCategory: 'autre', selfEsteem: 'self_respect' },
    ],
  },
  {
    id: 'emotional',
    label: 'Émotionnel',
    skills: [
      { id: 'courage', label: 'Courage', engineCategory: 'autre', selfEsteem: 'courage' },
      { id: 'resilience', label: 'Résilience', engineCategory: 'autre', selfEsteem: 'comeback' },
      { id: 'self_control', label: 'Maîtrise de soi', engineCategory: 'autre', selfEsteem: 'self_respect' },
      { id: 'adaptability', label: 'Adaptabilité', engineCategory: 'autre' },
    ],
  },
];

// Index à plat { skillId -> { id, label, engineCategory, selfEsteem, categoryId, categoryLabel } }
// pratique pour résoudre un id sans reparcourir les catégories à chaque fois.
export const developmentSkillIndex = developmentCategories.reduce((acc, cat) => {
  cat.skills.forEach((s) => {
    acc[s.id] = { ...s, categoryId: cat.id, categoryLabel: cat.label };
  });
  return acc;
}, {});

/** Renvoie les métadonnées d'un skill id du catalogue, ou null si inconnu
 * (ex: id issu d'une version future du catalogue). Ne jamais throw ici :
 * les anciennes tâches / ids inconnus doivent être ignorés silencieusement. */
export function getDevelopmentSkill(skillId) {
  return developmentSkillIndex[skillId] || null;
}

// ---------------------------------------------------------------
// Auto-suggestion — mots-clés FR/EN simples sur le titre de la tâche.
// Volontairement séparé de skillEngine.skillDictionary (qui, lui, sert au
// fallback automatique quand AUCUN skill n'a été choisi à la main) : ici on
// ne fait que PROPOSER des cases à cocher, l'utilisateur garde la main
// (voir §9 du cahier des charges — jamais de sélection automatique sans
// possibilité de modification).
// ---------------------------------------------------------------
const SUGGESTION_RULES = [
  { skillIds: ['mechanics', 'problem_solving'], keywords: ['moto', 'reparer', 'réparer', 'reparation', 'réparation', 'voiture', 'mecanique', 'mécanique', 'panne', 'bricolage'] },
  { skillIds: ['technology', 'problem_solving'], keywords: ['code', 'coder', 'programmation', 'ordinateur', 'logiciel', 'app', 'bug', 'informatique'] },
  { skillIds: ['electronics'], keywords: ['electronique', 'électronique', 'circuit', 'soudure'] },
  { skillIds: ['strength', 'discipline'], keywords: ['gym', 'muscu', 'musculation', 'salle de sport', 'entrainement', 'entraînement'] },
  { skillIds: ['endurance', 'discipline'], keywords: ['courir', 'course', 'running', 'jogging', 'cardio'] },
  { skillIds: ['english', 'communication', 'public_speaking'], keywords: ['anglais', 'english', 'parler anglais'] },
  { skillIds: ['communication', 'public_speaking'], keywords: ['presentation', 'présentation', 'discours', 'exposé', 'expose'] },
  { skillIds: ['negotiation'], keywords: ['negociation', 'négociation', 'negocier', 'négocier'] },
  { skillIds: ['sales'], keywords: ['vente', 'vendre', 'client'] },
  { skillIds: ['financial_management'], keywords: ['budget', 'epargne', 'épargne', 'facture', 'paiement', 'dette'] },
  { skillIds: ['entrepreneurship'], keywords: ['entreprise', 'business', 'startup'] },
  { skillIds: ['leadership', 'teamwork'], keywords: ['equipe', 'équipe', 'diriger', 'manager', 'gerer', 'gérer'] },
  { skillIds: ['cooking'], keywords: ['cuisiner', 'cuisine', 'recette', 'repas'] },
  { skillIds: ['driving'], keywords: ['conduire', 'conduite', 'permis'] },
  { skillIds: ['learning', 'memory'], keywords: ['apprendre', 'reviser', 'réviser', 'etudier', 'étudier', 'cours', 'lecon', 'leçon'] },
  { skillIds: ['creativity'], keywords: ['creer', 'créer', 'creation', 'création', 'dessiner', 'design', 'idee', 'idée'] },
  { skillIds: ['resilience', 'discipline'], keywords: ['malgre', 'malgré', 'sans motivation', 'pas envie'] },
];

/** Renvoie une liste d'ids de skills suggérés à partir du titre saisi
 * (déduplication incluse). Purement indicatif — l'UI doit permettre à
 * l'utilisateur de décocher/cocher librement (voir §9). */
export function suggestDevelopmentSkills(title, max = 4) {
  const text = (title || '').toLowerCase();
  if (!text.trim()) return [];
  const found = [];
  SUGGESTION_RULES.forEach((rule) => {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      rule.skillIds.forEach((id) => { if (!found.includes(id)) found.push(id); });
    }
  });
  return found.slice(0, max);
}
