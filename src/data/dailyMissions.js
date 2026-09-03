/**
 * Pool de missions quotidiennes possibles. Chaque jour, _ensureTodayMissions()
 * (voir store.js) en tire 3 au hasard, sans doublon, pour remplacer
 * state.todayMissions. Ajouter/retirer des entrées ici suffit à faire
 * évoluer la variété — aucune autre modification nécessaire ailleurs.
 */
export const dailyMissionsPool = [
  { text: 'Écrire 3 objectifs de la semaine', xp: 15 },
  { text: '10 minutes de lecture ou audio motivant', xp: 10 },
  { text: 'Faire le point sur ton "Pourquoi"', xp: 10 },
  { text: 'Faire un check-in émotionnel', xp: 10 },
  { text: 'Avancer une étape sur un objectif actif', xp: 15 },
  { text: 'Noter une victoire de la journée', xp: 10 },
  { text: '5 minutes de respiration ou méditation', xp: 10 },
  { text: 'Ranger ou planifier ta journée dans Agenda', xp: 10 },
  { text: 'Relire ton objectif principal du jour', xp: 5 },
  { text: 'Faire une action concrète pour un projet en cours', xp: 15 },
  { text: 'Noter une dépense ou un revenu dans Money', xp: 5 },
  { text: 'Écrire ce qui t\'a coûté le plus d\'énergie aujourd\'hui', xp: 10 },
  { text: 'Envoyer un message à quelqu\'un qui compte pour toi', xp: 10 },
  { text: 'Faire 10 minutes d\'activité physique', xp: 15 },
  { text: 'Relire une citation motivante et la garder en tête', xp: 5 },
];

/**
 * Tire `count` missions distinctes du pool (par texte, pour éviter les
 * doublons même si le pool venait à contenir des libellés répétés).
 */
export function pickRandomMissions(count = 3) {
  const shuffled = [...dailyMissionsPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
