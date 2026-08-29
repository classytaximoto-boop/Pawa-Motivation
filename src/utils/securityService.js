/**
 * SecurityService — verrouillage de la zone Secret.
 *
 * Responsabilités :
 * - PIN : stocké uniquement sous forme de hash salé (PBKDF2/SHA-256 via
 *   SubtleCrypto), jamais en clair. Le PIN lui-même ne persiste nulle part.
 * - Biométrie : utilise WebAuthn (navigator.credentials) quand le device et
 *   le navigateur le supportent, comme second facteur de déverrouillage.
 *   Dégrade proprement vers PIN seul si absent (dégradation exigée par le
 *   prompt : "biométrie si disponible").
 * - Verrouillage automatique : après une inactivité configurable, ou dès
 *   que l'app repasse en arrière-plan (visibilitychange).
 * - Fournit aussi deriveKey(), utilisé par secretStorage.js pour chiffrer
 *   les notes — la clé de chiffrement est dérivée du PIN, jamais stockée.
 *
 * Ce module ne connaît pas le contenu des notes — seule sa fonction est de
 * gérer qui a le droit de voir la zone Secret et de fournir la clé qui sert
 * à déchiffrer, jamais de lire les données lui-même.
 */

const CONFIG_KEY = 'boost:v1:secretSecurity';
const DEFAULT_AUTO_LOCK_MS = 60 * 1000; // 1 minute d'inactivité dans Secret

function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function randomSalt(len = 16) {
  return crypto.getRandomValues(new Uint8Array(len));
}

const RECOVERY_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O/1/I pour éviter la confusion à la relecture

function generateRecoveryPhrase(groups = 6, groupLen = 4) {
  const randomVals = crypto.getRandomValues(new Uint32Array(groups * groupLen));
  const parts = [];
  for (let g = 0; g < groups; g += 1) {
    let part = '';
    for (let i = 0; i < groupLen; i += 1) {
      part += RECOVERY_CHARSET[randomVals[g * groupLen + i] % RECOVERY_CHARSET.length];
    }
    parts.push(part);
  }
  return parts.join('-');
}

function normalizeRecoveryPhrase(phrase) {
  return String(phrase || '').trim().toUpperCase().replace(/\s+/g, '');
}

async function deriveKeyFromRecoveryPhrase(phrase, salt, usages) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(normalizeRecoveryPhrase(phrase)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    usages
  );
}

async function pbkdf2Hash(pin, salt, iterations = 150000, bits = 256) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    bits
  );
  return derived;
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

