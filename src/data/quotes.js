// Bibliothèque de citations locales — aucune dépendance réseau, disponibles offline.
// Chaque citation est taguée par "mood" (humeurs de moods.js qu'elle sert le mieux)
// et par "tags" (thèmes libres) pour permettre une recherche et une sélection
// adaptée à l'état émotionnel courant (voir quoteForMood / searchQuotes).
//
// moods possibles : great | good | neutral | low | bad (voir data/moods.js)
// une citation peut cibler plusieurs moods à la fois.

export const quotes = [
  // ---- Discipline & constance (neutral / good) ----
  { text: 'La discipline est le pont entre les objectifs et les résultats.', author: 'Jim Rohn', moods: ['neutral', 'good'], tags: ['discipline', 'objectifs'] },
  { text: "Tu n'as pas besoin d'être extrême, juste constant.", author: 'Anonyme', moods: ['neutral', 'good', 'low'], tags: ['discipline', 'constance'] },
  { text: 'Chaque jour est un vote pour la personne que tu deviens.', author: 'James Clear', moods: ['neutral', 'good'], tags: ['habitudes', 'identité'] },
  { text: 'La motivation te fait démarrer. La discipline te fait continuer.', author: 'Jim Ryun', moods: ['neutral', 'good'], tags: ['discipline', 'motivation'] },
  { text: "Ce que tu fais aujourd'hui peut améliorer tous tes lendemains.", author: 'Ralph Marston', moods: ['neutral', 'good'], tags: ['action', 'futur'] },
  { text: 'Le succès est la somme de petits efforts répétés jour après jour.', author: 'Robert Collier', moods: ['neutral', 'good'], tags: ['succès', 'constance'] },
  { text: "On ne devient pas ce que l'on désire, on devient ce que l'on répète.", author: 'Anonyme', moods: ['neutral', 'good'], tags: ['habitudes', 'identité'] },
  { text: "L'ordre et la constance donnent de la force même aux choses les plus faibles.", author: 'Thomas à Kempis', moods: ['neutral'], tags: ['discipline', 'constance'] },
  { text: 'Un peu chaque jour vaut mieux que beaucoup de temps en temps.', author: 'Anonyme', moods: ['neutral', 'good'], tags: ['constance', 'habitudes'] },
  { text: "Ce n'est pas la charge qui te casse, c'est la façon dont tu la portes.", author: "Lou Holtz", moods: ['neutral', 'low'], tags: ['résilience', 'attitude'] },

  // ---- Motivation basse / coup de mou (low) ----
  { text: "Tu n'as pas besoin de voir tout l'escalier, juste la première marche.", author: 'Martin Luther King Jr.', moods: ['low', 'bad'], tags: ['premier pas', 'doute'] },
  { text: "Ça va bien se passer, même si aujourd'hui ce n'est pas le cas.", author: 'Anonyme', moods: ['low', 'bad'], tags: ['réconfort'] },
  { text: 'Il est normal de ne pas avoir toutes les réponses tout de suite.', author: 'Anonyme', moods: ['low', 'bad', 'neutral'], tags: ['patience', 'doute'] },
  { text: "Un jour difficile n'efface pas tous les jours où tu as tenu bon.", author: 'Anonyme', moods: ['low', 'bad'], tags: ['persévérance', 'réconfort'] },
  { text: "Le plus dur, c'est de commencer. Après, ça devient du mouvement.", author: 'Anonyme', moods: ['low'], tags: ['premier pas', 'action'] },
  { text: "Tu n'es pas en retard. Tu suis ton propre rythme.", author: 'Anonyme', moods: ['low'], tags: ['patience', 'comparaison'] },
  { text: 'Repose-toi si tu dois, mais ne renonce pas.', author: 'Bantu proverbe', moods: ['low', 'bad'], tags: ['persévérance', 'repos'] },
  { text: "La vallée fait aussi partie de la montagne.", author: 'Anonyme', moods: ['low', 'bad'], tags: ['résilience'] },
  { text: "Tomber ne fait pas de toi un perdant. Rester à terre, oui.", author: 'Anonyme', moods: ['low', 'bad'], tags: ['résilience', 'échec'] },
  { text: "Petit à petit, l'oiseau fait son nid.", author: 'Proverbe français', moods: ['low', 'neutral'], tags: ['patience', 'constance'] },
  { text: 'Sois patient avec toi-même. Tu désapprends des habitudes qui datent de plusieurs années.', author: 'Anonyme', moods: ['low'], tags: ['patience', 'habitudes'] },

  // ---- Stress élevé (bad) ----
  { text: "Respire. Tu es exactement où tu dois être pour apprendre ce que tu dois apprendre.", author: 'Anonyme', moods: ['bad'], tags: ['stress', 'respiration'] },
  { text: "Tu n'as pas à tout porter aujourd'hui. Juste la prochaine heure.", author: 'Anonyme', moods: ['bad'], tags: ['stress', 'présent'] },
  { text: "Le calme n'est pas l'absence de tempête, c'est la paix au milieu de celle-ci.", author: 'Anonyme', moods: ['bad'], tags: ['calme', 'stress'] },
  { text: "Ce que tu ressens maintenant n'est pas permanent.", author: 'Anonyme', moods: ['bad', 'low'], tags: ['stress', 'impermanence'] },
  { text: "Ralentir n'est pas reculer.", author: 'Anonyme', moods: ['bad'], tags: ['stress', 'rythme'] },
  { text: "Une chose à la fois. C'est déjà beaucoup.", author: 'Anonyme', moods: ['bad'], tags: ['stress', 'simplicité'] },
  { text: "Tu ne peux pas verser d'une tasse vide. Prends soin de toi d'abord.", author: 'Anonyme', moods: ['bad'], tags: ['stress', 'repos'] },

  // ---- Bonne dynamique / énergie haute (great) ----
  { text: "Quand tu es en feu, ne demande pas la permission d'avancer.", author: 'Anonyme', moods: ['great'], tags: ['énergie', 'action'] },
  { text: "La meilleure façon de prédire ton avenir, c'est de le créer.", author: 'Abraham Lincoln', moods: ['great', 'good'], tags: ['action', 'futur'] },
  { text: "Vise la lune. Même en cas d'échec, tu atterriras parmi les étoiles.", author: 'Norman Vincent Peale', moods: ['great', 'good'], tags: ['ambition'] },
  { text: "L'élan que tu ressens aujourd'hui, transforme-le en une action concrète maintenant.", author: 'Anonyme', moods: ['great'], tags: ['énergie', 'action'] },
  { text: "Ce n'est pas le temps qui manque, c'est la direction.", author: 'Anonyme', moods: ['great', 'good'], tags: ['direction', 'action'] },
  { text: "Profite de l'élan : les jours forts construisent les semaines fortes.", author: 'Anonyme', moods: ['great'], tags: ['énergie', 'constance'] },
  { text: "Fixe la barre plus haute que ce qui te met à l'aise.", author: 'Anonyme', moods: ['great'], tags: ['ambition', 'dépassement'] },
  { text: "Le succès, c'est tomber sept fois et se relever huit.", author: 'Proverbe japonais', moods: ['great', 'good'], tags: ['résilience', 'persévérance'] },

  // ---- Peur / doute / abandon ----
  { text: "Le doute tue plus de rêves que l'échec ne le fera jamais.", author: 'Suzy Kassem', moods: ['low', 'bad'], tags: ['doute', 'peur'] },
  { text: "Tu n'échoues que si tu abandonnes.", author: 'Anonyme', moods: ['low', 'bad'], tags: ['abandon', 'persévérance'] },
  { text: "Ce que tu crains de faire est souvent la clé de ce que tu veux devenir.", author: 'Anonyme', moods: ['low'], tags: ['peur', 'croissance'] },
  { text: "La peur est un menteur.", author: 'Zac Brown Band', moods: ['low', 'bad'], tags: ['peur'] },
  { text: "N'abandonne pas à cinq minutes du miracle.", author: 'Anonyme', moods: ['low', 'bad'], tags: ['abandon', 'persévérance'] },
  { text: "Il est plus difficile de rester en bas que de continuer à monter.", author: 'Anonyme', moods: ['low'], tags: ['persévérance'] },

  // ---- Deadline / échéance ----
  { text: "Le temps que tu apprécies gaspiller n'est pas du temps gaspillé.", author: 'Bertrand Russell', moods: ['neutral'], tags: ['temps'] },
  { text: "L'échéance n'est pas ton ennemie, c'est ton cadre.", author: 'Anonyme', moods: ['neutral', 'good'], tags: ['deadline', 'focus'] },
  { text: "Ce n'est pas le manque de temps qui est le problème, c'est le manque de priorités.", author: 'Anonyme', moods: ['neutral'], tags: ['priorités', 'temps'] },

  // ---- Objectif bloqué / persévérance ----
  { text: "Un objectif sans plan n'est qu'un souhait. Un plan sans action reste un souhait.", author: 'Antoine de Saint-Exupéry (adapté)', moods: ['neutral', 'low'], tags: ['objectifs', 'action'] },
  { text: "Si tu es bloqué, change l'échelle du problème, pas ton ambition.", author: 'Anonyme', moods: ['low', 'neutral'], tags: ['blocage', 'objectifs'] },
  { text: "Les montagnes ne se gravissent jamais en une saison — mais toujours pas à pas.", author: 'Anonyme', moods: ['low', 'neutral'], tags: ['persévérance', 'objectifs'] },
  { text: "Fais ce que tu peux, avec ce que tu as, là où tu es.", author: 'Theodore Roosevelt', moods: ['low', 'neutral'], tags: ['action', 'pragmatisme'] },

  // ---- Général / intemporel ----
  { text: "Le futur appartient à ceux qui croient à la beauté de leurs rêves.", author: 'Eleanor Roosevelt', moods: ['neutral', 'good', 'great'], tags: ['rêves', 'espoir'] },
  { text: "Ton seul concurrent, c'est qui tu étais hier.", author: 'Anonyme', moods: ['neutral', 'good'], tags: ['comparaison', 'progrès'] },
  { text: "La confiance ne vient pas d'être toujours dans le vrai, mais de ne pas avoir peur de se tromper.", author: 'Peter T. McIntyre', moods: ['neutral', 'good'], tags: ['confiance', 'échec'] },
  { text: "On ne construit pas une maison en un jour, mais chaque brique compte.", author: 'Anonyme', moods: ['neutral', 'good'], tags: ['patience', 'constance'] },
  { text: "Fais aujourd'hui ce que les autres ne feront pas, pour avoir demain ce que les autres n'auront pas.", author: 'Jerry Rice', moods: ['neutral', 'good', 'great'], tags: ['sacrifice', 'ambition'] },
  { text: "L'action est la clé fondamentale de tout succès.", author: 'Pablo Picasso', moods: ['neutral', 'good'], tags: ['action', 'succès'] },
  { text: "Deviens si bon qu'ils ne pourront plus t'ignorer.", author: 'Steve Martin', moods: ['neutral', 'good', 'great'], tags: ['excellence', 'travail'] },
  { text: "Le meilleur moment pour planter un arbre, c'était il y a vingt ans. Le second, c'est maintenant.", author: 'Proverbe chinois', moods: ['neutral', 'low'], tags: ['action', 'temps'] },
];

