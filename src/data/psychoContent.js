/**
 * Contenu "PSYCHO" affiché dans l'onglet Compétences, sous la section
 * "Compétences à apprendre". Ce sont des articles de vulgarisation en
 * psychologie / neurosciences / communication, structurés en points
 * numérotés pour une lecture rapide et actionnable.
 *
 * Chaque article a :
 *  - id, title : identification et titre affiché
 *  - intro : phrase d'accroche
 *  - points : liste de { heading, body } (un point = une technique)
 *  - outro : phrase de clôture
 */

export const psychoArticles = [
  {
    id: 'psy1',
    title: 'Cinq techniques que les meilleures mémoires utilisent pour ne plus jamais oublier',
    intro: 'Des neuroscientifiques ont révélé cinq techniques, que les meilleures mémoires utilisent, pour ne plus jamais oublier.',
    points: [
      {
        heading: 'Un. La répétition espacée.',
        body: "Ne relis pas tout d'un coup, revois l'information après un jour, puis après trois jours, puis après une semaine. Ton cerveau consolide ce qu'il revoit à intervalle régulier. C'est la technique la plus puissante, que les écoles ne t'ont jamais enseignée.",
      },
      {
        heading: 'Deux. L\'effet de génération.',
        body: "Ne recopie pas, ne surligne pas. Ferme ton livre et réécris ce dont tu te souviens de mémoire. Ton cerveau retient trois fois mieux ce qu'il a produit lui-même.",
      },
      {
        heading: 'Trois. L\'ancrage émotionnel.',
        body: "Associe chaque information importante à une émotion ou une image forte. Le cerveau humain oublie les faits, il n'oublie jamais les émotions. Transforme ce que tu apprends en quelque chose que tu ressens.",
      },
      {
        heading: 'Quatre. La technique de Feynman.',
        body: "Explique ce que tu viens d'apprendre comme si tu parlais à un enfant de dix ans. Si tu bloques quelque part, c'est exactement là que tu n'as pas compris. Retourne étudier ce point précis, rien d'autre.",
      },
      {
        heading: 'Cinq. Le sommeil stratégique.',
        body: "Après avoir appris quelque chose d'important, dors dans les deux heures qui suivent. Pendant le sommeil, ton cerveau transfère les informations de la mémoire à court terme vers la mémoire à long terme. Une nuit blanche efface ce que tu as appris, une bonne nuit le grave pour toujours.",
      },
    ],
    outro: 'Reprogramme ta façon d\'apprendre pour retenir plus, avec moins d\'efforts inutiles.',
  },
  {
    id: 'psy2',
    title: 'Quatre techniques de manipulation que les gens utilisent sur toi chaque jour',
    intro: "Voici quatre techniques de manipulation que les gens utilisent sur toi chaque jour, et tu ne t'en rends jamais compte.",
    points: [
      {
        heading: 'Un. La dette artificielle.',
        body: "Quelqu'un te rend un service sans que tu le demandes, un cadeau, une faveur, un geste. Ton cerveau enregistre automatiquement une dette émotionnelle. Et quand il va te demander quelque chose, tu vas dire oui, pas parce que tu veux, mais parce que tu te sens redevable.",
      },
      {
        heading: 'Deux. La validation suivie du retrait.',
        body: "Il te complimente, il s'intéresse à toi, tu te sens bien, tu t'ouvres. Puis il se retire sans explication. Son absence crée un vide et tu vas chercher à retrouver cette validation qu'il t'a donnée puis retirée. Ton cerveau devient dépendant sans que tu comprennes pourquoi.",
      },
      {
        heading: 'Trois. La question qui te place en défense.',
        body: "« Pourquoi tu as fait ça ? » « Tu es sûr de toi ? » Ces questions ne cherchent pas une réponse. Elles cherchent à te déstabiliser, à te faire douter, et le doute te rend malléable.",
      },
      {
        heading: 'Quatre. La comparaison destructrice.',
        body: "« Un tel aurait fait ça différemment. » « La plupart des gens dans ta situation… » Ton amygdale reçoit une menace sociale. Tu vas agir pour prouver ta valeur sans réaliser que tu viens d'être manipulé par ton propre ego.",
      },
    ],
    outro: 'Apprends à repérer ces mécanismes pour les neutraliser au lieu de les subir.',
  },
  {
    id: 'psy3',
    title: 'Comment gagner le respect comme les hommes de pouvoir',
    intro: 'Trois principes simples, mais rarement appliqués avec constance.',
    points: [
      {
        heading: 'Un. La poignée de main et le regard.',
        body: "Quand tu salues quelqu'un, serre-lui la main fermement et maintiens le contact visuel trois secondes. Pas un, pas deux, exactement trois. Ces trois secondes communiquent une chose simple : je suis à ma place ici.",
      },
      {
        heading: 'Deux. Ne pas réagir à la moquerie.',
        body: "Si quelqu'un se moque de toi, ne réagis pas immédiatement. Tiens son regard cinq secondes en silence, sans sourire, sans bouger, puis ris calmement. Son cerveau vient de recevoir le message le plus puissant qui soit : tu ne peux pas me déstabiliser.",
      },
      {
        heading: 'Trois. Savoir dire non.',
        body: "N'accepte jamais quelque chose qui ne te convient pas juste pour éviter le conflit. Chaque oui forcé te coûte du respect. Un non calme et ferme construit une réputation que mille mots polis ne peuvent pas créer.",
      },
    ],
    outro: 'Le respect s\'impose naturellement quand la posture et la parole restent alignées.',
  },
  {
    id: 'psy4',
    title: 'Cinq techniques secrètes que les agents du FBI utilisent pour faire parler n\'importe qui',
    intro: "Voici cinq techniques d'écoute et de communication utilisées en négociation, que tu peux appliquer dès aujourd'hui.",
    points: [
      {
        heading: 'Un. Le miroir stratégique.',
        body: "Tu répètes les trois derniers mots de ce que l'autre vient de dire. Son cerveau interprète ça comme de la compréhension. Il continue à parler, il révèle plus qu'il ne voulait.",
      },
      {
        heading: 'Deux. Le silence calculé.',
        body: "Après qu'il répond, tu ne dis rien. Cinq secondes complètes. Le cerveau humain ne supporte pas le vide. Il va parler pour le remplir, et celui qui parle en premier révèle souvent sa vraie position.",
      },
      {
        heading: 'Trois. L\'étiquetage émotionnel.',
        body: "Tu nommes ce qu'il ressent sans demander. « On dirait que tu te sens incompris. » Son amygdale se calme. Il baisse sa garde, il s'ouvre plus facilement.",
      },
      {
        heading: 'Quatre. La fausse preuve.',
        body: "Tu affirmes savoir quelque chose que tu ne sais pas encore. « On m'a déjà expliqué, je veux juste entendre ta version. » Son cerveau abandonne la résistance. Il préfère contrôler le récit plutôt que de se taire.",
      },
      {
        heading: 'Cinq. Le pivot émotionnel.',
        body: "Tu passes brusquement de la pression à la compassion. « Je comprends pourquoi t'as fait ça. » Son système nerveux se détend. Il parle, il s'ouvre, il fait confiance.",
      },
    ],
    outro: 'À utiliser pour mieux écouter et comprendre — jamais pour tromper ou piéger quelqu\'un.',
  },
  {
    id: 'psy5',
    title: 'Cinq techniques psychologiques que 99 % des gens ne maîtriseront jamais',
    intro: 'Cinq façons de garder son calme et son autorité, sans jamais élever la voix.',
    points: [
      {
        heading: 'Un. Retourner la critique en question.',
        body: "Si quelqu'un te critique, ne t'énerve pas. Regarde-le calmement et dis : « Et toi, comment tu m'aiderais à faire mieux ? » S'il n'a rien à répondre, son masque tombe. Il ne te critiquera plus de la même façon.",
      },
      {
        heading: 'Deux. Désamorcer une moquerie.',
        body: "Si quelqu'un se moque de toi avec une blague, ne réponds pas sur le même ton. Dis juste : « Je comprends pas, explique-moi. » La blague perd son effet et la gêne change de camp.",
      },
      {
        heading: 'Trois. Chuchoter plutôt que crier.',
        body: "Si quelqu'un veut t'entraîner dans une dispute, n'élève jamais la voix. Réponds en parlant plus bas, pour qu'il doive faire l'effort de t'écouter. Il devra se calmer en premier. Tu reprends le contrôle du ton de l'échange.",
      },
      {
        heading: 'Quatre. Répondre à l\'insulte par une question de fond.',
        body: "Si quelqu'un t'insulte, arrête-toi, regarde-le dans les yeux et demande : « Tu vas bien ? » Cette phrase casse l'élan, déstabilise l'agressivité et le pousse à se questionner lui-même.",
      },
      {
        heading: 'Cinq. Le silence face au doute.',
        body: "Si tu sens que quelqu'un ne te dit pas toute la vérité, ne le presse pas. Reste silencieux et attentif un instant. Beaucoup de gens finissent par compléter ou corriger d'eux-mêmes, simplement parce que le silence les met mal à l'aise.",
      },
    ],
    outro: 'Le calme et le silence sont souvent plus puissants qu\'une réaction immédiate.',
  },
  {
    id: 'psy6',
    title: 'Sept lois pour augmenter ton charisme',
    intro: 'Sept principes de présence et de posture, à travailler un par un plutôt que tous d\'un coup.',
    points: [
      {
        heading: 'Un. La loi du calme.',
        body: "Celui qui ne se précipite jamais garde le contrôle de la pièce. Parle lentement, bouge lentement, respire profondément. Le calme communique de l'assurance — la maîtrise de soi impressionne plus que l'agitation.",
      },
      {
        heading: 'Deux. La loi du regard.',
        body: "Regarde les gens une seconde de plus que la normale. Ni agressif, ni fuyant. Stable, présent. Un regard qui ne se dérobe pas montre que tu es à l'aise avec toi-même.",
      },
      {
        heading: 'Trois. La loi du silence.',
        body: "Ne remplis pas systématiquement les silences par gêne. Un silence assumé installe le respect et l'attention. Apprends à laisser un blanc exister sans te sentir obligé de le combler.",
      },
      {
        heading: 'Quatre. La loi du corps.',
        body: "Dos droit, épaules ouvertes, gestes posés. Ta posture communique avant même que tu ouvres la bouche.",
      },
      {
        heading: 'Cinq. La loi de l\'indépendance émotionnelle.',
        body: "Ne cherche pas à plaire à tout prix. Plus tu te valides toi-même, moins tu dépends du regard des autres pour te sentir bien. Le charisme naît souvent de cette indépendance émotionnelle.",
      },
      {
        heading: 'Six. La loi de la cohérence.',
        body: "Fais ce que tu dis, dis ce que tu fais. Une personne alignée entre ses paroles et ses actes inspire confiance presque automatiquement.",
      },
      {
        heading: 'Sept. La loi du travail silencieux.',
        body: "Travaille et progresse même quand personne ne regarde. Le respect que les autres te donnent vient presque toujours d'une discipline construite loin des regards.",
      },
    ],
    outro: 'Le charisme se construit par la pratique répétée de ces principes, pas par une posture forcée du jour au lendemain.',
  },
];
