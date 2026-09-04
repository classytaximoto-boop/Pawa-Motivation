/**
 * Pool de leçons journalières. Chaque jour, _ensureDailyLesson() (voir store.js)
 * tire une leçon au hasard dans ce pool pour remplacer state.dailyLesson.
 * Format volontairement riche (paragraphes + exercice) : ce ne sont pas des
 * "missions" courtes comme dailyMissions.js, mais du contenu à lire et pratiquer.
 *
 * Pour ajouter un thème ou enrichir un thème existant : ajouter un objet à ce
 * tableau, avec un `id` unique (utilisé pour éviter les doublons si besoin) et
 * un `theme` cohérent avec ceux déjà présents. Aucune autre modification requise.
 */
export const dailyLessonsPool = [
  {
    id: 'marketing_1',
    theme: 'Marketing',
    title: 'La proposition de valeur en une phrase',
    body: [
      "Une proposition de valeur répond à une seule question posée par ton client potentiel : \"Pourquoi toi, et pas un autre, et pas rien du tout ?\" Beaucoup d'entrepreneurs décrivent ce qu'ils font (\"je vends des chaussures\") au lieu de ce que ça change pour le client (\"tes pieds ne te feront plus mal après 8h de marche\"). La différence entre les deux est ce qui fait qu'un client se souvient de toi ou t'oublie.",
      "Une bonne proposition de valeur a 3 ingrédients : le résultat concret que le client obtient, ce qui la rend crédible (preuve, méthode, expérience), et ce qui te différencie d'une alternative évidente — y compris \"ne rien faire\". Si tu ne peux pas la dire en une phrase à un inconnu dans un ascenseur, elle n'est pas encore assez claire pour toi-même.",
      "Le piège classique est de vouloir plaire à tout le monde. Une proposition de valeur qui parle à tout le monde ne marque personne. Plus elle est précise sur QUI elle vise, plus elle devient puissante pour ce public précis — même si ça veut dire renoncer à convaincre les autres.",
    ],
    exercise: "Écris la proposition de valeur d'un de tes projets actuels (ou de BOOST lui-même) en une seule phrase, sans utiliser les mots \"qualité\", \"innovant\" ou \"meilleur\" — ce sont des mots vides que tout le monde utilise. Concentre-toi sur le résultat concret pour la personne qui utilise ton produit ou service.",
    xp: 15,
  },
  {
    id: 'negociation_1',
    theme: 'Négociation',
    title: "L'ancrage : qui parle en premier fixe le cadre",
    body: [
      "En négociation, la première offre chiffrée posée sur la table devient un \"ancrage\" psychologique : toute la suite de la discussion s'articule autour de ce chiffre, même s'il était arbitraire. C'est prouvé en psychologie comportementale — si tu proposes 800, la contre-proposition tournera probablement autour de 600-700, pas de 200.",
      "Ça veut dire que dans la plupart des négociations, il vaut mieux parler en premier plutôt que d'attendre \"pour voir ce que l'autre propose\" — sauf si tu as beaucoup moins d'information que l'autre partie sur ce qui est raisonnable. Si tu ne connais pas la valeur du marché, laisse l'autre parler d'abord pour calibrer.",
      "L'ancrage fonctionne mieux avec un chiffre précis (847 000 Ar) plutôt qu'un chiffre rond (800 000 Ar) — un chiffre précis paraît plus réfléchi et moins négociable psychologiquement, même s'il n'y a objectivement aucune raison logique à ça.",
    ],
    exercise: "Repense à ta dernière négociation (prix, salaire, délai). Qui a parlé en premier ? Le résultat final était-il plus proche de la première offre de l'un ou de l'autre ? La prochaine fois que tu négocies quelque chose cette semaine, essaie consciemment de poser le premier chiffre — précis, pas rond — et observe l'effet.",
    xp: 15,
  },
  {
    id: 'communication_1',
    theme: 'Communication',
    title: "L'écoute active : reformuler avant de répondre",
    body: [
      "La plupart des conversations ratées ne viennent pas d'un désaccord de fond, mais du fait que chacun répond à ce qu'il a cru entendre plutôt qu'à ce qui a réellement été dit. On prépare notre réponse pendant que l'autre parle encore, au lieu d'écouter vraiment jusqu'au bout.",
      "L'écoute active consiste à reformuler ce que l'autre vient de dire avant de répondre : \"Si je comprends bien, tu dis que...\". Ça a deux effets : ça force à vraiment écouter (impossible de reformuler correctement quelque chose qu'on n'a pas suivi), et ça donne à l'autre la sensation d'être compris — ce qui désamorce énormément de tensions inutiles.",
      "Reformuler n'est pas être d'accord. On peut reformuler parfaitement la position de quelqu'un et ensuite la contester point par point. Mais reformuler d'abord change complètement le ton de la suite : l'autre sent qu'il a été entendu avant d'être contredit, ce qui le rend beaucoup plus réceptif.",
    ],
    exercise: "Dans ta prochaine conversation un peu tendue ou importante (travail, famille), commence ta réponse par une reformulation en une phrase de ce que l'autre vient de dire, avant de donner ton avis. Observe si le ton de la discussion change.",
    xp: 15,
  },
  {
    id: 'ventes_1',
    theme: 'Ventes',
    title: 'Vendre le problème avant de vendre la solution',
    body: [
      "Un vendeur qui commence directement par les caractéristiques de son produit perd son interlocuteur, parce que celui-ci ne s'est pas encore reconnu dans un problème. Vendre efficacement commence presque toujours par nommer précisément la douleur ou le besoin du client, avant même de parler de ce que tu proposes.",
      "Une technique simple : poser des questions qui amènent le client à formuler lui-même son problème, plutôt que de le lui dire à sa place. Quelqu'un qui dit lui-même \"oui, en fait je perds beaucoup de temps sur cette étape\" est bien plus convaincu que quelqu'un à qui on l'a annoncé. C'est la base de méthodes de vente comme SPIN Selling (Situation, Problème, Implication, Nécessité).",
      "Une fois le problème nommé PAR le client, ta solution n'a plus besoin d'être \"vendue\" au sens agressif du terme — elle devient la réponse logique à quelque chose que la personne vient d'admettre elle-même. C'est pour ça que les meilleurs vendeurs parlent souvent moins que les mauvais : ils posent des questions, ils n'imposent pas un discours.",
    ],
    exercise: "La prochaine fois que tu dois présenter quelque chose (un produit, une idée, un projet) à quelqu'un, prépare 2 questions à poser AVANT de présenter ta solution — des questions qui amènent la personne à décrire elle-même le problème que tu vas résoudre.",
    xp: 15,
  },
  {
    id: 'juridique_1',
    theme: 'Termes juridiques',
    title: "Contrat, clause, et la différence entre nul et résiliable",
    body: [
      "Un contrat est un accord qui crée des obligations juridiquement contraignantes entre les parties qui le signent. Une clause est une disposition précise à l'intérieur de ce contrat (ex. : \"clause de non-concurrence\", \"clause de confidentialité\"). Comprendre cette distinction aide à lire n'importe quel document juridique sans paniquer : c'est un ensemble de petites promesses individuelles, pas un bloc monolithique.",
      "Un contrat \"nul\" n'a jamais produit d'effet juridique valable — c'est comme s'il n'avait jamais existé, en général parce qu'une condition essentielle manquait dès le départ (par exemple, une des parties n'avait pas la capacité légale de signer). Un contrat \"résilié\", lui, était valable, mais prend fin pour l'avenir — les effets passés restent, seuls les effets futurs s'arrêtent.",
      "Une clause \"abusive\" est une clause valable en apparence, mais qui crée un déséquilibre significatif entre les parties (souvent utilisée contre un consommateur ou une partie plus faible) — les tribunaux peuvent la déclarer inapplicable même si le contrat dans son ensemble reste valide. Retenir ce mot permet de repérer qu'une clause mérite d'être questionnée, même dans un contrat qu'on a déjà signé.",
    ],
    exercise: "Si tu as un contrat sous la main (bail, abonnement, prestation), repère une clause que tu n'avais jamais vraiment lue. Essaie de la reformuler avec tes propres mots, en une phrase simple. Si tu n'arrives pas à la reformuler simplement, c'est souvent le signe qu'elle mérite d'être clarifiée avant de s'engager davantage.",
    xp: 15,
  },
  {
    id: 'politique_1',
    theme: 'Politique',
    title: 'Séparation des pouvoirs : pourquoi trois branches ?',
    body: [
      "L'idée de séparer le pouvoir législatif (qui fait les lois), exécutif (qui les applique) et judiciaire (qui tranche les litiges et vérifie leur respect) vient notamment de Montesquieu au 18e siècle. Le principe de base : si une seule personne ou un seul groupe détient les trois pouvoirs, rien ne l'empêche d'abuser de son autorité — qui écrit la loi, l'applique et juge en même temps ne rencontre jamais de contre-pouvoir.",
      "Dans la pratique, aucun système n'a une séparation parfaite et étanche — les trois pouvoirs interagissent constamment (l'exécutif propose souvent des lois, le judiciaire peut invalider une loi votée). Ce qui compte vraiment n'est pas une séparation totale impossible, mais l'existence de contre-pouvoirs réels : chaque branche doit pouvoir limiter les excès des deux autres.",
      "Comprendre ce principe aide à lire n'importe quelle actualité politique, dans n'importe quel pays : quand un gouvernement affaiblit l'indépendance de sa justice ou contourne son parlement, ce n'est jamais un détail technique — c'est directement la question de savoir si le pouvoir reste limité ou devient absolu.",
    ],
    exercise: "Choisis un pays dont tu entends parler dans l'actualité récente. Cherche (mentalement ou en le notant) qui détient le pouvoir exécutif, qui détient le pouvoir législatif, et si le pouvoir judiciaire y est présenté comme indépendant ou non. Ça te donne une grille de lecture simple pour n'importe quelle actualité politique future.",
    xp: 15,
  },
  {
    id: 'histoire_1',
    theme: 'Histoire',
    title: "Pourquoi l'Histoire ne se répète pas, mais rime",
    body: [
      "Une citation souvent attribuée (à tort, mais l'idée reste juste) à Mark Twain dit que \"l'histoire ne se répète pas, mais elle rime\". Ça veut dire que les situations exactes ne reviennent jamais à l'identique — mais les mécanismes humains (peur, ambition, rareté des ressources, besoin de reconnaissance) reviennent sans cesse sous des formes différentes.",
      "Étudier l'histoire n'est donc pas apprendre des dates par cœur, mais reconnaître des schémas : comment les empires s'effondrent souvent par surextension plutôt que par attaque extérieure directe ; comment les crises économiques créent des conditions propices aux discours simplistes et autoritaires ; comment une innovation technologique déplace toujours le pouvoir de ceux qui maîtrisaient l'ancienne technologie vers ceux qui maîtrisent la nouvelle.",
      "Cette lecture par \"schémas\" plutôt que par dates rend l'histoire directement utile aujourd'hui : un entrepreneur qui comprend comment les monopoles se sont historiquement formés et effondrés comprend mieux son propre marché ; quelqu'un qui comprend comment les foules ont historiquement suivi des leaders charismatiques comprend mieux certains phénomènes politiques actuels.",
    ],
    exercise: "Pense à un événement historique que tu connais un peu (une révolution, une crise économique, la chute d'un empire ou d'une entreprise). Essaie d'en extraire UN schéma général (pas un fait précis) qui pourrait s'appliquer à une situation d'aujourd'hui — personnelle, professionnelle, ou politique.",
    xp: 15,
  },
  {
    id: 'geographie_1',
    theme: 'Géographie',
    title: 'Pourquoi la géographie explique tant de choses économiques',
    body: [
      "La géographie n'est pas qu'une question de savoir où se trouve un pays sur une carte — c'est souvent la clé pour comprendre pourquoi certaines régions du monde se sont développées économiquement plus vite que d'autres. L'accès à une côte navigable, à un fleuve, ou à des terres agricoles fertiles a historiquement donné un avantage énorme en facilitant le commerce et en réduisant les coûts de transport.",
      "Un pays enclavé (sans accès à la mer) doit systématiquement négocier le passage de ses marchandises à travers un ou plusieurs pays voisins, ce qui ajoute des coûts, des délais et une dépendance politique. C'est une des raisons structurelles (pas la seule) pour lesquelles beaucoup de pays enclavés ont un développement économique plus difficile, indépendamment de la qualité de leur gouvernance.",
      "Madagascar, par exemple, a l'avantage géographique d'être une île avec un accès maritime complet sur tout son pourtour, mais l'inconvénient d'un relief central montagneux qui rend les liaisons internes (route, rail) coûteuses à construire et à entretenir — ce qui explique en partie pourquoi les régions côtières et les régions de l'intérieur se développent parfois à des rythmes très différents.",
    ],
    exercise: "Prends une carte (mentale ou réelle) de ta région. Identifie un obstacle géographique concret (montagne, fleuve, distance à la côte) qui influence encore aujourd'hui l'activité économique locale — le prix du transport, l'accès à un marché, le type d'activité qui s'y développe naturellement.",
    xp: 15,
  },
  {
    id: 'geopolitique_1',
    theme: 'Géopolitique',
    title: "L'intérêt national : la grille de lecture qui explique presque tout",
    body: [
      "En géopolitique, la question la plus utile à se poser face à n'importe quelle décision d'un État n'est pas \"est-ce moral ?\" mais \"quel intérêt nationale ce pays défend-il par cette action ?\". Ça ne veut pas dire que la morale n'existe pas en relations internationales — mais que la plupart des décisions étatiques s'expliquent d'abord par la sécurité, l'accès aux ressources, ou l'influence, bien avant les valeurs affichées publiquement.",
      "Un exemple classique : deux pays peuvent partager les mêmes valeurs officielles et rester des rivaux stratégiques (accès à une ressource, position géographique clé, marché à conquérir), tandis que deux pays aux valeurs très différentes peuvent devenir alliés parce qu'ils font face à une menace commune. Comprendre ça évite d'être surpris par des alliances \"contre-intuitives\" dans l'actualité.",
      "Un deuxième concept clé est celui de \"sphère d'influence\" : les grandes puissances cherchent historiquement à garder une zone géographique proche où leur influence prime sur celle des rivaux — pas nécessairement par occupation directe, mais par des liens économiques, militaires ou diplomatiques privilégiés. Beaucoup de tensions internationales actuelles se comprennent mieux à travers ce prisme qu'à travers un simple \"qui a raison\".",
    ],
    exercise: "Choisis un conflit ou une tension internationale actuelle dont tu as entendu parler. Essaie de formuler, pour chaque camp principal, quel intérêt national concret (pas une valeur abstraite) est réellement en jeu selon toi.",
    xp: 15,
  },
  {
    id: 'physique_1',
    theme: 'Physique appliquée',
    title: "Le rendement : pourquoi rien n'est jamais efficace à 100%",
    body: [
      "En physique, le rendement d'un système est le rapport entre l'énergie utile qu'il produit et l'énergie totale qu'il consomme. Un moteur thermique classique a un rendement typique de 25 à 40% : le reste de l'énergie part en chaleur perdue, en frottements, en vibrations — jamais utilisée pour le mouvement recherché. Aucune machine réelle n'atteint 100%, c'est une conséquence directe du deuxième principe de la thermodynamique.",
      "Ce concept dépasse largement la mécanique : il s'applique à peu près à tout système qui transforme une ressource en résultat utile. Une réunion de travail a un \"rendement\" (temps utile / temps total passé) ; une campagne marketing a un rendement (clients acquis / budget dépensé) ; ton propre travail quotidien a un rendement (résultat produit / énergie et temps investis).",
      "Comprendre qu'un rendement de 100% est physiquement impossible aide à relâcher une pression irréaliste : l'objectif n'est jamais \"zéro perte\", mais l'amélioration continue du rapport utile/total. Un moteur qui passe de 30% à 35% de rendement représente un progrès énorme en ingénierie — la même logique s'applique à l'amélioration de tes propres process personnels ou professionnels.",
    ],
    exercise: "Choisis une activité répétitive de ta semaine (une réunion type, une tâche administrative, un trajet). Estime grossièrement son \"rendement\" actuel (résultat utile obtenu / temps ou énergie investie) et identifie UNE perte évidente que tu pourrais réduire, sans viser un perfectionnisme à 100%.",
    xp: 15,
  },
  {
    id: 'mathematiques_1',
    theme: 'Mathématiques appliquées',
    title: "Les intérêts composés : la formule que tout le monde sous-estime",
    body: [
      "L'intérêt composé, c'est le fait que les intérêts gagnés une année génèrent eux-mêmes des intérêts l'année suivante — contrairement à l'intérêt simple, qui reste toujours calculé sur le montant de départ uniquement. La formule est simple : Valeur finale = Capital initial × (1 + taux)^nombre d'années. La puissance de cette formule vient de l'exposant : elle ne grandit pas de façon linéaire, mais exponentielle.",
      "Concrètement : à un taux de 10% par an, un capital double environ tous les 7 ans (règle de calcul rapide : 72 ÷ taux en % = nombre d'années pour doubler). Ce qui semble être une petite différence de taux (8% vs 10%) produit un écart énorme sur 20 ou 30 ans, précisément parce que l'effet est exponentiel et non linéaire — notre intuition humaine est naturellement mauvaise pour estimer les croissances exponentielles.",
      "Ce même mécanisme mathématique s'applique dans l'autre sens et explique pourquoi une dette à taux élevé (carte de crédit, crédit à la consommation) peut devenir écrasante très vite : les intérêts non remboursés s'ajoutent au capital, qui génère à son tour plus d'intérêts. Comprendre cette formule change concrètement la façon d'évaluer une épargne, un investissement, ou une dette.",
    ],
    exercise: "Prends un montant simple (par exemple 100 000 Ar) et calcule à la main (ou avec une calculatrice) sa valeur après 10 ans à 5% d'intérêt composé annuel, puis à 10%. Compare l'écart entre les deux résultats — il est presque toujours plus grand que l'intuition ne le suggère.",
    xp: 15,
  },
  {
    id: 'entrepreneuriat_1',
    theme: 'Entrepreneuriat',
    title: "Le MVP : tester une idée avant de la construire en entier",
    body: [
      "Le MVP (Minimum Viable Product, \"produit minimum viable\") est la version la plus simple possible d'un produit ou service qui permet de tester une hypothèse auprès de vrais clients, sans avoir tout construit. L'idée n'est pas de faire quelque chose de médiocre, mais de faire le plus petit test possible qui donne une vraie réponse à la question \"est-ce que quelqu'un veut réellement ça ?\".",
      "L'erreur la plus fréquente chez les entrepreneurs débutants est de passer des mois (voire des années) à perfectionner un produit avant de le montrer à qui que ce soit, par peur du jugement ou par perfectionnisme. Le risque réel n'est pas de montrer un produit imparfait — c'est de découvrir après 12 mois de travail que personne n'en voulait, alors qu'un test à 2 semaines l'aurait révélé.",
      "Un MVP peut être extrêmement simple : une page web qui décrit le service et mesure combien de gens cliquent sur \"je suis intéressé\", avant même que le service existe réellement (technique dite du \"fake door test\"). Ou un service rendu manuellement par toi-même pour les 5 premiers clients, avant d'automatiser quoi que ce soit. Le but est toujours d'apprendre vite et pas cher, jamais d'impressionner.",
    ],
    exercise: "Pense à une idée de produit, service ou fonctionnalité que tu envisages depuis un moment sans l'avoir lancée. Décris en 3 phrases la version la plus simple possible qui te permettrait de savoir en une semaine si des gens en veulent vraiment, sans tout construire.",
    xp: 15,
  },
  {
    id: 'management_1',
    theme: 'Management',
    title: 'Déléguer le résultat, pas la méthode',
    body: [
      "Une erreur fréquente en management est de déléguer une tâche en expliquant en détail COMMENT la faire, étape par étape — ce qui transforme la personne en simple exécutant et l'empêche de développer son propre jugement. Une délégation efficace définit clairement le résultat attendu (le \"quoi\" et le \"pourquoi\"), et laisse la personne responsable choisir le \"comment\", dans un cadre de contraintes clair (délai, budget, qualité minimale).",
      "Ça demande de tolérer que la personne arrive au résultat par un chemin différent de celui que tu aurais choisi toi-même — et parfois un chemin moins efficace la première fois. C'est le prix à payer pour qu'elle apprenne réellement, plutôt que de simplement exécuter tes instructions sans jamais développer d'autonomie.",
      "Le concept clé ici est le \"niveau de délégation\" : il existe un spectre entre \"fais exactement ce que je te dis\" et \"fais ce que tu penses être le mieux, informe-moi après coup\". Un bon manager ajuste ce niveau selon l'expérience de la personne et l'enjeu de la tâche — déléguer trop peu frustre les personnes compétentes, déléguer trop à quelqu'un de débutant sur un enjeu critique crée un risque réel.",
    ],
    exercise: "Repense à la dernière tâche que tu as confiée à quelqu'un (ou que tu as reçue toi-même). As-tu précisé le résultat attendu clairement, ou surtout la méthode à suivre ? La prochaine fois que tu délègues quelque chose, essaie de formuler uniquement le résultat et les contraintes, sans dicter les étapes.",
    xp: 15,
  },
  {
    id: 'leadership_1',
    theme: 'Leadership',
    title: 'La confiance se construit par la cohérence, pas par le charisme',
    body: [
      "Le charisme peut donner envie de suivre quelqu'un sur le court terme, mais ce n'est pas ce qui fait qu'une équipe fait réellement confiance à un leader sur la durée. La confiance se construit par la cohérence entre ce que le leader dit et ce qu'il fait — de façon répétée, y compris (surtout) quand personne ne vérifie.",
      "Un leader qui tient une petite promesse (\"je te réponds avant vendredi\") construit plus de confiance sur le long terme qu'un leader qui fait de grandes déclarations inspirantes mais oublie ses engagements concrets. La confiance se perd d'un coup lors d'une incohérence visible, mais se construit lentement, promesse tenue après promesse tenue.",
      "Un autre pilier souvent sous-estimé : un leader qui reconnaît ses propres erreurs publiquement renforce sa crédibilité, contrairement à l'intuition qui pousse à cacher ses failles par peur de paraître faible. Une équipe qui voit son leader assumer une erreur sans se chercher d'excuses développe une confiance beaucoup plus solide qu'une équipe à qui on ne montre que des succès.",
    ],
    exercise: "Identifie une petite promesse que tu as faite récemment (à toi-même ou à quelqu'un d'autre) et vérifie honnêtement si tu l'as tenue. Si non, la meilleure action de leadership aujourd'hui n'est pas une grande décision, c'est de la rattraper ou de la reconnaître ouvertement.",
    xp: 15,
  },
  {
    id: 'comptabilite_1',
    theme: 'Comptabilité',
    title: 'Chiffre d\'affaires, marge, et bénéfice : trois chiffres qu\'on confond souvent',
    body: [
      "Le chiffre d'affaires est le montant total des ventes réalisées, avant toute déduction — c'est souvent le chiffre le plus impressionnant à annoncer, mais aussi le moins informatif sur la santé réelle d'une activité. Une entreprise peut avoir un chiffre d'affaires énorme et perdre de l'argent si ses coûts dépassent ses ventes.",
      "La marge (brute) est ce qu'il reste du chiffre d'affaires une fois le coût direct de production ou d'achat déduit (par exemple : prix de vente moins coût d'achat de la marchandise). C'est un indicateur clé pour savoir si l'activité elle-même est structurellement rentable, avant même de compter les frais fixes (loyer, salaires, marketing).",
      "Le bénéfice (résultat net) est ce qui reste réellement après TOUTES les charges déduites — coûts directs, frais fixes, impôts. C'est le seul des trois chiffres qui dit vraiment \"combien d'argent l'activité a-t-elle créé\". Beaucoup d'entrepreneurs débutants suivent leur chiffre d'affaires avec fierté sans jamais calculer leur marge réelle, et découvrent trop tard qu'ils travaillent à perte malgré des ventes en hausse.",
    ],
    exercise: "Si tu as une activité (même petite, même informelle), calcule pour ta dernière vente ou prestation les trois chiffres : chiffre d'affaires, marge brute (après coût direct), et une estimation du bénéfice réel après tes frais fixes. Le résultat te surprend-il ?",
    xp: 15,
  },
  {
    id: 'prise_de_parole_1',
    theme: 'Prise de parole',
    title: "La structure en trois parties : dis ce que tu vas dire, dis-le, dis ce que tu as dit",
    body: [
      "Une des structures les plus anciennes et les plus efficaces pour une présentation ou une intervention en réunion tient en une phrase : annonce ton plan, développe-le, puis résume ce que tu viens de dire. Ça paraît répétitif à l'oral, mais c'est exactement ce qui aide un auditoire à suivre et à retenir un message — contrairement à l'écrit, l'audience ne peut pas \"revenir en arrière\" pour relire.",
      "L'introduction ne doit pas être un résumé complet, juste une annonce claire de la structure : \"Je vais vous présenter 3 points : le problème actuel, la solution que je propose, et les prochaines étapes.\" Ça donne à l'auditoire une carte mentale pour se repérer pendant toute l'intervention, ce qui réduit énormément la charge cognitive de suivre un discours improvisé.",
      "La conclusion doit reprendre explicitement les points annoncés au début, pas en ajouter de nouveaux. Beaucoup d'interventions ratées introduisent une idée neuve dans la conclusion, ce qui laisse l'auditoire confus sur ce qu'il doit vraiment retenir. Une bonne règle : si une idée n'était pas dans ton plan initial, elle ne doit pas apparaître dans ta conclusion.",
    ],
    exercise: "Avant ta prochaine prise de parole (réunion, présentation, même informelle), écris à l'avance une seule phrase d'annonce du plan et une seule phrase de conclusion qui reprend ce plan. Utilise-les telles quelles, même si le contenu du milieu reste improvisé.",
    xp: 15,
  },
  {
    id: 'marketing_2',
    theme: 'Marketing',
    title: "Le positionnement : occuper une place précise dans l'esprit du client",
    body: [
      "Le positionnement, ce n'est pas ce que tu fais, c'est la place que ton produit occupe dans la tête du client par rapport aux alternatives. Deux produits presque identiques peuvent être positionnés très différemment : l'un \"le moins cher du marché\", l'autre \"le plus rapide\", un troisième \"fait pour les débutants\". Le positionnement précède souvent le produit lui-même dans la réflexion stratégique.",
      "Un positionnement fort implique presque toujours un sacrifice assumé. Vouloir être \"le moins cher ET le plus rapide ET le plus premium\" ne positionne rien du tout — le client ne sait plus où te ranger mentalement. Les marques qui durent choisissent un axe clair et l'assument, même si ça exclut une partie du marché.",
      "Une bonne façon de tester ton positionnement : demande à un client existant de te décrire en une phrase par rapport à un concurrent. S'il hésite ou reste vague, ton positionnement n'est probablement pas encore assez net dans son esprit — même si toi tu le trouves clair sur le papier.",
    ],
    exercise: "Nomme un concurrent direct (ou une alternative) à un de tes projets. Écris en une phrase ce qui te distingue clairement de lui — pas une qualité générique (\"meilleure qualité\"), mais un axe précis que tu es prêt à assumer même si ça en repousse certains.",
    xp: 15,
  },
  {
    id: 'negociation_2',
    theme: 'Négociation',
    title: "Le BATNA : ta meilleure alternative si la négociation échoue",
    body: [
      "Le BATNA (Best Alternative To a Negotiated Agreement, \"meilleure solution de repli\") est ce que tu feras si l'accord actuel ne se conclut pas. Connaître précisément son BATNA avant d'entrer dans une négociation change complètement le rapport de force — pas parce qu'on le brandit forcément, mais parce qu'il évite d'accepter un mauvais accord par peur de repartir les mains vides.",
      "Beaucoup de gens négocient mal simplement parce qu'ils n'ont pas clarifié leur alternative avant de s'asseoir à la table. Résultat : la pression psychologique de \"ne rien obtenir\" les pousse à accepter des conditions largement inférieures à ce qu'ils auraient dû accepter, uniquement parce qu'ils ignoraient qu'ils avaient une meilleure porte de sortie.",
      "Un bon négociateur cherche aussi activement à comprendre le BATNA de l'autre partie, pas seulement le sien. Si l'autre a une alternative faible (peu d'autres acheteurs, délai serré), ta position de force est bien plus grande que ce que la conversation laisse paraître — et inversement.",
    ],
    exercise: "Avant ta prochaine négociation (même petite), écris noir sur blanc quelle est ton alternative réelle si ça échoue. Cette clarté, à elle seule, change souvent la façon dont tu abordes la discussion — même sans jamais la mentionner à l'autre partie.",
    xp: 15,
  },
  {
    id: 'communication_2',
    theme: 'Communication',
    title: 'Messages "je" contre messages "tu" : désamorcer sans accuser',
    body: [
      "Un message qui commence par \"tu\" (\"tu es toujours en retard\", \"tu ne m'écoutes jamais\") sonne comme une accusation, même quand l'intention n'est pas hostile — et une accusation déclenche presque automatiquement une posture défensive chez l'autre, qui n'écoute plus le fond, seulement l'attaque perçue.",
      "Un message \"je\" reformule la même observation sans accuser : \"je me sens frustré quand j'attends longtemps\" plutôt que \"tu es en retard\". Ça ne change pas le fait rapporté, mais ça change complètement la réception : l'autre entend un ressenti à comprendre, pas un procès à se défendre.",
      "La structure complète, popularisée notamment par la Communication Non Violente, suit souvent 4 étapes : observation factuelle (sans jugement), sentiment ressenti, besoin sous-jacent, demande concrète. \"Quand la réunion commence sans moi (fait), je me sens mis de côté (sentiment), j'ai besoin d'être informé des changements (besoin), peux-tu me prévenir avant la prochaine fois (demande) ?\"",
    ],
    exercise: "Repense à un reproche que tu as formulé récemment en commençant par \"tu\". Réécris-le mentalement (ou par écrit) en message \"je\", avec le fait, le sentiment, et une demande concrète. Note si la formulation te semble plus difficile à dire, ou plus facile à recevoir pour l'autre.",
    xp: 15,
  },
  {
    id: 'ventes_2',
    theme: 'Ventes',
    title: 'Traiter une objection sans se braquer',
    body: [
      "Une objection (\"c'est trop cher\", \"je dois réfléchir\") n'est presque jamais un rejet final — c'est souvent un signal que le client est intéressé mais qu'un doute précis n'est pas encore levé. Un vendeur qui panique ou se braque face à une objection perd l'occasion de comprendre ce doute et d'y répondre.",
      "Une technique simple et puissante : accueillir l'objection avant d'y répondre, avec une reformulation courte (\"je comprends, le budget est une vraie question pour toi\"), puis poser une question pour préciser l'objection réelle derrière l'objection formulée. \"C'est trop cher\" peut vouloir dire \"je ne vois pas encore la valeur\", \"je n'ai pas le budget maintenant\", ou \"je compare avec une option moins chère\" — trois réponses très différentes selon le cas réel.",
      "Traiter l'objection \"trop cher\" en baissant immédiatement le prix est souvent une erreur : ça confirme au client que le prix initial n'était pas juste, et ça dévalue ta propre offre. Mieux vaut clarifier d'abord ce que l'objection recouvre réellement avant de proposer quoi que ce soit.",
    ],
    exercise: "Pense à une objection qu'on te fait souvent (dans une vente, une négociation, ou même une discussion personnelle). La prochaine fois qu'elle survient, résiste à l'envie de répondre immédiatement — pose d'abord une question pour comprendre ce qui se cache précisément derrière.",
    xp: 15,
  },
  {
    id: 'juridique_2',
    theme: 'Termes juridiques',
    title: 'Personne physique, personne morale, et responsabilité limitée',
    body: [
      "Une \"personne physique\" est un être humain au sens juridique du terme — toi, moi, n'importe quel individu. Une \"personne morale\" est une entité créée par le droit (une entreprise, une association) à qui la loi reconnaît une existence juridique propre, distincte des individus qui la composent — elle peut signer des contrats, posséder des biens, être poursuivie en justice, indépendamment de ses fondateurs.",
      "Cette distinction est la base du concept de \"responsabilité limitée\" dans certaines formes de sociétés (SARL, SA et équivalents locaux) : les dettes de l'entreprise (personne morale) restent en principe séparées du patrimoine personnel des associés (personnes physiques), sauf faute grave prouvée. C'est ce qui permet à quelqu'un de créer une entreprise sans risquer sa maison ou ses économies personnelles à chaque décision commerciale.",
      "À l'inverse, une entreprise individuelle (sans création de personne morale distincte) ne sépare pas ces deux patrimoines : l'entrepreneur individuel est juridiquement responsable des dettes de son activité sur ses biens personnels. Comprendre cette différence est souvent la première décision structurante avant même de commencer à vendre quoi que ce soit.",
    ],
    exercise: "Si tu as (ou envisages) une activité entrepreneuriale, vérifie sous quelle forme juridique elle existe ou existerait — entreprise individuelle ou société avec personnalité morale distincte. Note ce que ça implique concrètement pour ta responsabilité personnelle en cas de dette de l'activité.",
    xp: 15,
  },
  {
    id: 'politique_2',
    theme: 'Politique',
    title: 'Régime parlementaire contre régime présidentiel',
    body: [
      "Dans un régime parlementaire, le chef du gouvernement (souvent appelé premier ministre) est issu de la majorité au parlement et reste responsable devant lui — le parlement peut le renverser par une motion de censure. Le chef de l'État (roi, président) y joue souvent un rôle plus symbolique ou d'arbitre, avec moins de pouvoir exécutif direct.",
      "Dans un régime présidentiel, le président est élu directement (ou quasi-directement) par le peuple, cumule les fonctions de chef de l'État et chef du gouvernement, et n'est en général pas révocable par un simple vote du parlement — seule une procédure exceptionnelle (destitution) peut l'écarter. En contrepartie, le président ne peut généralement pas dissoudre le parlement à sa guise non plus : chaque pouvoir a un mandat fixe et indépendant.",
      "De nombreux pays adoptent des régimes \"semi-présidentiels\", mélangeant les deux logiques (un président avec de vrais pouvoirs ET un premier ministre responsable devant le parlement) — ce qui explique pourquoi certaines situations politiques (cohabitation entre un président et un parlement de bords opposés) peuvent sembler complexes de l'extérieur.",
    ],
    exercise: "Identifie le régime politique du pays où tu vis actuellement (parlementaire, présidentiel, ou semi-présidentiel). Note qui peut révoquer qui dans ce système — c'est souvent la meilleure façon de comprendre concrètement où se trouve le pouvoir réel.",
    xp: 15,
  },
  {
    id: 'histoire_2',
    theme: 'Histoire',
    title: 'Les révolutions ne naissent pas de la misère la plus extrême',
    body: [
      "Un constat historique contre-intuitif, formulé notamment par Alexis de Tocqueville à propos de la Révolution française : les grandes révolutions n'éclatent presque jamais au pic de la misère la plus totale, mais souvent après une période d'amélioration suivie d'un recul ou d'un plafonnement brutal des attentes. C'est l'écart entre ce qu'on espérait et ce qu'on obtient réellement qui déclenche la révolte, pas la souffrance en valeur absolue.",
      "Ce phénomène porte un nom en science politique : la \"courbe en J\" des révolutions — une amélioration progressive des conditions de vie qui crée des attentes croissantes, suivie d'une chute soudaine (crise économique, échec militaire, scandale) qui rend l'écart entre attente et réalité insupportable, même si la situation reste globalement meilleure qu'une génération plus tôt.",
      "Ce schéma s'observe dans de nombreux mouvements historiques : des populations qui avaient connu une hausse de leur niveau de vie ou de leurs libertés, puis un coup d'arrêt brutal, se révoltent souvent bien plus que des populations restées durablement pauvres sans jamais avoir connu d'amélioration. Ça change la façon de lire les tensions sociales actuelles : chercher l'écart d'attentes, pas seulement le niveau de pauvreté.",
    ],
    exercise: "Pense à une tension sociale ou un mouvement de contestation dont tu as entendu parler récemment. Essaie d'identifier si la population concernée avait connu une période d'amélioration récente suivie d'un recul, plutôt qu'une misère stable et continue — est-ce que ce schéma s'applique ?",
    xp: 15,
  },
  {
    id: 'geographie_2',
    theme: 'Géographie',
    title: "L'urbanisation : pourquoi les villes concentrent la richesse",
    body: [
      "Les villes concentrent systématiquement une part disproportionnée de la richesse économique par rapport à leur superficie, pour une raison géographique simple : la densité réduit les coûts de mise en relation. Trouver un client, un fournisseur, un employé qualifié, ou une information coûte beaucoup moins cher (en temps et en argent) quand tout le monde se trouve à quelques kilomètres plutôt qu'à des centaines.",
      "Ce phénomène s'appelle l'économie d'agglomération : plus une ville est grande, plus elle attire des entreprises variées, ce qui attire à son tour des travailleurs qualifiés, ce qui attire encore plus d'entreprises — un cercle qui se renforce lui-même. C'est pourquoi les grandes métropoles mondiales (New York, Londres, Tokyo) restent dominantes malgré des coûts de la vie très élevés : la proximité avec d'autres acteurs économiques compense le coût.",
      "L'envers de ce phénomène est l'exode rural et le déséquilibre territorial : les zones rurales ou les petites villes perdent leurs habitants les plus qualifiés vers les grandes villes, ce qui affaiblit encore plus leur économie locale et accélère le déséquilibre. Comprendre cette dynamique aide à lire les politiques d'aménagement du territoire de n'importe quel pays.",
    ],
    exercise: "Pense à ta propre ville ou région. Identifie un secteur d'activité qui s'y concentre particulièrement à cause de la proximité avec d'autres acteurs (fournisseurs, clients, main-d'œuvre qualifiée) — c'est une illustration directe de l'économie d'agglomération.",
    xp: 15,
  },
  {
    id: 'geopolitique_2',
    theme: 'Géopolitique',
    title: 'Le "soft power" : influencer sans contraindre',
    body: [
      "Le concept de \"soft power\", développé par le politologue Joseph Nye, désigne la capacité d'un pays à obtenir ce qu'il veut par l'attraction et la persuasion plutôt que par la force ou la coercition (\"hard power\"). Une culture attractive, un système éducatif respecté, une langue largement parlée, ou des valeurs perçues comme désirables donnent à un pays une influence qui ne passe jamais par une armée ou une sanction économique.",
      "Le soft power explique pourquoi certains petits pays ont une influence internationale disproportionnée par rapport à leur taille ou leur puissance militaire — via leur cinéma, leur musique, leur design, leur diplomatie culturelle. À l'inverse, un pays peut avoir une puissance militaire ou économique énorme et un soft power très faible si son image internationale est négative.",
      "Le soft power et le hard power ne s'opposent pas, ils se combinent souvent dans ce que Nye appelle le \"smart power\" — les puissances les plus influentes durablement savent utiliser les deux en fonction du contexte, plutôt que de miser uniquement sur la coercition ou uniquement sur la séduction culturelle.",
    ],
    exercise: "Identifie un pays dont tu apprécies certains aspects culturels (musique, cinéma, cuisine, technologie, valeurs) sans jamais y être allé. Réfléchis à comment cette perception positive pourrait influencer, même indirectement, ta vision de sa politique ou de son économie.",
    xp: 15,
  },
  {
    id: 'physique_2',
    theme: 'Physique appliquée',
    title: "L'inertie : pourquoi commencer est plus dur que continuer",
    body: [
      "En physique, l'inertie est la résistance d'un objet à changer son état de mouvement — un objet immobile a tendance à rester immobile, un objet en mouvement a tendance à rester en mouvement, tant qu'aucune force extérieure n'intervient. C'est la première loi de Newton. Concrètement, il faut beaucoup plus d'énergie pour faire démarrer un objet lourd que pour le maintenir en mouvement une fois lancé.",
      "Cette loi physique a un équivalent frappant en comportement humain : démarrer une nouvelle habitude, un projet, ou une tâche difficile demande une énergie disproportionnée par rapport à l'énergie nécessaire pour la continuer une fois lancée. C'est pour ça que \"commencer\" (ouvrir le fichier, mettre les chaussures de sport, écrire la première phrase) est souvent l'obstacle réel, bien plus que l'activité elle-même une fois en cours.",
      "Cette analogie donne une stratégie concrète : au lieu de viser \"faire 30 minutes de sport\", viser \"mettre les chaussures et sortir 2 minutes\" réduit l'énergie de démarrage nécessaire. Une fois en mouvement, l'inertie joue en ta faveur — il devient psychologiquement plus facile de continuer que de s'arrêter en plein milieu.",
    ],
    exercise: "Choisis une tâche que tu repousses depuis un moment. Définis la plus petite action de démarrage possible (pas la tâche entière) — quelque chose qui prend moins de 2 minutes — et fais uniquement ça aujourd'hui, sans te forcer à continuer au-delà si tu n'en as pas envie.",
    xp: 15,
  },
  {
    id: 'mathematiques_2',
    theme: 'Mathématiques appliquées',
    title: 'La loi de Pareto (80/20) appliquée à tes priorités',
    body: [
      "L'économiste italien Vilfredo Pareto a observé qu'en Italie, environ 80% des terres appartenaient à 20% de la population. Ce ratio approximatif (pas une loi mathématique exacte, plutôt une tendance statistique fréquente) se retrouve dans énormément de domaines : environ 80% du chiffre d'affaires d'une entreprise vient souvent de 20% de ses clients, 80% des bugs d'un logiciel viennent de 20% du code, 80% des résultats d'un effort viennent souvent de 20% des actions entreprises.",
      "L'utilité pratique de ce principe n'est pas le chiffre exact (ce n'est jamais précisément 80/20), mais l'idée que les causes et les résultats ne sont presque jamais répartis uniformément. Identifier les 20% d'actions qui produisent la majorité des résultats permet de concentrer son énergie là où elle compte vraiment, plutôt que de traiter toutes les tâches comme si elles avaient la même importance.",
      "Le piège inverse existe aussi : passer un temps disproportionné à optimiser les 80% qui ne rapportent presque rien, par perfectionnisme ou par confort (des tâches faciles mais peu importantes), au lieu d'affronter les 20% plus difficiles mais réellement déterminants pour le résultat final.",
    ],
    exercise: "Liste 5 tâches ou activités de ta semaine. Essaie d'identifier laquelle (ou lesquelles) produit une part disproportionnée de tes résultats réels — et laquelle tu pourrais réduire ou abandonner sans grande perte, même si elle te semble occuper beaucoup de ton temps.",
    xp: 15,
  },
  {
    id: 'entrepreneuriat_2',
    theme: 'Entrepreneuriat',
    title: "Le product-market fit : le moment où ça décolle vraiment",
    body: [
      "Le \"product-market fit\" est le moment où un produit répond si bien à un besoin réel du marché que la croissance devient nettement plus facile — les clients reviennent, en parlent naturellement autour d'eux, et l'acquisition ne demande plus autant d'effort forcé. Avant ce point, une startup se bat en permanence pour convaincre ; après ce point, elle se bat surtout pour suivre la demande.",
      "Un signal fréquemment cité pour détecter le product-market fit (popularisé par l'entrepreneur Sean Ellis) : si plus de 40% de tes utilisateurs actuels disent qu'ils seraient \"très déçus\" si ton produit disparaissait demain, c'est un bon indicateur que tu as touché un vrai besoin. En dessous de ce seuil, le produit répond probablement à un besoin secondaire, pas essentiel.",
      "Une erreur fréquente est de chercher à accélérer la croissance (plus de marketing, plus de budget publicitaire) AVANT d'avoir atteint le product-market fit. Ça revient à pousser plus fort sur un produit que le marché ne veut pas encore vraiment — le résultat est souvent de brûler du budget sans effet durable, alors que le vrai problème est le produit ou le ciblage, pas le volume d'efforts marketing.",
    ],
    exercise: "Si tu as des utilisateurs ou clients actuels (même peu nombreux), pose-leur directement la question : \"Si ce produit/service disparaissait demain, seriez-vous très déçu, un peu déçu, ou pas déçu ?\". Le pourcentage de \"très déçu\" te donne une vraie indication, même sur un petit échantillon.",
    xp: 15,
  },
  {
    id: 'management_2',
    theme: 'Management',
    title: 'Le feedback : critiquer le comportement, pas la personne',
    body: [
      "Un feedback efficace porte toujours sur un comportement observable et un impact concret, jamais sur un jugement de caractère. \"Tu es désorganisé\" attaque l'identité de la personne et déclenche une défense immédiate ; \"le rapport est arrivé 2 jours après la deadline, ce qui a retardé la présentation client\" décrit un fait précis que la personne peut corriger sans se sentir personnellement attaquée.",
      "Une structure simple et efficace pour donner un feedback : décrire la situation précise (quand, où), décrire le comportement observé (factuel, pas interprété), décrire l'impact que ça a eu, puis proposer ou demander un changement concret pour la suite. Ce modèle s'appelle souvent SBI (Situation-Behavior-Impact) dans la littérature managériale.",
      "Le feedback positif mérite autant de rigueur que le feedback correctif : dire vaguement \"bon travail\" apprend beaucoup moins à quelqu'un que \"la façon dont tu as anticipé la question du client sur les délais a évité un blocage en réunion\" — un feedback positif précis renforce spécifiquement le comportement à répéter, pas juste le moral général.",
    ],
    exercise: "La prochaine fois que tu dois donner un feedback (positif ou correctif) à quelqu'un, formule-le en utilisant la structure Situation → Comportement observé → Impact, sans aucun jugement sur la personnalité de la personne.",
    xp: 15,
  },
  {
    id: 'leadership_2',
    theme: 'Leadership',
    title: 'La vision : donner un sens au-delà de la tâche',
    body: [
      "Une équipe qui comprend uniquement CE qu'elle doit faire exécute des tâches. Une équipe qui comprend POURQUOI elle le fait — quel problème plus large ça résout, pour qui, avec quel impact — s'engage différemment, prend de meilleures décisions dans l'incertitude, et a besoin de beaucoup moins de supervision directe. C'est le rôle central d'un leader : porter et répéter cette vision, pas seulement distribuer des tâches.",
      "Une vision efficace n'est pas un slogan abstrait affiché sur un mur, mais une histoire concrète que chaque membre de l'équipe peut relier à son travail quotidien. \"Nous voulons être leader du marché\" ne dit rien de concret à quelqu'un qui répond au téléphone toute la journée ; \"chaque appel qu'on traite bien évite à quelqu'un de perdre confiance dans notre service\" relie directement une tâche banale à un impact réel.",
      "Un leader répète sa vision bien plus souvent qu'il ne le pense nécessaire. Ce qui semble redondant pour celui qui la porte depuis des mois est souvent la première ou deuxième fois qu'un membre de l'équipe l'entend clairement formulée. La répétition n'est pas un signe de faiblesse de communication, c'est une nécessité structurelle du rôle.",
    ],
    exercise: "Formule en 2 phrases le \"pourquoi\" d'un projet ou d'une tâche que tu diriges ou dans lequel tu es impliqué — pas ce qu'il faut faire, mais l'impact réel que ça a pour quelqu'un. Si tu diriges une équipe, partage cette formulation avec elle cette semaine.",
    xp: 15,
  },
  {
    id: 'comptabilite_2',
    theme: 'Comptabilité',
    title: 'Trésorerie contre rentabilité : pourquoi on peut faire faillite en étant rentable',
    body: [
      "La rentabilité mesure si une activité gagne plus qu'elle ne dépense sur une période donnée (le compte de résultat). La trésorerie mesure l'argent réellement disponible sur le compte bancaire à un instant T. Ces deux notions peuvent diverger fortement : une entreprise peut être rentable sur le papier tout en manquant cruellement de liquidités au quotidien.",
      "Le décalage vient souvent des délais de paiement : une vente est comptabilisée comme du chiffre d'affaires au moment de la facturation, mais l'argent n'arrive parfois sur le compte que 30, 60 ou 90 jours plus tard — pendant ce temps, il faut quand même payer les fournisseurs, les salaires, le loyer. Une entreprise en forte croissance, pourtant rentable, peut ainsi mourir de \"faillite par manque de trésorerie\", un phénomène très fréquent chez les jeunes entreprises.",
      "C'est pourquoi le suivi de trésorerie (savoir précisément combien d'argent entre et sort, et quand) est souvent plus urgent au quotidien que le suivi de rentabilité pour une petite structure — la rentabilité dit si le modèle fonctionne sur le long terme, la trésorerie dit si l'entreprise survit jusqu'à la fin du mois.",
    ],
    exercise: "Si tu gères une activité (même petite), regarde tes délais de paiement moyens : combien de temps s'écoule entre le moment où tu factures ou vends, et le moment où l'argent arrive réellement ? Cet écart est ta zone de risque de trésorerie.",
    xp: 15,
  },
  {
    id: 'prise_de_parole_2',
    theme: 'Prise de parole',
    title: 'Le silence : l\'outil le plus sous-utilisé à l\'oral',
    body: [
      "La plupart des gens ont peur du silence en public et le comblent par des mots de remplissage (\"euh\", \"donc\", \"voilà\") qui diluent leur message et trahissent leur nervosité. Un silence bref et volontaire, au contraire, capte l'attention bien plus efficacement qu'un enchaînement continu de mots — il signale que ce qui vient est important, et donne à l'auditoire le temps d'absorber ce qui vient d'être dit.",
      "Une pause de 2 à 3 secondes après une idée clé paraît interminable pour celui qui parle (à cause du trac), mais reste parfaitement naturelle pour celui qui écoute. C'est un des écarts les plus fréquents entre la perception de l'orateur et celle du public : ce qui semble être un vide gênant pour toi est souvent perçu comme de l'assurance et du contrôle par l'auditoire.",
      "Le silence sert aussi de ponctuation naturelle : une courte pause avant une phrase importante l'annonce comme telle, sans avoir besoin de dire \"et c'est important\". Les meilleurs orateurs utilisent le silence de la même façon qu'un bon musicien utilise les temps de pause dans une mélodie — pas comme une absence, mais comme un élément à part entière du discours.",
    ],
    exercise: "Lors de ta prochaine prise de parole, choisis à l'avance UN moment où tu marqueras volontairement une pause de 2-3 secondes après une phrase clé — même si ça te semble long sur le moment. Observe la réaction de l'auditoire.",
    xp: 15,
  },
];

/** Tire une leçon au hasard dans le pool. */
export function pickRandomLesson() {
  return dailyLessonsPool[Math.floor(Math.random() * dailyLessonsPool.length)];
}
