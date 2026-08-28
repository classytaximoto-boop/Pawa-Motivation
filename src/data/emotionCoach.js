// Coach Émotionnel — base offline, aucune dépendance réseau.
//
// Principe : l'utilisateur tape un mot-clé libre ("stresser", "colère", "seul"...)
// ou choisit une émotion. On matche sur emotionStates[].keywords puis on affiche
// le contenu (message direct + instructions concrètes + citations de personas).
//
// IMPORTANT — cadrage de la colère / respect (voir emotionStates.temper) :
// ce module ne contient JAMAIS de contenu qui présente l'agression physique ou
// la confrontation comme une solution valable pour "se faire respecter". Le
// contenu canalise toujours vers la maîtrise de soi, la sortie de situation,
// et l'affirmation par les actes — jamais vers la validation de la violence.

// Personas : figures fictives (Peaky Blinders, La Casa de Papel, James Bond)
// utilisées comme modèles de sang-froid / stratégie / prestance. Répliques
// paraphrasées dans l'esprit du personnage — pas des citations mot pour mot
// tirées des scripts.
export const personas = {
  shelby: {
    name: 'Thomas Shelby',
    source: 'Peaky Blinders',
    trait: 'Sang-froid, contrôle total de soi-même',
    lines: [
      "Ne montre jamais tout ce que tu ressens. Ce que les autres ne voient pas, ils ne peuvent pas l'utiliser contre toi.",
      "La colère est une information, pas un ordre. Tu l'écoutes, tu ne lui obéis pas.",
      "Un homme qui garde son calme dans le chaos a déjà gagné la moitié du combat.",
      "Ce n'est pas la peur qui te définit, c'est ce que tu fais avec.",
      "Décide, agis, n'explique pas. Les résultats parlent à ta place.",
    ],
  },
  professeur: {
    name: 'Le Professeur',
    source: 'La Casa de Papel',
    trait: 'Stratégie, leadership sous pression, anti-panique',
    lines: [
      "Un plan ne survit jamais totalement au contact du réel — c'est pour ça qu'on prévoit toujours un plan B, et un état d'esprit qui ne casse pas.",
      "La panique est la seule vraie erreur irréversible. Tout le reste peut se corriger si tu restes lucide.",
      "Avant d'agir, pose-toi la question : qu'est-ce que je contrôle réellement dans cette situation ? Agis seulement là-dessus.",
      "Un leader ne rassure pas en niant le danger, il rassure en montrant qu'il a déjà pensé au pire.",
      "Respire. Le temps que tu prends pour réfléchir n'est jamais du temps perdu.",
    ],
  },
  bond: {
    name: 'James Bond',
    source: '007',
    trait: 'Charisme, élégance sous pression, précision',
    lines: [
      "Le charisme, ce n'est pas parler fort. C'est parler juste, et seulement quand c'est nécessaire.",
      "Reste précis. Un homme qui maîtrise les détails inspire confiance sans avoir à la demander.",
      "L'élégance dans l'échec compte plus que le bruit dans la victoire.",
      "On ne négocie jamais depuis la panique. On négocie depuis la position la plus calme possible.",
      "Habille ta discipline comme tu habilles ton corps : discrètement, mais sans exception.",
    ],
  },
};

