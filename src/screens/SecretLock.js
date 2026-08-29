import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AppHeader } from '../components/AppHeader.js';
import { SecurityService } from '../utils/securityService.js';
import { primeSessionKey, reencryptNotes } from '../utils/secretStorage.js';

const AUTO_LOCK_OPTIONS = [
  { label: '30 secondes', ms: 30 * 1000 },
  { label: '1 minute', ms: 60 * 1000 },
  { label: '5 minutes', ms: 5 * 60 * 1000 },
  { label: '15 minutes', ms: 15 * 60 * 1000 },
];

/**
 * Re-chiffre toutes les notes Secret existantes avec une nouvelle clé,
 * et persiste le résultat via le store. Utilisé après un changement de
 * PIN ou une récupération par phrase, où la clé de chiffrement change.
 * Les échecs individuels (note corrompue) n'interrompent pas la migration
 * des autres notes — ils sont juste comptés pour informer l'utilisateur.
 */
async function migrateNotesToNewKey(oldKey, newKey) {
  const notes = store.listSecretNotes();
  if (notes.length === 0) return { total: 0, failed: 0 };
  const results = await reencryptNotes(notes, oldKey, newKey);
  let failed = 0;
  results.forEach((r) => {
    if (!r.ok) { failed += 1; return; }
    if (r.changed) store.updateSecretNote(r.id, r.fields);
  });
  return { total: notes.length, failed };
}

function pinDots(length, filled, hasError) {
  const wrap = document.createElement('div');
  wrap.className = `pin-dots ${hasError ? 'is-error' : ''}`;
  for (let i = 0; i < length; i += 1) {
    const dot = document.createElement('span');
    dot.className = `pin-dots__dot ${i < filled ? 'is-filled' : ''}`;
    wrap.appendChild(dot);
  }
  return wrap;
}

function pinPad(onDigit, onBackspace, onBiometric, showBiometric) {
  const pad = document.createElement('div');
  pad.className = 'pin-pad';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'back'];
  keys.forEach((key) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    if (key === 'bio') {
      btn.className = 'pin-pad__btn pin-pad__btn--ghost';
      if (showBiometric) {
        btn.innerHTML = icons.fingerprint;
        btn.addEventListener('click', onBiometric);
      }
    } else if (key === 'back') {
      btn.className = 'pin-pad__btn pin-pad__btn--ghost';
      btn.innerHTML = icons.backspace;
      btn.addEventListener('click', onBackspace);
    } else {
      btn.className = 'pin-pad__btn';
      btn.textContent = key;
      btn.addEventListener('click', () => onDigit(key));
    }
    pad.appendChild(btn);
  });
  return pad;
}

/**
 * Affiche une phrase de récupération générée, à noter par l'utilisateur
 * avant de continuer. Ne réaffiche jamais une phrase existante — appelé
 * uniquement juste après une génération (setupRecovery), qui est le seul
 * moment où la phrase existe encore en clair côté app.
 */
function RecoveryPhraseScreen(phrase, onDone) {
  const el = document.createElement('div');
  el.className = 'lock-screen';

  const icon = document.createElement('div');
  icon.innerHTML = icons.shieldCheck;
  icon.className = 'lock-screen__icon';
  el.appendChild(icon);

  const title = document.createElement('h1');
  title.className = 'lock-screen__title';
  title.textContent = 'Ta phrase de récupération';
  el.appendChild(title);

  const desc = document.createElement('p');
  desc.className = 'lock-screen__desc';
  desc.textContent = "Note-la quelque part de sûr (papier, gestionnaire de mots de passe). Elle permet de redéfinir ton code si tu l'oublies. Elle ne sera plus jamais affichée après cet écran.";
  el.appendChild(desc);

  const phraseBox = document.createElement('div');
  phraseBox.className = 'card';
  phraseBox.style.marginTop = 'var(--sp-4)';
  phraseBox.style.textAlign = 'center';
  phraseBox.innerHTML = `<p style="font-family:monospace; font-size:var(--fs-lg); letter-spacing:0.05em; word-break:break-all; margin:0;">${phrase}</p>`;
  el.appendChild(phraseBox);

  const confirmRow = document.createElement('label');
  confirmRow.style.display = 'flex';
  confirmRow.style.alignItems = 'center';
  confirmRow.style.gap = 'var(--sp-2)';
  confirmRow.style.marginTop = 'var(--sp-4)';
  confirmRow.innerHTML = `<input type="checkbox" id="recovery-noted-check" /> <span class="detail-desc">J'ai noté ma phrase de récupération</span>`;
  el.appendChild(confirmRow);

  const continueBtn = document.createElement('button');
  continueBtn.className = 'btn-primary';
  continueBtn.style.marginTop = 'var(--sp-4)';
  continueBtn.style.width = '100%';
  continueBtn.textContent = 'Continuer';
  continueBtn.disabled = true;
  el.appendChild(continueBtn);

  confirmRow.querySelector('input').addEventListener('change', (e) => {
    continueBtn.disabled = !e.target.checked;
  });
  continueBtn.addEventListener('click', () => onDone());

  return el;
}

