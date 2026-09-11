import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { encryptText, decryptText, isEncryptedPayload, hasSessionKey } from '../utils/secretStorage.js';

export function SecretForm(params = {}) {
  const editingId = params.id ?? null;
  const existing = editingId ? store.getSecretNote(editingId) : null;

  if (editingId && !existing) {
    router.navigate('/secret');
    return document.createElement('div');
  }

  if (!hasSessionKey()) {
    // Ne devrait pas arriver (secretGuard protège déjà cette route), mais
    // par sécurité on ne rend jamais un formulaire de note sans clé de session.
    router.navigate('/secret');
    return document.createElement('div');
  }

  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">${existing ? 'Modifier la note' : 'Nouvelle note secrète'}</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => {
    router.navigate(existing ? `/secret/${existing.id}` : '/secret');
  });
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  screen.innerHTML = `
    <form id="secret-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="f-title">Titre <span class="optional">(optionnel)</span></label>
        <input class="form-input" id="f-title" name="title" placeholder="Ex. Idée personnelle" value="" disabled />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-text">Texte</label>
        <textarea class="form-textarea" id="f-text" name="text" placeholder="Écris librement, en toute confidentialité..." style="min-height:180px" required disabled></textarea>
      </div>

      <p class="form-error" id="form-error" hidden>Écris au moins quelques mots.</p>
      <p class="form-error" id="decrypt-error" hidden>Impossible de déchiffrer cette note (code incorrect ou donnée corrompue).</p>

      <div class="form-actions">
        <button type="button" class="btn-secondary" id="cancel-btn">Annuler</button>
        <button type="submit" class="btn-primary">${existing ? 'Enregistrer' : 'Ajouter'}</button>
      </div>
    </form>
  `;

  el.appendChild(screen);

  const titleInput = screen.querySelector('#f-title');
  const textInput = screen.querySelector('#f-text');

  // Pré-remplissage : les champs restent désactivés tant que le contenu
  // existant n'a pas fini d'être déchiffré, pour éviter d'écraser une note
  // avec un champ vide en cas de soumission trop rapide.
  (async () => {
    if (!existing) {
      titleInput.disabled = false;
      textInput.disabled = false;
      textInput.focus();
      return;
    }
    try {
      const title = isEncryptedPayload(existing.title) ? await decryptText(existing.title) : (existing.title || '');
      const text = isEncryptedPayload(existing.text) ? await decryptText(existing.text) : (existing.text || '');
      if (title === null || text === null) throw new Error('decrypt_failed');
      titleInput.value = title;
      textInput.value = text;
    } catch {
      screen.querySelector('#decrypt-error').hidden = false;
    } finally {
      titleInput.disabled = false;
      textInput.disabled = false;
    }
  })();

  screen.querySelector('#cancel-btn').addEventListener('click', () => {
    router.navigate(existing ? `/secret/${existing.id}` : '/secret');
  });

  screen.querySelector('#secret-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = textInput.value.trim();
    const errorEl = screen.querySelector('#form-error');
    if (!text) {
      errorEl.hidden = false;
      textInput.focus();
      return;
    }
    errorEl.hidden = true;

    const submitBtn = screen.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const fields = {
        title: await encryptText(titleInput.value.trim()),
        text: await encryptText(text),
      };

      if (existing) {
        store.updateSecretNote(existing.id, fields);
        router.navigate(`/secret/${existing.id}`);
      } else {
        const id = store.createSecretNote(fields);
        router.navigate(`/secret/${id}`);
      }
    } catch (err) {
      console.warn('[SecretForm] chiffrement échoué', err);
      errorEl.textContent = "Erreur de chiffrement — la note n'a pas été enregistrée.";
      errorEl.hidden = false;
      submitBtn.disabled = false;
    }
  });

  return el;
}
