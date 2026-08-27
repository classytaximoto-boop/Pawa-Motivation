# BOOST — Checklist de tests et audit de finalisation (Partie 3)

Ce document couvre les sections TESTS, OPTIMISATION, ÉTATS À GÉRER et FINALE
du prompt. BOOST est une PWA 100% offline-first (localStorage), sans backend
propre à l'app — les "tests" pertinents sont donc un audit manuel du
comportement réel, complété par des tests fonctionnels exécutés sur la
logique pure du store (voir section "Ce qui a été exécuté et vérifié").

## 1. Ce qui a été exécuté et vérifié (pas seulement relu)

- **Syntaxe** : tous les fichiers `.js` du projet passent `node --check`
  sans erreur, après chaque modification.
- **Logique métier du store**, exécutée réellement dans un environnement
  Node simulé (localStorage + navigator en mémoire) :
  - Cycle onboarding complet (6 étapes → `completeOnboarding` → répercussion
    correcte sur `whyStatement`, `coachSettings`, heure du Morning Boost).
  - Toggle IA (`aiEnabled`) → bascule effective, `eraseAllData` la remet à
    `true` par défaut.
  - `getAbandonModeData()` fonctionne sans aucun appel réseau.
  - Cycle XP mission (check/uncheck symétrique, aucune fuite).
  - **Bug trouvé et corrigé** : `toggleGoalStep`, `toggleHabitToday`,
    `toggleProjectTask` et `toggleMediaConsumed` créditaient de l'XP à
    l'entrée dans l'état "terminé" mais ne le retiraient pas symétriquement
    en sortant de cet état — un décochage/recochage répété permettait de
    farmer l'XP à l'infini. Corrigé pour reproduire le pattern déjà correct
    de `toggleMission` (gain à l'entrée, retrait symétrique à la sortie).
    Revérifié par test automatisé après correction : 4 toggles consécutifs
    → solde XP net inchangé sur les 3 mécaniques ; une complétion simple
    → gain correctement crédité une seule fois.
  - `eraseAllData()` → `onboarding.completed` repasse à `false`, confirmé
    déclencher la redirection automatique vers `/onboarding` au prochain
    changement de route (voir §5).
  - `contextForCoach()` transmet bien `coachPreferences` (style, difficulté,
    objectif, valeurs, raisons, phrase) sans jamais inclure `secretNotes` —
    vérifié en listant les clés du contexte réellement produit.
  - `coachReply()` hors ligne renvoie bien le fallback local sans exception.

### Corrections apportées pendant l'audit (au-delà de la première passe)

- **`VoiceRecorder.js`** : `refreshList()` et la sauvegarde d'un enregistrement
  (`onstop`) n'avaient aucune gestion d'erreur — un échec IndexedDB (mode
  privé strict, quota dépassé) plantait silencieusement la Promise, sans
  aucun message à l'utilisateur. Ajout d'un état de chargement (`skeleton`),
  d'un état d'erreur explicite (`state-block--error`), et d'un message
  d'échec de sauvegarde visible.
- **Personnalisation du coach réellement effective** : le formulaire de
  style/difficulté/objectif ajouté dans Profil était jusque-là purement
  déclaratif — rien ne l'exploitait, ce qui aurait été trompeur pour
  l'utilisateur. `contextForCoach()` transmet maintenant ces préférences,
  et `coachReply()` les traduit en instruction de style dans le prompt
  (`coachStyleInstruction`), sans toucher au cadre de sécurité
  (`SAFETY_PREAMBLE` reste appliqué dans tous les cas, quel que soit le
  style choisi — jamais de diagnostic, toujours une action concrète).
- **Suppression de transaction sans confirmation** : `TransactionForm.js`
  supprimait une transaction en un seul clic, sans le `confirm-sheet`
  utilisé partout ailleurs pour les suppressions irréversibles. Corrigé
  pour reprendre le même pattern que le reste de l'app.
- **XP non retiré lors de la suppression d'une étape/tâche/contribution qui
  faisait franchir les 100%** : `deleteGoalStep`, `deleteProjectTask`,
  `deleteFamilyGoalStep` et `deleteFinancialGoalContribution` recalculaient
  bien la progression après suppression, mais ne retiraient jamais le bonus
  de complétion si celle-ci repassait sous 100% — contrairement aux
  `toggle*` équivalents (déjà corrigés dans la passe précédente).
  `toggleFamilyGoalStep` avait aussi le même défaut de symétrie que les
  autres toggles (non détecté lors du premier passage). Les cinq fonctions
  ont été corrigées pour retirer l'XP symétriquement, et le tout a été
  revérifié par test automatisé (gain à la complétion, retrait exact au
  retour sous 100%, sur les quatre mécaniques : objectifs, projets,
  objectifs financiers, projets familiaux).
- **Fuite XP par combinaison de deux points d'entrée vers "completed"** :
  `markGoalCompleted` et `setProjectStatus` (déclenchés manuellement par un
  bouton, indépendamment des étapes/tâches) créditaient l'XP de complétion
  sans vérifier l'état précédent réel, et ne le retiraient jamais en sortant
  de l'état complété. Combiné avec `toggleGoalStep`/`toggleProjectTask`, ça
  permettait un cycle infini (cocher l'étape → "Rouvrir" manuellement → "Marquer
  terminé" manuellement → répéter) pour farmer l'XP sans aucune limite —
  confirmé exploitable en usage normal, pas un cas exotique. Les deux
  fonctions ne créditent/retirent désormais l'XP que sur un vrai changement
  d'état (`completed !== wasCompleted`), revérifié par test combiné
  (double-appel direct + combinaison avec le toggle d'étape, retour net à 0
  dans les deux cas).
- **Farming XP trivial sans aucune friction, sur six mécaniques distinctes** :
  contrairement aux cas ci-dessus (qui nécessitaient de repasser par un état
  "100%"), `deleteEmotionEntry`, `deleteLeadershipScore`, `deleteTransaction`,
  `deleteJournalEntry`, `deleteMediaItem`, `deleteDailyReview` et
  `deleteWeeklyReview` ne retiraient jamais le bonus crédité à la création —
  un simple cycle créer→supprimer suffisait à gagner de l'XP indéfiniment,
  confirmé par test (+25 XP en 5 cycles sur les check-ins émotionnels, avant
  correction). Corrigé sur les sept fonctions ; `updateProblem` avait le même
  défaut que `markGoalCompleted` (résoudre → rouvrir → résoudre en boucle) et
  a été corrigé de la même façon. `deleteDailyReview`/`deleteWeeklyReview` ne
  sont pas exposées dans l'UI aujourd'hui (aucun écran n'a de bouton
  "supprimer un rapport") — corrigées quand même pour éviter une fuite
  silencieuse si un tel écran est ajouté plus tard. `deleteProblem` et
  `deleteHabit` ont été vérifiées comme correctes en l'état : la première ne
  crédite jamais d'XP à la création, la seconde conserve volontairement
  l'historique XP des complétions passées (comportement voulu, pas un bug).
  Trois suppressions sans confirmation ont aussi été corrigées dans
  `Mind.js` (check-in émotionnel, problème, évaluation leadership) pour
  rester cohérentes avec le `confirm-sheet` utilisé partout ailleurs.
- **Bandeau IA incohérent** : `DifficultExperiencesAnalysis.js` ne
  distinguait pas "IA désactivée" de "IA non configurée" ni de "hors ligne",
  contrairement à `Coach.js` (déjà corrigé). Aligné sur le même pattern.

Ce que je n'ai **pas** pu exécuter dans cet environnement (pas de
navigateur, pas de réseau) : rendu DOM réel, WebAuthn/biométrie, captation
micro/caméra, notifications système, installation PWA, `npm run build`
(le registre npm est inaccessible ici). Ces points restent à valider sur un
appareil réel avant mise en production — voir cases à cocher ci-dessous.

## 2. Tests fonctionnels (à valider sur appareil réel)

### Objectifs / Missions / XP / Niveaux
- [ ] Créer, modifier, supprimer un objectif
- [ ] Ajouter/cocher/décocher des étapes ; vérifier que la progression suit
- [ ] Décocher puis recocher plusieurs fois une étape terminée → l'XP ne
      doit **pas** augmenter à chaque cycle (corrigé, à reconfirmer en UI)
- [ ] Cocher/décocher une mission du jour → XP crédité/retiré symétriquement
- [ ] Vérifier le changement de niveau (`levelName`) au passage d'un palier

### Rapports
- [ ] Rapport quotidien manuel (victoire/problème/appris/demain) se sauvegarde
- [ ] Bouton "Générer l'analyse IA" (jour et semaine) fonctionne en ligne
- [ ] Même bouton, hors ligne → bascule sur le rapport local, aucun blocage
- [ ] Rapport hebdomadaire affiche bien le disclaimer "pas un diagnostic"

### Émotions / Journal
- [ ] Check-in émotionnel (humeur/motivation/énergie/stress) crédite l'XP
- [ ] Entrée de journal créée, modifiée, supprimée
- [ ] Analyse d'expériences difficiles ne pose jamais de diagnostic

### Projets / Money / Family / Secret
- [ ] Projets : tâches cochées/décochées, progression, complétion → XP
- [ ] Money : transaction créée/modifiée/supprimée, objectif financier avec
      apports
- [ ] Family : membre, dates importantes, projet familial avec étapes
- [ ] Secret : verrouillage PIN, contenu jamais visible sans déverrouillage,
      **jamais transmis à l'IA** (vérifié dans le code : `aiContext.js` ne
      référence `secretNotes` sous aucune forme)