/**
 * Écran de première configuration : demande un PIN (4 à 8 chiffres), le
 * fait saisir deux fois pour confirmation, puis propose la biométrie si
 * le device la supporte.
 */
function SetupScreen(onDone) {
  const el = document.createElement('div');
  el.className = 'lock-screen';
  let stage = 'create'; // 'create' | 'confirm'
  let firstPin = '';
  let currentPin = '';

  function render(errorMsg = '') {
    el.innerHTML = '';
    const icon = document.createElement('div');
    icon.innerHTML = icons.shieldCheck;
    icon.className = 'lock-screen__icon';
    el.appendChild(icon);

    const title = document.createElement('h1');
    title.className = 'lock-screen__title';
    title.textContent = stage === 'create' ? 'Crée un code PIN' : 'Confirme ton code PIN';
    el.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'lock-screen__desc';
    desc.textContent = 'Ce code protège ta zone Secret. Choisis 4 à 8 chiffres faciles à retenir, mais pas évidents.';
    el.appendChild(desc);

    el.appendChild(pinDots(Math.max(currentPin.length, 4), currentPin.length, Boolean(errorMsg)));

    const err = document.createElement('p');
    err.className = 'lock-screen__error';
    err.textContent = errorMsg;
    el.appendChild(err);

    el.appendChild(pinPad(
      (digit) => {
        if (currentPin.length >= 8) return;
        currentPin += digit;
        render();
        maybeAdvance();
      },
      () => {
        currentPin = currentPin.slice(0, -1);
        render();
      },
      () => {},
      false
    ));

    if (currentPin.length >= 4) {
      const validateRow = document.createElement('button');
      validateRow.className = 'btn-primary';
      validateRow.style.marginTop = 'var(--sp-4)';
      validateRow.textContent = 'Valider';
      validateRow.addEventListener('click', () => maybeAdvance(true));
      el.appendChild(validateRow);
    }
  }

  async function maybeAdvance(forced = false) {
    if (currentPin.length < 4) return;
    if (currentPin.length < 8 && !forced) return; // laisse taper jusqu'à 8, ou clic sur Valider
    if (stage === 'create') {
      firstPin = currentPin;
      currentPin = '';
      stage = 'confirm';
      render();
      return;
    }
    // stage === 'confirm'
    if (currentPin !== firstPin) {
      currentPin = '';
      render('Les deux codes ne correspondent pas. Réessaie.');
      return;
    }
    try {
      await SecurityService.setPin(firstPin);
      await primeSessionKey(firstPin);
      const phrase = await SecurityService.setupRecovery(firstPin);
      el.replaceWith(RecoveryPhraseScreen(phrase, onDone));
    } catch (e) {
      render(e.message || 'Erreur lors de la création du PIN.');
    }
  }

  render();
  return el;
}

/**
 * Écran "code oublié" : saisie de la phrase de récupération, puis d'un
 * nouveau PIN (deux fois). Si la phrase est valide, retrouve la clé de
 * chiffrement existante, migre les notes vers le nouveau PIN, puis
 * termine — pas de perte de données, contrairement à "Effacer toutes mes
 * données" (utils/securityService.js: resetAll).
 */
