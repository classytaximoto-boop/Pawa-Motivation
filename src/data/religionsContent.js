/**
 * Contenu "Religions & croyances" affiché dans l'onglet Compétences,
 * dans la même logique que PSYCHO : des articles de vulgarisation
 * culturelle, ici centrés sur les représentations de la mort et de
 * l'au-delà dans plusieurs grandes traditions religieuses.
 *
 * Ce contenu est présenté à titre culturel et informatif : ce sont des
 * croyances propres à chaque tradition, pas des faits vérifiables ni
 * une hiérarchie entre religions. Aucune n'est présentée comme supérieure
 * aux autres.
 *
 * Chaque article a :
 *  - id, title : identification et titre affiché
 *  - intro : phrase d'accroche
 *  - points : liste de { heading, body } (un point = une étape ou un concept)
 *  - outro : phrase de clôture
 */

export const religionsDisclaimer = "Ce contenu présente des croyances religieuses à titre culturel et informatif, telles que rapportées par les traditions elles-mêmes. Il ne s'agit ni de faits vérifiables, ni d'un jugement de valeur entre religions — chaque tradition mérite le même respect.";

export const religionsArticles = [
  {
    id: 'rel1',
    title: "L'islam : rites funéraires et voyage de l'âme",
    intro: "Dans la tradition islamique, la mort n'est pas une fin mais le début d'un voyage de l'âme, en plusieurs étapes.",
    points: [
      {
        heading: 'Le rite funéraire.',
        body: "Le corps est lavé avec respect, généralement trois fois à l'eau, puis enveloppé dans un simple tissu blanc sans couture appelé le kafan. Riche ou pauvre, tout le monde y est enveloppé de la même façon. L'enterrement a lieu rapidement, souvent le jour même, le corps couché sur le côté droit tourné vers la Kaaba. Une prière spécifique, la Salat al-Janaza, est accomplie avant l'enterrement.",
      },
      {
        heading: 'Le Barzakh, l\'attente dans la tombe.',
        body: "Selon les sources islamiques, deux anges, Munkar et Nakir, interrogent le défunt sur son Seigneur, sa religion et son prophète. Cette période d'attente entre la mort et le jour du Jugement s'appelle le Barzakh.",
      },
      {
        heading: 'Le jour du Jugement dernier.',
        body: "Une trompette retentit et toute l'humanité ressuscite pour se rassembler sur une grande plaine. Chacun reçoit le livre de ses actions, en main droite pour les vertueux, en main gauche ou par-dessus l'épaule pour les autres. Les actions sont pesées sur la balance appelée Mizan.",
      },
      {
        heading: 'Le pont du Sirat.',
        body: "Après le jugement, chacun doit traverser un pont au-dessus de l'enfer, décrit comme plus fin qu'un cheveu et plus tranchant qu'une épée. Selon leurs actions, certains le traversent rapidement, d'autres marchent ou rampent.",
      },
    ],
    outro: "Ces étapes structurent la vision islamique de l'au-delà : une justice précise, où chaque action compte.",
  },
  {
    id: 'rel2',
    title: 'Le judaïsme : purification temporaire et monde à venir',
    intro: 'Le judaïsme partage certains rites funéraires avec l\'islam, mais propose une vision très différente de l\'au-delà.',
    points: [
      {
        heading: 'Le rite funéraire.',
        body: "Dans les vingt-quatre heures suivant le décès, le corps est lavé par une communauté sacrée, la Chevra Kadisha, enveloppé dans un linceul blanc simple et placé dans un cercueil en bois brut.",
      },
      {
        heading: 'La Gehenne, une purification limitée dans le temps.',
        body: "Contrairement à l'enfer éternel d'autres traditions, la Gehenne est présentée comme un lieu de purification, d'une durée maximale de douze mois. Même la personne la plus fautive finit par être purifiée et poursuit son chemin.",
      },
      {
        heading: 'Le Gan Eden, ouvert à tous les justes.',
        body: "Les âmes vertueuses rejoignent le Gan Eden, le jardin du paradis. Le judaïsme enseigne que ce lieu n'est pas réservé aux seuls juifs : les justes de toutes les nations peuvent y avoir leur place.",
      },
      {
        heading: 'L\'Olam Ha-Ba, le monde à venir.',
        body: "L'âme attend ensuite l'Olam Ha-Ba, un monde renouvelé où la souffrance et l'injustice n'existeraient plus, après la venue espérée d'un Messie rétablissant la justice.",
      },
      {
        heading: 'Des courants aux visions différentes.',
        body: "Les juifs orthodoxes attendent une résurrection physique réelle. Les juifs réformistes mettent l'accent sur l'immortalité de l'âme plutôt que sur le retour du corps. La Kabbalah, courant mystique, enseigne les Guilgoulim : l'âme se réincarnerait dans différents corps jusqu'à accomplir son but spirituel.",
      },
    ],
    outro: "Une différence marquante avec le christianisme et l'islam : dans le judaïsme, l'enfer n'est pas éternel.",
  },
  {
    id: 'rel3',
    title: 'Le christianisme : purgatoire, orthodoxie et protestantisme',
    intro: 'Le christianisme regroupe plusieurs grandes branches, avec des visions de l\'au-delà assez différentes les unes des autres.',
    points: [
      {
        heading: 'Le catholicisme et le purgatoire.',
        body: "À la mort, l'âme catholique est jugée : paradis, enfer, ou purgatoire — un lieu de purification temporaire, pas une punition, pour les âmes destinées au paradis mais pas encore totalement pures. Les vivants peuvent, par la prière, aider l'âme durant cette étape. Le purgatoire est présenté comme temporaire, jamais éternel.",
      },
      {
        heading: 'Enfer et paradis dans l\'enseignement catholique.',
        body: "L'enfer y est défini comme la séparation éternelle d'avec Dieu, pour ceux qui meurent dans le péché grave sans repentir. Le paradis est décrit comme voir Dieu directement, dans une joie totale et éternelle. À la fin des temps, le retour du Christ et le Jugement dernier précéderaient un nouveau ciel et une nouvelle terre.",
      },
      {
        heading: 'L\'orthodoxie et le voyage de quarante jours.',
        body: "Le christianisme orthodoxe enseigne qu'après la mort, l'âme entreprend un voyage d'environ quarante jours, revisitant les lieux de sa vie et faisant face à ses actes, parfois décrit comme des péages célestes. L'objectif ultime est la théosis : se rapprocher de Dieu et être transformé par sa présence. Paradis et enfer y sont vus comme deux expériences différentes d'une même présence divine, apaisante pour les uns, douloureuse pour les autres.",
      },
      {
        heading: 'Le protestantisme, une vision plus directe.',
        body: "Les protestants rejettent généralement le purgatoire, la prière pour les morts et ce voyage de quarante jours. Ils enseignent qu'après la mort, la personne va directement au paradis ou en enfer, selon sa foi en Jésus-Christ.",
      },
    ],
    outro: 'Trois branches d\'une même religion, trois visions différentes de ce qui se passe après la mort.',
  },
  {
    id: 'rel4',
    title: 'L\'hindouisme : cycle des renaissances et libération',
    intro: 'L\'hindouisme propose une vision radicalement différente : on ne reste pas éternellement au paradis ou en enfer, on revient dans ce monde.',
    points: [
      {
        heading: 'Le rite funéraire.',
        body: "Le corps est brûlé sur un bûcher funéraire, généralement allumé par le fils aîné. Les cendres sont dispersées dans une rivière sacrée, le Gange étant la plus sainte de toutes.",
      },
      {
        heading: 'L\'Atma, une âme éternelle.',
        body: "L'âme, appelée Atma, ne meurt jamais : elle passe d'un corps à un autre, un peu comme on change de vêtements, un processus déjà vécu d'innombrables fois selon cette croyance, sans que l'on s'en souvienne.",
      },
      {
        heading: 'Le karma et le jugement de Yama.',
        body: "Les messagers de Yama, dieu de la mort, conduisent l'âme devant lui pour un bilan de toute sa vie. Selon le karma accumulé, l'âme peut aller au Swarga (royaume céleste) ou au Naraka (royaume infernal) — mais ce séjour reste temporaire.",
      },
      {
        heading: 'Le Samsara, le cycle des renaissances.',
        body: "Une fois le karma de ce séjour épuisé, l'âme renaît — humain, animal, ou autre forme de vie — selon le karma accumulé au fil des vies passées. Ce cycle sans fin de naissance, mort et renaissance s'appelle le Samsara.",
      },
      {
        heading: 'Le Moksha, la libération du cycle.',
        body: "Le but ultime de l'hindouisme est de s'échapper du Samsara par le Moksha, atteint par une vie vertueuse, la méditation et la connaissance spirituelle. Les différentes traditions hindoues en donnent des interprétations variées : pour les adeptes de Vishnou, rejoindre le Vaikuntha ; pour ceux de Shiva, s'unir à lui ; pour l'Advaita Vedanta, réaliser que l'âme individuelle et l'âme universelle n'ont jamais fait qu'une.",
      },
    ],
    outro: "Une vision où la mort n'est qu'une étape parmi d'autres dans un voyage bien plus long que celui de la vie.",
  },
];
