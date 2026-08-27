import { icons } from '../utils/icons.js';

/**
 * Bannière globale "hors connexion", montée une seule fois dans main.js.
 * Rappelle que l'app reste utilisable (rien n'est bloqué) mais que l'IA
 * et l'export ne peuvent pas atteindre l'extérieur pour l'instant.
 * Se met à jour automatiquement via les événements online/offline du navigateur.
 */
export function OfflineBanner() {
  const el = document.createElement('div');
  el.className = 'offline-banner';
  el.style.display = 'none';
  el.innerHTML = `${icons.wifiOff}<span>Hors connexion — tes données restent accessibles, l'IA repasse en mode local.</span>`;

  const sync = () => {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    el.style.display = offline ? 'flex' : 'none';
  };

  window.addEventListener('online', sync);
  window.addEventListener('offline', sync);
  sync();

  return el;
}