function RecoveryUnlockScreen(onDone, onCancel) {
  const el = document.createElement('div');
  el.className = 'lock-screen';
  let stage = 'phrase'; // 'phrase' | 'create' | 'confirm' | 'working'
  let phraseValue = '';
  let recoveredKey = null;
  let firstPin = '';
  let currentPin = '';

  function render(errorMsg = '') {
    el.innerHTML = '';
    const icon = document.createElement('div');
    icon.innerHTML = icons.shieldCheck;
    icon.className = 'lock-screen__icon';
    el.appendChild(icon);

    const title = document.createElement('h1');
    title.className = 'lock-screen__title';
    title.textContent = stage === 'phrase' ? 'Code oublié' : (stage === 'create' ? 'Nouveau code PIN' : 'Confirme le nouveau code');
    el.appendChild(title);

    if (stage === 'phrase') {
      const desc = document.createElement('p');
      desc.className = 'lock-screen__desc';
      desc.textContent = 'Saisis ta phrase de récupération telle que notée (majuscules, tirets compris — la casse importe peu).';
      el.appendChild(desc);

      const input = document.createElement('input');
      input.className = 'form-input';
      input.style.marginTop = 'var(--sp-4)';
      input.style.textAlign = 'center';
      input.style.fontFamily = 'monospace';
      input.placeholder = 'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX';
      input.value = phraseValue;
      input.addEventListener('input', () => { phraseValue = input.value; });
      el.appendChild(input);

      const err = document.createElement('p');
      err.className = 'lock-screen__error';
      err.textContent = errorMsg;
      el.appendChild(err);

      const submitBtn = document.createElement('button');
      submitBtn.className = 'btn-primary';
      submitBtn.style.marginTop = 'var(--sp-4)';
      submitBtn.style.width = '100%';
      submitBtn.textContent = 'Valider la phrase';
      submitBtn.addEventListener('click', async () => {
        if (!phraseValue.trim()) return;
        submitBtn.disabled = true;
        try {
          recoveredKey = await SecurityService.recoverDataKey(phraseValue);
          stage = 'create';
          currentPin = '';
          render();
        } catch (e) {
          submitBtn.disabled = false;
          render(e.message || 'Phrase incorrecte.');
        }
      });
      el.appendChild(submitBtn);

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn-secondary';
      cancelBtn.style.marginTop = 'var(--sp-2)';
      cancelBtn.style.width = '100%';
      cancelBtn.textContent = 'Annuler';
      cancelBtn.addEventListener('click', onCancel);
      el.appendChild(cancelBtn);
      return;
    }

    // stages 'create' / 'confirm' : même pavé PIN que SetupScreen
    const desc = document.createElement('p');
    desc.className = 'lock-screen__desc';
    desc.textContent = 'Choisis 4 à 8 chiffres.';
    el.appendChild(desc);

    el.appendChild(pinDots(Math.max(currentPin.length, 4), currentPin.length, Boolean(errorMsg)));

    const err = document.createElement('p');
    err.className = 'lock-screen__error';
    err.textContent = errorMsg;
    el.appendChild(err);

    el.appendChild(pinPad(
      (digit) => {
        if (currentPin.length >= 8) return;
        currentPin += digit;
        render();
        maybeAdvance();
      },
      () => {
        currentPin = currentPin.slice(0, -1);
        render();
      },
      () => {},
      false
    ));

    if (currentPin.length >= 4) {
      const validateRow = document.createElement('button');
      validateRow.className = 'btn-primary';
      validateRow.style.marginTop = 'var(--sp-4)';
      validateRow.textContent = 'Valider';
      validateRow.addEventListener('click', () => maybeAdvance(true));
      el.appendChild(validateRow);
    }
  }

  async function maybeAdvance(forced = false) {
    if (currentPin.length < 4) return;
    if (currentPin.length < 8 && !forced) return;
    if (stage === 'create') {
      firstPin = currentPin;
      currentPin = '';
      stage = 'confirm';
      render();
      return;
    }
    // stage === 'confirm'
    if (currentPin !== firstPin) {
      currentPin = '';
      render('Les deux codes ne correspondent pas. Réessaie.');
      return;
    }
    try {
      await SecurityService.setPinViaRecovery(firstPin);
      const newKey = await SecurityService.deriveEncryptionKey(firstPin);
      const migration = await migrateNotesToNewKey(recoveredKey, newKey);
      await primeSessionKey(firstPin);
      const phrase = await SecurityService.setupRecovery(firstPin);
      el.replaceWith(RecoveryPhraseScreen(phrase, () => {
        if (migration.failed > 0) {
          alert(`${migration.failed} note(s) n'ont pas pu être migrées et restent verrouillées avec l'ancien code.`);
        }
        onDone();
      }));
    } catch (e) {
      render(e.message || 'Erreur lors de la définition du nouveau code.');
    }
  }

  render();
  return el;
}

