// Métadonnées des problèmes — source unique de vérité (formulaire + filtres + badges).
export const problemStatuses = [
  { id: 'OPEN', label: 'Ouvert', color: '--danger-500' },
  { id: 'IN_PROGRESS', label: 'En cours', color: '--warning-500' },
  { id: 'SOLVED', label: 'Résolu', color: '--success-500' },
  { id: 'ARCHIVED', label: 'Archivé', color: '--text-tertiary' },
];

export const problemStatusMap = Object.fromEntries(problemStatuses.map((s) => [s.id, s]));

export const problemImportance = [
  { id: 'haute', label: 'Haute', color: '--danger-500' },
  { id: 'moyenne', label: 'Moyenne', color: '--warning-500' },
  { id: 'basse', label: 'Basse', color: '--steel-400' },
];

export const problemImportanceMap = Object.fromEntries(problemImportance.map((p) => [p.id, p]));
