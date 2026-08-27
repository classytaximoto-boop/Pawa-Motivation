import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Repos bien mérité';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export function AppHeader() {
  const state = store.get();
  const header = document.createElement('header');
  header.className = 'app-header';
  header.innerHTML = `
    <div class="app-header__greeting">
      <span class="app-header__eyebrow">${timeGreeting()}</span>
      <h1 class="app-header__title">${state.user.name}</h1>
    </div>
    <div class="app-header__streak" aria-label="Série de jours actifs">
      ${icons.flame}
      <span class="mono">${state.user.streak}</span>
    </div>
  `;
  return header;
}