### PIN / Biométrie
- [ ] Création du PIN, hash stocké (jamais le PIN en clair — vérifié dans
      `securityService.js`, PBKDF2/SHA-256 via SubtleCrypto)
- [ ] Verrouillage automatique après inactivité dans Secret
- [ ] Biométrie (WebAuthn) si le device la supporte ; dégradation propre
      vers PIN seul si absente

### Audio / Vidéo / Enregistrement vocal
- [ ] Enregistrement vocal (message personnel), lecture, suppression
- [ ] Média audio/vidéo ajouté, marqué consommé/favori
- [ ] Marquer consommé/non-consommé plusieurs fois → XP ne doit pas
      s'accumuler indéfiniment (corrigé, à reconfirmer en UI)

### Notifications
- [ ] Autorisation demandée, état reflété dans Profil
- [ ] Chaque type de rappel togglable, horaire modifiable
- [ ] Rappels ne sonnent que si l'app est ouverte (limite assumée, sans
      serveur de push — expliqué à l'utilisateur dans Profil)

### Offline / réseau / IA
- [ ] Couper le réseau → bannière "Hors connexion" apparaît en haut de l'app
- [ ] Toutes les fonctions locales restent utilisables hors ligne
- [ ] Appel IA hors ligne → fallback local immédiat, jamais de blocage UI
- [ ] Désactiver l'IA dans Profil → tous les écrans IA (coach, rapports)
      basculent sur le mode local, même en ligne
