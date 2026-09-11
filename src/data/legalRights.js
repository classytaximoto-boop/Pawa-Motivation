// Module Droits & Loi (Madagascar) — présenté sous forme de dialogues simulés
// ("Pawa mode avocat" face à un représentant de l'État) plutôt que de texte
// de loi brut, pour être concret et mémorisable. Les articles sont cités
// naturellement dans les répliques, pas listés à part.
//
// AVERTISSEMENT NON NÉGOCIABLE : ce contenu est un repère général d'éducation
// civique, PAS un avis juridique, et les dialogues sont des scénarios
// pédagogiques simplifiés, pas un scénario garanti dans la réalité. Les lois
// évoluent, les situations réelles varient selon le contexte, et seul un
// avocat inscrit au barreau de Madagascar peut conseiller sur un cas précis.
// En vrai, rester poli et calme reste la meilleure stratégie dans TOUS les cas
// — ces dialogues montrent le fond (ce que dit la loi), pas un ton à copier
// mot pour mot face à un agent réel.
//
// Sources consultées (à re-vérifier périodiquement, la loi peut changer) :
// - Code de procédure pénale malgache (droit-afrique.com, textes.lexxika.com,
//   unodc.org, assemblee-nationale.mg — Loi n°2016-017)
// - Code pénal malgache (Loi n°2004-51 du 28 janvier 2005 et mises à jour)

/**
 * Chaque scénario est un dialogue en tours (turns), alterné agent/pawa.
 * type: 'agent' | 'pawa'
 * article: référence citée dans cette réplique (optionnel, affichée en badge)
 */
export const legalScenarios = [
  {
    id: 'controle-identite',
    title: "Contrôle / interpellation dans la rue",
    intro: "Un agent t'arrête dans la rue et veut t'interroger.",
    turns: [
      { type: 'agent', text: "Papiers ! Suivez-moi au poste, on a des questions pour vous." },
      { type: 'pawa', text: "Bien sûr. Avant ça, puis-je connaître votre nom et votre fonction ?", article: null },
      { type: 'agent', text: "Peu importe qui je suis, avancez." },
      { type: 'pawa', text: "Les officiers de police judiciaire qui ne sont pas en uniforme doivent décliner leur qualité et montrer leur carte s'ils en sont requis, avant tout interrogatoire — c'est dans le Code de procédure pénale. Je vous suis, calmement, je ne résiste pas.", article: 'CPP — devoir d\'identification de l\'OPJ' },
      { type: 'agent', text: "Vous êtes soupçonné d'un délit. On vous emmène." },
      { type: 'pawa', text: "D'accord. Je veux juste que ce soit clair pour la suite : je n'ai pas plus de 48 heures de garde à vue possibles pour une enquête préliminaire, et j'ai le droit de choisir un défenseur dès ma première audition.", article: 'CPP art. 136 et art. 53' },
    ],
    keyTakeaway: "Tu ne résistes jamais physiquement — tu coopères, mais tu poses les bonnes questions calmement. Rester factuel protège plus que le silence buté ou la confrontation.",
  },
  {
    id: 'garde-a-vue-debut',
    title: "Début de garde à vue — le droit à un défenseur",
    intro: "Tu es amené au poste pour une première audition.",
    turns: [
      { type: 'agent', text: "On va commencer l'audition, asseyez-vous." },
      { type: 'pawa', text: "Avant de commencer, est-ce que vous m'informez de mon droit de choisir un défenseur ? C'est une obligation légale dès la première audition pour un crime ou un délit.", article: 'CPP art. 53' },
      { type: 'agent', text: "On verra ça plus tard, répondez d'abord aux questions." },
      { type: 'pawa', text: "Cette formalité doit être mentionnée sur le procès-verbal, sinon la procédure peut être nulle. Je préfère qu'on la fasse maintenant, dans l'ordre — ce n'est pas contre vous, c'est pour que tout soit valable des deux côtés.", article: 'CPP art. 53, sous peine de nullité' },
      { type: 'agent', text: "Très bien. Vous avez le droit de choisir un avocat, un agent d'affaires, ou toute personne de votre choix." },
      { type: 'pawa', text: "Merci. Je fais valoir ce droit maintenant, avant de répondre sur le fond." },
    ],
    keyTakeaway: "Ce droit doit t'être annoncé par l'agent lui-même. S'il ne le fait pas spontanément, tu peux le demander — poliment, mais fermement, en citant que c'est une formalité obligatoire.",
  },
  {
    id: 'perquisition',
    title: "Perquisition à ton domicile",
    intro: "Des agents se présentent chez toi pour fouiller.",
    turns: [
      { type: 'agent', text: "On va perquisitionner votre domicile, ouvrez." },
      { type: 'pawa', text: "Vous avez mon accord express pour entrer — je précise que je le donne librement, ça doit être écrit ou attesté par deux témoins.", article: 'CPP art. 135' },
      { type: 'agent', text: "Restez dans le salon pendant qu'on fouille." },
      { type: 'pawa', text: "En principe, je peux assister à la perquisition qui se déroule chez moi. Je préfère rester présent, si c'est possible.", article: 'CPP art. 57 (présence de l\'occupant)' },
      { type: 'agent', text: "Il est 22h, on continue quand même." },
      { type: 'pawa', text: "Une perquisition commencée avant 21h peut effectivement se poursuivre après — donc pas de souci de ce côté-là, je note juste l'heure de début pour mes archives.", article: 'CPP art. 59 — horaires' },
    ],
    keyTakeaway: "Ton assentiment compte — donne-le clairement, mais sache aussi qu'il doit être demandé, pas juste présumé. Rester présent et noter les horaires/noms est ta meilleure protection, pas la confrontation.",
  },
  {
    id: 'legitime-defense-recit',
    title: "Après un incident — expliquer une légitime défense",
    intro: "Tu dois expliquer à un enquêteur pourquoi tu as réagi physiquement à une agression.",
    turns: [
      { type: 'agent', text: "Vous avez frappé cette personne. Expliquez-vous." },
      { type: 'pawa', text: "Cette personne m'a agressé en premier, physiquement, et j'ai réagi pour me protéger — pas pour l'attaquer.", article: null },
      { type: 'agent', text: "Ça ne suffit pas comme excuse." },
      { type: 'pawa', text: "Ce n'est pas une excuse, c'est la légitime défense — le Code pénal dit qu'il n'y a ni crime ni délit quand les coups sont commandés par la nécessité actuelle de se défendre soi-même ou autrui.", article: 'CP art. 328' },
      { type: 'agent', text: "Vous auriez pu partir plutôt que répondre." },
      { type: 'pawa', text: "Si j'avais eu ce choix réel au moment des faits, oui — c'est justement ça que la loi regarde : est-ce que ma réponse était nécessaire, et proportionnée au danger. Je suis prêt à expliquer précisément le déroulement.", article: 'CP art. 329 — nécessité et proportionnalité' },
    ],
    keyTakeaway: "La légitime défense protège une réaction à une agression réelle et immédiate — pas une revanche, pas une provocation que tu as toi-même cherchée. Explique les faits précisément, ne les enjolive pas : c'est ce qui te protège devant la justice.",
  },
];