/**
 * Écran de déverrouillage courant : PIN + biométrie si enrôlée.
 */
function UnlockScreen(onDone) {
  const el = document.createElement('div');
  el.className = 'lock-screen';
  let currentPin = '';

  async function tryBiometric() {
    const ok = await SecurityService.unlockWithBiometric();
    if (ok) {
      // La biométrie ne peut pas dériver la clé de chiffrement (elle ne
      // connaît pas le PIN) : on redemande le PIN uniquement pour cette
      // dérivation, mais l'accès à l'écran est déjà débloqué visuellement.
      // Pour rester simple et cohérent, on invite quand même à saisir le PIN
      // ici — la biométrie sert de confirmation rapide, pas de bypass total.
      render('Confirme avec ton code pour déchiffrer tes notes.');
    }
  }

  function render(hint = '') {
    el.innerHTML = '';
    const icon = document.createElement('div');
    icon.innerHTML = icons.lock;
    icon.className = 'lock-screen__icon';
    el.appendChild(icon);

    const title = document.createElement('h1');
    title.className = 'lock-screen__title';
    title.textContent = 'Secret verrouillé';
    el.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'lock-screen__desc';
    desc.textContent = hint || 'Entre ton code PIN pour accéder à cette zone confidentielle.';
    el.appendChild(desc);

    el.appendChild(pinDots(Math.max(currentPin.length, 4), currentPin.length, false));

    const err = document.createElement('p');
    err.className = 'lock-screen__error';
    err.id = 'unlock-error';
    el.appendChild(err);

    el.appendChild(pinPad(
      (digit) => {
        if (currentPin.length >= 8) return;
        currentPin += digit;
        render(hint);
        if (currentPin.length >= 4) attemptUnlock();
      },
      () => {
        currentPin = currentPin.slice(0, -1);
        render(hint);
      },
      tryBiometric,
      SecurityService.isBiometricEnrolled()
    ));

    if (SecurityService.hasRecovery()) {
      const forgotBtn = document.createElement('button');
      forgotBtn.className = 'chip';
      forgotBtn.style.marginTop = 'var(--sp-4)';
      forgotBtn.textContent = 'Code oublié ?';
      forgotBtn.addEventListener('click', () => {
        el.replaceWith(RecoveryUnlockScreen(onDone, () => el.replaceWith(UnlockScreen(onDone))));
      });
      el.appendChild(forgotBtn);
    }
  }

  async function attemptUnlock() {
    const pin = currentPin;
    const ok = await SecurityService.unlockWithPin(pin);
    if (ok) {
      await primeSessionKey(pin);
      onDone();
      return;
    }
    // On ne connaît pas la longueur exacte du PIN configuré (volontairement,
    // pour ne rien révéler) : tant que moins de 8 chiffres sont tapés, on
    // laisse taper sans effacer ni afficher d'erreur — atteindre 8 sans
    // succès signifie forcément un code incorrect.
    if (pin.length >= 8) {
      currentPin = '';
      const errEl = el.querySelector('#unlock-error');
      if (errEl) errEl.textContent = 'Code incorrect. Réessaie.';
    }
  }

  render();

  // Propose la biométrie tout de suite si disponible, sans attendre un appui.
  if (SecurityService.isBiometricEnrolled()) {
    tryBiometric();
  }

  return el;
}

/**
 * Mini-flux "Changer le code PIN", affiché en overlay au-dessus de
 * SettingsScreen. Demande l'ancien PIN (vérifié), puis le nouveau (2x),
 * migre les notes existantes vers la nouvelle clé, puis se ferme.
 */