/** Recherche simple, insensible à la casse et aux accents, sur texte/auteur/tags. */
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Recherche des citations par mot-clé libre (texte, auteur ou thème/tag).
 * Renvoie toutes les correspondances, sans limite — l'appelant tranche l'affichage.
 */
export function searchQuotes(query) {
  const q = normalize(query || '').trim();
  if (!q) return quotes;
  return quotes.filter((quote) => {
    const haystack = normalize(`${quote.text} ${quote.author} ${(quote.tags || []).join(' ')}`);
    return haystack.includes(q);
  });
}

/** Citation du jour, stable pour la journée (déterministe par date). */
export function quoteOfTheDay() {
  const day = new Date();
  const dayIndex = Math.floor(
    (day - new Date(day.getFullYear(), 0, 0)) / 86400000
  );
  return quotes[dayIndex % quotes.length];
}

/** Citation aléatoire, tirée au sort à chaque appel (pour "nouvelle citation à la demande"). */
export function randomQuote(excludeText) {
  const pool = excludeText ? quotes.filter((q) => q.text !== excludeText) : quotes;
  const source = pool.length ? pool : quotes;
  return source[Math.floor(Math.random() * source.length)];
}

/**
 * Citation adaptée à une humeur donnée (id de moods.js : great|good|neutral|low|bad).
 * Si aucune humeur fournie ou aucune citation taguée pour cette humeur, retombe sur
 * une citation aléatoire — jamais de blocage.
 */
export function quoteForMood(moodId, excludeText) {
  if (!moodId) return randomQuote(excludeText);
  let pool = quotes.filter((q) => q.moods?.includes(moodId));
  if (excludeText) pool = pool.filter((q) => q.text !== excludeText);
  if (!pool.length) return randomQuote(excludeText);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Citation "intelligente" pour l'accueil : si un check-in émotionnel a été fait
 * aujourd'hui (moodEntry avec sa date), on adapte la citation à cette humeur ;
 * sinon on retombe sur la citation du jour classique. `moodEntry` attend la forme
 * de state.mood.current issue de store.js : { emoji: <moodId>, date }.
 */
export function smartQuote(moodEntry) {
  if (moodEntry?.date) {
    const entryDay = new Date(moodEntry.date).toDateString();
    const today = new Date().toDateString();
    if (entryDay === today) {
      return quoteForMood(moodEntry.emoji);
    }
  }
  return quoteOfTheDay();
}
