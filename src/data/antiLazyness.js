// Contenu anti-paresse basé sur des méthodes japonaises (Ikigai, Kaizen, Gaman, etc.).
// 100% offline — aucun appel IA. Chaque méthode a 3 variantes selon le tempérament
// du coach choisi : military | motivating | friendly.

export const antiLazynessMethods = [
  {
    id: 'ikigai',
    title: 'Ikigai — Ta raison d\'être',
    messages: {
      military: 'Pourquoi tu fais ça ? Trouve ta raison, soldat, et bouge-toi. Pas de mission sans objectif clair.',
      motivating: 'Rappelle-toi POURQUOI tu as commencé. Cette raison est plus forte que ta fatigue du moment !',
      friendly: 'Prends un instant : pourquoi est-ce que tu fais tout ça ? Se reconnecter à sa raison d\'être aide beaucoup.',
    },
  },
  {
    id: 'kaizen',
    title: 'Kaizen — 1% chaque jour',
    messages: {
      military: 'Pas besoin d\'exploit aujourd\'hui. Une amélioration, une seule. Exécute.',
      motivating: '1% aujourd\'hui, 1% demain — ça s\'accumule vite. Fais ce petit pas maintenant !',
      friendly: 'Pas besoin de tout changer d\'un coup. Une toute petite amélioration aujourd\'hui, c\'est déjà bien.',
    },
  },
  {
    id: 'kaikaku',
    title: 'Kaikaku — Le changement radical',
    messages: {
      military: 'Si ta méthode ne marche plus, arrête de bricoler. Change de stratégie. Maintenant.',
      motivating: 'Si ça bloque depuis un moment, change de stratégie ! Un nouveau départ peut tout débloquer.',
      friendly: 'Si quelque chose ne fonctionne plus depuis un moment, c\'est peut-être le signe qu\'il faut changer d\'approche — pas grave.',
    },
  },
  {
    id: '5s',
    title: '5S — Réduire la friction',
    messages: {
      military: 'Ton espace est en désordre ? Range-le. Un environnement sale nourrit la paresse.',
      motivating: 'Un espace rangé = un esprit clair. Prends 5 minutes pour dégager le terrain, tu vas voir la différence !',
      friendly: 'Un petit rangement autour de toi peut vraiment aider à te sentir prêt à commencer.',
    },
  },
  {
    id: 'gaman',
    title: 'Gaman — Endurer sans abandonner',
    messages: {
      military: 'Tu n\'as pas besoin d\'en avoir envie. Tu dois juste commencer. Exécution immédiate.',
      motivating: 'L\'envie viendra APRÈS l\'action, pas avant. Commence, même sans motivation !',
      friendly: 'Ce n\'est pas grave si tu n\'en as pas envie — tu peux commencer quand même, doucement.',
    },
  },
  {
    id: 'shokunin',
    title: 'Shokunin — L\'esprit de l\'artisan',
    messages: {
      military: 'Pas "je veux être fort". Aujourd\'hui, tu perfectionnes UNE chose. Concentre-toi.',
      motivating: 'Deviens un peu meilleur aujourd\'hui dans ce que tu fais. Chaque répétition compte !',
      friendly: 'Aujourd\'hui, essaie juste de peaufiner un petit détail dans ce que tu fais. Pas besoin de viser la perfection totale.',
    },
  },
  {
    id: 'harahachibu',
    title: 'Hara Hachi Bu — Ne pas se surcharger',
    messages: {
      military: 'Garde de l\'énergie pour demain. Ne te vide pas complètement. Discipline aussi dans le repos.',
      motivating: 'Garde un peu d\'énergie en réserve — tu en auras besoin pour continuer demain avec la même force !',
      friendly: 'Pas besoin de te surcharger complètement. Garde un peu d\'énergie pour demain, ça compte aussi.',
    },
  },
  {
    id: 'wabisabi',
    title: 'Wabi-Sabi — Accepter l\'imperfection',
    messages: {
      military: 'Une action imparfaite vaut mieux qu\'un plan parfait jamais lancé. Avance.',
      motivating: 'N\'attends pas la perfection pour commencer ! Une action imparfaite bat un projet parfait resté dans ta tête.',
      friendly: 'Ce n\'est pas grave si ce n\'est pas parfait. Commencer, même imparfaitement, c\'est déjà énorme.',
    },
  },
  {
    id: 'mottainai',
    title: 'Mottainai — Ne pas gaspiller',
    messages: {
      military: 'Ce temps ne reviendra pas. Ne le gaspille pas. Utilise-le.',
      motivating: 'Ton temps et ton énergie sont précieux — ne les laisse pas filer sans rien construire !',
      friendly: 'Essaie de ne pas laisser filer ce moment — même une petite action vaut la peine d\'être faite.',
    },
  },
  {
    id: 'shoshin',
    title: 'Shoshin — L\'esprit du débutant',
    messages: {
      military: 'Tu n\'es pas mauvais. Tu es en apprentissage. Continue la mission.',
      motivating: '"Je suis encore en apprentissage" — pas "je suis mauvais". Cette différence change tout !',
      friendly: 'Sois indulgent avec toi-même : tu es encore en train d\'apprendre, et c\'est très bien comme ça.',
    },
  },
  {
    id: 'nemawashi',
    title: 'Nemawashi — Préparer avant d\'agir',
    messages: {
      military: 'Prépare ton terrain avant l\'action. Moins de friction, moins d\'excuses.',
      motivating: 'Prépare ta première étape à l\'avance — ça enlève une barrière énorme au moment de commencer !',
      friendly: 'Si tu prépares un peu le terrain à l\'avance, ce sera plus facile de t\'y mettre plus tard.',
    },
  },
  {
    id: 'ganbaru',
    title: 'Ganbaru — Tenir jusqu\'au bout',
    messages: {
      military: 'Tu as pris un engagement. Tiens-le. Jusqu\'au bout. Pas d\'abandon.',
      motivating: 'Tu es capable de tenir ton engagement jusqu\'au bout — donne tout ce qu\'il te reste !',
      friendly: 'Essaie de tenir ton engagement, même doucement — chaque effort compte vraiment.',
    },
  },
];

// Rappel "lève-toi tôt" — affiché avec les messages anti-paresse, et peut aussi
// déclencher la création d'une vraie alarme via alarm_create_v0 côté écran.
export const wakeUpReminders = {
  military: 'Lève-toi tôt. Chaque minute au lit est une minute perdue sur ta mission. Debout.',
  motivating: 'Le lever tôt te donne des heures en plus pour avancer vers tes objectifs — lève-toi motivé !',
  friendly: 'Essaie de te lever un peu plus tôt demain — tu te sentiras probablement mieux dans ta journée.',
};

// Phrase de clôture, dans l'esprit "discipline > envie".
export const closingLine = {
  military: 'La discipline n\'attend pas l\'envie. Elle agit quand même. Rompez.',
  motivating: 'La discipline ne consiste pas à avoir toujours envie — elle consiste à agir même quand l\'envie n\'est pas là !',
  friendly: 'Rappelle-toi : ce n\'est pas grave de ne pas avoir envie. Ce qui compte, c\'est d\'agir quand même, à ton rythme.',
};

export function randomAntiLazynessMethod() {
  return antiLazynessMethods[Math.floor(Math.random() * antiLazynessMethods.length)];
}
