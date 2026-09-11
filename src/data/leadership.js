// Les 10 dimensions du leadership — source unique de vérité (formulaire + graphique + historique).
export const leadershipDimensions = [
  { id: 'discipline', label: 'Discipline' },
  { id: 'communication', label: 'Communication' },
  { id: 'decision', label: 'Décision' },
  { id: 'responsabilite', label: 'Responsabilité' },
  { id: 'confiance', label: 'Confiance' },
  { id: 'gestionTemps', label: 'Gestion du temps' },
  { id: 'gestionConflits', label: 'Gestion des conflits' },
  { id: 'vision', label: 'Vision' },
  { id: 'gestionEmotionnelle', label: 'Gestion émotionnelle' },
  { id: 'leadershipEquipe', label: "Leadership d'équipe" },
];

export function emptyLeadershipScores() {
  return Object.fromEntries(leadershipDimensions.map((d) => [d.id, 5]));
}

export function averageLeadershipScore(scores) {
  const vals = leadershipDimensions.map((d) => scores[d.id]).filter((v) => v != null);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}
