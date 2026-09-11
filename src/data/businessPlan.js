// Business Plan — structure à remplir + suivi de jalons (atteint / à atteindre).
// Même logique que Goals/Projects : un plan = des sections texte + des
// jalons (milestones) trackés avec statut, pour visualiser où on en est.

export const businessPlanSections = [
  { id: 'idee', label: "Idée / concept", placeholder: "En une ou deux phrases, quel problème ton business résout-il ?" },
  { id: 'cible', label: 'Client cible', placeholder: 'Qui a ce problème précisément ? Où le trouves-tu ?' },
  { id: 'offre', label: 'Offre / produit', placeholder: 'Que vends-tu concrètement ? Comment ça fonctionne ?' },
  { id: 'valeur', label: 'Valeur unique', placeholder: 'Pourquoi toi et pas un concurrent ?' },
  { id: 'revenus', label: 'Modèle de revenus', placeholder: 'Comment gagnes-tu de l’argent ? Prix, fréquence, volume ?' },
  { id: 'couts', label: 'Coûts principaux', placeholder: 'Quelles sont tes charges fixes et variables ?' },
  { id: 'ressources', label: 'Ressources nécessaires', placeholder: 'Compétences, matériel, argent, réseau — qu\'est-ce qu\'il te manque encore ?' },
  { id: 'risques', label: 'Risques identifiés', placeholder: 'Qu\'est-ce qui pourrait faire échouer ce plan ? Comment tu t\'en protèges ?' },
];

export const milestoneStatuses = [
  { id: 'a_atteindre', label: 'À atteindre', color: '--steel-400' },
  { id: 'en_cours', label: 'En cours', color: '--warning-500' },
  { id: 'atteint', label: 'Atteint', color: '--success-500' },
];

export const milestoneStatusMap = Object.fromEntries(milestoneStatuses.map((s) => [s.id, s]));
