import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

export function MoneySubScreenHeader(title, slug) {
  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  if (slug) header.dataset.slug = slug;
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">${title}</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/money'));
  return header;
}
