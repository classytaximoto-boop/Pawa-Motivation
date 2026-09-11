import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AIService } from '../utils/aiService.js';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statRow(label, value) {
  return `
    <div class="progress-header">
      <span class="progress-header__title">${label}</span>
      <span class="progress-header__value mono">${value == null ? '—' : value}</span>
    </div>`;
}

/** Rendu du rapport IA hebdomadaire structuré (voir aiService.generateWeeklyAIReport). */
function renderWeeklyAIReportBlock(report, ok) {
  return `
    <section class="card" id="ai-weekly-report-block" style="margin-top: var(--sp-4); border-color: var(--ember-400)">
      <div class="card__label">Analyse IA de la semaine ${ok ? '' : '(mode local)'}</div>
      <p class="detail-desc" style="margin-top:var(--sp-2)"><strong>Progrès :</strong> ${report.progress}</p>
      <p class="detail-desc" style="margin-top:var(--sp-1)"><strong>Blocages :</strong> ${report.blockers}</p>
      ${report.positiveHabits?.length ? `<p class="detail-desc" style="margin-top:var(--sp-1)">✅ <strong>Habitudes positives :</strong> ${report.positiveHabits.join(', ')}</p>` : ''}
      ${report.negativeHabits?.length ? `<p class="detail-desc" style="margin-top:var(--sp-1)">🚫 <strong>Habitudes à surveiller :</strong> ${report.negativeHabits.join(', ')}</p>` : ''}
      ${report.attentionAreas?.length ? `<p class="detail-desc" style="margin-top:var(--sp-1)">👀 <strong>Domaines à surveiller :</strong> ${report.attentionAreas.join(', ')}</p>` : ''}
      <p class="detail-desc" style="margin-top:var(--sp-1)"><strong>Priorité de la semaine prochaine :</strong> ${report.nextWeekPriority}</p>
      <p class="mind-disclaimer" style="margin-top:var(--sp-2)">${report.disclaimer}</p>
    </section>`;
}

export function WeeklyReview() {
  const snapshot = store.getWeeklySnapshot();

  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">Rapport hebdomadaire</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/rapports'));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  screen.innerHTML = `
    <p class="detail-desc">Bilan glissant des 7 derniers jours</p>

    <section class="card" style="margin-top: var(--sp-3)">
      ${statRow('Objectifs atteints', snapshot.goalsCompleted)}
      ${statRow('Missions accomplies', snapshot.missionsCompleted)}
      ${statRow('Progression moyenne des projets', snapshot.avgProjectProgress != null ? `${snapshot.avgProjectProgress}%` : '—')}
      ${statRow('Apports financiers', `${snapshot.financialProgress.toLocaleString('fr-FR')} Ar`)}
      ${statRow('Motivation moyenne', snapshot.avgMotivation != null ? `${snapshot.avgMotivation}/10` : '—')}
      ${statRow('Habitudes tenues', `${snapshot.habitsCompletions} fois sur ${snapshot.habitsCount} habitude${snapshot.habitsCount > 1 ? 's' : ''}`)}
    </section>

    <form id="weekly-form" novalidate>
      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-victories">Victoires de la semaine</label>
        <textarea class="form-textarea" id="f-victories" name="victories" placeholder="Ce qui a bien marché..."></textarea>
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-difficulties">Difficultés rencontrées</label>
        <textarea class="form-textarea" id="f-difficulties" name="difficulties" placeholder="Ce qui a été dur..."></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-primary">Valider le rapport</button>
      </div>
    </form>

    <button type="button" class="btn-secondary" id="ai-weekly-report-btn" style="width:100%; margin-top:var(--sp-4)">
      ${icons.sparkles} Générer l'analyse IA de la semaine
    </button>
    <div id="ai-weekly-report-container"></div>

    <div class="card__label" style="margin-top: var(--sp-6)">Rapports précédents</div>
    <div id="weekly-history"></div>
  `;

  const aiWeeklyBtn = screen.querySelector('#ai-weekly-report-btn');
  const aiWeeklyContainer = screen.querySelector('#ai-weekly-report-container');
  aiWeeklyBtn.addEventListener('click', async () => {
    aiWeeklyBtn.disabled = true;
    aiWeeklyBtn.textContent = 'Analyse en cours…';
    const result = await AIService.generateWeeklyAIReport();
    aiWeeklyContainer.innerHTML = renderWeeklyAIReportBlock(result.report, result.ok);
    aiWeeklyBtn.disabled = false;
    aiWeeklyBtn.innerHTML = `${icons.sparkles} Régénérer l'analyse IA`;
  });

  const history = screen.querySelector('#weekly-history');
  const past = store.listWeeklyReviews();
  if (past.length === 0) {
    history.innerHTML = `<p class="detail-desc">Aucun rapport hebdomadaire précédent.</p>`;
  } else {
    past.forEach((r) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginTop = 'var(--sp-2)';
      card.innerHTML = `
        <div class="progress-header">
          <span class="progress-header__title">${fmtDate(r.createdAt)}</span>
          <span class="progress-header__value mono">${r.goalsCompleted} objectif${r.goalsCompleted > 1 ? 's' : ''}</span>
        </div>
        ${r.victories ? `<p class="detail-desc" style="margin-top:var(--sp-2)">🏆 ${r.victories}</p>` : ''}
        ${r.difficulties ? `<p class="detail-desc" style="margin-top:var(--sp-1)">⚠️ ${r.difficulties}</p>` : ''}
      `;
      history.appendChild(card);
    });
  }

  el.appendChild(screen);

  screen.querySelector('#weekly-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    store.saveWeeklyReview({
      victories: formData.get('victories')?.toString() ?? '',
      difficulties: formData.get('difficulties')?.toString() ?? '',
    });
    router.navigate('/rapports');
  });

  return el;
}
