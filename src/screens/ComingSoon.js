import { icons } from '../utils/icons.js';
import { AppHeader } from '../components/AppHeader.js';

/**
 * Écran état-vide réutilisé pour chaque module tant qu'il n'est pas construit.
 * Chaque module remplacera cet écran par le sien au fur et à mesure des prompts suivants.
 */
export function ComingSoon({ title, icon, description }) {
  return function render() {
    const el = document.createElement('div');
    el.appendChild(AppHeader());

    const screen = document.createElement('main');
    screen.className = 'screen';
    screen.innerHTML = `
      <div class="screen-title-row"><h1>${title}</h1></div>
      <div class="state-block">
        <span class="state-block__icon">${icons[icon] ?? icons.inbox}</span>
        <h2 class="state-block__title">Bientôt disponible</h2>
        <p class="state-block__desc">${description}</p>
      </div>
    `;
    el.appendChild(screen);
    return el;
  };
}
