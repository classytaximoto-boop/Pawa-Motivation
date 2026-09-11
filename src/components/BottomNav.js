import { navItems } from '../data/navigation.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

export function BottomNav() {
  const wrap = document.createElement('div');
  wrap.className = 'bottom-nav-wrap';

  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Navigation principale');

  navItems.forEach((item) => {
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.dataset.path = item.path;
    btn.setAttribute('aria-label', item.label);
    btn.innerHTML = `${icons[item.icon] ?? ''}<span class="nav-item__label">${item.label}</span>`;
    btn.addEventListener('click', () => router.navigate(item.path));
    nav.appendChild(btn);
  });

  wrap.appendChild(nav);

  const syncActive = () => {
    const current = router.currentPath ?? '/';
    nav.querySelectorAll('.nav-item').forEach((btn) => {
      const isActive = btn.dataset.path === '/'
        ? current === '/'
        : current === btn.dataset.path || current.startsWith(`${btn.dataset.path}/`);
      btn.classList.toggle('is-active', isActive);
      if (isActive) {
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  };

  document.addEventListener('boost:navigated', syncActive);
  syncActive();

  return wrap;
}
