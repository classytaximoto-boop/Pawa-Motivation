// Catégories du journal — source unique de vérité (formulaire + filtres + badges).
export const journalCategories = [
  { id: 'libre', label: 'Libre', icon: 'notes', color: '--steel-500' },
  { id: 'victoire', label: 'Victoire', icon: 'sparkles', color: '--success-500' },
  { id: 'apprentissage', label: 'Apprentissage', icon: 'target', color: '--steel-400' },
  { id: 'idee', label: 'Idée', icon: 'bolt', color: '--ember-500' },
  { id: 'gratitude', label: 'Gratitude', icon: 'flame', color: '--ember-600' },
  { id: 'autre', label: 'Autre', icon: 'inbox', color: '--text-tertiary' },
];

export const journalCategoryMap = Object.fromEntries(journalCategories.map((c) => [c.id, c]));
