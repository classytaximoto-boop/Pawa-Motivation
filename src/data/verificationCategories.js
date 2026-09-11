/**
 * Catégories de base pour Pawa Beloha (voir store.js — verification sur une
 * tâche Agenda). Ce ne sont que des domaines d'organisation (label + icône) —
 * AUCUN élément de vérification n'est pré-rempli ici, volontairement : chaque
 * utilisateur construit sa propre checklist à partir de zéro.
 *
 * `color` : teinte d'icône propre à chaque catégorie (UI uniquement, voir
 * PawaBelohaScreen.js / pawa-beloha.css) — reproduit les couleurs distinctes
 * par catégorie de la référence visuelle. Purement décoratif, n'affecte
 * jamais la logique de vérification.
 *
 * L'utilisateur peut aussi créer des catégories personnalisées via
 * "+ Ajouter une catégorie" — celles-ci sont stockées séparément dans
 * state.verificationCustomCategories (voir store.js), jamais ici, pour que
 * ce fichier reste une simple liste de référence statique.
 */
export const verificationBaseCategories = [
  { id: 'tournage_media', label: 'Tournage / Média', icon: 'camera', color: 'blue', hint: 'Caméra, son, matériel...' },
  { id: 'mecanique', label: 'Moto / Véhicule', icon: 'wrench', color: 'orange', hint: 'Serrage, fluides, sécurité...' },
  { id: 'enseignement', label: 'Enseignement', icon: 'graduationCap', color: 'violet', hint: 'Cours, matériel, salle...' },
  { id: 'voyage', label: 'Voyage', icon: 'plane', color: 'cyan', hint: 'Documents, bagages, etc.' },
  { id: 'maison', label: 'Maison', icon: 'home', color: 'red', hint: 'Sécurité, électricité, etc.' },
  { id: 'travail_bureau', label: 'Travail / Bureau', icon: 'briefcase', color: 'slate', hint: 'Ordinateur, documents, etc.' },
  { id: 'evenement', label: 'Événement', icon: 'calendar', color: 'indigo', hint: 'Organisation, matériel, etc.' },
];
