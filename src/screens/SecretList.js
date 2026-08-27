import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AppHeader } from '../components/AppHeader.js';
import { SecurityService } from '../utils/securityService.js';
import { decryptText, isEncryptedPayload } from '../utils/secretStorage.js';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function excerpt(text, max = 100) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

/**
 * Déchiffre titre/texte d'une note pour l'affichage. Gère aussi les notes
 * créées avant l'introduction du chiffrement (title/text étaient alors de
 * simples chaînes en clair) : dans ce cas, on les affiche telles quelles
 * sans tenter de les déchiffrer.
 */
async function revealNote(note) {
  const title = isEncryptedPayload(note.title) ? await decryptText(note.title) : (note.title || '');
  const text = isEncryptedPayload(note.text) ? await decryptText(note.text) : (note.text || '');
  return { title, text };
}

function noteCard(note, revealed, masked) {
  const card = document.createElement('button');
  card.className = 'card goal-card';
  card.style.textAlign = 'left';

  const label = masked
    ? '<span class="secret-masked-text">Contenu masqué</span>'
    : (revealed.title || excerpt(revealed.text, 40) || 'Sans titre');

  card.innerHTML = `
    <div class="goal-card__top">
      <div>
        <div class="goal-card__title-row">
          ${icons.lock}
          <span class="goal-card__name">${label}</span>
        </div>
        <div class="goal-card__meta-row">
          <span class="chip">${fmtDate(note.updatedAt)}</span>
        </div>
      </div>
    </div>
  `;
  card.addEventListener('click', () => router.navigate(`/secret/${note.id}`));
  return card;
}

export function SecretList() {
  const notes = store.listSecretNotes();
  const el = document.createElement('div');
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen';

  screen.innerHTML = `
    <div class="screen-title-row">
      <h1>Secret</h1>
      <button class="icon-btn" id="security-settings-btn" aria-label="Réglages de sécurité">${icons.shield}</button>
    </div>
    <div class="goal-list" id="notes-list"></div>
  `;

  screen.querySelector('#security-settings-btn').addEventListener('click', () => router.navigate('/secret/securite'));

  const list = screen.querySelector('#notes-list');
  if (notes.length === 0) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-8)">
        ${icons.lock.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">Aucune note confidentielle</h2>
        <p class="state-block__desc">Un espace privé pour ce que tu ne veux garder que pour toi.</p>
      </div>`;
  } else {
    const masked = SecurityService.isPreviewMaskingEnabled();
    notes.forEach(async (n) => {
      const revealed = masked ? { title: '', text: '' } : await revealNote(n).catch(() => ({ title: '', text: '' }));
      list.appendChild(noteCard(n, revealed, masked));
    });
  }

  el.appendChild(screen);

  const fab = document.createElement('div');
  fab.className = 'fab';
  fab.innerHTML = `<button class="fab-btn" aria-label="Nouvelle note">${icons.plus}</button>`;
  fab.querySelector('button').addEventListener('click', () => router.navigate('/secret/nouveau'));
  el.appendChild(fab);

  return el;
}
