/**
 * Contenus de compétences suggérées à apprendre, affichés dans l'onglet
 * "Compétences" de Développement. Organisé par domaine, avec pour chaque
 * compétence : une courte description et des ressources/pistes concrètes
 * pour démarrer (sans dépendance réseau — juste des pistes texte).
 */

export const learningDomains = [
  {
    id: 'dev',
    label: 'Développement / Tech',
    icon: '💻',
    skills: [
      {
        name: 'JavaScript moderne (ES6+)',
        desc: 'Arrow functions, destructuring, async/await, modules — la base de tout ce que tu fais déjà sur tes apps.',
        pistes: ['Pratiquer sur tes propres projets (SMAX, laoka, BOOST)', 'Refactoriser une ancienne fonction avec la syntaxe moderne', 'Comprendre les Promises en profondeur'],
      },
      {
        name: 'Git & GitHub avancé',
        desc: 'Branches, rebase, résolution de conflits, GitHub Actions CI.',
        pistes: ['Créer une branche de test avant chaque grosse feature', 'Écrire un workflow CI simple', 'Apprendre `git rebase -i` pour nettoyer l\'historique'],
      },
      {
        name: 'PWA & Service Workers',
        desc: 'Cache offline, installabilité, notifications — le cœur de tes apps type BOOST.',
        pistes: ['Étudier le cycle de vie d\'un service worker', 'Mettre en cache intelligemment (network-first vs cache-first)', 'Tester le mode offline réel sur mobile'],
      },
      {
        name: 'Capacitor / build Android',
        desc: 'Packager une PWA en app Android native, gérer permissions et plugins.',
        pistes: ['Maîtriser les permissions runtime Android', 'Comprendre le cycle WebView', 'Automatiser le build avec CI'],
      },
      {
        name: 'Architecture d\'app (state management)',
        desc: 'Comment structurer un store, séparer données/UI, éviter le spaghetti code.',
        pistes: ['Étudier le pattern observer', 'Séparer clairement store.js / screens / components', 'Documenter le flux de données'],
      },
      {
        name: 'Design d\'interface (UI/UX)',
        desc: 'Rendre une app agréable à utiliser, pas juste fonctionnelle.',
        pistes: ['Étudier les principes de hiérarchie visuelle', 'Tester ton app avec quelqu\'un qui ne l\'a jamais vue', 'Simplifier avant d\'ajouter'],
      },
    ],
  },
  {
    id: 'business',
    label: 'Entrepreneuriat',
    icon: '📈',
    skills: [
      {
        name: 'Business Model Canvas',
        desc: 'Structurer une idée business en un seul schéma clair.',
        pistes: ['Remplir un canvas pour un de tes projets actuels', 'Identifier ta proposition de valeur en une phrase', 'Lister tes canaux de distribution réels'],
      },
      {
        name: 'Négociation',
        desc: 'Savoir défendre un prix, un délai, une position sans perdre la relation.',
        pistes: ['Préparer un objectif haut/bas avant chaque négociation', 'S\'entraîner à dire non calmement', 'Écouter avant de contrer'],
      },
      {
        name: 'Gestion financière de base',
        desc: 'Comprendre marge, trésorerie, seuil de rentabilité.',
        pistes: ['Calculer le seuil de rentabilité d\'un petit projet', 'Séparer dépenses fixes / variables', 'Suivre un budget simple sur un mois'],
      },
      {
        name: 'Pitch / prise de parole',
        desc: 'Présenter une idée en 60 secondes de façon claire et convaincante.',
        pistes: ['Écrire un pitch de 3 phrases', 'Le dire à voix haute 5 fois', 'Le tester sur un proche et ajuster'],
      },
    ],
  },
  {
    id: 'communication',
    label: 'Communication & Relationnel',
    icon: '🗣️',
    skills: [
      {
        name: 'Communication non-violente (CNV)',
        desc: 'Exprimer un besoin ou un désaccord sans attaquer l\'autre.',
        pistes: ['Reformuler une critique en "je ressens... quand... j\'aimerais..."', 'Observer sans juger avant de réagir', 'Pratiquer sur une situation réelle récente'],
      },
      {
        name: 'Écoute active',
        desc: 'Vraiment entendre l\'autre avant de répondre.',
        pistes: ['Reformuler ce que dit l\'autre avant de donner ton avis', 'Poser une question avant de conclure', 'Observer tes propres coupures de parole'],
      },
      {
        name: 'Gestion des conflits',
        desc: 'Désamorcer une tension sans fuir ni exploser.',
        pistes: ['Identifier ton déclencheur émotionnel principal', 'Pratiquer la pause de 5 secondes avant de répondre', 'Séparer le fait de l\'interprétation'],
      },
      {
        name: 'Confiance en soi / posture',
        desc: 'Langage corporel, ton de voix, présence — la base du charisme.',
        pistes: ['Travailler la posture debout (épaules, regard)', 'Ralentir son débit de parole', 'S\'enregistrer en train de parler et s\'écouter'],
      },
    ],
  },
  {
    id: 'personnel',
    label: 'Développement personnel',
    icon: '🌱',
    skills: [
      {
        name: 'Discipline / habitudes',
        desc: 'Construire une routine qui tient dans le temps.',
        pistes: ['Choisir une seule habitude à la fois', 'Lier la nouvelle habitude à une existante', 'Suivre sa régularité, pas sa perfection'],
      },
      {
        name: 'Gestion du temps',
        desc: 'Prioriser ce qui compte vraiment.',
        pistes: ['Lister 3 priorités max par jour', 'Bloquer des créneaux dédiés sans notifications', 'Revoir sa semaine chaque dimanche'],
      },
      {
        name: 'Gestion du stress',
        desc: 'Rester stable sous pression.',
        pistes: ['Pratiquer une respiration lente 2 min par jour', 'Identifier les signaux physiques de stress', 'Préparer une phrase-ancrage pour les moments tendus'],
      },
      {
        name: 'Apprentissage autonome',
        desc: 'Apprendre efficacement par soi-même, sans prof.',
        pistes: ['Se fixer un petit projet pratique par nouvelle compétence', 'Enseigner ce qu\'on apprend à quelqu\'un d\'autre', 'Revenir sur ses notes après 24h puis après une semaine'],
      },
    ],
  },
  {
    id: 'langues',
    label: 'Langues',
    icon: '🌍',
    skills: [
      {
        name: 'Français soutenu',
        desc: 'Enrichir son vocabulaire pour convaincre à l\'oral et à l\'écrit.',
        pistes: ['Lire 10 minutes par jour un texte varié', 'Noter 3 mots nouveaux par semaine et les réutiliser', 'Reformuler ses messages avant envoi'],
      },
      {
        name: 'Anglais technique',
        desc: 'Lire la doc, comprendre les erreurs, suivre les tutoriels internationaux.',
        pistes: ['Lire la documentation officielle en anglais plutôt qu\'une traduction', 'Suivre un projet open source en anglais', 'Pratiquer 15 min/jour avec une appli de langue'],
      },
      {
        name: 'Malagasy (registre soutenu)',
        desc: 'Enrichir le vocabulaire malgache pour les apps et la communication formelle.',
        pistes: ['Lister le vocabulaire spécifique à chaque projet (laoka, culture)', 'Comparer les registres courant/soutenu', 'Demander une relecture à un locuteur natif'],
      },
    ],
  },
];
