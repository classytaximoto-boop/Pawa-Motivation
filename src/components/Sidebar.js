import { navItems } from '../data/navigation.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

/**
 * Sidebar desktop du Home Dashboard — remplace visuellement BottomNav sur
 * l'écran Home (voir main.js). Réutilise la même source de vérité de
 * navigation (data/navigation.js) : aucune route dupliquée, aucun nouveau
 * système de nav parallèle. BottomNav.js reste inchangé et continue de
 * servir les autres écrans.
 */
export function Sidebar() {
  const aside = document.createElement('aside');
  aside.className = 'dash-sidebar';

  const logo = document.createElement('div');
  logo.className = 'dash-sidebar__logo';
  logo.innerHTML = `${icons.bolt}<span>PAWA<b>BOOST</b></span>`;
  aside.appendChild(logo);

  const nav = document.createElement('nav');
  nav.className = 'dash-nav';
  nav.setAttribute('aria-label', 'Navigation principale');

  navItems.forEach((item) => {
    const btn = document.createElement('button');
    btn.className = 'dash-nav__item';
    btn.dataset.path = item.path;
    btn.setAttribute('aria-label', item.label);
    btn.innerHTML = `${icons[item.icon] ?? ''}<span>${item.label}</span>`;
    btn.addEventListener('click', () => router.navigate(item.path));
    nav.appendChild(btn);
  });

  aside.appendChild(nav);

  const footer = document.createElement('div');
  footer.className = 'dash-sidebar__footer';
  footer.innerHTML = `
    <div class="dash-sidebar__footer-title">Better<br/>Every Day</div>
  `;
  aside.appendChild(footer);

  const syncActive = () => {
    const current = router.currentPath ?? '/';
    nav.querySelectorAll('.dash-nav__item').forEach((btn) => {
      const isActive = btn.dataset.path === '/'
        ? current === '/'
        : current === btn.dataset.path || current.startsWith(`${btn.dataset.path}/`);
      btn.classList.toggle('is-active', isActive);
    });
  };

  document.addEventListener('boost:navigated', syncActive);
  syncActive();

  return aside;
}
