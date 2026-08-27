import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { getRandomRecording } from '../utils/voiceStorage.js';

/**
 * MODE « JE VEUX ABANDONNER »
 *
 * Séquence fixe demandée par le prompt :
 * 1. Raisons initiales
 * 2. Objectifs
 * 3. Progrès
 * 4. Victoires
 * 5. Message personnel (si disponible)
 * 6. Une action très simple
 * 7. « Continuer » ou « Faire une pause »
 *
 * Règle non négociable : aucun message culpabilisant, nulle part dans cet
 * écran. Le ton reste factuel, chaleureux, jamais moralisateur — on ne
 * rappelle jamais à la personne ce qu'elle "aurait dû" faire.
 */

function simpleActionFor(data) {
  const nextStepGoal = data.goals.find((g) => g.nextStep);
  if (nextStepGoal) {
    return { text: nextStepGoal.nextStep, goalId: nextStepGoal.id, goalName: nextStepGoal.name };
  }
  if (data.goals[0]) {
    return { text: `Rouvre « ${data.goals[0].name} » et regarde juste où tu en es.`, goalId: data.goals[0].id, goalName: data.goals[0].name };
  }
  return { text: 'Bois un verre d\'eau, respire, et reviens dans 5 minutes si tu veux.', goalId: null, goalName: null };
}

export function AbandonMode() {
  const data = store.getAbandonModeData();
  const action = simpleActionFor(data);

  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">Avant de lâcher</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/'));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  screen.innerHTML = `
    <p class="detail-desc">Regarde ça deux minutes. Ensuite, tu décides — pas de mauvaise réponse.</p>

    <section class="card" style="margin-top: var(--sp-4); border-color: var(--ember-400)">
      <div class="card__label">1 · Pourquoi tu as commencé</div>
      <p class="detail-desc" style="margin-top:var(--sp-2)">${data.whyStatement}</p>
      ${data.goalReasons.map((r) => `
        <p class="detail-desc" style="margin-top:var(--sp-2)"><strong>${r.goalName} :</strong> ${r.why}</p>
      `).join('')}
    </section>

    <section class="card" style="margin-top: var(--sp-4)">
      <div class="card__label">2 · Tes objectifs actifs</div>
      ${data.goals.length ? data.goals.map((g) => `
        <div class="mind-stat-row">
          <div class="progress-header">
            <span class="progress-header__title">${g.name}</span>
            <span class="progress-header__value mono">${g.progress}%</span>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${g.progress}%"></div></div>
        </div>
      `).join('') : `<p class="detail-desc" style="margin-top:var(--sp-2)">Aucun objectif actif pour l'instant — ce n'est pas grave, ça se crée en une minute.</p>`}
    </section>

    <section class="card" style="margin-top: var(--sp-4)">
      <div class="card__label">3 · Ta progression</div>
      <div class="detail-tags-row" style="margin-top:var(--sp-2)">
        <div class="chip">Niveau ${data.xpSummary.level} · ${data.xpSummary.levelName}</div>
        <div class="chip">${data.xpSummary.xp} XP</div>
        <div class="chip">${icons.flame}Streak ${data.streak}</div>
      </div>
    </section>

    <section class="card" style="margin-top: var(--sp-4)">
      <div class="card__label">4 · Tes victoires récentes</div>
      ${data.victories.length ? data.victories.map((v) => `
        <p class="detail-desc" style="margin-top:var(--sp-2)">🏆 ${v.text}</p>
      `).join('') : `<p class="detail-desc" style="margin-top:var(--sp-2)">Pas encore de victoire enregistrée — la prochaine peut être aujourd'hui, en petit.</p>`}
    </section>

    <section class="card" id="personal-message-block" style="margin-top: var(--sp-4); display:none">
      <div class="card__label">5 · Un message de toi, pour toi</div>
      <p class="detail-desc" style="margin-top:var(--sp-2)" id="personal-message-name"></p>
      <audio controls id="personal-message-audio" style="width:100%; margin-top:var(--sp-2)"></audio>
    </section>

    <section class="card" style="margin-top: var(--sp-4); background: var(--bg-surface)">
      <div class="card__label">6 · Une seule chose, très simple</div>
      <p class="detail-desc" style="margin-top:var(--sp-2)">${action.text}</p>
      ${action.goalId ? `<button class="btn-secondary" id="goto-action-goal" style="margin-top:var(--sp-3)">Voir l'objectif</button>` : ''}
    </section>

    <div class="form-actions" style="margin-top: var(--sp-6); flex-direction:column; gap:var(--sp-3)">
      <button type="button" class="btn-primary" id="continue-btn" style="width:100%">Continuer</button>
      <button type="button" class="btn-secondary" id="pause-btn" style="width:100%">Faire une pause</button>
    </div>
  `;

  el.appendChild(screen);

  // Étape 5 — message personnel, chargé de façon asynchrone (IndexedDB) sans bloquer le reste de l'écran.
  getRandomRecording()
    .then((rec) => {
      if (!rec) return;
      const block = screen.querySelector('#personal-message-block');
      block.style.display = '';
      screen.querySelector('#personal-message-name').textContent = `« ${rec.name} »`;
      screen.querySelector('#personal-message-audio').src = URL.createObjectURL(rec.blob);
    })
    .catch(() => {
      // Pas d'enregistrement disponible ou IndexedDB indisponible : l'étape 5 reste simplement masquée.
    });

  screen.querySelector('#goto-action-goal')?.addEventListener('click', () => {
    router.navigate(`/objectifs/${action.goalId}`);
  });

  screen.querySelector('#continue-btn').addEventListener('click', () => {
    router.navigate('/');
  });

  screen.querySelector('#pause-btn').addEventListener('click', () => {
    router.navigate('/');
  });

  return el;
}