function ChangePinSheet(onClose) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  let stage = 'old'; // 'old' | 'create' | 'confirm'
  let oldPinValue = '';
  let firstPin = '';
  let currentPin = '';

  function render(errorMsg = '') {
    backdrop.innerHTML = '';
    const sheet = document.createElement('div');
    sheet.className = 'confirm-sheet';

    const title = document.createElement('h2');
    title.className = 'confirm-sheet__title';
    title.textContent = stage === 'old' ? 'Code actuel' : (stage === 'create' ? 'Nouveau code' : 'Confirme le nouveau code');
    sheet.appendChild(title);

    const currentInput = stage === 'old' ? oldPinValue : currentPin;
    sheet.appendChild(pinDots(Math.max(currentInput.length, 4), currentInput.length, Boolean(errorMsg)));

    const err = document.createElement('p');
    err.className = 'lock-screen__error';
    err.textContent = errorMsg;
    sheet.appendChild(err);

    sheet.appendChild(pinPad(
      (digit) => {
        if (stage === 'old') {
          if (oldPinValue.length >= 8) return;
          oldPinValue += digit;
        } else {
          if (currentPin.length >= 8) return;
          currentPin += digit;
        }
        render();
        maybeAdvance();
      },
      () => {
        if (stage === 'old') oldPinValue = oldPinValue.slice(0, -1);
        else currentPin = currentPin.slice(0, -1);
        render();
      },
      () => {},
      false
    ));

    if (currentInput.length >= 4) {
      const validateBtn = document.createElement('button');
      validateBtn.className = 'btn-primary';
      validateBtn.style.marginTop = 'var(--sp-4)';
      validateBtn.style.width = '100%';
      validateBtn.textContent = 'Valider';
      validateBtn.addEventListener('click', () => maybeAdvance(true));
      sheet.appendChild(validateBtn);
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.style.marginTop = 'var(--sp-2)';
    cancelBtn.style.width = '100%';
    cancelBtn.textContent = 'Annuler';
    cancelBtn.addEventListener('click', () => backdrop.remove());
    sheet.appendChild(cancelBtn);

    backdrop.appendChild(sheet);
  }

  async function maybeAdvance(forced = false) {
    if (stage === 'old') {
      if (oldPinValue.length < 4) return;
      if (oldPinValue.length < 8 && !forced) return;
      const ok = await SecurityService.verifyPin(oldPinValue);
      if (!ok) {
        oldPinValue = '';
        render('Code incorrect. Réessaie.');
        return;
      }
      stage = 'create';
      render();
      return;
    }
    if (currentPin.length < 4) return;
    if (currentPin.length < 8 && !forced) return;
    if (stage === 'create') {
      firstPin = currentPin;
      currentPin = '';
      stage = 'confirm';
      render();
      return;
    }
    // stage === 'confirm'
    if (currentPin !== firstPin) {
      currentPin = '';
      render('Les deux codes ne correspondent pas. Réessaie.');
      return;
    }
    try {
      const oldKey = await SecurityService.deriveEncryptionKey(oldPinValue);
      await SecurityService.changePin(oldPinValue, firstPin);
      const newKey = await SecurityService.deriveEncryptionKey(firstPin);
      const migration = await migrateNotesToNewKey(oldKey, newKey);
      await primeSessionKey(firstPin);
      const phrase = await SecurityService.setupRecovery(firstPin);
      backdrop.innerHTML = '';
      const sheet = document.createElement('div');
      sheet.className = 'confirm-sheet';
      sheet.appendChild(RecoveryPhraseScreen(phrase, () => {
        if (migration.failed > 0) {
          alert(`${migration.failed} note(s) n'ont pas pu être migrées et restent verrouillées avec l'ancien code.`);
        }
        backdrop.remove();
        onClose();
      }));
      backdrop.appendChild(sheet);
    } catch (e) {
      render(e.message || 'Erreur lors du changement de code.');
    }
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.remove();
  });

  render();
  return backdrop;
}

/**
 * Mini-flux "Générer une phrase de récupération" pour les comptes qui
 * n'en ont pas encore (créés avant l'introduction de cette fonctionnalité).
 * Redemande le PIN actuel (nécessaire pour dériver et envelopper la clé
 * de chiffrement), génère la phrase, l'affiche une fois, puis se ferme.
 */
