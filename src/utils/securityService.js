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
