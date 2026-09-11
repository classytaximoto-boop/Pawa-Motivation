/**
 * Fournisseurs IA — interchangeables derrière AIService.
 *
 * ⚠️ MODE TEMPORAIRE — clé API Gemini exposée côté client.
 * Choix assumé pour un déploiement rapide (app perso). La clé est visible
 * dans le bundle JS déployé sur GitHub Pages par quiconque l'inspecte.
 * Utiliser une clé dédiée à ce projet, surveiller le quota Gemini de temps
 * en temps, et régénérer la clé sur AI Studio en cas d'usage anormal.
 *
 * Idéalement, migrer plus tard vers un vrai backend proxy (clé côté serveur
 * uniquement) — voir l'historique de ce fichier pour la version prévue à
 * cet effet (AI_BACKEND_URL). Basculer suffira à ce moment-là, le contrat
 * complete({ task, context, prompt }) -> { text } ne change pas.
 *
 * Configuration : définir VITE_GEMINI_API_KEY dans un fichier .env
 * (non commité, à la racine du repo), ex. :
 *   VITE_GEMINI_API_KEY=AIza...
 */

const GEMINI_API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Contrat commun que tout provider doit respecter :
 *   async complete({ task, context, prompt }) -> { text }
 * - task : identifiant de la fonction IA appelée (voir aiService.js), utile
 *   côté backend pour choisir un system prompt adapté par fonction.
 * - context : données déjà filtrées/minimisées (jamais Secret).
 * - prompt : instruction ou message libre (ex. message du coach).
 * Doit lever une erreur en cas d'échec réseau/API — AIService gère le fallback.
 */
class BaseProvider {
  // eslint-disable-next-line no-unused-vars
  async complete({ task, context, prompt }) {
    throw new Error('Provider non implémenté');
  }

  isConfigured() {
    return false;
  }
}

/**
 * GeminiProvider — appelle directement l'API Gemini (generateContent) avec
 * la clé lue depuis VITE_GEMINI_API_KEY. Le "context" n'est pas envoyé tel
 * quel : seul le texte du prompt (déjà construit par aiService.js/aiContext.js
 * avec le contenu minimisé) part vers l'API.
 */
class GeminiProvider extends BaseProvider {
  isConfigured() {
    return Boolean(GEMINI_API_KEY);
  }

  async complete({ task, context, prompt }) {
    if (!this.isConfigured()) {
      throw new Error('VITE_GEMINI_API_KEY non configuré');
    }
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    if (!res.ok) {
      throw new Error(`API Gemini indisponible (HTTP ${res.status})`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Réponse IA vide ou malformée');
    }
    return { text };
  }
}

/**
 * FutureProvider — emplacement réservé pour un second fournisseur
 * (ex. un autre modèle gratuit, ou un modèle auto-hébergé plus tard).
 * Même contrat que GeminiProvider : passerait lui aussi par AI_BACKEND_URL,
 * juste avec provider: 'future' dans le payload, pour que le switch se
 * fasse côté backend sans toucher au client.
 */
class FutureProvider extends BaseProvider {
  isConfigured() {
    return false; // pas encore branché — activer quand un 2e fournisseur existe
  }

  async complete() {
    throw new Error('FutureProvider pas encore disponible');
  }
}

export const providers = {
  gemini: new GeminiProvider(),
  future: new FutureProvider(),
};

/** Fournisseur actif par défaut. Changer ici suffit à migrer toute l'app. */
export const activeProviderId = 'gemini';