- [ ] Backend IA indisponible (erreur HTTP) → message standard, données
      utilisateur toujours accessibles

### Sauvegarde / suppression
- [ ] Export .json télécharge un fichier lisible
- [ ] Import restaure correctement après confirmation explicite
- [ ] Import d'un fichier invalide → message d'erreur clair, rien n'est
      modifié
- [ ] Suppression totale → confirmation par saisie de "SUPPRIMER", PIN
      Secret également réinitialisé, onboarding se redéclenche

## 3. États d'écran

Le système `.state-block` / `.state-block--error` / `.skeleton` existe déjà
et est utilisé sur les listes principales (Objectifs, Projets, Habitudes,
Notes, Secret, Media, Money, Family, Rapports). Ajouté dans cette partie :

- **Aucune connexion** : nouvelle bannière globale (`OfflineBanner`,
  sticky en haut de l'app, écoute `online`/`offline`) — visible sur tous
  les écrans sans dupliquer la logique par écran.
- **IA désactivée** vs **IA non configurée** vs **hors ligne** : messages
  désormais distincts dans Coach ; dans les rapports IA, le libellé
  "(mode local)" couvre uniformément les trois causes (volontaire — la
  cause exacte est secondaire, ce qui compte pour l'utilisateur est que le
  résultat reste fiable et local).
- **Données supprimées** : après `eraseAllData`, l'app revient
  automatiquement à `/onboarding` plutôt que de laisser un écran d'accueil
  incohérent avec un état "neuf".

## 4. Sécurité et confidentialité — statut

- [x] Secret jamais envoyé à l'IA — garanti structurellement : `aiContext.js`
      est le seul point de sélection de données vers l'IA et ne référence
      `secretNotes` nulle part, sous aucune forme.
- [x] Aucune clé API dans le code client — `aiProviders.js` n'appelle qu'un
      backend proxy (`AI_BACKEND_URL`), jamais l'API IA directement.
- [x] Données sensibles protégées — Secret chiffré, clé dérivée du PIN,
      PIN jamais stocké en clair.
- [x] Suppression totale des données — `eraseAllData()` + reset du PIN/
      biométrie via `SecurityService.resetAll()`.
- [x] Export des données — `downloadBackup()`.
- [x] Désactivation de l'IA — nouveau toggle `aiEnabled` (Profil →
      Intelligence artificielle), respecté par `aiService.js` avant tout
      appel réseau.

