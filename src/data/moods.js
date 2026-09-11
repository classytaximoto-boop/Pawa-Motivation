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
  { id: 'determination', emoji: '🔥', label: 'Détermination' },
  { id: 'ambition', emoji: '🚀', label: 'Ambition' },
  { id: 'fear_of_failure', emoji: '😰', label: 'Peur de l’échec' },
  { id: 'need_validation', emoji: '🏆', label: 'Besoin de validation' },
  { id: 'frustration', emoji: '😤', label: 'Frustration' },
  { id: 'pressure', emoji: '🥵', label: 'Pression' },
  { id: 'insecurity', emoji: '😔', label: 'Insécurité' },
  { id: 'pride', emoji: '😊', label: 'Fierté' },
  { id: 'control_obsession', emoji: '🎯', label: 'Obsession du contrôle' },
  { id: 'emotional_exhaustion', emoji: '🥱', label: 'Épuisement émotionnel' },
  { id: 'anxious', emoji: '😟', label: 'Anxieux' },
  { id: 'overwhelmed', emoji: '🌊', label: 'Submergé' },
  { id: 'lonely', emoji: '🌑', label: 'Seul' },
  { id: 'jealous', emoji: '🟢', label: 'Jalousie' },
  { id: 'shame', emoji: '🫣', label: 'Honte' },
  { id: 'relief', emoji: '😮‍💨', label: 'Soulagement' },
  { id: 'gratitude', emoji: '🙏', label: 'Gratitude' },
  { id: 'hope', emoji: '🌅', label: 'Espoir' },
  { id: 'disappointment', emoji: '😞', label: 'Déception' },
  { id: 'boredom', emoji: '🥱', label: 'Ennui' },
  { id: 'confidence', emoji: '😎', label: 'Assurance' },
  { id: 'confusion', emoji: '🌀', label: 'Confusion' },
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