function RecoverySetupSheet(onClose) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  let currentPin = '';

  function render(errorMsg = '') {
    backdrop.innerHTML = '';
    const sheet = document.createElement('div');
    sheet.className = 'confirm-sheet';

    const title = document.createElement('h2');
    title.className = 'confirm-sheet__title';
    title.textContent = 'Confirme ton code actuel';
    sheet.appendChild(title);

    sheet.appendChild(pinDots(Math.max(currentPin.length, 4), currentPin.length, Boolean(errorMsg)));

    const err = document.createElement('p');
    err.className = 'lock-screen__error';
    err.textContent = errorMsg;
    sheet.appendChild(err);

    sheet.appendChild(pinPad(
      (digit) => {
        if (currentPin.length >= 8) return;
        currentPin += digit;
        render();
        if (currentPin.length >= 4) maybeSubmit();
      },
      () => {
        currentPin = currentPin.slice(0, -1);
        render();
      },
      () => {},
      false
    ));

    if (currentPin.length >= 4) {
      const validateBtn = document.createElement('button');
      validateBtn.className = 'btn-primary';
      validateBtn.style.marginTop = 'var(--sp-4)';
      validateBtn.style.width = '100%';
      validateBtn.textContent = 'Valider';
      validateBtn.addEventListener('click', () => maybeSubmit(true));
      sheet.appendChild(validateBtn);
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.style.marginTop = 'var(--sp-2)';
    cancelBtn.style.width = '100%';
    cancelBtn.textContent = 'Annuler';
    cancelBtn.addEventListener('click', () => backdrop.remove());
    sheet.appendChild(cancelBtn);

    backdrop.appendChild(sheet);
  }

  async function maybeSubmit(forced = false) {
    if (currentPin.length < 4) return;
    if (currentPin.length < 8 && !forced) return;
    try {
      const phrase = await SecurityService.setupRecovery(currentPin);
      backdrop.innerHTML = '';
      const sheet = document.createElement('div');
      sheet.className = 'confirm-sheet';
      sheet.appendChild(RecoveryPhraseScreen(phrase, () => {
        backdrop.remove();
        onClose();
      }));
      backdrop.appendChild(sheet);
    } catch (e) {
      currentPin = '';
      render(e.message || 'Code incorrect.');
    }
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.remove();
  });

  render();
  return backdrop;
}