/**
 * "Did you know" — faits courts et marquants, format qui se lit en 10 secondes.
 * Mélange de droit malgache et de contexte utile pour comprendre pourquoi
 * ces règles existent.
 */
export const didYouKnowFacts = [
  {
    fact: "En garde à vue, un officier de police judiciaire ne peut te retenir plus de 48 heures pour une enquête préliminaire — au-delà, c'est à un magistrat de décider.",
    article: 'CPP art. 136',
  },
  {
    fact: "Dès ta première audition pour un crime ou un délit, l'agent doit t'informer de ton droit à un défenseur — s'il ne le fait pas et ne le note pas au procès-verbal, la procédure peut être annulée.",
    article: 'CPP art. 53',
  },
  {
    fact: "Un défenseur de ton choix (pas un avocat commis d'office) travaille normalement à titre bénévole selon le Code — donc le coût ne devrait pas être une raison de renoncer à ce droit.",
    article: 'CPP art. 53',
  },
  {
    fact: "Une perquisition chez toi nécessite ton accord exprès — donné par écrit de ta main, ou attesté par deux officiers ou deux témoins.",
    article: 'CPP art. 135',
  },
  {
    fact: "Tu as normalement le droit d'assister à une perquisition qui se déroule à ton propre domicile.",
    article: 'CPP art. 57',
  },
  {
    fact: "Une perquisition commencée avant 21h peut légalement continuer après cette heure — ce n'est pas automatiquement une irrégularité.",
    article: 'CPP art. 59',
  },
  {
    fact: "La légitime défense n'efface pas une infraction qui a servi de vengeance après coup — elle protège seulement une réponse nécessaire à un danger réel et immédiat.",
    article: 'CP art. 328-329',
  },
  {
    fact: "Un agent en civil (pas en uniforme) doit décliner sa qualité et, si on le lui demande, montrer sa carte, avant tout interrogatoire ou perquisition.",
    article: 'CPP — devoir d\'identification de l\'OPJ',
  },
  {
    fact: "L'officier doit mentionner par écrit l'heure exacte de début et de fin de ta garde à vue, ainsi que l'itinéraire parcouru — ce document est ta meilleure preuve en cas d'abus.",
    article: 'CPP art. 139',
  },
  {
    fact: "Le Code de procédure pénale malgache de base date de 1962, mais il a été modifié plusieurs fois depuis (dernière grande réforme en 2016) — les règles évoluent, d'où l'intérêt de toujours vérifier avec un avocat pour un cas réel.",
    article: null,
  },
];

export const legalDisclaimer =
  "Ces dialogues et faits sont un repère pédagogique basé sur le Code de procédure pénale et le Code pénal malgaches — ce ne sont pas des scripts garantis ni un avis juridique. Pour toute situation réelle, contacte un avocat inscrit au barreau de Madagascar. Dans la vraie vie, reste toujours calme et coopératif avec un agent, quoi qu'il arrive — la fermeté se joue dans les mots et le suivi, jamais dans la confrontation physique.";
