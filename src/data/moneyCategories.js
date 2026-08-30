// Catégories de transactions Money — source unique de vérité (formulaire + filtres + badges).
// Distinctes de goalCategories.js : adaptées aux revenus/dépenses, pas aux objectifs de vie.
export const expenseCategories = [
  { id: 'logement', label: 'Logement', icon: 'home', color: '--steel-500' },
  { id: 'alimentation', label: 'Alimentation', icon: 'inbox', color: '--ember-500' },
  { id: 'transport', label: 'Transport', icon: 'compass', color: '--steel-400' },
  { id: 'vehicule', label: 'Véhicule', icon: 'bolt', color: '--steel-400' },
  { id: 'shopping', label: 'Shopping', icon: 'star', color: '--ember-500' },
  { id: 'sante', label: 'Santé', icon: 'mind', color: '--success-500' },
  { id: 'famille', label: 'Famille', icon: 'family', color: '--steel-400' },
  { id: 'communication', label: 'Communication', icon: 'volume', color: '--steel-500' },
  { id: 'loisirs', label: 'Loisirs', icon: 'media', color: '--ember-500' },
  { id: 'voyage', label: 'Voyage', icon: 'compass', color: '--success-500' },
  { id: 'education', label: 'Éducation', icon: 'notes', color: '--steel-500' },
  { id: 'business', label: 'Business', icon: 'target', color: '--ember-600' },
  { id: 'finance', label: 'Finance', icon: 'bank', color: '--steel-500' },
  { id: 'epargne', label: 'Épargne', icon: 'piggyBank', color: '--success-500' },
  { id: 'autre', label: 'Autre', icon: 'inbox', color: '--text-tertiary' },
];

export const incomeCategories = [
  { id: 'salaire', label: 'Salaire', icon: 'wallet', color: '--success-500' },
  { id: 'business', label: 'Business', icon: 'target', color: '--ember-600' },
  { id: 'cadeau', label: 'Cadeau', icon: 'sparkles', color: '--ember-500' },
  { id: 'investissement', label: 'Investissement', icon: 'compass', color: '--steel-500' },
  { id: 'autre', label: 'Autre', icon: 'inbox', color: '--text-tertiary' },
];

export const moneyCategoriesByType = { income: incomeCategories, expense: expenseCategories };

export const moneyCategoryMap = Object.fromEntries(
  [...expenseCategories, ...incomeCategories].map((c) => [c.id, c])
);