/** Écran affiché une fois déverrouillé : réglages de sécurité de la zone Secret. */
function SettingsScreen() {
  const el = document.createElement('div');
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.innerHTML = `<div class="screen-title-row"><h1>Sécurité Secret</h1></div>`;

  const card = document.createElement('section');
  card.className = 'card';
  screen.appendChild(card);
  el.appendChild(screen);

  async function renderRows() {
    card.innerHTML = '';

    // Verrouillage automatique
    const lockRow = document.createElement('div');
    lockRow.className = 'security-row';
    lockRow.innerHTML = `
      <div class="security-row__label">
        <span class="security-row__title">Verrouillage automatique</span>
        <span class="security-row__desc">Après une période d'inactivité dans Secret</span>
      </div>
    `;
    const select = document.createElement('select');
    select.className = 'form-input';
    select.style.width = 'auto';
    AUTO_LOCK_OPTIONS.forEach((opt) => {
      const o = document.createElement('option');
      o.value = String(opt.ms);
      o.textContent = opt.label;
      if (opt.ms === SecurityService.getAutoLockMs()) o.selected = true;
      select.appendChild(o);
    });
    select.addEventListener('change', () => SecurityService.setAutoLockMs(Number(select.value)));
    lockRow.appendChild(select);
    card.appendChild(lockRow);

    // Biométrie
    const bioAvailable = await SecurityService.isBiometricAvailable();
    if (bioAvailable) {
      const bioRow = document.createElement('div');
      bioRow.className = 'security-row';
      bioRow.innerHTML = `
        <div class="security-row__label">
          <span class="security-row__title">Biométrie</span>
          <span class="security-row__desc">Face ID / empreinte pour accélérer le déverrouillage</span>
        </div>
      `;
      const toggle = document.createElement('button');
      toggle.className = `toggle-switch ${SecurityService.isBiometricEnrolled() ? 'is-on' : ''}`;
      toggle.innerHTML = `<span class="toggle-switch__knob"></span>`;
      toggle.addEventListener('click', async () => {
        try {
          if (SecurityService.isBiometricEnrolled()) {
            SecurityService.disableBiometric();
          } else {
            await SecurityService.enrollBiometric();
          }
          renderRows();
        } catch (e) {
          alert(e.message || "Impossible d'activer la biométrie.");
        }
      });
      bioRow.appendChild(toggle);
      card.appendChild(bioRow);
    }

    // Masquage des aperçus
    const maskRow = document.createElement('div');
    maskRow.className = 'security-row';
    maskRow.innerHTML = `
      <div class="security-row__label">
        <span class="security-row__title">Masquer les aperçus</span>
        <span class="security-row__desc">Cache les titres/extraits dans la liste Secret</span>
      </div>
    `;
    const maskToggle = document.createElement('button');
    maskToggle.className = `toggle-switch ${SecurityService.isPreviewMaskingEnabled() ? 'is-on' : ''}`;
    maskToggle.innerHTML = `<span class="toggle-switch__knob"></span>`;
    maskToggle.addEventListener('click', () => {
      SecurityService.setPreviewMasking(!SecurityService.isPreviewMaskingEnabled());
      renderRows();
    });
    maskRow.appendChild(maskToggle);
    card.appendChild(maskRow);

    // Changer le code PIN
    const changePinRow = document.createElement('div');
    changePinRow.className = 'security-row';
    changePinRow.innerHTML = `
      <div class="security-row__label">
        <span class="security-row__title">Changer le code PIN</span>
        <span class="security-row__desc">Redéfinit le code de la zone Secret</span>
      </div>
    `;
    const changePinBtn = document.createElement('button');
    changePinBtn.className = 'icon-btn';
    changePinBtn.innerHTML = icons.chevronRight;
    changePinBtn.addEventListener('click', () => {
      el.appendChild(ChangePinSheet(() => renderRows()));
    });
    changePinRow.appendChild(changePinBtn);
    card.appendChild(changePinRow);

    // Phrase de récupération — proposée si absente (ex. comptes créés
    // avant l'introduction de cette fonctionnalité, migration douce).
    const recoveryRow = document.createElement('div');
    recoveryRow.className = 'security-row';
    if (SecurityService.hasRecovery()) {
      recoveryRow.innerHTML = `
        <div class="security-row__label">
          <span class="security-row__title">Phrase de récupération</span>
          <span class="security-row__desc">Configurée — permet de redéfinir ton code en cas d'oubli</span>
        </div>
      `;
      card.appendChild(recoveryRow);
    } else {
      recoveryRow.innerHTML = `
        <div class="security-row__label">
          <span class="security-row__title">Phrase de récupération</span>
          <span class="security-row__desc">Non configurée — sans elle, un code oublié est irrécupérable</span>
        </div>
      `;
      const setupBtn = document.createElement('button');
      setupBtn.className = 'icon-btn';
      setupBtn.innerHTML = icons.chevronRight;
      setupBtn.addEventListener('click', () => {
        el.appendChild(RecoverySetupSheet(() => renderRows()));
      });
      recoveryRow.appendChild(setupBtn);
      card.appendChild(recoveryRow);
    }

    // Verrouiller maintenant
    const lockNowRow = document.createElement('div');
    lockNowRow.className = 'security-row';
    lockNowRow.innerHTML = `
      <div class="security-row__label">
        <span class="security-row__title">Verrouiller maintenant</span>
        <span class="security-row__desc">Quitte immédiatement la session Secret</span>
      </div>
    `;
    const lockBtn = document.createElement('button');
    lockBtn.className = 'icon-btn';
    lockBtn.innerHTML = icons.lock;
    lockBtn.addEventListener('click', () => {
      SecurityService.lock();
      router.navigate('/secret');
    });
    lockNowRow.appendChild(lockBtn);
    card.appendChild(lockNowRow);
  }

  renderRows();

  const backRow = document.createElement('div');
  backRow.style.padding = '0 var(--sp-5)';
  backRow.innerHTML = `<button class="btn-secondary" style="width:100%;margin-top:var(--sp-4)">Retour à Secret</button>`;
  backRow.querySelector('button').addEventListener('click', () => router.navigate('/secret'));
  el.appendChild(backRow);

  return el;
}

/**
 * Point d'entrée unique : décide quel sous-écran afficher (setup / unlock /
 * settings). C'est ce composant qu'il faut monter en garde devant tout le
 * reste de la section Secret (voir SecretList.js / secretGuard()).
 */
export function SecretLock({ mode = 'guard' } = {}) {
  if (mode === 'settings' && SecurityService.isUnlocked()) {
    return SettingsScreen();
  }
  if (!SecurityService.isConfigured()) {
    return SetupScreen(() => router.navigate('/secret'));
  }
  return UnlockScreen(() => router.navigate(mode === 'settings' ? '/secret/securite' : '/secret'));
}
