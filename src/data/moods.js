// Métadonnées des humeurs — source unique de vérité (check-in, historique, stats).
export const moods = [
  { id: 'happy', emoji: '😄', label: 'Content' },
  { id: 'sad', emoji: '😢', label: 'Triste' },
  { id: 'angry', emoji: '😠', label: 'En colère' },
  { id: 'fearful', emoji: '😨', label: 'Peur' },
  { id: 'surprised', emoji: '😲', label: 'Surpris' },
  { id: 'disgusted', emoji: '🤢', label: 'Dégoûté' },
  { id: 'calm', emoji: '😌', label: 'Calme' },
  { id: 'miss', emoji: '🥺', label: 'Manque' },
  { id: 'neutral', emoji: '😐', label: 'Neutre' },
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
