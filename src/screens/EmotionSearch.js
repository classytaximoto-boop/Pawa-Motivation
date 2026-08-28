import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AppHeader } from '../components/AppHeader.js';
import { emotionStates, searchEmotionStates, pickPersonaLines } from '../data/emotionCoach.js';

let lastQuery = '';
let lastResults = null; // null = pas encore cherché, [] = aucun résultat

function resultCard(state) {
  const personaLines = pickPersonaLines(state.personaKeys || []);
  return `
    <div class="card" style="margin-top: var(--sp-4); border-color: var(--border-subtle);">
      <div style="display:flex; align-items:center; gap:var(--sp-2); margin-bottom:var(--sp-2);">
        <span style="font-size:1.4em;">${state.emoji}</span>
        <h2 style="font-size:var(--fs-lg); margin:0;">${state.label}</h2>
      </div>
      <p style="color:var(--text-secondary); margin-bottom:var(--sp-3);">${state.message}</p>

      <h3 style="font-size:var(--fs-sm); text-transform:uppercase; letter-spacing:0.04em; color:var(--text-tertiary); margin-bottom:var(--sp-2);">Ce que tu peux faire maintenant</h3>
      <ul style="margin:0 0 var(--sp-3) 0; padding-left: 1.2em; display:flex; flex-direction:column; gap:var(--sp-2);">
        ${state.actions.map((a) => `<li style="color:var(--text-primary);">${a}</li>`).join('')}
      </ul>

      ${personaLines.length ? `
        <h3 style="font-size:var(--fs-sm); text-transform:uppercase; letter-spacing:0.04em; color:var(--text-tertiary); margin-bottom:var(--sp-2);">Voix</h3>
        <div style="display:flex; flex-direction:column; gap:var(--sp-3);">
          ${personaLines.map((p) => `
            <div style="border-left: 3px solid var(--ember-500); padding-left: var(--sp-3);">
              <p style="font-style:italic; margin:0 0 4px 0;">« ${p.line} »</p>
              <p style="font-size:var(--fs-sm); color:var(--text-tertiary); margin:0;">— ${p.name}, ${p.source}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${state.isSensitive ? `
        <div class="mind-disclaimer" style="margin-top:var(--sp-3);">
          Si tu es en danger, si quelqu'un te menace ou te frappe régulièrement, ou si tu penses pouvoir blesser gravement quelqu'un, ce n'est plus seulement une question de gestion émotionnelle — cherche une personne de confiance ou une aide extérieure sans attendre.
        </div>
      ` : ''}
    </div>
  `;
}

export function EmotionSearch() {
  const el = document.createElement('div');
  const debugBanner = document.createElement('div');
  debugBanner.style.cssText = 'background:red;color:white;font-size:20px;padding:16px;border:4px solid yellow;';
  debugBanner.textContent = 'TEST DEBUG — EmotionSearch() a démarré, emotionStates.length = ' + emotionStates.length;
  el.appendChild(debugBanner);
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen';

  screen.innerHTML = `
    <div class="detail-header-row" style="padding:0;">
      <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
      <h1 style="font-size:var(--fs-xl)">Ce que je ressens</h1>
    </div>
    <p class="detail-desc" style="margin-top:var(--sp-2)">
      Écris ton problème ou juste un mot-clé — "stresser", "colère", "seul"... — et reçois de quoi avancer.
    </p>

    <form id="emotion-search-form" style="margin-top:var(--sp-4)">
      <input
        type="text"
        class="form-input"
        id="emotion-search-input"
        placeholder="Ex : je stresse pour demain..."
        autocomplete="off"
        value="${lastQuery.replace(/"/g, '&quot;')}"
      />
      <button type="submit" class="btn-primary" style="width:100%; margin-top:var(--sp-3);">Chercher</button>
    </form>

    <div class="category-scroll" id="emotion-quick-picks" style="margin-top:var(--sp-4);">
      ${emotionStates.map((s) => `<button type="button" class="category-chip" data-emotion="${s.id}">${s.emoji} ${s.label}</button>`).join('')}
    </div>

    <div id="emotion-results"></div>
  `;

  el.appendChild(screen);

  screen.querySelector('.back-btn').addEventListener('click', () => router.navigate('/mind'));

  const form = screen.querySelector('#emotion-search-form');
  const input = screen.querySelector('#emotion-search-input');
  const resultsEl = screen.querySelector('#emotion-results');

  function renderResults() {
    if (lastResults === null) {
      resultsEl.innerHTML = '';
      return;
    }
    if (lastResults.length === 0) {
      resultsEl.innerHTML = `
        <div class="state-block" style="padding-top: var(--sp-6)">
          ${icons.mind.replace('<svg ', '<svg class="state-block__icon" ')}
          <h2 class="state-block__title">Aucun mot-clé reconnu</h2>
          <p class="state-block__desc">Essaie un mot plus simple, ou choisis directement une émotion ci-dessus.</p>
        </div>`;
      return;
    }
    resultsEl.innerHTML = lastResults.map(resultCard).join('');
  }

  function runSearch(query) {
    lastQuery = query;
    lastResults = searchEmotionStates(query);
    renderResults();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    runSearch(input.value);
  });

  screen.querySelectorAll('[data-emotion]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const state = emotionStates.find((s) => s.id === btn.dataset.emotion);
      input.value = state.label;
      lastQuery = state.label;
      lastResults = [state];
      renderResults();
    });
  });

  renderResults();

  return el;
}