class SecurityServiceImpl {
  constructor() {
    this._unlocked = false;
    this._autoLockMs = DEFAULT_AUTO_LOCK_MS;
    this._lockTimer = null;
    this._listeners = new Set();
    this._biometricCredentialId = null;

    const cfg = loadConfig();
    if (cfg?.autoLockMs) this._autoLockMs = cfg.autoLockMs;
    if (cfg?.biometricCredentialId) this._biometricCredentialId = cfg.biometricCredentialId;

    // Verrouillage dès que l'app repasse en arrière-plan ou l'onglet change —
    // exigence "verrouillage automatique", pas seulement basé sur un minuteur.
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.lock();
      });
    }
  }

  // ------------------------------------------------------------
  // Configuration / état
  // ------------------------------------------------------------

  isConfigured() {
    return Boolean(loadConfig()?.pinHash);
  }

  isUnlocked() {
    return this._unlocked;
  }

  getAutoLockMs() {
    return this._autoLockMs;
  }

  /** Masquage des aperçus dans la liste (titre/extrait remplacés par un texte générique). Activé par défaut. */
  isPreviewMaskingEnabled() {
    const cfg = loadConfig();
    return cfg?.maskPreviews !== false;
  }

  setPreviewMasking(enabled) {
    const cfg = loadConfig() || {};
    saveConfig({ ...cfg, maskPreviews: enabled });
  }

  setAutoLockMs(ms) {
    this._autoLockMs = ms;
    const cfg = loadConfig() || {};
    saveConfig({ ...cfg, autoLockMs: ms });
    if (this._unlocked) this._restartAutoLockTimer();
  }

  onChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _emit() {
    this._listeners.forEach((fn) => fn(this._unlocked));
  }

  // ------------------------------------------------------------
  // PIN
  // ------------------------------------------------------------

  /** Définit ou change le PIN. Renvoie la clé dérivée (pour chiffrer les notes existantes si besoin de re-chiffrement). */
  async setPin(pin) {
    if (!/^\d{4,8}$/.test(pin)) {
      throw new Error('Le PIN doit contenir entre 4 et 8 chiffres.');
    }
    const salt = randomSalt();
    const hash = await pbkdf2Hash(pin, salt);
    const cfg = loadConfig() || {};
    saveConfig({
      ...cfg,
      pinHash: bufToBase64(hash),
      pinSalt: bufToBase64(salt),
      autoLockMs: this._autoLockMs,
    });
  }

  async verifyPin(pin) {
    const cfg = loadConfig();
    if (!cfg?.pinHash || !cfg?.pinSalt) return false;
    const salt = base64ToBuf(cfg.pinSalt);
    const hash = await pbkdf2Hash(pin, salt);
    return bufToBase64(hash) === cfg.pinHash;
  }

  /** Déverrouille la session Secret si le PIN est correct. */
  async unlockWithPin(pin) {
    const ok = await this.verifyPin(pin);
    if (ok) this._setUnlocked(true);
    return ok;
  }

  /**
   * Dérive une clé AES-GCM à partir du PIN, pour secretStorage.js.
   * Le sel utilisé est celui du PIN (déjà stocké) — la clé n'est jamais
   * persistée, seulement recalculée à la volée à chaque déverrouillage.
   */
  async deriveEncryptionKey(pin) {
    const cfg = loadConfig();
    if (!cfg?.pinSalt) throw new Error('Aucun PIN configuré.');
    const salt = base64ToBuf(cfg.pinSalt);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  resetAll() {
    localStorage.removeItem(CONFIG_KEY);
    this._biometricCredentialId = null;
    this._setUnlocked(false);
  }

  /**
   * Change le PIN à partir de l'ancien PIN vérifié. Nécessaire car la clé
   * de chiffrement des notes est dérivée du PIN (voir deriveEncryptionKey) :
   * changer le PIN sans repasser par l'ancien casserait le déchiffrement
   * des notes déjà enregistrées. Ne touche pas à secretStorage/store — à
   * l'appelant (UI) d'orchestrer le re-chiffrement des notes existantes
   * en s'appuyant sur les deux clés (ancienne via deriveEncryptionKey(oldPin)
   * avant cet appel, nouvelle via deriveEncryptionKey(newPin) après).
   */
  async changePin(oldPin, newPin) {
    const ok = await this.verifyPin(oldPin);
    if (!ok) throw new Error("L'ancien code est incorrect.");
    if (!/^\d{4,8}$/.test(newPin)) {
      throw new Error('Le nouveau PIN doit contenir entre 4 et 8 chiffres.');
    }
    await this.setPin(newPin);
    // Le PIN a changé : toute phrase de récupération existante était liée
    // à l'ancien PIN implicitement (elle protège la clé de données, qui va
    // être re-dérivée par l'appelant) — elle reste valide techniquement
    // pour retrouver l'ANCIENNE clé, ce qui ne correspond plus aux notes
    // une fois re-chiffrées. On l'invalide donc pour éviter toute confusion,
    // et on laisse l'UI proposer d'en régénérer une avec le nouveau PIN.
    const cfg = loadConfig() || {};
    if (cfg.recoveryWrappedKey) {
      delete cfg.recoveryWrappedKey;
      delete cfg.recoverySalt;
      delete cfg.recoveryWrapIv;
      saveConfig(cfg);
    }
  }

  hasRecovery() {
    const cfg = loadConfig();
    return Boolean(cfg?.recoveryWrappedKey && cfg?.recoverySalt);
  }

  /**
   * Génère une phrase de récupération et enveloppe la clé de données
   * actuelle (dérivée du PIN fourni) avec une clé issue de cette phrase.
   * Renvoie la phrase en clair — à afficher UNE SEULE FOIS à l'utilisateur,
   * jamais réaffichée ni stockée en clair nulle part.
   */
  async setupRecovery(pin) {
    const ok = await this.verifyPin(pin);
    if (!ok) throw new Error('Code incorrect.');

    const cfg = loadConfig() || {};
    const pinSalt = base64ToBuf(cfg.pinSalt);
    const enc = new TextEncoder();
    // Copie extractible de la même clé que deriveEncryptionKey produirait
    // (mêmes paramètres PBKDF2), uniquement pour pouvoir l'envelopper ici.
    const pinKeyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
    const dataKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: pinSalt, iterations: 150000, hash: 'SHA-256' },
      pinKeyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const phrase = generateRecoveryPhrase();
    const recoverySalt = randomSalt();
    const recoveryKey = await deriveKeyFromRecoveryPhrase(phrase, recoverySalt, ['wrapKey']);
    const wrapIv = crypto.getRandomValues(new Uint8Array(12));
    const wrapped = await crypto.subtle.wrapKey('raw', dataKey, recoveryKey, { name: 'AES-GCM', iv: wrapIv });

    saveConfig({
      ...cfg,
      recoverySalt: bufToBase64(recoverySalt),
      recoveryWrappedKey: bufToBase64(wrapped),
      recoveryWrapIv: bufToBase64(wrapIv),
    });

    return phrase;
  }

  /**
   * Retrouve la clé de chiffrement des notes à partir de la phrase de
   * récupération, sans connaître le PIN. Ne change rien en config — c'est
   * à l'appelant (UI) d'ensuite définir un nouveau PIN et de re-chiffrer
   * les notes avec la clé issue de deriveEncryptionKey(nouveauPin).
   * Renvoie la CryptoKey de données (extractible), utilisable directement
   * pour déchiffrer les notes existantes le temps de les migrer.
   */
  async recoverDataKey(phrase) {
    const cfg = loadConfig();
    if (!cfg?.recoveryWrappedKey || !cfg?.recoverySalt || !cfg?.recoveryWrapIv) {
      throw new Error('Aucune phrase de récupération configurée.');
    }
    try {
      const recoverySalt = base64ToBuf(cfg.recoverySalt);
      const recoveryKey = await deriveKeyFromRecoveryPhrase(phrase, recoverySalt, ['unwrapKey']);
      const wrapIv = base64ToBuf(cfg.recoveryWrapIv);
      const wrapped = base64ToBuf(cfg.recoveryWrappedKey);
      return await crypto.subtle.unwrapKey(
        'raw',
        wrapped,
        recoveryKey,
        { name: 'AES-GCM', iv: wrapIv },
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (e) {
      throw new Error('Phrase de récupération incorrecte.');
    }
  }

  /**
   * Définit un nouveau PIN sans connaître l'ancien (flux "code oublié").
   * À appeler seulement après recoverDataKey() réussi. Supprime aussi la
   * phrase de récupération utilisée (elle redevient obsolète, comme pour
   * changePin) — l'UI doit proposer d'en régénérer une nouvelle ensuite.
   */
  async setPinViaRecovery(newPin) {
    if (!/^\d{4,8}$/.test(newPin)) {
      throw new Error('Le nouveau PIN doit contenir entre 4 et 8 chiffres.');
    }
    await this.setPin(newPin);
    const cfg = loadConfig() || {};
    if (cfg.recoveryWrappedKey) {
      delete cfg.recoveryWrappedKey;
      delete cfg.recoverySalt;
      delete cfg.recoveryWrapIv;
      saveConfig(cfg);
    }
  }

  // ------------------------------------------------------------
  // Biométrie (WebAuthn) — facultative, dégrade proprement si absente
  // ------------------------------------------------------------

  isBiometricSupported() {
    return typeof window !== 'undefined' &&
      'PublicKeyCredential' in window &&
      typeof navigator?.credentials?.create === 'function';
  }

  async isBiometricAvailable() {
    if (!this.isBiometricSupported()) return false;
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  isBiometricEnrolled() {
    return Boolean(this._biometricCredentialId);
  }

  /** Enrôle la biométrie de l'appareil (Face ID / Touch ID / empreinte Android / Windows Hello). */
  async enrollBiometric() {
    if (!(await this.isBiometricAvailable())) {
      throw new Error('Biométrie non disponible sur cet appareil.');
    }
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'BOOST' },
        user: { id: userId, name: 'boost-secret', displayName: 'Secret BOOST' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
        timeout: 60000,
      },
    });
    if (!credential) throw new Error("Échec de l'enrôlement biométrique.");
    this._biometricCredentialId = bufToBase64(credential.rawId);
    const cfg = loadConfig() || {};
    saveConfig({ ...cfg, biometricCredentialId: this._biometricCredentialId });
    return true;
  }

  disableBiometric() {
    this._biometricCredentialId = null;
    const cfg = loadConfig() || {};
    delete cfg.biometricCredentialId;
    saveConfig(cfg);
  }

  /** Déverrouille via biométrie. Le PIN reste requis pour déchiffrer (voir secretStorage) : la biométrie ne remplace pas la clé, elle accélère juste l'accès à la session déjà chiffrée avec un PIN mémorisé côté session. */
  async unlockWithBiometric() {
    if (!this.isBiometricEnrolled()) return false;
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ id: base64ToBuf(this._biometricCredentialId), type: 'public-key' }],
          userVerification: 'required',
          timeout: 60000,
        },
      });
      if (!assertion) return false;
      this._setUnlocked(true);
      return true;
    } catch (e) {
      console.warn('[SecurityService] biométrie échouée/annulée', e);
      return false;
    }
  }

  // ------------------------------------------------------------
  // Verrouillage automatique
  // ------------------------------------------------------------

  _setUnlocked(value) {
    this._unlocked = value;
    if (value) this._restartAutoLockTimer();
    else this._clearAutoLockTimer();
    this._emit();
  }

  _restartAutoLockTimer() {
    this._clearAutoLockTimer();
    this._lockTimer = setTimeout(() => this.lock(), this._autoLockMs);
  }

  _clearAutoLockTimer() {
    if (this._lockTimer) {
      clearTimeout(this._lockTimer);
      this._lockTimer = null;
    }
  }

  /** À appeler sur toute interaction dans la zone Secret pour repousser le verrouillage auto. */
  notifyActivity() {
    if (this._unlocked) this._restartAutoLockTimer();
  }

  lock() {
    if (!this._unlocked) return;
    this._setUnlocked(false);
  }
}

export const SecurityService = new SecurityServiceImpl();
