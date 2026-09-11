import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { moodMap } from '../data/moods.js';
import { AIService } from '../utils/aiService.js';

function fmtDay(dayKey) {
  return new Date(dayKey).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' });
}

function statChip(label, value, unit = '') {
  return `<div class="chip">${label} : <strong>${value == null ? '—' : value + unit}</strong></div>`;
}

/** Rendu du rapport IA structuré (mêmes clés que le fallback local — voir aiService.generateDailyAIReport). */
function renderAIReportBlock(report, ok) {
  return `
    <section class="card" id="ai-report-block" style="margin-top: var(--sp-4); border-color: var(--ember-400)">
      <div class="card__label">Analyse IA de la journée ${ok ? '' : '(mode local)'}</div>
      <p class="detail-desc" style="margin-top:var(--sp-2)"><strong>Résumé :</strong> ${report.summary}</p>
      <p class="detail-desc" style="margin-top:var(--sp-1)">🏆 <strong>Victoire :</strong> ${report.victory}</p>
      <p class="detail-desc" style="margin-top:var(--sp-1)">⚠️ <strong>Difficulté :</strong> ${report.difficulty}</p>
      <p class="detail-desc" style="margin-top:var(--sp-1)"><strong>Tendance émotionnelle :</strong> ${report.emotionalTrend}</p>
      ${report.goalAdvanced ? `<p class="detail-desc" style="margin-top:var(--sp-1)"><strong>Objectif avancé :</strong> ${report.goalAdvanced}</p>` : ''}
      <p class="detail-desc" style="margin-top:var(--sp-1)"><strong>Prochaine priorité :</strong> ${report.nextPriority}</p>
      <p class="detail-desc" style="margin-top:var(--sp-2); color:var(--ember-400)">${report.motivationMessage}</p>
    </section>`;
}

export function DailyReview() {
  const todayKey = store.todayKey();
  const existing = store.getDailyReviewByDay(todayKey);
  const snapshot = store.getDailySnapshot(todayKey);
  const mood = (existing?.mood ?? snapshot.mood) ? moodMap[existing?.mood ?? snapshot.mood] : null;

  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">Rapport du jour</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/'));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  screen.innerHTML = `
    <p class="detail-desc" style="text-transform:capitalize">${fmtDay(todayKey)}</p>

    <section class="card" style="margin-top: var(--sp-3)">
      <div class="card__label">Résumé automatique</div>
      <div class="detail-tags-row" style="margin-top:var(--sp-2)">
        ${statChip('Missions', `${existing?.missionsDone ?? snapshot.missionsDone}/${existing?.missionsTotal ?? snapshot.missionsTotal}`)}
        ${statChip('Objectifs avancés', existing?.goalsAdvanced ?? snapshot.goalsAdvanced)}
        ${statChip('Projets avancés', existing?.projectsAdvanced ?? snapshot.projectsAdvanced)}
        ${mood ? `<div class="chip">${mood.emoji} ${mood.label}</div>` : ''}
      </div>
      ${(existing?.motivation ?? snapshot.motivation) != null ? `
      <div class="detail-tags-row" style="margin-top:var(--sp-2)">
        ${statChip('Motivation', existing?.motivation ?? snapshot.motivation, '/10')}
        ${statChip('Énergie', existing?.energy ?? snapshot.energy, '/10')}
        ${statChip('Stress', existing?.stress ?? snapshot.stress, '/10')}
      </div>` : `<p class="detail-desc" style="margin-top:var(--sp-2)">Fais un check-in émotionnel dans Mind pour compléter ce résumé.</p>`}
    </section>

    <form id="review-form" novalidate>
      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-victory">Victoire du jour</label>
        <textarea class="form-textarea" id="f-victory" name="victory" placeholder="Ce dont tu es fier aujourd'hui...">${existing?.victory ?? ''}</textarea>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-problem">Problème du jour <span class="optional">(optionnel)</span></label>
        <textarea class="form-textarea" id="f-problem" name="problem" placeholder="Une difficulté rencontrée...">${existing?.problem ?? ''}</textarea>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-learned">Ce que j'ai appris</label>
        <textarea class="form-textarea" id="f-learned" name="learned" placeholder="Une leçon, un déclic...">${existing?.learned ?? ''}</textarea>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-tomorrow">Ce que je dois faire demain</label>
        <textarea class="form-textarea" id="f-tomorrow" name="tomorrow" placeholder="La priorité de demain...">${existing?.tomorrow ?? ''}</textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-primary">${existing ? 'Enregistrer' : 'Valider le rapport'}</button>
      </div>
    </form>

    <button type="button" class="btn-secondary" id="ai-report-btn" style="width:100%; margin-top:var(--sp-4)">
      ${icons.sparkles} Générer l'analyse IA de la journée
    </button>
    <div id="ai-report-container"></div>
  `;

  el.appendChild(screen);

  const aiBtn = screen.querySelector('#ai-report-btn');
  const aiContainer = screen.querySelector('#ai-report-container');
  aiBtn.addEventListener('click', async () => {
    aiBtn.disabled = true;
    aiBtn.textContent = 'Analyse en cours…';
    const result = await AIService.generateDailyAIReport(todayKey);
    aiContainer.innerHTML = renderAIReportBlock(result.report, result.ok);
    aiBtn.disabled = false;
    aiBtn.innerHTML = `${icons.sparkles} Régénérer l'analyse IA`;
  });

  screen.querySelector('#review-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    store.saveDailyReview({
      victory: formData.get('victory')?.toString() ?? '',
      problem: formData.get('problem')?.toString() ?? '',
      learned: formData.get('learned')?.toString() ?? '',
      tomorrow: formData.get('tomorrow')?.toString() ?? '',
    });
    router.navigate('/rapports');
  });

  return el;
}
