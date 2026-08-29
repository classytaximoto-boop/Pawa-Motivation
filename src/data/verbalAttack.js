/**
 * Données pour l'onglet "Attaque Verbale".
 * Objectif : donner à l'utilisateur plusieurs façons de répondre avec
 * assurance dans des situations sociales concrètes — pas pour agresser,
 * mais pour ne pas se laisser marcher dessus et garder son calme/sa classe.
 *
 * Deux façons d'explorer le contenu :
 *  - Par SITUATION (verbalSituations) : un contexte précis → des réponses.
 *  - Par TYPE DE PERSONNE (peopleTypes) : à qui tu parles → comment adapter
 *    ton ton, ton vocabulaire, ta posture, avec des phrases-clés prêtes.
 *
 * Chaque situation/type propose jusqu'à 4 "styles" de réponse :
 *  - sigma       : calme, détaché, minimaliste, ne joue pas le jeu de l'autre
 *  - alpha       : direct, frontal, prend le dessus sans agressivité gratuite
 *  - charisme    : humour, second degré, désamorce avec classe
 *  - confiant    : assuré, posé, sans besoin de prouver quoi que ce soit
 */

export const verbalStyles = [
  { id: 'sigma', label: 'SIGMA', desc: 'Calme, détaché, ne rentre pas dans le jeu.', color: '#7c8ba1' },
  { id: 'alpha', label: 'ALPHA', desc: 'Direct, ferme, reprend le contrôle.', color: '#e0563a' },
  { id: 'charisme', label: 'CHARISME', desc: 'Humour, classe, désamorce avec style.', color: '#d4a017' },
  { id: 'confiant', label: 'CONFIANT', desc: 'Assuré, posé, sans rien à prouver.', color: '#4a9d6e' },
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
  { id: 'parler', label: 'Comment parler à...' },
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
      confiant: ["Je suis là depuis un moment, la file continue derrière.", "Pas de souci, mais on respecte l'ordre d'arrivée."],
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
      confiant: ["Je suis là, c'est ce qui compte maintenant.", "Désolé pour l'attente, on rattrape le temps."],
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
      confiant: ["Ça arrive, mais un mot ça fait pas de mal.", "(Tu le regardes calmement, sans t'énerver, et tu continues.)"],
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
      confiant: ["J'aime ce que je porte, c'est suffisant pour moi.", "Chacun son style, je suis bien dans le mien."],
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
      confiant: ["Je rigole avec vous, mais je garde ma dignité.", "Ok pour la blague, mais on s'arrête là."],
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
      confiant: ["Je change parce que j'apprends, et ça me va très bien.", "Je préfère être authentique que « marrant » par obligation."],
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
      confiant: ["Ok, ça arrive. Mais je remarque le pattern.", "Pas de problème, je m'organise autrement."],
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
      confiant: ["Je le pense, et c'est suffisant pour avancer.", "Je n'ai pas besoin que tu y croies pour continuer."],
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
      confiant: ["Je comprends parfaitement, merci.", "Pas besoin de me parler comme ça pour te faire comprendre."],
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
      confiant: ["Je suis fier de ce que j'ai fait, ton avis ne change rien.", "Pour moi, c'était un vrai effort — et ça compte."],
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
      confiant: ["Je n'ai pas besoin d'être lui, je suis très bien étant moi.", "Il a son chemin, j'ai le mien — les deux sont valables."],
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
      confiant: ["Je suis bien dans mon corps, ton avis ne change rien à ça.", "Je n'ai pas besoin de ta validation pour m'aimer."],
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
      confiant: ["Je reviens sur mon point, il mérite d'être entendu.", "Je vais le reformuler pour qu'on en discute vraiment."],
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
      confiant: ["Je suis à l'origine de cette idée, je tenais à le préciser calmement.", "Content que ça serve, je rappelle juste d'où ça vient."],
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
      confiant: ["J'accepte la critique constructive, en privé de préférence.", "Je vais y réfléchir et on peut en reparler calmement."],
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
      confiant: ["Je suis ici parce que j'ai les compétences pour, point.", "Je sais ce que je vaux, ton doute n'y change rien."],
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
      confiant: ["Je reste disponible pour vous aider, dans le calme.", "Je comprends votre frustration, cherchons une solution ensemble."],
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
      confiant: ["Je suis fier de mon parcours, même s'il est différent du sien.", "Ma réussite ne se mesure pas à la sienne."],
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
      confiant: ["J'ai réfléchi à mon choix, il me correspond.", "Je respecte votre inquiétude, mais c'est ma décision à assumer."],
    },
  },
  {
    id: 'v31',
    category: 'famille',
    title: 'Un parent te culpabilise pour une visite manquée',
    context: '"Tu ne penses jamais à nous."',
    responses: {
      sigma: ["Je pense à vous, même si je ne le montre pas assez.", "Je vais essayer de faire mieux, sans promesse en l'air."],
      alpha: ["Je fais de mon mieux avec mon temps, ne le minimisez pas.", "Je vous appelle, je viens dès que possible — c'est pas rien."],
      charisme: ["Je pense à vous tellement fort que ça devrait compter double.", "Promis, la prochaine visite sera mémorable."],
      confiant: ["Je vous aime, même si mon temps est limité en ce moment.", "Je fais ce que je peux, avec sincérité."],
    },
  },
  {
    id: 'v32',
    category: 'famille',
    title: 'On te reproche de ne pas suivre la tradition familiale',
    context: '"Dans cette famille, on fait comme ça, pas autrement."',
    responses: {
      sigma: ["Je respecte la tradition, mais je trace aussi mon chemin.", "Je garde ce qui me correspond, j'adapte le reste."],
      alpha: ["Les traditions évoluent, moi aussi.", "Je respecte d'où je viens sans devoir m'y enfermer."],
      charisme: ["Je suis la nouvelle édition, révisée et améliorée.", "La tradition continue, juste avec un twist personnel."],
      confiant: ["Je porte cette famille en moi, à ma façon.", "Respecter mes racines ne veut pas dire ne jamais évoluer."],
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
      confiant: ["Je suis bien dans ma peau, ça se sent parfois.", "Je suis moi-même, si ça paraît sûr, tant mieux."],
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
      confiant: ["Ça va bien. Je préfère la clarté à la disparition, pour la suite.", "Pas de rancune, mais je fais attention à qui me donne du temps."],
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
      confiant: ["Je t'aime, mais on parle de ça entre nous, pas ici.", "Je ne réagis pas devant tout le monde, on se retrouve plus tard."],
    },
  },
  {
    id: 'v33',
    category: 'drague',
    title: 'Tu approches quelqu\'un qui te plaît pour la première fois',
    context: 'Le moment de lancer la conversation, sans savoir comment elle va réagir.',
    responses: {
      sigma: ["Salut, je passais par là et je me suis dit que je devais venir te dire bonjour.", "Je t'ai remarqué(e), je voulais juste venir dire salut."],
      alpha: ["Salut, je m'appelle [prénom]. Toi c'est quoi ?", "J'ai pas voulu partir sans te parler, ça aurait été bête."],
      charisme: ["Excuse-moi de te déranger, mais je devais vérifier si tu étais aussi intéressant(e) que t'en as l'air.", "Je t'ai vu(e) de loin, j'ai préféré venir vérifier de près."],
      confiant: ["Salut, je voulais juste venir te parler, sans prétexte compliqué.", "Je m'appelle [prénom], et j'avais envie de faire ta connaissance."],
    },
  },
  {
    id: 'v34',
    category: 'drague',
    title: 'On te dit "non merci" après une approche',
    context: 'La personne décline poliment ou fermement.',
    responses: {
      sigma: ["Pas de souci, bonne journée à toi.", "Ok, ça arrive. Prends soin de toi."],
      alpha: ["Compris, aucun souci. Bonne continuation.", "Pas de problème, j'ai tenté ma chance."],
      charisme: ["Bien tenté de ma part, respect à toi pour la franchise.", "Ok, je retourne à mes affaires alors — la classe jusqu'au bout."],
      confiant: ["Je respecte ça complètement, bonne soirée à toi.", "Aucun souci, ça ne change rien à ma soirée."],
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
      confiant: ["Je poste ce qui me plaît, ça suffit comme raison.", "Merci pour ton avis, je continue quand même."],
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
      confiant: ["Je partage ce qui me fait plaisir, sans besoin de validation.", "Mes raisons de poster m'appartiennent."],
    },
  },
  {
    id: 'v35',
    category: 'reseaux',
    title: 'On te "clash" en message privé de façon agressive',
    context: 'Un message hostile arrive de nulle part.',
    responses: {
      sigma: ["Je ne rentre pas dans ce genre d'échange.", "(Tu ne réponds pas, ou tu bloques calmement.)"],
      alpha: ["Je vois pas l'intérêt de ce message, mais ok.", "Garde ça pour toi, ça m'atteint pas."],
      charisme: ["Belle énergie pour un dimanche, respect.", "T'as pris le temps d'écrire tout ça, dommage pour toi."],
      confiant: ["Je choisis à qui je donne mon attention, pas à toi aujourd'hui.", "Ce message ne mérite pas de réponse détaillée."],
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
      confiant: ["Je t'écoute, mais je ne réponds pas à la colère par la colère.", "On peut résoudre ça calmement, si tu veux bien."],
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
      confiant: ["Je n'ai rien à prouver à personne ici.", "Je reste moi-même, peu importe la provocation."],
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
      confiant: ["Je ne réponds pas à une menace par une autre.", "Je préfère m'éloigner que d'envenimer la situation."],
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
      confiant: ["Je suis ouvert à revoir les faits ensemble, calmement.", "Je n'accepte pas une accusation sans preuve."],
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
      confiant: ["Je vais finir mon idée, ça ne prendra pas longtemps.", "Laisse-moi terminer, c'est important."],
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
      confiant: ["Je ris avec vous, mais je garde mon calme.", "Ça ne me définit pas, continuez si ça vous amuse."],
    },
  },
  {
    id: 'v36',
    category: 'conflit',
    title: 'On te fait du chantage émotionnel',
    context: '"Si tu m\'aimais vraiment, tu ferais ça pour moi."',
    responses: {
      sigma: ["Je t'aime, mais ça ne veut pas dire faire tout ce que tu demandes.", "Aimer quelqu'un, ce n'est pas dire oui à tout."],
      alpha: ["Ça, c'est du chantage, pas de l'amour.", "Je refuse de me laisser convaincre de cette façon."],
      charisme: ["Belle tentative, mais l'amour et le chantage, ça fait deux.", "Je t'aime bien assez pour te dire non aujourd'hui."],
      confiant: ["Mon amour pour toi ne se prouve pas par des concessions forcées.", "Je peux t'aimer et dire non en même temps."],
    },
  },
  {
    id: 'v37',
    category: 'conflit',
    title: 'On te met la pression pour décider vite',
    context: '"Faut décider maintenant, sinon tant pis."',
    responses: {
      sigma: ["Je prends le temps qu'il me faut.", "Si l'urgence est fabriquée, je ne me presse pas."],
      alpha: ["Je décide à mon rythme, pas au tien.", "Si c'est vraiment urgent, ça peut attendre 5 minutes de réflexion."],
      charisme: ["La pression, très peu pour moi — je réfléchis à mon rythme.", "Tant pis alors, je préfère une bonne décision à une rapide."],
      confiant: ["Je ne prends pas de décision sous pression.", "J'ai besoin de réfléchir, et c'est légitime."],
    },
  },

  // ---------------- COMMENT PARLER À... (20 situations) ----------------
  {
    id: 'p1',
    category: 'parler',
    title: 'Parler à une belle fille / un beau garçon pour la première fois',
    context: 'Tu veux l\'aborder sans paraître forcé ni timide.',
    responses: {
      sigma: ["Salut, je voulais juste venir te dire bonjour, rien de plus.", "Je passais, et je me suis dit qu'il fallait que je vienne te parler."],
      alpha: ["Salut, je m'appelle [prénom]. J'avais envie de venir te parler.", "Je t'ai vue de loin, je voulais faire ta connaissance."],
      charisme: ["Excuse-moi, mais je devais vérifier si t'étais aussi sympa que t'en as l'air.", "J'allais partir sans te parler, mais ça aurait été une erreur."],
      confiant: ["Salut, je m'appelle [prénom]. Toi c'est quoi ?", "J'avais juste envie de venir dire bonjour, simplement."],
    },
  },
  {
    id: 'p2',
    category: 'parler',
    title: 'Parler à ton landlord / propriétaire pour une réparation',
    context: 'Un problème dans le logement qui n\'est toujours pas réglé.',
    responses: {
      sigma: ["Je voulais faire un point sur la réparation dont on avait parlé.", "Je vous recontacte au sujet du problème signalé la semaine dernière."],
      alpha: ["Ça fait deux semaines pour la réparation, il faut qu'on avance.", "J'ai besoin d'une date précise pour l'intervention."],
      charisme: ["Je commence à connaître le problème par cœur, on peut le régler ?", "Le problème et moi, on est devenus proches — aidez-moi à s'en séparer."],
      confiant: ["Je demande simplement le respect du délai qu'on avait fixé.", "C'est mon droit en tant que locataire, je vous le rappelle calmement."],
    },
  },
  {
    id: 'p3',
    category: 'parler',
    title: 'Parler à quelqu\'un que tu perçois comme "supérieur" (statut, richesse)',
    context: 'Tu te sens intimidé par son statut social ou financier.',
    responses: {
      sigma: ["Je lui parle normalement, comme à n'importe qui d'autre.", "Son statut ne change rien à la façon dont je me comporte."],
      alpha: ["Je le traite avec respect, sans me rabaisser pour autant.", "Je garde ma posture, personne n'est au-dessus de moi dans une conversation."],
      charisme: ["Impressionnant votre parcours — j'espère écrire le mien bientôt.", "On dirait qu'on a des choses à apprendre l'un de l'autre."],
      confiant: ["Je respecte son parcours sans m'effacer devant lui.", "Je reste moi-même, peu importe qui est en face."],
    },
  },
  {
    id: 'p4',
    category: 'parler',
    title: 'Parler à un policier / agent en contrôle',
    context: 'Un contrôle de routine, tension possible.',
    responses: {
      sigma: ["Bonjour, voici mes documents.", "Je coopère pleinement, tout est en règle."],
      alpha: ["Je vous montre tout ce qu'il faut, dans le calme.", "Je connais mes droits, mais je reste coopératif."],
      charisme: ["Bonjour, journée tranquille j'espère pour vous aussi.", "Je vous facilite la tâche, tout est en ordre."],
      confiant: ["Bonjour, je réponds à vos questions avec plaisir.", "Voici mes documents, n'hésitez pas si besoin d'autre chose."],
    },
  },
  {
    id: 'p5',
    category: 'parler',
    title: 'Parler à un vendeur pour négocier un prix',
    context: 'Tu veux obtenir un meilleur prix sans être agressif.',
    responses: {
      sigma: ["Le prix est un peu élevé pour moi, vous avez une marge ?", "Je suis intéressé, mais le budget est serré."],
      alpha: ["Je peux vous en donner [montant], c'est mon budget max.", "Faisons un prix qui marche pour nous deux."],
      charisme: ["Je vous aime bien, mais mon portefeuille un peu moins à ce prix.", "Aidez-moi à repartir content, et vous aussi."],
      confiant: ["Voici ce que je peux mettre, dites-moi si ça vous va.", "Je sais ce que ça vaut, proposons un compromis juste."],
    },
  },
  {
    id: 'p6',
    category: 'parler',
    title: 'Parler à un professeur / formateur après une mauvaise note',
    context: 'Tu veux comprendre sans paraître te justifier faiblement.',
    responses: {
      sigma: ["Je voudrais comprendre ce qui a manqué dans mon travail.", "Pouvez-vous m'expliquer les points à améliorer ?"],
      alpha: ["Je veux comprendre la note pour progresser, pas la contester.", "Montrez-moi où j'ai perdu des points, je veux corriger ça."],
      charisme: ["Aidez-moi à transformer cet échec en meilleure note la prochaine fois.", "Je prends note, littéralement — expliquez-moi tout."],
      confiant: ["Je veux m'améliorer, vos retours m'intéressent vraiment.", "Cette note ne me définit pas, mais je veux comprendre."],
    },
  },
  {
    id: 'p7',
    category: 'parler',
    title: 'Parler à un ex après une rupture difficile',
    context: 'Une conversation nécessaire mais chargée émotionnellement.',
    responses: {
      sigma: ["Je veux qu'on se parle calmement, sans rancune.", "On peut avancer chacun de son côté, sereinement."],
      alpha: ["Je dis ce que j'ai à dire, une fois, clairement.", "Je tourne la page, mais je voulais te le dire en face."],
      charisme: ["On a eu de bons moments, gardons ça au lieu du reste.", "Pas de drame, juste deux personnes qui avancent."],
      confiant: ["Je te souhaite du bien, sincèrement, en avançant chacun de mon côté.", "Cette conversation, c'est pour clore les choses proprement."],
    },
  },
  {
    id: 'p8',
    category: 'parler',
    title: 'Parler à un investisseur / partenaire business potentiel',
    context: 'Présenter un projet et donner confiance.',
    responses: {
      sigma: ["Voici le projet, et voici pourquoi il tient la route.", "Je vous expose les chiffres, à vous de juger."],
      alpha: ["Voici l'opportunité, et voici ce que j'attends de votre côté.", "Je crois en ce projet, et je veux un partenaire qui y croit aussi."],
      charisme: ["Ce projet, c'est le prochain que vous regretterez d'avoir raté.", "Laissez-moi vous convaincre en 3 minutes, montre en main."],
      confiant: ["Je maîtrise mon sujet, posez-moi toutes vos questions.", "Voici mon projet, avec ses forces et ses risques assumés."],
    },
  },
  {
    id: 'p9',
    category: 'parler',
    title: 'Parler à quelqu\'un de plus âgé qui te sous-estime',
    context: '"T\'es jeune, tu comprends pas encore la vie."',
    responses: {
      sigma: ["Je respecte votre expérience, et j'apprends chaque jour aussi.", "Je suis jeune, mais j'observe et j'apprends vite."],
      alpha: ["Jeune ne veut pas dire naïf, je sais ce que je fais.", "Mon âge n'enlève rien à la valeur de ce que je dis."],
      charisme: ["Jeune aujourd'hui, légende demain — patience.", "Je rattrape l'expérience à la vitesse de l'ambition."],
      confiant: ["Je respecte votre parcours, et je fais confiance au mien.", "Mon âge n'est pas un obstacle à ma clarté d'esprit."],
    },
  },
  {
    id: 'p10',
    category: 'parler',
    title: 'Parler à quelqu\'un qui a un avis politique/religieux très différent',
    context: 'Le sujet est sensible, tu veux échanger sans conflit inutile.',
    responses: {
      sigma: ["Je respecte ton avis, même si je ne le partage pas.", "On peut avoir des idées différentes et rester corrects."],
      alpha: ["Je ne suis pas d'accord, mais je t'écoute jusqu'au bout.", "Défendons nos idées sans attaquer la personne."],
      charisme: ["On n'est pas d'accord, mais au moins la conversation est vivante.", "Débattons, mais gardons le café sympa."],
      confiant: ["Mon avis est le mien, le tien est le tien — les deux peuvent coexister.", "Je peux entendre un avis différent sans me sentir menacé."],
    },
  },
  {
    id: 'p11',
    category: 'parler',
    title: 'Parler à un patron pour demander une augmentation',
    context: 'Le moment de défendre ta valeur professionnellement.',
    responses: {
      sigma: ["Je voudrais qu'on parle de ma rémunération, au vu de mes résultats.", "Je souhaite faire un point sur mon évolution salariale."],
      alpha: ["Vu mes résultats, je pense mériter une augmentation.", "Je demande une révision de salaire, avec des arguments concrets."],
      charisme: ["Je viens négocier ma valeur, café à la main.", "On va parler chiffres, et je pense que vous allez être convaincu."],
      confiant: ["Je connais ma valeur, et je pense qu'elle mérite d'être reconnue.", "Voici mes résultats, discutons de la suite ensemble."],
    },
  },
  {
    id: 'p12',
    category: 'parler',
    title: 'Parler à un ami pour lui dire qu\'il t\'a blessé',
    context: 'Une conversation délicate mais nécessaire pour la relation.',
    responses: {
      sigma: ["Je voulais te dire que ce que t'as dit m'a blessé.", "J'ai besoin qu'on en parle, calmement."],
      alpha: ["Ce que t'as fait m'a touché, et je veux qu'on en parle.", "Je te le dis en face, ça m'a vraiment dérangé."],
      charisme: ["Petit point sensible à régler entre nous, ça te dit ?", "J'ai un truc sur le cœur, autant le vider maintenant."],
      confiant: ["Je te le dis parce que notre amitié compte pour moi.", "Je préfère être honnête avec toi plutôt que de garder ça pour moi."],
    },
  },
  {
    id: 'p13',
    category: 'parler',
    title: 'Parler à un enfant pour poser une limite',
    context: 'Fixer une règle sans crier ni être trop mou.',
    responses: {
      sigma: ["On ne fait pas ça, je t'explique pourquoi.", "Je comprends que tu sois frustré, mais la règle reste la même."],
      alpha: ["Non, c'est non — et voici pourquoi.", "On respecte les règles, même quand c'est difficile."],
      charisme: ["Petit chef, même toi t'as des règles à suivre aujourd'hui.", "On négocie pas tout dans la vie, et c'est une bonne leçon."],
      confiant: ["Je pose cette limite parce que je t'aime et veux ton bien.", "C'est non, calmement, mais fermement."],
    },
  },
  {
    id: 'p14',
    category: 'parler',
    title: 'Parler à un mécanicien / artisan qui te propose un devis élevé',
    context: 'Tu veux vérifier et éventuellement négocier sans te faire avoir.',
    responses: {
      sigma: ["Vous pouvez me détailler ce devis, poste par poste ?", "Je vais comparer avec un autre avis avant de valider."],
      alpha: ["Ce prix me semble élevé, expliquez-moi la répartition.", "Je veux un devis détaillé avant de dire oui."],
      charisme: ["À ce prix-là, j'espère que la voiture va voler après.", "Convainquez-moi que ça vaut le coup, je suis tout ouïe."],
      confiant: ["Je veux comprendre chaque ligne avant de décider.", "Je fais confiance, mais je vérifie aussi — normal."],
    },
  },
  {
    id: 'p15',
    category: 'parler',
    title: 'Parler à un supérieur qui te donne une charge de travail excessive',
    context: 'Poser une limite professionnelle sans passer pour un mauvais élément.',
    responses: {
      sigma: ["Je veux livrer un bon travail, il faut qu'on revoie les priorités.", "Ma charge actuelle est pleine, voyons ce qui peut attendre."],
      alpha: ["Je ne peux pas tout faire correctement avec cette charge, il faut prioriser.", "Je dis stop avant l'épuisement, pas après."],
      charisme: ["Je suis bon, pas magicien — aidez-moi à prioriser.", "Je peux tout faire, mais pas tout en même temps, et bien."],
      confiant: ["Je veux bien faire mon travail, discutons des priorités réalistes.", "Ma qualité de travail dépend d'une charge raisonnable."],
    },
  },
  {
    id: 'p16',
    category: 'parler',
    title: 'Parler à quelqu\'un que tu admires (idole, mentor potentiel)',
    context: 'L\'occasion rare de lui adresser la parole.',
    responses: {
      sigma: ["Je voulais juste vous dire que votre travail m'inspire.", "Merci pour ce que vous faites, ça compte pour moi."],
      alpha: ["Votre parcours m'inspire, j'aimerais un jour faire pareil.", "Je voulais vous parler, votre travail a un vrai impact sur moi."],
      charisme: ["Vous êtes en partie responsable de mes ambitions, merci pour ça.", "Un jour je vous raconterai comment vous m'avez inspiré."],
      confiant: ["Je vous admire sincèrement, et je voulais vous le dire simplement.", "Votre parcours me motive à construire le mien."],
    },
  },
  {
    id: 'p17',
    category: 'parler',
    title: 'Parler à un groupe pour prendre la parole en public',
    context: 'Le trac avant de s\'exprimer devant plusieurs personnes.',
    responses: {
      sigma: ["Je respire, je parle posément, un mot après l'autre.", "Je n'ai pas besoin d'être parfait, juste clair."],
      alpha: ["Je prends la parole avec assurance, mon message compte.", "Je capte l'attention en parlant lentement et clairement."],
      charisme: ["J'aborde le groupe avec un sourire, ça détend tout de suite.", "Je commence par une accroche qui donne envie d'écouter la suite."],
      confiant: ["Je maîtrise mon sujet, le reste suivra naturellement.", "Je parle de ce que je connais, avec ma propre voix."],
    },
  },
  {
    id: 'p18',
    category: 'parler',
    title: 'Parler à un voisin bruyant ou dérangeant',
    context: 'Aborder un problème de voisinage sans dégénérer.',
    responses: {
      sigma: ["Le bruit est un peu fort le soir, ça vous dérange de baisser ?", "Je voulais juste signaler ça calmement, en voisin."],
      alpha: ["Le bruit m'empêche de dormir, il faut trouver un arrangement.", "Je demande juste un peu de respect des horaires."],
      charisme: ["On dirait un concert gratuit chez vous, on peut baisser un peu ?", "J'apprécie la musique, un peu moins à 23h."],
      confiant: ["Je vous le dis directement, sans détour, mais avec respect.", "J'aimerais qu'on trouve un compromis raisonnable."],
    },
  },
  {
    id: 'p19',
    category: 'parler',
    title: 'Parler à quelqu\'un qui te doit de l\'argent',
    context: 'Réclamer un remboursement sans casser la relation.',
    responses: {
      sigma: ["Je voulais juste faire un point sur le remboursement.", "Pas d'urgence, mais je pensais au montant que tu me dois."],
      alpha: ["Je te rappelle le montant que tu me dois, on fixe une date ?", "J'ai besoin de récupérer cet argent, trouvons un plan."],
      charisme: ["Petit rappel amical : mon portefeuille pense encore à toi.", "Pas pour te presser, mais mon compte en banque aimerait des nouvelles."],
      confiant: ["Je préfère en parler ouvertement plutôt que de laisser traîner.", "C'est important pour moi qu'on règle ça ensemble."],
    },
  },
  {
    id: 'p20',
    category: 'parler',
    title: 'Parler à toi-même avant un moment stressant (auto-discours)',
    context: 'Se préparer mentalement avant un entretien, une présentation, un rendez-vous important.',
    responses: {
      sigma: ["Je suis prêt, je respire, je fais ce que j'ai à faire.", "Peu importe le résultat, j'ai fait ce que je pouvais."],
      alpha: ["Je vais y aller et donner le meilleur de moi.", "Je n'ai rien à craindre, je suis préparé."],
      charisme: ["Allez, montre-leur ce que tu sais faire.", "C'est ton moment, prends-le avec le sourire."],
      confiant: ["Je suis capable, je l'ai déjà prouvé avant, je le referai.", "Quoi qu'il arrive, je reste fier de m'être présenté."],
    },
  },
];

