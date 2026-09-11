import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { goalCategories } from '../data/goalCategories.js';

const COACH_STYLES = [
  { id: 'direct', label: 'Direct', desc: 'Franc, sans détour.' },
  { id: 'calme', label: 'Calme', desc: 'Posé, rassurant.' },
  { id: 'militaire', label: 'Militaire', desc: 'Strict, exigeant.' },
  { id: 'professionnel', label: 'Professionnel', desc: 'Neutre, factuel.' },
  { id: 'ami', label: 'Ami', desc: 'Chaleureux, proche.' },
  { id: 'minimal', label: 'Minimal', desc: "Va à l'essentiel." },
];

const STEPS = [
  { key: 'identity', title: 'Qui veux-tu devenir ?' },
  { key: 'mainGoal', title: 'Quel est ton objectif principal ?' },
  { key: 'why', title: 'Pourquoi est-il important ?' },
  { key: 'focusAreas', title: 'Quels domaines veux-tu améliorer ?' },
  { key: 'coachStyle', title: 'Quel style de coach préfères-tu ?' },
  { key: 'morningBoostTime', title: 'À quelle heure veux-tu recevoir ton Morning Boost ?' },
];

/**
 * Onboarding — 6 étapes, une donnée par écran, jamais bloquant : chaque champ
 * a une valeur par défaut raisonnable, donc "Continuer" reste toujours possible.
 * Rien n'est persisté avant la toute dernière étape (store.completeOnboarding),
 * pour ne jamais laisser un état "onboarding à moitié fait" dans le store.
 */
export function Onboarding() {
  let stepIndex = 0;
  const answers = {
    identity: '',
    mainGoal: '',
    why: '',
    focusAreas: [],
    coachStyle: 'direct',
    morningBoostTime: '07:00',
  };

  const el = document.createElement('div');
  el.className = 'onboarding-root';

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.display = 'flex';
  screen.style.flexDirection = 'column';
  screen.style.minHeight = '100vh';

  function renderStepContent(step) {
    if (step.key === 'identity') {
      return `
        <textarea class="form-textarea" id="ob-input" placeholder="Ex : quelqu'un de discipliné, qui tient ses engagements..." style="min-height:120px">${answers.identity}</textarea>
      `;
    }
    if (step.key === 'mainGoal') {
      return `<input class="form-input" type="text" id="ob-input" placeholder="Ex : lancer mon projet, retrouver la forme..." value="${answers.mainGoal}" />`;
    }
    if (step.key === 'why') {
      return `<textarea class="form-textarea" id="ob-input" placeholder="Ce qui rend cet objectif important pour toi..." style="min-height:120px">${answers.why}</textarea>`;
    }
    if (step.key === 'focusAreas') {
      return `
        <div class="detail-tags-row" style="margin-top:var(--sp-2)">
          ${goalCategories.map((c) => `
            <button type="button" class="category-chip ${answers.focusAreas.includes(c.id) ? 'is-active' : ''}" data-focus="${c.id}">
              ${icons[c.icon] ?? icons.sparkles}${c.label}
            </button>`).join('')}
        </div>
        <p class="detail-desc" style="margin-top:var(--sp-3)">Choisis-en un ou plusieurs.</p>
      `;
    }
    if (step.key === 'coachStyle') {
      return `
        <div style="display:flex; flex-direction:column; gap:var(--sp-2)">
          ${COACH_STYLES.map((s) => `
            <button type="button" class="card ob-style-option ${answers.coachStyle === s.id ? 'is-active' : ''}" data-style="${s.id}" style="text-align:left; width:100%;">
              <span class="goal-card__name">${s.label}</span>
              <p class="detail-desc" style="margin-top:var(--sp-1)">${s.desc}</p>
            </button>`).join('')}
        </div>
      `;
    }
    if (step.key === 'morningBoostTime') {
      return `
        <input class="form-input" type="time" id="ob-input" value="${answers.morningBoostTime}" />
        <p class="detail-desc" style="margin-top:var(--sp-3)">Un rappel local pour démarrer ta journée — modifiable à tout moment dans Profil.</p>
      `;
    }
    return '';
  }

  function render() {
    const step = STEPS[stepIndex];
    const isLast = stepIndex === STEPS.length - 1;
    screen.innerHTML = `
      <div class="detail-tags-row" style="padding: var(--sp-5) var(--sp-5) 0; gap:var(--sp-1)">
        ${STEPS.map((_, i) => `<span style="flex:1; height:4px; border-radius:2px; background:${i <= stepIndex ? 'var(--ember-500)' : 'var(--bg-surface-hover)'}"></span>`).join('')}
      </div>
      <div style="padding: var(--sp-6) var(--sp-5); flex:1; display:flex; flex-direction:column;">
        <p class="detail-desc">Étape ${stepIndex + 1} / ${STEPS.length}</p>
        <h1 style="font-size:var(--fs-xl); margin-top:var(--sp-2)">${step.title}</h1>
        <div style="margin-top:var(--sp-5)">${renderStepContent(step)}</div>
        <div style="flex:1"></div>
        <div class="form-actions" style="margin-top:var(--sp-6)">
          ${stepIndex > 0 ? `<button type="button" class="btn-secondary" id="ob-back">Retour</button>` : '<span></span>'}
          <button type="button" class="btn-primary" id="ob-next">${isLast ? 'Commencer' : 'Continuer'}</button>
        </div>
      </div>
    `;

    const input = screen.querySelector('#ob-input');
    if (input) {
      input.addEventListener('input', () => {
        answers[step.key] = input.value;
      });
    }

    screen.querySelectorAll('[data-focus]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.focus;
        if (answers.focusAreas.includes(id)) {
          answers.focusAreas = answers.focusAreas.filter((f) => f !== id);
        } else {
          answers.focusAreas = [...answers.focusAreas, id];
        }
        btn.classList.toggle('is-active');
      });
    });

    screen.querySelectorAll('[data-style]').forEach((btn) => {
      btn.addEventListener('click', () => {
        answers.coachStyle = btn.dataset.style;
        screen.querySelectorAll('[data-style]').forEach((b) => b.classList.toggle('is-active', b.dataset.style === answers.coachStyle));
      });
    });

    screen.querySelector('#ob-back')?.addEventListener('click', () => {
      stepIndex -= 1;
      render();
    });

    screen.querySelector('#ob-next').addEventListener('click', () => {
      if (isLast) {
        store.completeOnboarding({ ...answers });
        router.navigate('/');
        return;
      }
      stepIndex += 1;
      render();
    });
  }

  render();
  el.appendChild(screen);
  return el;
}