// États émotionnels. Chaque état a des mots-clés (matching libre, insensible à
// la casse/accents) + un contenu structuré affiché quand l'état est identifié.
export const emotionStates = [
  {
    id: 'stress',
    label: 'Stress',
    emoji: '⚡',
    keywords: ['stress', 'stresse', 'stresser', 'stressé', 'anxieux', 'anxiete', 'panique', 'pression', 'debordé', 'submergé'],
    message: "Le stress, c'est de l'énergie mal dirigée. Tu n'as pas besoin d'en avoir moins — tu as besoin de savoir où l'envoyer.",
    actions: [
      "Respire 4 secondes inspire, 6 secondes expire — répète 5 fois avant de faire quoi que ce soit d'autre.",
      "Écris sur une feuille : ce que je contrôle maintenant / ce que je ne contrôle pas. Agis uniquement sur la première colonne.",
      "Choisis UNE seule action concrète pour les 20 prochaines minutes. Pas dix. Une.",
      "Bouge ton corps 5 minutes — marche, étirement. Le stress se loge dans le corps avant l'esprit.",
    ],
    personaKeys: ['professeur', 'bond'],
  },
  {
    id: 'sad',
    label: 'Tristesse',
    emoji: '😔',
    keywords: ['triste', 'tristesse', 'deprime', 'deprimé', 'chagrin', 'mal', 'vide', 'seul', 'solitude'],
    message: "La tristesse n'est pas une faiblesse à cacher. C'est un signal que quelque chose compte pour toi. Écoute-la, ne t'y noie pas.",
    actions: [
      "Nomme précisément ce qui te pèse — écris une phrase claire, pas juste 'ça va mal'.",
      "Contacte une personne de confiance aujourd'hui, même pour un message court. L'isolement nourrit la tristesse.",
      "Fais une action minuscule mais concrète pour ton corps : douche, repas correct, sortie dehors.",
      "Donne-toi le droit de ressentir sans te juger — puis fixe un cap : qu'est-ce que je fais demain matin, une seule chose.",
    ],
    personaKeys: ['shelby'],
  },
  {
    id: 'happy',
    label: 'Joie',
    emoji: '🔥',
    keywords: ['heureux', 'content', 'joie', 'motivé', 'motive', 'bien', 'euphorique', 'fier'],
    message: "Utilise cette énergie maintenant — ne la laisse pas s'évaporer. Les meilleurs jours sont ceux où tu construis pendant que tu es fort.",
    actions: [
      "Profite du moment 2 minutes, pleinement, sans culpabilité.",
      "Transforme cette énergie en action concrète sur un objectif important — maintenant, pas demain.",
      "Note ce qui a produit cet état. Tu pourras le recréer plus tard volontairement.",
      "Partage-la avec quelqu'un — la joie communiquée se multiplie, elle ne se divise pas.",
    ],
    personaKeys: ['bond'],
  },
  {
    id: 'angry',
    label: 'Colère',
    emoji: '🔥',
    keywords: ['colere', 'colère', 'enerve', 'énervé', 'furieux', 'rage', 'agace', 'agacé'],
    message: "La colère est une force. Un homme fort ne la nie pas et ne la laisse pas non plus le piloter — il la dirige.",
    actions: [
      "Avant de répondre ou d'agir, mets une distance physique avec la situation — sors, marche, change de pièce.",
      "Identifie ce que la colère protège vraiment chez toi (respect, justice, limite franchie). C'est souvent légitime — la façon de réagir, elle, se choisit.",
      "Écris ce que tu voudrais dire ou faire, sans l'envoyer ni l'exécuter. Relis dans 30 minutes.",
      "Décide de la réponse qui te fait respecter sur le long terme, pas celle qui soulage sur l'instant.",
    ],
    personaKeys: ['shelby', 'professeur'],
  },
  {
    id: 'victim',
    label: 'Syndrome de la victime',
    emoji: '🎯',
    keywords: ['victime', 'accuser', 'accuse', 'blame', 'jamais ma faute', 'toujours les autres', 'injuste'],
    message: "Se sentir lésé arrive à tout le monde — parfois à raison. Mais rester dedans, c'est donner ton pouvoir à quelqu'un d'autre. Reprends-le.",
    actions: [
      "Sépare les deux : ce qui t'a été fait (réel, parfois injuste) / ce que tu choisis d'en faire maintenant (ça, ça t'appartient).",
      "Pose-toi la question honnête : dans cette situation précise, quelle est ma part de responsabilité, même petite ?",
      "Remplace 'pourquoi ça m'arrive à moi' par 'qu'est-ce que je fais maintenant, avec ce qui est là'.",
      "Un homme fort peut reconnaître une injustice ET continuer d'avancer. Les deux ne s'excluent pas.",
    ],
    personaKeys: ['shelby', 'professeur'],
  },
  {
    id: 'guilty',
    label: 'Culpabilité',
    emoji: '🕯️',
    keywords: ['coupable', 'culpabilite', 'culpabilité', 'honte', 'regret'],
    message: "La culpabilité utile te fait grandir. La culpabilité inutile te fait tourner en rond. Trie les deux.",
    actions: [
      "Demande-toi : est-ce que je peux réparer ou corriger quelque chose de concret ici ? Si oui, fais-le.",
      "Si rien n'est réparable, transforme la culpabilité en leçon écrite noir sur blanc — puis ferme la page.",
      "Ne confonds pas 'j'ai fait une erreur' et 'je suis une erreur'. Le premier se corrige, le second est faux.",
      "Pardonne-toi comme tu pardonnerais à quelqu'un que tu respectes qui aurait fait la même chose.",
    ],
    personaKeys: ['professeur'],
  },
  {
    id: 'temper',
    label: 'Envie de se battre / tempérament',
    emoji: '🛑',
    keywords: ['me battre', 'frapper', 'exploser', 'temperament', 'tempérament', 'envie de taper', 'agressif', 'violence'],
    message: "Ce que tu ressens là, c'est une impulsion — une décharge, pas un plan. Un homme qui se respecte choisit sa réponse, il ne la subit pas. Se battre physiquement ne règle jamais un problème de respect : ça donne raison à celui qui t'a provoqué, et ça te coûte à toi, pas à lui.",
    actions: [
      "Sors immédiatement de l'endroit où tu es, physiquement, même 2 minutes. La distance casse l'escalade.",
      "Respire profondément, compte jusqu'à 20 en marchant si besoin. L'impulsion redescend en dessous de 90 secondes si tu ne la nourris pas.",
      "Dis-toi clairement : 'Je choisis ma réponse, je ne la subis pas.' Répète-le.",
      "Le vrai respect, tu le construis par ta constance, ta parole tenue et ton calme sous pression — pas par un coup de poing dans l'instant.",
      "Si la situation reste dangereuse ou récurrente (quelqu'un qui te menace, te frappe), ce n'est plus un sujet de gestion émotionnelle seule — cherche une personne de confiance ou une autorité compétente pour t'aider à sécuriser la situation.",
    ],
    personaKeys: ['shelby', 'professeur'],
    isSensitive: true,
  },
  {
    id: 'respect',
    label: "Besoin de respect (non obtenu)",
    emoji: '👑',
    keywords: ['respect', 'irrespecte', 'irrespecté', 'humilie', 'humilié', 'rabaisse', 'rabaissé', 'manque de respect'],
    message: "Le vrai respect ne se réclame pas à voix haute, il s'impose par la constance. Celui qui doit exiger le respect à chaque instant ne l'a souvent pas encore construit solidement — pas parce qu'il ne le mérite pas, mais parce que le respect se gagne dans la durée, pas dans l'instant.",
    actions: [
      "Avant de réagir à un manque de respect perçu, demande-toi : qu'est-ce que je veux, être entendu tout de suite, ou avoir raison sur la durée ?",
      "Pose une limite claire, calmement, en une phrase — sans crier, sans justifier dix fois. La fermeté calme impressionne plus que le volume.",
      "Ne poursuis jamais quelqu'un pour obtenir sa reconnaissance. Construis, et laisse le résultat parler.",
      "Le silence stratégique est souvent plus puissant qu'une réponse immédiate à une provocation.",
    ],
    personaKeys: ['shelby', 'bond'],
  },
];

export const emotionStateMap = Object.fromEntries(emotionStates.map((e) => [e.id, e]));

/** Normalise pour un matching robuste (accents, casse, espaces). */
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Cherche un ou plusieurs états émotionnels correspondant au texte libre tapé
 * par l'utilisateur. Retourne un tableau trié par pertinence (nombre de
 * mots-clés matchés), jamais vide seulement si aucun mot-clé ne matche.
 */
export function searchEmotionStates(query) {
  const q = normalize(query);
  if (!q) return [];
  const scored = emotionStates
    .map((state) => {
      const score = state.keywords.reduce((acc, kw) => (q.includes(normalize(kw)) ? acc + 1 : acc), 0);
      return { state, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((s) => s.state);
}

/** Retourne 2 lignes aléatoires (une par persona demandé) pour varier l'affichage. */
export function pickPersonaLines(personaKeys) {
  return personaKeys.map((key) => {
    const p = personas[key];
    const line = p.lines[Math.floor(Math.random() * p.lines.length)];
    return { name: p.name, source: p.source, line };
  });
}
