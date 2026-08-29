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
  {
    id: 'psy7',
    title: 'Les quatre personnes dont il faut vraiment écouter les conseils',
    intro: 'Tout le monde a un avis à donner, mais très peu de gens méritent qu\'on écoute vraiment leurs conseils. Voici quatre profils à privilégier.',
    points: [
      {
        heading: 'Un. L\'exemple.',
        body: "Quelqu'un qui a déjà construit ce que tu veux construire. S'il ne l'a jamais fait, il ne peut pas vraiment te l'enseigner. Ne demande pas comment monter une entreprise à quelqu'un qui n'en a jamais monté une. Étudie les gens qui ont des résultats concrets, pas seulement des opinions.",
      },
      {
        heading: 'Deux. Celui qui a échoué et s\'est relevé.',
        body: "Quelqu'un qui a échoué publiquement mais qui a continué. La réussite se cache souvent dans les leçons que l'échec enseigne. Les meilleurs mentors sont ceux qui ont été mis à terre par la vie et qui se sont relevés — ce sont eux qui savent vraiment ce que ça coûte de réussir.",
      },
      {
        heading: 'Trois. Celui qui dit la vérité, même dérangeante.',
        body: "Quelqu'un qui te met parfois mal à l'aise en te disant ce que tu dois entendre, pas ce que tu as envie d'entendre. On ne progresse pas en étant seulement rassuré. Garde près de toi les personnes qui te challengent et te recadrent — c'est une forme d'attention, pas une attaque.",
      },
      {
        heading: 'Quatre. Celui qui n\'a rien à gagner ni à perdre.',
        body: "Quelqu'un dont ta réussite ne change rien à sa vie. Un regard extérieur, sans enjeu personnel, voit souvent plus clair qu'un proche impliqué. Que tu gagnes ou que tu perdes ne l'affecte pas — il peut donc te dire honnêtement ce que les autres n'osent pas dire.",
      },
    ],
    outro: 'Pour tous les autres avis : sourire, hocher la tête poliment, et avancer. Le conseil est gratuit, mais une bonne direction venant de la bonne personne n\'a pas de prix.',
  },
  {
    id: 'psy8',
    title: 'Pourquoi on respecte plus facilement quelqu\'un qui sait se défendre',
    intro: 'Une idée ancienne, parfois résumée ainsi : un animal sans défense finit utilisé comme un simple outil par les autres.',
    points: [
      {
        heading: 'Le respect vient rarement de la seule gentillesse.',
        body: "Le respect et la prudence des autres viennent souvent moins de la bonté que de la capacité perçue à se défendre si nécessaire. Ce n'est pas une invitation à l'agressivité — c'est une observation sur les rapports humains.",
      },
      {
        heading: 'Ne jamais chercher à mordre, mais ne pas paraître sans défense.',
        body: "Il ne s'agit pas de chercher le conflit ou de menacer qui que ce soit. Il s'agit simplement de ne pas se montrer comme quelqu'un qui accepte tout sans jamais poser de limite. Une personne qui sait dire non, qui a des limites claires, inspire naturellement plus de respect qu'une personne qui plie systématiquement.",
      },
    ],
    outro: 'Poser des limites claires n\'est pas de l\'agressivité — c\'est ce qui permet d\'être traité avec respect plutôt qu\'exploité par confort.',
  },
  {
    id: 'psy9',
    title: 'Le cochon de la ferme : quand la gratuité cache un calcul',
    intro: 'Une image parlante pour comprendre certaines offres "trop belles pour être vraies", notamment en matière de crédit.',
    points: [
      {
        heading: 'Le cochon qui ne travaille pas.',
        body: "Dans une ferme, le cochon est le seul animal qui ne travaille pas : il mange gratuitement, dort au chaud, et pense que le fermier l'aime bien puisqu'il lui donne tout ce dont il a besoin.",
      },
      {
        heading: 'Ce que le cochon ne comprend pas.',
        body: "La nourriture n'est pas un cadeau, c'est un investissement. Le fermier ne le nourrit pas par générosité : il l'engraisse. Et le jour où le cochon est le plus gros et le plus content, c'est aussi le jour où le couteau est prêt.",
      },
      {
        heading: 'Le parallèle avec le crédit facile.',
        body: "Certaines offres financières fonctionnent sur le même principe : cartes de crédit avec plafond très généreux, prêts non sollicités, paiement en plusieurs fois sans frais la première année. Rien de tout cela n'est pensé pour améliorer ta vie — c'est pensé pour te rendre confortable avec la dette, afin de collecter des intérêts pendant des années.",
      },
      {
        heading: 'La question à se poser.',
        body: "Quand quelque chose est gratuit et confortable sans effort de ta part, il vaut la peine de se demander : qui gagne réellement dans cet arrangement, et sur le long terme ? Ce n'est pas une raison de refuser toute offre, mais une raison de lire les conditions avant de signer.",
      },
    ],
    outro: 'Avant d\'accepter une offre trop facile, demande-toi toujours ce qu\'elle rapporte à celui qui la propose — pas seulement ce qu\'elle t\'apporte à toi.',
  },
  {
    id: 'psy10',
    title: 'Vivre sans rancune ni vengeance',
    intro: 'Une confiance affichée à l\'extérieur ne vaut rien si on reste prisonnier, à l\'intérieur, de la rancune ou de la jalousie. Voici comment se libérer des deux.',
    points: [
      {
        heading: 'Un. Pardonner n\'est pas rouvrir la porte.',
        body: "Pardonner quelqu'un ne veut pas dire le laisser recommencer. Tu peux dire : « Je ne t'en veux plus, mais je ne veux plus la même relation avec toi. » La rancune veut que l'autre souffre autant qu'elle a fait souffrir ; la maturité se contente d'apprendre, de se protéger et d'avancer.",
      },
      {
        heading: 'Deux. Face à une blessure, trois questions.',
        body: "Qu'est-ce qui s'est réellement passé ? Qu'est-ce que cette situation m'a appris ? Qu'est-ce que je peux contrôler maintenant ? Une fois les réponses posées, laisse le reste derrière toi — ne laisse pas quelqu'un qui t'a blessé vivre gratuitement dans ta tête.",
      },
      {
        heading: 'Trois. La vengeance est un piège de l\'ego.',
        body: "Avant d'agir par envie de « montrer », demande-toi : est-ce que je veux vraiment réussir, ou simplement que l'autre regrette ? La meilleure réponse à certaines personnes n'est pas la vengeance, c'est de continuer à travailler, progresser et construire — pas pour faire regretter quelqu'un, mais parce que c'est ta vie.",
      },
    ],
    outro: 'Je respecte mon passé, mais je refuse d\'y vivre.',
  },
  {
    id: 'psy11',
    title: 'Transformer la jalousie en apprentissage',
    intro: 'La comparaison est un piège sans fin — il y aura toujours quelqu\'un de plus riche, plus beau ou plus doué. Voici comment retourner cette énergie en sa faveur.',
    points: [
      {
        heading: 'Un. Changer la question.',
        body: "Au lieu de « pourquoi lui et pas moi ? », demande « qu'est-ce que je peux apprendre de lui ? ». Quelqu'un réussit : observe, analyse, apprends, puis retourne travailler sur ta propre route. La réussite des autres ne diminue pas la tienne.",
      },
      {
        heading: 'Deux. Admiration plutôt qu\'envie.',
        body: "Devant une belle voiture, un anglais parfait ou une réussite en affaires, la formule gagnante est : admiration → apprentissage → action — jamais jalousie → comparaison → frustration.",
      },
      {
        heading: 'Trois. La méthode en 4 étapes face à l\'envie.',
        body: "Reconnais-la sans te mentir (« oui, je suis jaloux »). Identifie ce que l'autre possède et que tu désires réellement — argent, compétence, relation, statut, liberté. Transforme la question en action concrète pour t'en rapprocher. Puis agis : la jalousie devient une information, pas une prison.",
      },
      {
        heading: 'Quatre. Compare-toi à toi-même.',
        body: "Ta vraie compétition, c'est toi hier. Chaque soir : qu'est-ce que j'ai amélioré aujourd'hui ? Qu'est-ce que j'ai appris ? Où ai-je manqué de maîtrise ? Que vais-je faire différemment demain ?",
      },
    ],
    outro: 'La réussite des autres est une preuve que c\'est possible — pas une preuve que tu es inférieur.',
  },
  {
    id: 'psy12',
    title: 'Observer sans juger, ni être naïf',
    intro: 'Ne pas juger trop vite ne veut pas dire être aveugle. Voici la nuance entre jugement, observation et décision.',
    points: [
      {
        heading: 'Un. Un comportement n\'est pas toute l\'histoire.',
        body: "Quelqu'un de mal habillé, une belle voiture, une personne discrète ou bavarde : tu vois un comportement, pas toute son histoire. Remplace le jugement par la curiosité — « qu'est-ce qui peut expliquer ça ? » plutôt que « quel idiot ».",
      },
      {
        heading: 'Deux. Observer n\'est pas être naïf.',
        body: "Tu peux constater qu'une personne ment, manipule ou manque de respect sans avoir besoin de la détester. La différence : le jugement dit « c'est une mauvaise personne » ; l'observation dit « son comportement ne me convient pas » ; la décision dit « je garde mes distances ».",
      },
      {
        heading: 'Trois. Ne pas tout interpréter.',
        body: "Un regard, un message sans réponse, un rire après ton passage : ne construis pas une histoire sans preuve. Face à une petite offense (pas de bonjour, un oubli), pense d'abord que la personne était peut-être simplement occupée plutôt que d'y voir un manque de respect.",
      },
      {
        heading: 'Quatre. Séparer fait, interprétation, émotion, action.',
        body: "En cas de colère : le fait (« il a dit X »), ton interprétation (« j'ai pensé qu'il voulait m'humilier »), ton émotion (« je suis en colère »), puis l'action réelle nécessaire. Cette séparation évite beaucoup de réactions inutiles.",
      },
    ],
    outro: 'Je cherche à comprendre avant de condamner — et je peux garder mes distances sans haïr personne.',
  },
  {
    id: 'psy13',
    title: 'Le dialogue intérieur qui construit la maîtrise de soi',
    intro: 'Être fort ne veut pas dire ne jamais ressentir la colère, la peur ou la jalousie — mais savoir quoi se dire quand elles arrivent.',
    points: [
      {
        heading: 'Un. La pensée de base.',
        body: "« Je sais qui je suis. Je connais ma valeur. Je n'ai rien à prouver à tout le monde. » Ta valeur ne dépend pas de l'opinion du moment — pas besoin d'être trouvé intelligent, beau ou d'avoir le dernier mot pour continuer.",
      },
      {
        heading: 'Deux. En société.',
        body: "En entrant dans une pièce ou en parlant à quelqu'un, remplace « est-ce qu'ils vont m'aimer ? » par « je vais simplement être présent, écouter, sourire ». Remplace « qu'est-ce qu'il pense de moi ? » par « qu'est-ce que je peux apprendre de cette personne ? ».",
      },
      {
        heading: 'Trois. Face au rejet, à l\'échec ou à l\'insulte.',
        body: "Rejet : « cette personne ne me choisit pas, ça ne définit pas ma valeur. » Échec : « cette tentative n'a pas marché, qu'est-ce que je change ? » Insulte : « son comportement est sous son contrôle, ma réaction est sous le mien. »",
      },
      {
        heading: 'Quatre. La règle des 4 questions.',
        body: "Face à une émotion forte : qu'est-ce que je ressens ? Pourquoi (que s'est-il réellement passé) ? Est-ce sous mon contrôle (action si oui, acceptation si non) ? Quelle réaction correspond à la personne que je veux devenir ?",
      },
    ],
    outro: 'Je remarque ce que je ressens. Je n\'ai pas besoin de devenir ce que je ressens.',
  },
  {
    id: 'psy14',
    title: 'Face au rejet, à la critique et à l\'insulte',
    intro: 'On ne peut pas plaire à tout le monde, ni empêcher qu\'on parle de nous. Voici comment traverser ça sans perdre son calme ni sa valeur.',
    points: [
      {
        heading: 'Un. Tu ne plairas pas à tout le monde, et ce n\'est pas un problème.',
        body: "Certaines personnes ne t'aimeront pas, même si tu es gentil et que tu fais de ton mieux. « Je préfère être respecté pour qui je suis que aimé pour quelqu'un que je ne suis pas. » Ce n'est pas une excuse pour être désagréable : tu restes respectueux.",
      },
      {
        heading: 'Deux. Quand on parle mal de toi.',
        body: "Ne cours pas immédiatement expliquer ta version à tout le monde. Demande-toi si cette personne a réellement une importance dans ta vie. Si non, ignore. Si oui : « J'ai entendu ce qui s'est dit. Si tu as un problème avec moi, viens m'en parler directement. »",
      },
      {
        heading: 'Trois. Le rejet n\'est pas une condamnation.',
        body: "Face à un rejet — relation, business, amitié — pense : « cette personne ne me choisit pas, cela ne définit pas ma valeur. » Le rejet est une information, pas un verdict. Tu peux être une bonne personne sans être aimé par tout le monde, et tu n'es pas obligé de convaincre qui que ce soit.",
      },
      {
        heading: 'Quatre. Face à l\'insulte, avant de répondre.',
        body: "Pensée immédiate : « son comportement est sous son contrôle, ma réaction est sous le mien. » Puis demande-toi si tu dois vraiment répondre. Si oui, une phrase suffit : « je te demande de me parler avec respect. » Si non, ignore — une réponse peut satisfaire l'ego 30 secondes et créer un problème pendant 3 mois.",
      },
      {
        heading: 'Cinq. La critique, l\'information utile.',
        body: "Quelqu'un te critique : prends l'information utile et laisse le reste. Quelqu'un est en colère contre toi : tu peux écouter sans absorber son émotion. Quelqu'un est jaloux de toi : tu n'as pas besoin de diminuer ta réussite pour rassurer son insécurité.",
      },
    ],
    outro: 'Je peux être critiqué sans me détruire, et rejeté sans perdre confiance.',
  },
  {
    id: 'psy15',
    title: 'Ego, erreurs et le mantra de la maîtrise de soi',
    intro: 'La vraie force ne consiste pas à ne jamais ressentir la peur, la colère ou l\'échec — mais à ne pas leur laisser le volant.',
    points: [
      {
        heading: 'Un. Ce que veut ton ego, et ce que dit ta maturité.',
        body: "Ton ego veut avoir raison, être admiré, être supérieur, ne jamais être humilié, gagner toutes les discussions. Ta maturité dit : « je n'ai pas besoin de gagner chaque interaction. » Tu peux laisser quelqu'un avoir le dernier mot, dire simplement « d'accord », et passer à autre chose.",
      },
      {
        heading: 'Deux. Erreur et échec ne sont pas une identité.',
        body: "Face à une erreur : « j'ai fait une erreur, je ne suis pas mon erreur — qu'est-ce que j'apprends, comment éviter que ça recommence ? » Face à un échec : « cette tentative n'a pas fonctionné, qu'est-ce que je change pour la prochaine ? » L'échec devient une donnée, pas une identité.",
      },
      {
        heading: 'Trois. Reconnaître sa peur, savoir dire non.',
        body: "Inutile de te convaincre que tu n'as pas peur : reconnais-la — « oui, j'ai peur, et je vais quand même faire ce qui doit être fait. » Pour dire non : « il a le droit d'être déçu, je n'ai pas l'obligation de satisfaire tout le monde — dire non à une demande n'est pas dire non à la valeur de la personne. »",
      },
      {
        heading: 'Quatre. Le mantra à mémoriser.',
        body: "Je suis calme, confiant, sociable. Je souris et j'écoute. Je ne garde pas de rancune, je pardonne sans être naïf. Je ne laisse pas la jalousie me contrôler — la réussite des autres m'inspire au lieu de me diminuer. Je peux être rejeté sans perdre confiance, critiqué sans me détruire, avoir tort sans perdre ma dignité. Je peux être gentil sans être faible, ferme sans être cruel. Je n'ai rien à prouver. Je choisis ma réaction, mes batailles, ma direction.",
      },
    ],
    outro: 'Je ne contrôle pas ce que les autres pensent de moi. Je contrôle ma manière de vivre.',
  },
];
