// Développement personnel — structure pour l'auto-évaluation forces/faiblesses
// et le suivi de compétences. Aucune dépendance réseau, tout est local.

export const traitCategories = [
  { id: 'force', label: 'Force', color: '--success-500' },
  { id: 'faiblesse', label: 'Faiblesse à travailler', color: '--danger-500' },
];

// Domaines proposés en raccourci pour l'auto-évaluation — l'utilisateur peut
// aussi taper le sien librement, comme pour les causes d'humeur.
export const suggestedTraitDomains = [
  'Discipline',
  'Communication',
  'Gestion du stress',
  'Confiance en soi',
  'Patience',
  'Écoute',
  'Organisation',
  'Régulation de la colère',
  'Prise de décision',
  'Autre',
];

export const skillCategories = [
  { id: 'technique', label: 'Technique', icon: 'bolt' },
  { id: 'business', label: 'Business', icon: 'compass' },
  { id: 'relationnel', label: 'Relationnel', icon: 'family' },
  { id: 'juridique', label: 'Juridique / droits', icon: 'notes' },
  { id: 'langue', label: 'Langue', icon: 'notes' },
  { id: 'autre', label: 'Autre', icon: 'inbox' },
];

export const skillCategoryMap = Object.fromEntries(skillCategories.map((c) => [c.id, c]));

export const skillLevels = [
  { id: 1, label: 'Débutant' },
  { id: 2, label: 'Notions' },
  { id: 3, label: 'Compétent' },
  { id: 4, label: 'Avancé' },
  { id: 5, label: 'Expert' },
];
