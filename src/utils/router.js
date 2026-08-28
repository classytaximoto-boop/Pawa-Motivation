/**
 * Router minimaliste basé sur le hash (#/route).
 * Choisi pour une PWA offline-first : aucune configuration serveur nécessaire,
 * fonctionne aussi bien en local, en statique GitHub Pages, ou installée.
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.notFound = null;
    this.currentPath = null;
    this.beforeResolve = null; // (path) => redirectPath|null — voir setBeforeResolve
    window.addEventListener('hashchange', () => this._resolve());
  }

  register(path, renderFn) {
    this.routes.set(path, { renderFn, segments: path.split('/').filter(Boolean) });
    return this;
  }

  setNotFound(renderFn) {
    this.notFound = renderFn;
    return this;
  }

  /**
   * Garde global exécuté avant chaque résolution de route (navigation directe,
   * hashchange, ou start()). fn reçoit le chemin demandé et renvoie soit un
   * chemin de redirection (string), soit null/undefined pour laisser passer.
   * Utilisé pour l'onboarding obligatoire — évite de patcher chaque route
   * individuellement, et évite le flash d'un mauvais écran avant redirection.
   */
  setBeforeResolve(fn) {
    this.beforeResolve = fn;
    return this;
  }

  start(defaultPath = '/') {
    if (!window.location.hash) {
      window.location.hash = `#${defaultPath}`;
    }
    this._resolve();
  }

  navigate(path) {
    window.location.hash = `#${path}`;
  }

  _match(path) {
    const pathSegments = path.split('/').filter(Boolean);
    for (const { renderFn, segments } of this.routes.values()) {
      if (segments.length !== pathSegments.length) continue;
      const params = {};
      const isMatch = segments.every((seg, i) => {
        if (seg.startsWith(':')) {
          params[seg.slice(1)] = decodeURIComponent(pathSegments[i]);
          return true;
        }
        return seg === pathSegments[i];
      });
      if (isMatch) return { renderFn, params };
    }
    return null;
  }

  _resolve() {
    const path = window.location.hash.replace(/^#/, '') || '/';
    const redirect = this.beforeResolve?.(path);
    if (redirect && redirect !== path) {
      window.location.hash = `#${redirect}`;
      return;
    }
    this.currentPath = path;
    const match = this._match(path);
    const mount = document.getElementById('screen-root');
    if (!mount) return;
    if (!match) {
      mount.innerHTML = '';
      if (this.notFound) mount.appendChild(this.notFound());
      document.dispatchEvent(new CustomEvent('boost:navigated', { detail: { path } }));
      return;
    }
    mount.innerHTML = '';
    mount.scrollTop = 0;
    try {
      mount.appendChild(match.renderFn(match.params));
    } catch (err) {
      mount.innerHTML = `<div style="background:red;color:white;font-size:16px;padding:16px;border:4px solid yellow;white-space:pre-wrap;font-family:monospace;">ERREUR DE RENDU pour "${path}" :\n\n${err.stack || err.message || err}</div>`;
      console.error('Erreur de rendu route', path, err);
    }
    document.dispatchEvent(new CustomEvent('boost:navigated', { detail: { path } }));
    return;
  }
}

export const router = new Router();
