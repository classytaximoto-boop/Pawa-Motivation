/**
 * secretGuard — protège toutes les routes /secret*.
 *
 * Enveloppe une fonction d'écran : si la session Secret n'est pas
 * déverrouillée (PIN pas encore saisi, ou verrouillage auto déclenché),
 * affiche SecretLock à la place et bloque l'accès à l'écran réel — quel
 * que soit le chemin utilisé pour y arriver (lien direct, retour navigateur,
 * hash tapé à la main).
 */

import { SecurityService } from './securityService.js';
import { hasSessionKey } from './secretStorage.js';
import { SecretLock } from '../screens/SecretLock.js';

export function secretGuard(renderFn) {
  return (params) => {
    if (!SecurityService.isUnlocked() || !hasSessionKey()) {
      return SecretLock({ mode: 'guard' });
    }
    SecurityService.notifyActivity();
    return renderFn(params);
  };
}