export function getSituationsByCategory(categoryId) {
  return verbalSituations.filter((s) => s.category === categoryId);
}

// ---------------------------------------------------------------
// TYPES DE PERSONNES — 15 profils avec conseils d'approche +
// phrases-clés par style, indépendamment d'une situation précise.
// ---------------------------------------------------------------
export const peopleTypes = [
  {
    id: 'pt1',
    name: 'Une belle fille / un beau garçon qui t\'intimide',
    tip: 'Ne cherche pas à l\'impressionner à tout prix — sois simplement toi-même, avec une vraie question ou remarque, pas une réplique préparée à l\'excès.',
    phrases: {
      sigma: ["Salut, je voulais juste dire bonjour, sans raison particulière.", "T'as l'air sympa, je me suis dit qu'il fallait venir te parler."],
      alpha: ["Salut, moi c'est [prénom]. Toi ?", "J'avais envie de venir discuter, voilà."],
      charisme: ["Je devais vérifier si t'étais aussi cool que t'en as l'air.", "J'allais regretter de pas être venu te parler."],
      confiant: ["Salut, je m'appelle [prénom] — content de te rencontrer.", "J'avais juste envie de dire bonjour, simplement."],
    },
  },
  {
    id: 'pt2',
    name: 'Le landlord / propriétaire',
    tip: 'Reste factuel, poli, et toujours avec une trace écrite si possible. La fermeté passe mieux avec des faits précis (dates, montants) qu\'avec des reproches.',
    phrases: {
      sigma: ["Je voulais faire un point sur [sujet].", "Je vous recontacte au sujet de notre dernier échange."],
      alpha: ["J'ai besoin d'une réponse claire d'ici [date].", "Ça fait [durée], il faut qu'on avance sur ce point."],
      charisme: ["On dirait qu'on est devenus des habitués de cette conversation.", "Réglons ça avant que ça devienne une tradition."],
      confiant: ["C'est mon droit en tant que locataire, je le rappelle calmement.", "Je reste disponible, mais j'attends un retour concret."],
    },
  },
  {
    id: 'pt3',
    name: 'Une personne que tu perçois comme "supérieure" (statut, argent, pouvoir)',
    tip: 'Le respect ne veut pas dire s\'effacer. Garde ta posture, ton ton normal, ne parle pas plus bas ou plus vite que d\'habitude.',
    phrases: {
      sigma: ["Je lui parle exactement comme à n'importe qui d'autre.", "Son statut ne change rien à ma façon d'être."],
      alpha: ["Je garde ma posture, personne n'est au-dessus de moi dans l'échange.", "Le respect est mutuel, pas à sens unique."],
      charisme: ["Impressionnant parcours — j'espère écrire le mien bientôt.", "On dirait qu'on a des choses à apprendre l'un de l'autre."],
      confiant: ["Je respecte son parcours sans diminuer le mien.", "Je reste moi-même, peu importe qui est en face."],
    },
  },
  {
    id: 'pt4',
    name: 'Un policier ou agent d\'autorité en contrôle',
    tip: 'Reste calme, coopératif, poli — la fermeté vient du fait de connaître ses droits, pas du ton employé.',
    phrases: {
      sigma: ["Bonjour, voici mes documents.", "Je coopère pleinement, tout est en règle."],
      alpha: ["Je connais mes droits, mais je reste coopératif.", "Je vous montre tout ce qu'il faut, calmement."],
      charisme: ["Bonjour, journée tranquille j'espère.", "Je vous facilite la tâche, tout est en ordre."],
      confiant: ["Bonjour, je réponds à vos questions avec plaisir.", "N'hésitez pas si vous avez besoin d'autre chose."],
    },
  },
  {
    id: 'pt5',
    name: 'Un vendeur / commerçant lors d\'une négociation',
    tip: 'Connais ton prix maximum avant de commencer, reste souriant, et ne t\'excuse jamais de négocier — c\'est normal.',
    phrases: {
      sigma: ["Le prix est un peu élevé pour moi, vous avez une marge ?", "Je suis intéressé, mais mon budget est serré."],
      alpha: ["Voici mon budget max, on peut s'arranger ?", "Faisons un prix qui marche pour nous deux."],
      charisme: ["Je vous aime bien, mais mon portefeuille un peu moins à ce prix.", "Aidez-moi à repartir content."],
      confiant: ["Voici ce que je peux mettre, dites-moi si ça vous va.", "Je sais ce que ça vaut, trouvons un compromis juste."],
    },
  },
  {
    id: 'pt6',
    name: 'Un professeur ou formateur',
    tip: 'Pose des questions pour comprendre, pas pour te justifier. Ça montre une vraie envie de progresser plutôt qu\'une contestation.',
    phrases: {
      sigma: ["Je voudrais comprendre ce qui a manqué.", "Pouvez-vous m'expliquer les points à améliorer ?"],
      alpha: ["Je veux comprendre pour progresser, pas contester.", "Montrez-moi où j'ai perdu des points."],
      charisme: ["Aidez-moi à transformer cet échec en réussite la prochaine fois.", "Je prends note, littéralement."],
      confiant: ["Je veux m'améliorer, vos retours m'intéressent vraiment.", "Cette note ne me définit pas, mais je veux comprendre."],
    },
  },
  {
    id: 'pt7',
    name: 'Un ex ou une ancienne relation',
    tip: 'Vise la clarté et la fermeture, pas la revanche ni la nostalgie excessive. Une conversation courte et honnête vaut mieux qu\'un long débat.',
    phrases: {
      sigma: ["Je veux qu'on se parle calmement, sans rancune.", "On peut avancer chacun de son côté, sereinement."],
      alpha: ["Je dis ce que j'ai à dire, une fois, clairement.", "Je tourne la page, mais je voulais te le dire en face."],
      charisme: ["On a eu de bons moments, gardons ça au lieu du reste.", "Pas de drame, juste deux personnes qui avancent."],
      confiant: ["Je te souhaite du bien, sincèrement.", "Cette conversation, c'est pour clore les choses proprement."],
    },
  },
  {
    id: 'pt8',
    name: 'Un investisseur ou partenaire business',
    tip: 'Prépare tes chiffres et connais tes propres faiblesses avant qu\'on te les pointe — ça inspire beaucoup plus confiance.',
    phrases: {
      sigma: ["Voici le projet, et voici pourquoi il tient la route.", "Je vous expose les chiffres, à vous de juger."],
      alpha: ["Voici l'opportunité, et voici ce que j'attends de votre côté.", "Je crois en ce projet, je veux un partenaire qui y croit aussi."],
      charisme: ["Ce projet, c'est celui que vous regretterez d'avoir raté.", "Laissez-moi vous convaincre en 3 minutes."],
      confiant: ["Je maîtrise mon sujet, posez-moi toutes vos questions.", "Voici mon projet, forces et risques assumés."],
    },
  },
  {
    id: 'pt9',
    name: 'Une personne plus âgée qui te sous-estime',
    tip: 'Montre la maturité par le calme et les faits, pas en élevant la voix — ça démonte l\'argument de "trop jeune" plus vite que n\'importe quel mot.',
    phrases: {
      sigma: ["Je respecte votre expérience, et j'apprends chaque jour aussi.", "Je suis jeune, mais j'observe et j'apprends vite."],
      alpha: ["Jeune ne veut pas dire naïf, je sais ce que je fais.", "Mon âge n'enlève rien à la valeur de ce que je dis."],
      charisme: ["Jeune aujourd'hui, légende demain.", "Je rattrape l'expérience à la vitesse de l'ambition."],
      confiant: ["Je respecte votre parcours, et je fais confiance au mien.", "Mon âge n'est pas un obstacle à ma clarté d'esprit."],
    },
  },
  {
    id: 'pt10',
    name: 'Quelqu\'un avec un avis politique ou religieux très différent',
    tip: 'Sépare toujours l\'idée de la personne. Attaquer l\'idée est un débat ; attaquer la personne est un conflit — choisis le premier.',
    phrases: {
      sigma: ["Je respecte ton avis, même si je ne le partage pas.", "On peut avoir des idées différentes et rester corrects."],
      alpha: ["Je ne suis pas d'accord, mais je t'écoute jusqu'au bout.", "Défendons nos idées sans attaquer la personne."],
      charisme: ["On n'est pas d'accord, mais la conversation reste vivante.", "Débattons, sans perdre le sourire."],
      confiant: ["Mon avis est le mien, le tien est le tien.", "Je peux entendre un avis différent sans me sentir menacé."],
    },
  },
  {
    id: 'pt11',
    name: 'Ton patron ou supérieur hiérarchique',
    tip: 'Amène toujours des faits et des résultats concrets à l\'appui de ta demande — l\'assurance appuyée sur des preuves est très difficile à contester.',
    phrases: {
      sigma: ["Je voudrais qu'on parle de [sujet], au vu de mes résultats.", "Je souhaite faire un point sur mon évolution."],
      alpha: ["Vu mes résultats, je pense mériter [demande].", "Je demande une révision, avec des arguments concrets."],
      charisme: ["Je viens négocier ma valeur, café à la main.", "On va parler chiffres, et je pense que ça va convaincre."],
      confiant: ["Je connais ma valeur, et je pense qu'elle mérite d'être reconnue.", "Voici mes résultats, discutons de la suite."],
    },
  },
  {
    id: 'pt12',
    name: 'Un ami proche à qui tu dois dire une vérité difficile',
    tip: 'Parle en "je ressens" plutôt qu\'en "tu as tort" — ça évite que l\'autre se mette immédiatement sur la défensive.',
    phrases: {
      sigma: ["Je voulais te dire que ce que t'as dit m'a blessé.", "J'ai besoin qu'on en parle, calmement."],
      alpha: ["Ce que t'as fait m'a touché, et je veux qu'on en parle.", "Je te le dis en face, ça m'a vraiment dérangé."],
      charisme: ["Petit point sensible à régler entre nous, ça te dit ?", "J'ai un truc sur le cœur, autant le vider maintenant."],
      confiant: ["Je te le dis parce que notre amitié compte pour moi.", "Je préfère être honnête plutôt que de garder ça pour moi."],
    },
  },
  {
    id: 'pt13',
    name: 'Un enfant à qui tu dois poser une limite',
    tip: 'Sois ferme sur la règle, mais chaleureux dans le ton — la limite doit rassurer, pas effrayer.',
    phrases: {
      sigma: ["On ne fait pas ça, je t'explique pourquoi.", "Je comprends que tu sois frustré, mais la règle reste."],
      alpha: ["Non, c'est non — et voici pourquoi.", "On respecte les règles, même quand c'est difficile."],
      charisme: ["Petit chef, même toi t'as des règles à suivre aujourd'hui.", "On négocie pas tout, et c'est une bonne leçon."],
      confiant: ["Je pose cette limite parce que je t'aime.", "C'est non, calmement, mais fermement."],
    },
  },
  {
    id: 'pt14',
    name: 'Un artisan ou prestataire de service (devis, réparation)',
    tip: 'Demande toujours un détail écrit avant d\'accepter un prix — ça n\'a rien d\'agressif, c\'est une pratique normale et professionnelle.',
    phrases: {
      sigma: ["Vous pouvez me détailler ce devis, poste par poste ?", "Je vais comparer avec un autre avis avant de valider."],
      alpha: ["Ce prix me semble élevé, expliquez-moi la répartition.", "Je veux un devis détaillé avant de dire oui."],
      charisme: ["À ce prix-là, j'espère un résultat exceptionnel.", "Convainquez-moi que ça vaut le coup."],
      confiant: ["Je veux comprendre chaque ligne avant de décider.", "Je fais confiance, mais je vérifie aussi."],
    },
  },
  {
    id: 'pt15',
    name: 'Toi-même, avant un moment stressant (auto-discours intérieur)',
    tip: 'Parle-toi comme tu parlerais à un ami que tu veux encourager — pas comme un juge qui cherche la faille.',
    phrases: {
      sigma: ["Je suis prêt, je respire, je fais ce que j'ai à faire.", "Peu importe le résultat, j'ai fait ce que je pouvais."],
      alpha: ["Je vais y aller et donner le meilleur de moi.", "Je n'ai rien à craindre, je suis préparé."],
      charisme: ["Allez, montre-leur ce que tu sais faire.", "C'est ton moment, prends-le avec le sourire."],
      confiant: ["Je suis capable, je l'ai déjà prouvé avant.", "Quoi qu'il arrive, je reste fier de m'être présenté."],
    },
  },
];
