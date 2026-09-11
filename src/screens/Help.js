import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

const FAQ = [
  {
    q: "Mes données sont-elles envoyées sur un serveur ?",
    a: "Non. Toutes tes données (objectifs, journal, finances, Secret, etc.) restent stockées uniquement sur cet appareil, dans le stockage local du navigateur. Rien n'est envoyé sans ton action explicite.",
  },
  {
    q: "Que fait le coach IA avec mes données ?",
    a: "Quand tu utilises le coach ou une analyse IA, seul un contexte minimal et nécessaire à la réponse est transmis (ex. tes objectifs actifs, ton humeur récente). Le contenu de Secret n'est jamais transmis, sous aucune forme, même partiellement.",
  },
  {
    q: "Puis-je utiliser BOOST sans IA ?",
    a: "Oui. Depuis Profil → Intelligence artificielle, tu peux désactiver l'IA complètement. Toutes les fonctions locales (objectifs, missions, XP, rapports, mode abandon, Boost Me) continuent de fonctionner normalement.",
  },
  {
    q: "Que se passe-t-il si je n'ai pas de connexion Internet ?",
    a: "L'application reste entièrement utilisable hors ligne pour tout ce qui ne dépend pas de l'IA. Les fonctions IA basculent automatiquement sur une réponse locale équivalente, sans bloquer l'écran.",
  },
  {
    q: "Comment récupérer mes données sur un nouvel appareil ?",
    a: "Depuis Profil → Sauvegarde, exporte un fichier .json sur l'ancien appareil, puis importe ce même fichier depuis le nouvel appareil.",
  },
  {
    q: "Comment supprimer toutes mes données ?",
    a: "Depuis Profil → Zone dangereuse → Supprimer toutes mes données. Cette action efface tout sur cet appareil, y compris ton code PIN Secret, de façon irréversible.",
  },
];

export function Help() {
  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">Aide &amp; à propos</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/profile'));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  screen.innerHTML = `
    <section class="card">
      <div class="card__label">BOOST</div>
      <p class="detail-desc" style="margin-top:var(--sp-2)">
        Une application personnelle de motivation et de progression : objectifs, missions quotidiennes, XP,
        suivi émotionnel, journal, coach IA et rapports — pensée pour fonctionner entièrement hors ligne.
      </p>
    </section>

    <div class="card__label" style="margin-top: var(--sp-5)">Confidentialité en un coup d'œil</div>
    <section class="card">
      <div class="detail-desc" style="display:flex; flex-direction:column; gap:var(--sp-2)">
        <div style="display:flex; gap:var(--sp-2); align-items:flex-start">${icons.shieldCheck.replace('<svg ', '<svg style="width:18px;height:18px;stroke:currentColor;stroke-width:2;flex-shrink:0;margin-top:1px" ')}<span>Secret n'est jamais envoyé à l'IA, automatiquement ou non.</span></div>
        <div style="display:flex; gap:var(--sp-2); align-items:flex-start">${icons.shieldCheck.replace('<svg ', '<svg style="width:18px;height:18px;stroke:currentColor;stroke-width:2;flex-shrink:0;margin-top:1px" ')}<span>Aucune clé API n'est stockée ni visible dans l'application.</span></div>
        <div style="display:flex; gap:var(--sp-2); align-items:flex-start">${icons.shieldCheck.replace('<svg ', '<svg style="width:18px;height:18px;stroke:currentColor;stroke-width:2;flex-shrink:0;margin-top:1px" ')}<span>Tu peux exporter, importer ou supprimer toutes tes données à tout moment.</span></div>
        <div style="display:flex; gap:var(--sp-2); align-items:flex-start">${icons.shieldCheck.replace('<svg ', '<svg style="width:18px;height:18px;stroke:currentColor;stroke-width:2;flex-shrink:0;margin-top:1px" ')}<span>Tu peux désactiver l'IA complètement dans Profil.</span></div>
      </div>
    </section>

    <div class="card__label" style="margin-top: var(--sp-5)">Questions fréquentes</div>
    <div id="faq-list"></div>
  `;

  const faqList = screen.querySelector('#faq-list');
  FAQ.forEach((item) => {
    const card = document.createElement('details');
    card.className = 'card';
    card.style.marginTop = 'var(--sp-2)';
    card.innerHTML = `
      <summary style="font-weight:700; cursor:pointer; list-style:none;">${item.q}</summary>
      <p class="detail-desc" style="margin-top:var(--sp-2)">${item.a}</p>
    `;
    faqList.appendChild(card);
  });

  el.appendChild(screen);
  return el;
}