### Point identifié, non corrigé — nécessite un arbitrage produit

- **Pas de limitation de tentatives sur le PIN Secret** (`SecurityService`/
  `SecretLock.js`) : aucun délai croissant ni blocage temporaire après
  plusieurs échecs. Le PBKDF2 à 150 000 itérations ralentit déjà chaque
  tentative de façon notable, ce qui limite le bruteforce depuis l'UI, mais
  un vrai lockout progressif ajouterait une couche de protection réelle.
  Je ne l'ai pas implémenté unilatéralement car ça touche à un compromis
  UX/sécurité (risque de bloquer l'utilisateur légitime après une série
  d'erreurs de frappe) qui mérite un arbitrage explicite plutôt qu'une
  décision prise à la volée pendant un audit.

## 5. Finalisation — statut

- [x] Onboarding (6 étapes conformes au prompt) — nouvel écran
      `Onboarding.js`, forcé au premier lancement et après suppression des
      données via un garde générique au niveau du router
      (`router.setBeforeResolve`), sans dupliquer la logique par route.
- [x] Profil — existant, complété (IA + personnalisation coach).
- [x] Paramètres / confidentialité — notifications, sauvegarde, IA, zone
      dangereuse, tout regroupé dans Profil.
- [x] Export / import — existant, inchangé.
- [x] Suppression du compte/données — existant, inchangé.
- [x] Aide / informations sur l'application — nouvel écran `Help.js`
      (`/aide`), FAQ + résumé confidentialité, accessible depuis Profil.

## 6. Cohérence de bout en bout — vérifié dans le code

```
OBJECTIFS → MISSIONS → ACTIONS → XP → PROGRESSION → ÉMOTIONS → JOURNAL
→ ANALYSE → COACH → NOUVELLES ACTIONS
```

Chaque maillon a été retrouvé et confirmé dans `store.js` :
- Objectifs, missions, projets, habitudes, journal, émotions, leadership,
  rapports quotidiens/hebdo, finances et famille créditent tous l'XP via un
  unique point d'entrée (`addXp`), jamais dupliqué.
- `getDailySnapshot` / `getWeeklySnapshot` agrègent missions, émotions,
  objectifs et projets pour nourrir les rapports.
- `aiContext.js` construit le contexte du coach et des rapports IA à partir
  de ces mêmes données réelles (objectifs actifs, projets, habitudes,
  émotions récentes, journal, problèmes ouverts, leadership) — jamais Secret.
- Le coach et Boost Me pointent vers de vraies missions/étapes existantes
  (`getBoostSuggestion`, `contextForCoach`), pas du texte déconnecté.
- L'app reste fonctionnelle sans IA et sans Internet pour toutes les
  fonctions locales — vérifié fonctionnellement pour le store, à
  reconfirmer en conditions réelles sur appareil (§2).

## 7. Optimisation — limites de l'audit possible ici

Sans navigateur ni appareil réel, seuls les points suivants ont pu être
vérifiés depuis le code :
- Pas de dépendance réseau dans le stockage local (`voiceStorage.js`,
  `mediaStorage.js`) — confirmé, aucun `fetch`/URL distante.
- Architecture single-file par écran, pas de lazy-loading actuellement —
  taille du bundle et temps de démarrage à mesurer avec `npm run build` +
  `vite preview` sur un poste avec accès réseau (non disponible ici).
- Accessibilité : labels `aria-label` présents sur les boutons d'icônes
  principaux (nav, back, toggle notifications) ; à auditer plus largement
  avec un lecteur d'écran réel.
- Responsive : layout construit en unités `--sp-*`/flex, pensé mobile
  d'abord ; à valider sur plusieurs tailles d'écran réelles.

Ces points nécessitent un environnement avec navigateur/réseau pour être
mesurés sérieusement plutôt qu'estimés — je préfère le signaler explicitement
plutôt que de prétendre les avoir vérifiés.
