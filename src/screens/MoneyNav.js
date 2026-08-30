import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

// Source unique de vérité pour la navigation du module Money : ordre des
// sections, icône, libellé, route. Utilisé par MoneyNav (nav horizontale) et
// par tout écran qui a besoin de connaître les sections Money (ex: un futur
// menu "Plus"). Ajouter une section ici suffit à la faire apparaître partout
// avec le même style — jamais de nav dupliquée à la main dans un écran.
//
// IMPORTANT : chaque entrée doit correspondre à une route réellement
// enregistrée dans main.js. Phase 3 : Investissements, Statistiques, Liste
// d'achats et Garanties ont désormais leur propre écran + route et rejoignent
// la nav ci-dessous. Import/Export dédié reste prévu pour une phase
// ultérieure et n'est volontairement pas listé ici tant que son écran +
// route n'existent pas — l'ajouter sans route donnerait un onglet qui semble
// fonctionner mais ne mène nulle part.
export const MONEY_SECTIONS = [
  { id: 'apercu', label: 'Aperçu', icon: 'home', path: '/money' },
  { id: 'comptes', label: 'Comptes', icon: 'bank', path: '/money/comptes' },
  { id: 'transactions', label: 'Transactions', icon: 'transfer', path: '/money/transactions' },
  { id: 'categories', label: 'Catégories', icon: 'sliders', path: '/money/categories' },
  { id: 'budgets', label: 'Budgets', icon: 'piggyBank', path: '/money/budgets' },
  { id: 'objectifs', label: 'Objectifs', icon: 'target', path: '/money/objectifs' },
  { id: 'dettes', label: 'Dettes', icon: 'handshakeOut', path: '/money/dettes' },
  { id: 'planifies', label: 'Planifiés', icon: 'calendar', path: '/money/paiements-planifies' },
  { id: 'investissements', label: 'Investissements', icon: 'briefcase', path: '/money/investissements' },
  { id: 'statistiques', label: 'Statistiques', icon: 'chart', path: '/money/statistiques' },
  { id: 'achats', label: 'Achats', icon: 'cart', path: '/money/achats' },
  { id: 'garanties', label: 'Garanties', icon: 'shield', path: '/money/garanties' },
  { id: 'parametres', label: 'Paramètres', icon: 'sliders', path: '/money/parametres' },
];

/**
 * Détermine la section active à partir d'un chemin de route (ex:
 * "/money/comptes" ou "/money/objectifs/xyz"). Un préfixe suffit à matcher,
 * pour que les sous-routes (détail, formulaire) gardent le bon onglet actif.
 * "/money" seul ne doit matcher que la section 'apercu', pas toutes les
 * autres (elles commencent aussi par "/money").
 */
export function activeMoneySectionId(path) {
  if (path === '/money' || path === '/money/') return 'apercu';
  const match = MONEY_SECTIONS
    .filter((s) => s.id !== 'apercu')
    .find((s) => path === s.path || path.startsWith(`${s.path}/`));
  return match?.id ?? null;
}

/**
 * Nav horizontale scrollable, un seul système visuel pour toutes les
 * sections Money (voir styles/money.css .money-nav / .money-nav-item) :
 * même hauteur, même radius, même padding, même taille d'icône partout, y
 * compris Paramètres (jamais caché ni oublié — voir MONEY_SECTIONS).
 * activeId : id de MONEY_SECTIONS actuellement affiché.
 */
export function MoneyNav(activeId) {
  const nav = document.createElement('nav');
  nav.className = 'money-nav';
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', 'Sections Money');

  nav.innerHTML = MONEY_SECTIONS.map((s) => `
    <button
      type="button"
      class="money-nav-item ${activeId === s.id ? 'is-active' : ''}"
      role="tab"
      aria-selected="${activeId === s.id}"
      aria-label="${s.label}"
      data-path="${s.path}"
    >
      ${icons[s.icon] || ''}<span>${s.label}</span>
    </button>
  `).join('');

  nav.querySelectorAll('.money-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.path === router.currentPath) return;
      router.navigate(btn.dataset.path);
    });
  });

  return nav;
}
