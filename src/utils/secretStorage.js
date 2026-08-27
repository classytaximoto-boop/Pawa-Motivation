/**
 * SecretStorage — chiffrement local du contenu des notes Secret.
 *
 * Pourquoi un module séparé du store principal : `store.js` persiste tout
 * en clair dans localStorage (`boost:v1:state`), ce qui convient aux
 * données non sensibles. Le contenu Secret (titre, texte) ne doit jamais
 * apparaître en clair sur le disque — ce module intercepte donc le champ
 * `text`/`title` d'une SecretNote et le remplace par un blob chiffré
 * (AES-GCM) avant que `store.js` ne le sérialise.
 *
 * La clé de chiffrement est dérivée du PIN via SecurityService et ne vit
 * qu'en mémoire, le temps de la session déverrouillée — jamais persistée.
 * Sans PIN correct, le contenu chiffré est illisible : c'est ça qui rend
 * le verrouillage réel, pas juste un écran qui masque l'UI.
 *
 * Format stocké par note : { iv: base64, cipher: base64 }.
 */

import { SecurityService } from './securityService.js';

let sessionKey = null; // CryptoKey en mémoire uniquement, jamais persisté

/** À appeler juste après un déverrouillage réussi (PIN vérifié), pour dériver et garder la clé en mémoire le temps de la session. */
export async function primeSessionKey(pin) {
  sessionKey = await SecurityService.deriveEncryptionKey(pin);
}

export function clearSessionKey() {
  sessionKey = null;
}

export function hasSessionKey() {
  return sessionKey !== null;
}

function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/** Chiffre une chaîne. Renvoie { iv, cipher } en base64, prêt à persister tel quel. */
export async function encryptText(plainText) {
  if (!sessionKey) throw new Error('Session verrouillée : aucune clé de chiffrement disponible.');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sessionKey, enc.encode(plainText || ''));
  return { iv: bufToBase64(iv), cipher: bufToBase64(cipherBuf) };
}

/** Déchiffre un { iv, cipher } en clair. Renvoie null si la clé ne correspond pas (PIN incorrect / re-chiffré ailleurs). */
export async function decryptText(payload) {
  if (!payload || typeof payload !== 'object' || !payload.iv || !payload.cipher) return '';
  if (!sessionKey) throw new Error('Session verrouillée : aucune clé de chiffrement disponible.');
  try {
    const iv = base64ToBuf(payload.iv);
    const cipherBuf = base64ToBuf(payload.cipher);
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, sessionKey, cipherBuf);
    return new TextDecoder().decode(plainBuf);
  } catch (e) {
    console.warn('[SecretStorage] déchiffrement échoué', e);
    return null; // null distingue "erreur" de "" (note vide), pour que l'écran affiche un message clair
  }
}

/** Vrai si le champ ressemble déjà à un payload chiffré (pour gérer la migration douce d'anciennes notes en clair). */
export function isEncryptedPayload(value) {
  return Boolean(value && typeof value === 'object' && value.iv && value.cipher);
}
