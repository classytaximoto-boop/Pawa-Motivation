// Types de média — source unique de vérité (formulaire + filtres + badges).
export const mediaCategories = [
  { id: 'video', label: 'Vidéo', icon: 'media', color: '--ember-500' },
  { id: 'audio', label: 'Audio', icon: 'bolt', color: '--steel-400' },
  { id: 'article', label: 'Article', icon: 'notes', color: '--steel-500' },
  { id: 'livre', label: 'Livre', icon: 'target', color: '--success-500' },
  { id: 'autre', label: 'Autre', icon: 'inbox', color: '--text-tertiary' },
];

export const mediaCategoryMap = Object.fromEntries(mediaCategories.map((c) => [c.id, c]));
