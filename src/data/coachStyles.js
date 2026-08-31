// Tempéraments du coach Anti-Paresse — 100% offline, aucune dépendance IA.
export const coachStyles = [
  { id: 'military', emoji: '🪖', label: 'Militaire' },
  { id: 'motivating', emoji: '🔥', label: 'Motivant' },
  { id: 'friendly', emoji: '🤝', label: 'Friendly' },
];

export const coachStyleMap = Object.fromEntries(coachStyles.map((c) => [c.id, c]));
