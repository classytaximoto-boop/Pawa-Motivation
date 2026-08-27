import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AppHeader } from '../components/AppHeader.js';
import { SecurityService } from '../utils/securityService.js';
import { primeSessionKey } from '../utils/secretStorage.js';

const AUTO_LOCK_OPTIONS = [
  { label: '30 secondes', ms: 30 * 1000 },
  { label: '1 minute', ms: 60 * 1000 },
  { label: '5 minutes', ms: 5 * 60 * 1000 },
  { label: '15 minutes', ms: 15 * 60 * 1000 },
];

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
      onDone();
    } catch (e) {
      render(e.message || 'Erreur lors de la création du PIN.');
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
