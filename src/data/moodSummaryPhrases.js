// Bibliothèque de phrases pour l'encart "ta journée aujourd'hui" sur Home.
// Une phrase est choisie aléatoirement parmi celles associées à l'humeur
// dominante des check-ins Mind du jour (voir store.getTodayMoodSummary()).
// Plusieurs variantes par humeur pour éviter de répéter toujours la même
// formulation. Ce ne sont que des reformulations éditoriales — pas un
// diagnostic psychologique.

export const moodSummaryPhrases = {
  happy: [
    "Tu vis cette journée dans la joie — profite de cet élan.",
    "Aujourd'hui a le goût d'une bonne journée. Savoure-la.",
    "Ton énergie du jour est du côté de la lumière.",
  ],
  sad: [
    "Tu vis cette journée dans la mélancolie.",
    "Aujourd'hui semble plus lourd à porter que d'habitude.",
    "Une tristesse discrète traverse ta journée.",
  ],
  angry: [
    "Ta journée est traversée par de la colère.",
    "Quelque chose te met en tension aujourd'hui.",
    "Aujourd'hui, l'irritation prend de la place.",
  ],
  fearful: [
    "Une inquiétude sourde accompagne ta journée.",
    "Tu avances aujourd'hui avec un peu de peur au ventre.",
    "La journée est teintée d'appréhension.",
  ],
  surprised: [
    "Ta journée a été marquée par l'inattendu.",
    "Quelque chose t'a pris de court aujourd'hui.",
    "Une journée pleine de surprises, semble-t-il.",
  ],
  disgusted: [
    "Une forme de rejet ou de dégoût colore ta journée.",
    "Aujourd'hui, quelque chose ne passe pas.",
    "Ta journée porte la trace d'un malaise persistant.",
  ],
  calm: [
    "Tu vis cette journée dans le calme.",
    "Aujourd'hui coule sans heurts, en douceur.",
    "Une belle tranquillité accompagne ta journée.",
  ],
  miss: [
    "Un manque se fait sentir aujourd'hui.",
    "Ta journée porte la trace de quelque chose — ou quelqu'un — qui te manque.",
    "Il y a un vide discret dans ta journée aujourd'hui.",
  ],
  neutral: [
    "Une journée plutôt neutre, sans grand relief.",
    "Aujourd'hui avance sans éclat particulier — ni bon ni mauvais.",
    "Ta journée semble stable, sans grande émotion dominante.",
  ],
  determination: [
    "Tu vis cette journée portée par la détermination.",
    "Aujourd'hui, tu avances avec une vraie volonté d'agir.",
    "Une énergie déterminée traverse ta journée.",
  ],
  ambition: [
    "Ta journée est tirée vers le haut par l'ambition.",
    "Aujourd'hui, tu vises plus loin que d'habitude.",
    "Une envie de conquête colore ta journée.",
  ],
  fear_of_failure: [
    "La peur de l'échec s'est invitée dans ta journée.",
    "Aujourd'hui, le doute sur tes résultats pèse un peu.",
    "Ta journée porte la trace d'une crainte de ne pas être à la hauteur.",
  ],
  need_validation: [
    "Aujourd'hui, tu cherches un peu de reconnaissance.",
    "Ta journée est traversée par un besoin d'être validé.",
    "Un besoin d'approbation accompagne ta journée.",
  ],
  frustration: [
    "Ta journée est marquée par de la frustration.",
    "Aujourd'hui, les choses n'avancent pas comme tu le voudrais.",
    "Une impatience contrariée traverse ta journée.",
  ],
  pressure: [
    "Tu vis cette journée sous pression.",
    "Aujourd'hui pèse lourd sur tes épaules.",
    "Ta journée est tendue par les attentes qui pèsent sur toi.",
  ],
  insecurity: [
    "Une insécurité discrète traverse ta journée.",
    "Aujourd'hui, tu doutes un peu plus que d'habitude.",
    "Ta journée porte la marque d'un manque de confiance passager.",
  ],
  pride: [
    "Tu vis cette journée avec fierté.",
    "Aujourd'hui, tu peux être content de ce que tu accomplis.",
    "Une belle fierté accompagne ta journée.",
  ],
  control_obsession: [
    "Aujourd'hui, tu cherches à tout maîtriser.",
    "Ta journée est marquée par un besoin de tout contrôler.",
    "Une tension autour du contrôle traverse ta journée.",
  ],
  emotional_exhaustion: [
    "Tu vis cette journée dans l'épuisement émotionnel.",
    "Aujourd'hui, tes réserves semblent basses.",
    "Ta journée porte le poids de la fatigue accumulée.",
  ],
};

// Phrase affichée quand aucun check-in n'a été fait aujourd'hui.
export const noCheckinTodayPhrase = "De awn deba, milamina izy ao? tsisy check-in manko.";

/**
 * Choisit une phrase pour l'humeur dominante donnée. Retourne
 * noCheckinTodayPhrase si moodId est null/inconnu.
 */
export function pickMoodSummaryPhrase(moodId) {
  const pool = moodSummaryPhrases[moodId];
  if (!pool || !pool.length) return noCheckinTodayPhrase;
  return pool[Math.floor(Math.random() * pool.length)];
}
