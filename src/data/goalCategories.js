// Catégories d'objectifs — source unique de vérité (formulaire + filtres + badges).
export const goalCategories = [
  { id: 'personnel', label: 'Personnel', icon: 'sparkles', color: '--steel-500' },
  { id: 'business', label: 'Business', icon: 'compass', color: '--ember-500' },
  { id: 'argent', label: 'Argent', icon: 'wallet', color: '--success-500' },
  { id: 'famille', label: 'Famille', icon: 'family', color: '--steel-400' },
  { id: 'sante', label: 'Santé', icon: 'mind', color: '--success-500' },
  { id: 'sport', label: 'Sport', icon: 'bolt', color: '--ember-500' },
  { id: 'etudes', label: 'Études', icon: 'notes', color: '--steel-500' },
  { id: 'langues', label: 'Langues', icon: 'notes', color: '--steel-400' },
  { id: 'leadership', label: 'Leadership', icon: 'target', color: '--ember-600' },
  { id: 'voyage', label: 'Voyage', icon: 'compass', color: '--steel-500' },
  { id: 'autre', label: 'Autre', icon: 'inbox', color: '--text-tertiary' },
];

export const goalCategoryMap = Object.fromEntries(goalCategories.map((c) => [c.id, c]));

export const priorityLevels = [
  { id: 'haute', label: 'Haute', color: '--danger-500' },
  { id: 'moyenne', label: 'Moyenne', color: '--warning-500' },
  { id: 'basse', label: 'Basse', color: '--steel-400' },
];
