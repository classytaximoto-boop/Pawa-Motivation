// Citations locales — aucune dépendance réseau, disponibles offline.
export const quotes = [
  { text: 'La discipline est le pont entre les objectifs et les résultats.', author: 'Jim Rohn' },
  { text: "Tu n'as pas besoin d'être extrême, juste constant.", author: 'Anonyme' },
  { text: "Chaque jour est un vote pour la personne que tu deviens.", author: 'James Clear' },
  { text: 'La motivation te fait démarrer. La discipline te fait continuer.', author: 'Jim Ryun' },
  { text: "Ce que tu fais aujourd'hui peut améliorer tous tes lendemains.", author: 'Ralph Marston' },
  { text: 'Le succès est la somme de petits efforts répétés jour après jour.', author: 'Robert Collier' },
];

export function quoteOfTheDay() {
  const day = new Date();
  const dayIndex = Math.floor(
    (day - new Date(day.getFullYear(), 0, 0)) / 86400000
  );
  return quotes[dayIndex % quotes.length];
}
