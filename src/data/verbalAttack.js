/**
 * Données pour l'onglet "Attaque Verbale".
 * Objectif : donner à l'utilisateur plusieurs façons de répondre avec
 * assurance dans des situations sociales concrètes — pas pour agresser,
 * mais pour ne pas se laisser marcher dessus et garder son calme/sa classe.
 *
 * Chaque situation propose 3 "styles" de réponse :
 *  - sigma       : calme, détaché, minimaliste, ne joue pas le jeu de l'autre
 *  - alpha       : direct, frontal, prend le dessus sans agressivité gratuite
 *  - charisme    : humour, second degré, désamorce avec classe
 */

export const verbalStyles = [
  { id: 'sigma', label: 'SIGMA', desc: 'Calme, détaché, ne rentre pas dans le jeu.', color: '#7c8ba1' },
  { id: 'alpha', label: 'ALPHA', desc: 'Direct, ferme, reprend le contrôle.', color: '#e0563a' },
  { id: 'charisme', label: 'CHARISME', desc: 'Humour, classe, désamorce avec style.', color: '#d4a017' },
];

export const verbalCategories = [
  { id: 'quotidien', label: 'Quotidien' },
  { id: 'amis', label: 'Entre amis' },
  { id: 'lookdown', label: 'On te "look down"' },
  { id: 'travail', label: 'Travail' },
  { id: 'famille', label: 'Famille' },
  { id: 'drague', label: 'Drague / Couple' },
  { id: 'reseaux', label: 'Réseaux sociaux' },
  { id: 'conflit', label: 'Conflit direct' },
];

