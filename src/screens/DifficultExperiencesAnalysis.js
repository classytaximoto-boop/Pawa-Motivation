import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AppHeader } from '../components/AppHeader.js';
import { AIService, isAIConfigured, isAIEnabled } from '../utils/aiService.js';

/**
 * « Analyse de mes expériences difficiles »
 *
 * Point d'accès UI à AIService.analyzeDifficultExperiences() — la fonction
 * elle-même applique déjà tout le cadrage exigé par le prompt (jamais de
 * diagnostic, présentation comme réflexion sur un thème récurrent,
 * recommandation d'aide professionnelle). Cet écran ne fait qu'afficher le
 * résultat sans jamais reformuler le texte reçu en une affirmation plus
 * forte — le texte de l'IA (ou son repli local) est montré tel quel.
 */
export function DifficultExperiencesAnalysis() {
  const el = document.createElement('div');
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.innerHTML = `
    <div class="detail-header-row" style="padding:0;">
      <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
      <h1 style="font-size:var(--fs-xl)">Mes expériences difficiles</h1>
    </div>
    <p class="detail-desc" style="margin-top:var(--sp-2)">
      Une lecture de ton journal et de tes moments de bas moral récents, pour repérer un thème
      récurrent éventuel — présentée comme une réflexion, jamais comme un diagnostic.
      Le contenu Secret n'est jamais transmis.
    </p>

    ${!isAIEnabled() ? `
      <div class="mind-disclaimer" style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:var(--sp-3); margin-top:var(--sp-3);">
        L'IA est désactivée dans tes paramètres — tu reçois une réponse locale simplifiée. Réactive-la depuis Profil si tu veux l'analyse complète.
      </div>` : !isAIConfigured() ? `
      <div class="mind-disclaimer" style="background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:var(--sp-3); margin-top:var(--sp-3);">
        Le coach IA n'est pas encore connecté à un service en ligne — tu reçois une réponse locale simplifiée en attendant.
      </div>` : ''}

    <div id="analysis-result" style="margin-top:var(--sp-4)"></div>

    <button type="button" class="btn-primary" id="run-analysis-btn" style="width:100%; margin-top:var(--sp-4)">
      Lancer l'analyse
    </button>

    <p class="mind-disclaimer">
      Ceci n'est ni un diagnostic médical ni un diagnostic psychologique. Si un sujet est difficile
      à porter seul·e, en parler à un professionnel (médecin, psychologue, ligne d'écoute) peut vraiment aider.
    </p>
  `;

  el.appendChild(screen);

  screen.querySelector('.back-btn').addEventListener('click', () => router.navigate('/mind'));

  const resultEl = screen.querySelector('#analysis-result');
  const runBtn = screen.querySelector('#run-analysis-btn');

  runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;
    runBtn.textContent = 'Analyse en cours…';
    resultEl.innerHTML = '';

    const result = await AIService.analyzeDifficultExperiences();

    const card = document.createElement('section');
    card.className = `card ${result.ok ? '' : 'state-block--error'}`;
    card.innerHTML = `<p class="detail-desc" style="white-space:pre-wrap">${result.text}</p>`;
    resultEl.appendChild(card);

    if (!result.ok) {
      const retryHint = document.createElement('p');
      retryHint.className = 'mind-disclaimer';
      retryHint.textContent = result.error === 'ai_disabled'
        ? "L'IA est désactivée dans tes paramètres — voici une lecture locale simplifiée."
        : result.error === 'offline'
        ? "Pas de connexion pour le moment — réessaie plus tard pour une analyse plus détaillée."
        : 'Le coach IA est temporairement indisponible. Tes données restent accessibles — réessaie plus tard.';
      resultEl.appendChild(retryHint);
    }

    runBtn.disabled = false;
    runBtn.textContent = 'Relancer l\'analyse';
  });

  return el;
}
