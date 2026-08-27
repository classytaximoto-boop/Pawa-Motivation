// Métadonnées des humeurs — source unique de vérité (check-in, historique, stats).
export const moods = [
  { id: 'great', emoji: '🔥', label: 'En feu' },
  { id: 'good', emoji: '🙂', label: 'Bien' },
  { id: 'neutral', emoji: '😐', label: 'Neutre' },
  { id: 'low', emoji: '😔', label: 'En baisse' },
  { id: 'bad', emoji: '😣', label: 'Difficile' },
];

export const moodMap = Object.fromEntries(moods.map((m) => [m.id, m]));

// Causes courantes proposées en raccourci — l'utilisateur peut aussi taper la sienne.
export const commonCauses = [
  'Travail',
  'Objectifs',
  'Famille',
  'Argent',
  'Santé',
  'Sommeil',
  'Relations',
  'Météo',
  'Autre',
];