export const verbalSituations = [
  // ---------------- QUOTIDIEN ----------------
  {
    id: 'v1',
    category: 'quotidien',
    title: 'Quelqu\'un te double dans la file d\'attente',
    context: 'Une personne passe devant toi comme si tu n\'existais pas.',
    responses: {
      sigma: ["Je crois que la file continue derrière moi.", "Ah, je pensais être invisible. Bonne nouvelle, non."],
      alpha: ["La file est là, tu la reprends depuis le bout.", "On recule d'un pas, la queue c'est par là."],
      charisme: ["Tranquille, je t'invite pas à couper chez moi non plus.", "J'aurais dû venir en scooter, direct devant tout le monde, non ?"],
    },
  },
  {
    id: 'v2',
    category: 'quotidien',
    title: 'On te fait remarquer que tu es en retard',
    context: '"T\'es encore en retard, comme d\'habitude."',
    responses: {
      sigma: ["Je suis là maintenant, on avance.", "Noté. On continue."],
      alpha: ["Je suis là, on perd plus de temps à en parler qu'à commencer.", "C'est fait, next."],
      charisme: ["Le temps c'est relatif, Einstein l'a dit avant moi.", "Je fais durer le plaisir de me voir arriver."],
    },
  },
  {
    id: 'v3',
    category: 'quotidien',
    title: 'Un inconnu te bouscule sans s\'excuser',
    context: 'Il continue son chemin sans un mot.',
    responses: {
      sigma: ["...", "(Tu continues ton chemin, tu ne lui donnes pas ton énergie.)"],
      alpha: ["Hé, on dit pardon normalement.", "Tu me bouscules, tu t'excuses. C'est pas compliqué."],
      charisme: ["Wow, quelle entrée fracassante.", "T'inquiète, je vais bien, merci de demander."],
    },
  },
  {
    id: 'v4',
    category: 'quotidien',
    title: 'On critique ta façon de t\'habiller',
    context: '"C\'est original ce que tu portes aujourd\'hui..."',
    responses: {
      sigma: ["Ça me va, c'est le principal.", "Je m'habille pour moi, pas pour un jury."],
      alpha: ["Je porte ce que je veux, ça change quoi pour toi ?", "T'as un avis, j'ai un miroir. On est différents."],
      charisme: ["Merci, j'ai mis du temps à assumer ce niveau de style.", "Original, ouais — comme moi."],
    },
  },

  // ---------------- ENTRE AMIS ----------------
  {
    id: 'v5',
    category: 'amis',
    title: 'Un ami te charrie devant tout le monde',
    context: 'La blague dépasse un peu la limite mais tout le monde rigole.',
    responses: {
      sigma: ["Ok, ok, t'as eu ton moment.", "Continue, ça me fait pas grand-chose."],
      alpha: ["C'est bon pour une fois, la prochaine je te la rends.", "Vas-y doucement, j'ai pas fini de rire avec toi."],
      charisme: ["Attends, laisse-moi noter ça, je vais la ressortir contre toi.", "T'es drôle, dommage que ce soit à mes frais."],
    },
  },
  {
    id: 'v6',
    category: 'amis',
    title: 'On te dit que tu as changé "en mal"',
    context: '"Avant t\'étais plus marrant/cool."',
    responses: {
      sigma: ["J'évolue, c'est normal.", "Peut-être. Je me sens mieux comme ça."],
      alpha: ["J'ai grandi, toi t'es resté au même endroit apparemment.", "Je préfère avancer que rester figé pour te plaire."],
      charisme: ["Version améliorée, patch 2.0, tu t'y feras.", "Avant j'étais en beta, maintenant je suis stable."],
    },
  },
  {
    id: 'v7',
    category: 'amis',
    title: 'Un ami annule au dernier moment, encore',
    context: '"Désolé je peux plus venir" pour la troisième fois.',
    responses: {
      sigma: ["Ok, pas de souci, je gère.", "Compris, on se voit une prochaine fois."],
      alpha: ["C'est la troisième fois, dis-le clairement si t'as pas envie.", "Ok mais la prochaine fois préviens plus tôt, ça se fait pas."],
      charisme: ["T'inquiète, je vais gérer la soirée tout seul comme un chef.", "Encore un lapin, je vais finir par ouvrir un élevage."],
    },
  },
  {
    id: 'v8',
    category: 'amis',
    title: 'On se moque de ton ambition/tes projets',
    context: '"Tu crois vraiment que ça va marcher ton truc ?"',
    responses: {
      sigma: ["On verra bien.", "Je fais mon chemin, chacun le sien."],
      alpha: ["Je crois en moi, c'est déjà plus que ce que tu fais pour toi.", "Regarde-moi faire au lieu de commenter."],
      charisme: ["Reviens me voir dans un an, on en reparle autour d'un café que j'aurai payé.", "Doute si tu veux, moi je construis pendant ce temps."],
    },
  },

  // ---------------- ON TE LOOK DOWN ----------------
  {
    id: 'v9',
    category: 'lookdown',
    title: 'Quelqu\'un te parle de haut / condescendant',
    context: '"Tu comprends même pas de quoi je parle."',
    responses: {
      sigma: ["Explique-moi alors, je suis là pour ça.", "Peut-être. Éclaire-moi."],
      alpha: ["Je comprends très bien, c'est ton ton qui pose problème.", "Baisse d'un ton, on est au même niveau ici."],
      charisme: ["Vas-y, impressionne-moi avec ton explication.", "Ah, un professeur gratuit, quelle chance."],
    },
  },
  {
    id: 'v10',
    category: 'lookdown',
    title: 'On minimise ce que tu as accompli',
    context: '"C\'est pas si dur ce que t\'as fait."',
    responses: {
      sigma: ["Peut-être, mais je l'ai fait.", "Chacun son ressenti, moi je suis fier du résultat."],
      alpha: ["Fais-le alors, on en reparle après.", "Facile à dire de l'extérieur."],
      charisme: ["Ah bon ? Vas-y, montre-moi comment tu fais, je prends des notes.", "Si c'était si simple, tout le monde l'aurait fait avant moi."],
    },
  },
  {
    id: 'v11',
    category: 'lookdown',
    title: 'Quelqu\'un te compare défavorablement à quelqu\'un d\'autre',
    context: '"Untel fait ça beaucoup mieux que toi."',
    responses: {
      sigma: ["Chacun son rythme, chacun son style.", "Je me compare à moi-même d'hier, pas à lui."],
      alpha: ["Peut-être, mais c'est moi que t'as en face, pas lui.", "Compare quand j'aurai fini, pas en plein milieu."],
      charisme: ["Tant mieux pour lui, moi je fais ma propre légende.", "Chacun son film, moi je suis le héros du mien."],
    },
  },
  {
    id: 'v12',
    category: 'lookdown',
    title: 'On te rabaisse sur ton physique',
    context: 'Une remarque désobligeante et gratuite.',
    responses: {
      sigma: ["Merci pour ton avis, je m'en passais.", "Je vis très bien avec, tranquille."],
      alpha: ["C'est pas à toi de valider mon physique.", "Garde ça pour toi, personne t'a demandé."],
      charisme: ["Aïe, tu voulais dire ça méchamment mais j'ai pris ça comme un compliment.", "Merci d'avoir remarqué, je fais des efforts."],
    },
  },
  {
    id: 'v13',
    category: 'lookdown',
    title: 'Quelqu\'un ignore ce que tu dis en réunion/discussion',
    context: 'Ton idée est écartée sans qu\'on t\'écoute vraiment.',
    responses: {
      sigma: ["Je le redis clairement, une fois, posément.", "Je note, on en reparlera si besoin."],
      alpha: ["Je viens de dire quelque chose d'important, on peut y revenir.", "J'attends qu'on considère ce que je viens de dire."],
      charisme: ["Je vais répéter, cette fois plus lentement pour que ça rentre.", "Pas grave, l'idée fera son chemin toute seule."],
    },
  },

  // ---------------- TRAVAIL ----------------
  {
    id: 'v14',
    category: 'travail',
    title: 'Un collègue s\'attribue ton travail',
    context: 'Il présente ton idée comme la sienne devant le groupe.',
    responses: {
      sigma: ["Content que l'idée avance — je l'avais proposée la semaine dernière, on peut le vérifier.", "Je précise juste : c'était mon idée initiale, mais l'important c'est que ça avance."],
      alpha: ["C'était mon idée, je l'ai proposée avant. On garde ça clair.", "Je vais clarifier : j'en avais parlé en premier."],
      charisme: ["J'adore quand mes idées font le tour de bureau plus vite que moi.", "Content que ça plaise autant, l'auteur original te remercie."],
    },
  },
  {
    id: 'v15',
    category: 'travail',
    title: 'Ton patron te critique injustement devant les autres',
    context: 'Une remarque publique qui te met mal à l\'aise.',
    responses: {
      sigma: ["On peut en discuter en privé si besoin.", "Je prends note, on ajustera."],
      alpha: ["Je préfère qu'on discute de ça en privé la prochaine fois.", "Je suis ouvert à la critique, mais pas en public."],
      charisme: ["Merci pour le feedback express, je vais le digérer tranquillement.", "Wow, en direct devant tout le monde, quel honneur."],
    },
  },
  {
    id: 'v16',
    category: 'travail',
    title: 'On te dit que tu ne mérites pas ta place',
    context: '"T\'as eu ce poste par chance."',
    responses: {
      sigma: ["Je fais mon travail, le résultat parle de lui-même.", "Chance ou pas, je suis là et je livre."],
      alpha: ["J'ai bossé pour être ici, personne me l'a donné gratuitement.", "Continue de penser ça, moi je continue d'avancer."],
      charisme: ["La chance, ça se travaille tous les jours apparemment.", "Si c'est de la chance, j'en ai eu tous les jours pendant des années."],
    },
  },
  {
    id: 'v17',
    category: 'travail',
    title: 'Un client / une personne te parle mal au téléphone',
    context: 'Ton interlocuteur hausse le ton sans raison valable.',
    responses: {
      sigma: ["Je vous écoute, mais restons calmes tous les deux.", "Je comprends la frustration, on va régler ça posément."],
      alpha: ["Je vais vous aider, mais pas sur ce ton.", "Baissez d'un ton, on avance mieux comme ça."],
      charisme: ["Je capte le stress, on respire et on résout ça ensemble.", "Promis je suis de votre côté, même si le ton dit le contraire."],
    },
  },

  // ---------------- FAMILLE ----------------
  {
    id: 'v18',
    category: 'famille',
    title: 'Un proche compare ta réussite à celle d\'un cousin/frère',
    context: '"Regarde ton cousin, lui il a réussi."',
    responses: {
      sigma: ["Je suis content pour lui, moi j'avance à mon rythme.", "Chacun son parcours, le mien n'est pas fini."],
      alpha: ["Je me compare pas, je construis mon propre chemin.", "Arrête de comparer, regarde plutôt ce que je fais moi."],
      charisme: ["Il a son film, moi j'écris le mien — patience, la suite arrive.", "Laisse-moi finir mon histoire avant de juger le chapitre 3."],
    },
  },
  {
    id: 'v19',
    category: 'famille',
    title: 'On critique tes choix de vie en famille',
    context: '"Tu devrais faire comme tout le monde."',
    responses: {
      sigma: ["C'est mon choix, je l'assume.", "Je respecte votre avis, mais je décide pour moi."],
      alpha: ["C'est ma vie, je prends mes décisions en connaissance de cause.", "J'écoute le conseil, mais la décision reste la mienne."],
      charisme: ["Tout le monde fait pareil, c'est justement pour ça que je fais autrement.", "Je préfère être l'exception que la copie."],
    },
  },

  // ---------------- DRAGUE / COUPLE ----------------
  {
    id: 'v20',
    category: 'drague',
    title: 'On te teste avec une remarque piquante pour voir ta réaction',
    context: '"T\'as l\'air un peu trop sûr de toi, non ?"',
    responses: {
      sigma: ["Peut-être, ou juste tranquille.", "Je suis juste à l'aise, ça se voit."],
      alpha: ["Je suis sûr de qui je suis, rien de plus.", "Assurance, pas arrogance — nuance."],
      charisme: ["Sûr de moi ou juste habitué à ce qu'on me remarque ?", "C'est pas de la confiance, c'est de l'expérience."],
    },
  },
  {
    id: 'v21',
    category: 'drague',
    title: 'On te ghost puis on revient comme si de rien n\'était',
    context: '"Salut, ça va ? Désolé j\'étais super occupé(e)."',
    responses: {
      sigma: ["Pas de souci, ça arrive.", "Ok, tout va bien de mon côté."],
      alpha: ["Ça va. La prochaine fois un message suffit pour prévenir.", "Ok, mais la disparition ça me convient pas trop."],
      charisme: ["Occupé(e) à ce point que le téléphone a disparu aussi ?", "T'inquiète, j'ai pas remarqué, j'étais occupé(e) aussi."],
    },
  },
  {
    id: 'v22',
    category: 'drague',
    title: 'Ton/ta partenaire te fait une remarque blessante en public',
    context: 'Une pique lancée devant des amis.',
    responses: {
      sigma: ["On en reparle plus tard, tranquillement.", "Je préfère qu'on garde ça pour nous deux."],
      alpha: ["On règle ça en privé, pas ici.", "Je note, on en discute calmement après."],
      charisme: ["Gardons le meilleur pour l'after, promis je réponds.", "Round 2 ce soir, en privé."],
    },
  },

  // ---------------- RÉSEAUX SOCIAUX ----------------
  {
    id: 'v23',
    category: 'reseaux',
    title: 'Un commentaire moqueur sous une de tes publications',
    context: '"Franchement ça sert à rien ce post."',
    responses: {
      sigma: ["Chacun son avis, je continue de poster.", "Merci du passage quand même."],
      alpha: ["Toi t'as cliqué, t'as lu, t'as commenté — ça a bien servi à quelque chose.", "Libre à toi de scroller ailleurs la prochaine fois."],
      charisme: ["Merci de booster mon engagement, même en négatif ça compte.", "T'as pris le temps de commenter, c'est déjà un début d'intérêt."],
    },
  },
  {
    id: 'v24',
    category: 'reseaux',
    title: 'On te dit que tu postes "trop" ou que tu cherches l\'attention',
    context: '"Tu cherches juste des likes."',
    responses: {
      sigma: ["Je partage ce que je veux, à mon rythme.", "Chacun sa manière de s'exprimer."],
      alpha: ["Je poste pour moi, si ça dérange, personne t'oblige à regarder.", "C'est mon compte, ma vie, mes règles."],
      charisme: ["Et toi tu cherches quoi en commentant à chaque fois ?", "Au moins moi j'assume, toi tu regardes en cachette."],
    },
  },

  // ---------------- CONFLIT DIRECT ----------------
  {
    id: 'v25',
    category: 'conflit',
    title: 'Quelqu\'un hausse le ton pour t\'intimider',
    context: 'La voix monte, l\'attitude devient agressive.',
    responses: {
      sigma: ["Je reste calme, je ne monte pas dans le ton avec toi.", "On peut parler normalement, je t'écoute."],
      alpha: ["Baisse d'un ton, on discute pas en criant.", "Je reste calme, mais je recule pas."],
      charisme: ["Crier plus fort donne pas plus raison, essaie autre chose.", "Je suis toujours là, même après le volume max."],
    },
  },
  {
    id: 'v26',
    category: 'conflit',
    title: 'On te provoque pour que tu craques en public',
    context: 'La personne cherche clairement la réaction.',
    responses: {
      sigma: ["Je ne rentre pas dans ce jeu.", "(Tu gardes le silence, un léger sourire, et tu passes ton chemin.)"],
      alpha: ["Je vois ce que tu fais, ça marche pas avec moi.", "T'attends une réaction, je te la donne pas."],
      charisme: ["Belle tentative, mais j'ai déjà vu ce film.", "T'as préparé cette réplique longtemps ? Ça se sent."],
    },
  },
  {
    id: 'v27',
    category: 'conflit',
    title: 'Quelqu\'un te menace verbalement',
    context: 'Des propos menaçants, situation tendue.',
    responses: {
      sigma: ["Je préfère qu'on arrête cette discussion là.", "(Tu t'éloignes calmement, sans provoquer davantage — la sécurité avant l'ego.)"],
      alpha: ["Les menaces règlent rien, on arrête ça maintenant.", "Calme-toi, ça sert à rien d'aller plus loin."],
      charisme: ["Garde ton énergie pour autre chose, ça marche pas sur moi.", "Menacer, c'est facile — proposer une solution, ça c'est utile."],
    },
  },
  {
    id: 'v28',
    category: 'conflit',
    title: 'On te fait porter la responsabilité d\'une erreur qui n\'est pas la tienne',
    context: '"C\'est de ta faute si ça a foiré."',
    responses: {
      sigma: ["Ce n'est pas ce qui s'est passé de mon côté, mais réglons le problème.", "Je vérifie les faits avant de valider ça."],
      alpha: ["Vérifions les faits avant de m'accuser.", "Je prends mes responsabilités quand c'est justifié — là, ça l'est pas."],
      charisme: ["Sherlock, on va revoir les preuves avant le verdict.", "Belle tentative de transfert, mais les faits disent autre chose."],
    },
  },
  {
    id: 'v29',
    category: 'conflit',
    title: 'On coupe la parole systématiquement',
    context: 'Tu n\'arrives pas à finir une phrase.',
    responses: {
      sigma: ["Je termine ma phrase, puis c'est à toi.", "Laisse-moi finir, ensuite je t'écoute."],
      alpha: ["Je n'ai pas fini de parler.", "Un peu de respect, chacun son tour."],
      charisme: ["Attends, le meilleur de la phrase arrive.", "Patience, la suite est encore mieux."],
    },
  },
  {
    id: 'v30',
    category: 'conflit',
    title: 'On se moque de toi devant un groupe pour rire à tes dépens',
    context: 'Rires collectifs, tu es la cible du moment.',
    responses: {
      sigma: ["Ok, amusez-vous bien.", "(Tu restes impassible, sans donner l'énergie qu'ils cherchent.)"],
      alpha: ["Ok, c'est fait, on passe à autre chose maintenant.", "Marrant deux secondes, ensuite on parle sérieux."],
      charisme: ["Content de faire votre programme du jour, gratuitement en plus.", "Je facture pas encore pour le spectacle, vous avez de la chance."],
    },
  },
];

export function getSituationsByCategory(categoryId) {
  return verbalSituations.filter((s) => s.category === categoryId);
}
