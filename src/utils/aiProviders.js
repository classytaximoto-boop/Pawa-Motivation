/**
 * Fournisseurs IA — interchangeables derrière AIService.
 *
 * RÈGLE NON NÉGOCIABLE : aucune clé API dans le code de l'app mobile/web.
 * Le client BOOST n'appelle jamais Gemini (ou tout autre fournisseur)
 * directement. Il appelle un backend proxy à nous (à héberger séparément),
 * qui lui détient la clé API côté serveur, applique son propre rate-limit,
 * et peut changer de fournisseur sans que l'app ait à être mise à jour.
 *
 * Tant que ce backend n'est pas déployé, AI_BACKEND_URL reste vide et
 * AIService bascule automatiquement sur des réponses locales (voir
 * aiService.js → _localFallback). L'app reste 100% utilisable offline.
 *
 * Pour activer un vrai backend : définir VITE_AI_BACKEND_URL dans un
 * fichier .env (non commité) au build, ex. :
 *   VITE_AI_BACKEND_URL=https://boost-ai-proxy.example.com
 */

const AI_BACKEND_URL = import.meta.env?.VITE_AI_BACKEND_URL || '';

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
 * GeminiProvider — n'appelle PAS Gemini directement.
 * Il appelle notre propre backend (AI_BACKEND_URL + '/ai/complete'), qui lui
 * fait le relais vers l'API Gemini avec la clé côté serveur. Le nom reflète
 * le fournisseur utilisé "derrière", pas l'endpoint contacté par le client.
 */
class GeminiProvider extends BaseProvider {
  isConfigured() {
    return Boolean(AI_BACKEND_URL);
  }

  async complete({ task, context, prompt }) {
    if (!this.isConfigured()) {
      throw new Error('AI_BACKEND_URL non configuré');
    }
    const res = await fetch(`${AI_BACKEND_URL}/ai/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, context, prompt, provider: 'gemini' }),
    });
    if (!res.ok) {
      throw new Error(`Backend IA indisponible (HTTP ${res.status})`);
    }
    const data = await res.json();
    if (!data?.text) {
      throw new Error('Réponse IA vide ou malformée');
    }
    return { text: data.text };
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
