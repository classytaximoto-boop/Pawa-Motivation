import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { moods, moodMap, commonCauses } from '../data/moods.js';
import { problemStatuses, problemStatusMap, problemImportance, problemImportanceMap } from '../data/problems.js';
import { leadershipDimensions, emptyLeadershipScores, averageLeadershipScore } from '../data/leadership.js';
import { quotes } from '../data/quotes.js';
import { scripts, scriptThemes } from '../data/scripts.js';

// État local de l'écran (pas persisté) : onglet actif + fenêtre de stats + humeur sélectionnée dans le formulaire.
let activeTab = 'checkin'; // checkin | history | stats | problems | leadership | quotes | xp
let statsWindow = 7; // 7 | 30
let selectedMood = 'neutral';
let selectedCause = '';
// Intensité mémorisée par émotion (id du mood -> valeur du slider 0-10), pour que
// changer d'émotion dans le check-in ne fasse pas perdre le réglage précédent.
let moodIntensities = {};

// État local pour l'onglet Problèmes.
let problemFilter = 'OPEN'; // OPEN | IN_PROGRESS | SOLVED | ARCHIVED | all
let openProblemForm = null; // null | 'new' | problemId (édition)
let formProblemImportance = 'moyenne';
let formProblemEmotion = '';

// État local pour l'onglet Leadership.
let showLeadershipForm = false;
let formLeadershipScores = emptyLeadershipScores();

// État local pour l'onglet Citations : index courant dans la liste fusionnée + thème filtré.
let quoteIndex = 0;
let quoteThemeFilter = ''; // '' = tous | 'short' = citations courtes | id de scriptThemes

// Liste fusionnée : citations courtes (quotes.js) + scripts longs (scripts.js), forme commune.
const allQuoteEntries = [
  ...quotes.map((q) => ({ kind: 'short', title: q.author, text: q.text, theme: 'short' })),
  ...scripts.map((s) => ({ kind: 'long', title: s.title, text: s.text, theme: s.theme })),
];

function filteredQuoteEntries() {
  if (!quoteThemeFilter) return allQuoteEntries;
  return allQuoteEntries.filter((e) => e.theme === quoteThemeFilter);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' · ' +
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function sliderRow({ id, label, value, min = 0, max = 10 }) {
  return `
    <div class="mind-slider-row">
      <div class="mind-slider-row__top">
        <label class="form-label" for="${id}">${label}</label>
        <span class="mind-slider-row__value mono" id="${id}-out">${value}</span>
      </div>
      <input class="mind-slider" type="range" min="${min}" max="${max}" step="1" id="${id}" value="${value}" />
    </div>`;
}

function renderCheckin(screen) {
  screen.innerHTML = `
    <form id="emotion-form" novalidate>
      <div class="form-group">
        <label class="form-label">Humeur</label>
        <div class="mood-picker" id="mood-picker">
          ${moods.map((m) => `
            <button type="button" class="mood-picker-item ${selectedMood === m.id ? 'is-selected' : ''}" data-mood="${m.id}">
              <span class="mood-picker-item__emoji">${m.emoji}</span>
              <span>${m.label}</span>
            </button>`).join('')}
        </div>
      </div>

      <div class="card" style="margin-top: var(--sp-4)">
        ${sliderRow({ id: 'f-motivation', label: 'Motivation', value: 5 })}
        ${sliderRow({ id: 'f-energy', label: 'Énergie', value: 5 })}
        ${sliderRow({ id: 'f-stress', label: 'Stress', value: 5 })}
        ${sliderRow({ id: 'f-intensity', label: 'Intensité de l’émotion', value: moodIntensities[selectedMood] ?? 0, min: -10, max: 10 })}
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label">Cause <span class="optional">(optionnel)</span></label>
        <div class="category-scroll" id="cause-scroll">
          ${commonCauses.map((c) => `
            <button type="button" class="category-chip ${selectedCause === c ? 'is-active' : ''}" data-cause="${c}">${c}</button>
          `).join('')}
        </div>
        <input class="form-input" id="f-cause" name="cause" placeholder="Ou précise ici..." style="margin-top: var(--sp-2)" value="${selectedCause && !commonCauses.includes(selectedCause) ? selectedCause : ''}" />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-text">Note <span class="optional">(optionnel)</span></label>
        <textarea class="form-textarea" id="f-text" name="text" placeholder="Qu'est-ce qui se passe pour toi en ce moment ?"></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-primary" style="width:100%">Enregistrer le check-in</button>
      </div>
    </form>
  `;

  screen.querySelectorAll('[data-mood]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedMood = btn.dataset.mood;
      screen.querySelectorAll('[data-mood]').forEach((b) => b.classList.toggle('is-selected', b.dataset.mood === selectedMood));
      const intensityInput = screen.querySelector('#f-intensity');
      const intensityOut = screen.querySelector('#f-intensity-out');
      const value = moodIntensities[selectedMood] ?? 0;
      intensityInput.value = value;
      intensityOut.textContent = value;
    });
  });

  screen.querySelectorAll('[data-cause]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCause = selectedCause === btn.dataset.cause ? '' : btn.dataset.cause;
      screen.querySelectorAll('[data-cause]').forEach((b) => b.classList.toggle('is-active', b.dataset.cause === selectedCause));
      screen.querySelector('#f-cause').value = '';
    });
  });

  ['f-motivation', 'f-energy', 'f-stress', 'f-intensity'].forEach((id) => {
    const input = screen.querySelector(`#${id}`);
    const out = screen.querySelector(`#${id}-out`);
    input.addEventListener('input', () => {
      out.textContent = input.value;
      if (id === 'f-intensity') moodIntensities[selectedMood] = Number(input.value);
    });
  });

  screen.querySelector('#emotion-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const typedCause = formData.get('cause')?.toString().trim();
    store.createEmotionEntry({
      mood: selectedMood,
      motivation: screen.querySelector('#f-motivation').value,
      energy: screen.querySelector('#f-energy').value,
      stress: screen.querySelector('#f-stress').value,
      intensity: screen.querySelector('#f-intensity').value,
      cause: typedCause || selectedCause,
      text: formData.get('text')?.toString() ?? '',
    });
    selectedMood = 'neutral';
    selectedCause = '';
    moodIntensities = {};
    activeTab = 'history';
    router.navigate('/mind');
  });
}

function mindDeleteConfirmSheet({ title, desc }, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">${title}</h2>
      <p class="confirm-sheet__desc">${desc}</p>
      <div class="form-actions">
        <button class="btn-secondary" id="cancel-delete">Annuler</button>
        <button class="btn-danger" id="confirm-delete">Supprimer</button>
      </div>
    </div>
  `;
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.remove();
  });
  backdrop.querySelector('#cancel-delete').addEventListener('click', () => backdrop.remove());
  backdrop.querySelector('#confirm-delete').addEventListener('click', () => {
    onConfirm();
    backdrop.remove();
  });
  return backdrop;
}

function historyRow(entry) {
  const meta = moodMap[entry.mood] ?? moodMap.neutral;
  const row = document.createElement('div');
  row.className = 'card mind-entry';
  row.innerHTML = `
    <div class="mind-entry__top">
      <div class="mind-entry__mood">
        <span class="mood-emoji">${meta.emoji}</span>
        <div>
          <div class="mood-row__value">${meta.label}</div>
          <div class="mind-entry__date">${formatDate(entry.date)}</div>
        </div>
      </div>
      <button class="icon-btn icon-btn--danger" aria-label="Supprimer" data-delete="${entry.id}">${icons.trash}</button>
    </div>
    <div class="mind-entry__metrics">
      <span>Motiv. <strong class="mono">${entry.motivation ?? '—'}</strong></span>
      <span>Énergie <strong class="mono">${entry.energy ?? '—'}</strong></span>
      <span>Stress <strong class="mono">${entry.stress ?? '—'}</strong></span>
      <span>Intensité <strong class="mono">${entry.intensity ?? '—'}</strong></span>
    </div>
    ${entry.cause ? `<div class="mind-entry__cause">Cause : ${entry.cause}</div>` : ''}
    ${entry.text ? `<p class="mind-entry__text">${entry.text}</p>` : ''}
  `;
  row.querySelector('[data-delete]').addEventListener('click', (ev) => {
    ev.stopPropagation();
    document.body.appendChild(mindDeleteConfirmSheet(
      { title: 'Supprimer ce check-in ?', desc: 'Cette entrée émotionnelle sera supprimée définitivement. Cette opération est irréversible.' },
      () => {
        store.deleteEmotionEntry(entry.id);
        router.navigate('/mind');
      }
    ));
  });
  return row;
}

function renderHistory(screen) {
  const entries = store.listEmotionEntries();
  screen.innerHTML = `<div class="mind-history" id="mind-history"></div>`;
  const list = screen.querySelector('#mind-history');
  if (!entries.length) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-8)">
        ${icons.mind.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">Aucun check-in pour le moment</h2>
        <p class="state-block__desc">Enregistre ton premier check-in pour commencer à suivre ton évolution.</p>
      </div>`;
    return;
  }
  entries.forEach((entry) => list.appendChild(historyRow(entry)));
}

function statBar(label, value, max = 10) {
  const pct = value == null ? 0 : Math.round((value / max) * 100);
  return `
    <div class="mind-stat-row">
      <div class="progress-header">
        <span class="progress-header__title">${label}</span>
        <span class="progress-header__value mono">${value == null ? '—' : value}</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`;
}

function renderStats(screen) {
  const stats = store.getEmotionStats(statsWindow);
  const freqEntries = Object.entries(stats.moodFrequency).sort(([, a], [, b]) => b - a);

  screen.innerHTML = `
    <div class="tab-row" role="tablist" style="margin-bottom: var(--sp-4)">
      <button class="tab-btn ${statsWindow === 7 ? 'is-active' : ''}" data-window="7">7 jours</button>
      <button class="tab-btn ${statsWindow === 30 ? 'is-active' : ''}" data-window="30">30 jours</button>
    </div>

    ${stats.count === 0 ? `
      <div class="state-block" style="padding-top: var(--sp-6)">
        ${icons.sparkles.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">Pas encore assez de données</h2>
        <p class="state-block__desc">Fais quelques check-ins pour voir tes statistiques sur ${statsWindow} jours.</p>
      </div>` : `
      <p class="mind-stats-count">${stats.count} check-in${stats.count > 1 ? 's' : ''} sur les ${statsWindow} derniers jours</p>
      <div class="card">
        ${statBar('Motivation moyenne', stats.avgMotivation)}
        ${statBar('Énergie moyenne', stats.avgEnergy)}
        ${statBar('Stress moyen', stats.avgStress)}
        ${statBar('Intensité moyenne', stats.avgIntensity)}
      </div>

      <div class="card__label" style="margin-top: var(--sp-5)">Fréquence des humeurs</div>
      <div class="card">
        ${freqEntries.map(([moodId, count]) => {
          const meta = moodMap[moodId] ?? moodMap.neutral;
          const pct = Math.round((count / stats.count) * 100);
          return `
            <div class="mind-stat-row">
              <div class="progress-header">
                <span class="progress-header__title">${meta.emoji} ${meta.label}</span>
                <span class="progress-header__value mono">${count} (${pct}%)</span>
              </div>
              <div class="progress-track"><div class="progress-fill progress-fill--steel" style="width:${pct}%"></div></div>
            </div>`;
        }).join('')}
      </div>

      <p class="mind-disclaimer">Ces chiffres sont de simples moyennes calculées à partir de tes check-ins — ce n'est pas un diagnostic psychologique.</p>
    `}

    <button type="button" class="btn-secondary" id="difficult-experiences-btn" style="width:100%; margin-top:var(--sp-3)">
      Analyse de mes expériences difficiles
    </button>
  `;

  screen.querySelector('#difficult-experiences-btn')?.addEventListener('click', () => router.navigate('/mind/experiences-difficiles'));

  screen.querySelectorAll('[data-window]').forEach((btn) => {
    btn.addEventListener('click', () => {
      statsWindow = Number(btn.dataset.window);
      renderStats(screen);
    });
  });
}

function problemForm(screen, existing) {
  formProblemImportance = existing?.importance ?? 'moyenne';
  formProblemEmotion = existing?.emotion ?? '';

  const wrap = document.createElement('form');
  wrap.className = 'card';
  wrap.id = 'problem-form';
  wrap.innerHTML = `
    <div class="form-group">
      <label class="form-label" for="pf-title">Problème</label>
      <input class="form-input" id="pf-title" name="title" placeholder="Décris le problème" value="${existing?.title ?? ''}" required />
    </div>

    <div class="form-group" style="margin-top: var(--sp-3)">
      <label class="form-label">Importance</label>
      <div class="priority-picker" id="pf-importance-picker">
        ${problemImportance.map((p) => `
          <button type="button" class="priority-picker-item ${formProblemImportance === p.id ? 'is-selected' : ''}" data-importance="${p.id}">
            <span class="priority-dot" style="background:var(${p.color})"></span>${p.label}
          </button>`).join('')}
      </div>
    </div>

    <div class="form-group" style="margin-top: var(--sp-3)">
      <label class="form-label">Émotion associée <span class="optional">(optionnel)</span></label>
      <div class="mood-picker" id="pf-emotion-picker">
        ${moods.map((m) => `
          <button type="button" class="mood-picker-item ${formProblemEmotion === m.id ? 'is-selected' : ''}" data-emotion="${m.id}">
            <span class="mood-picker-item__emoji">${m.emoji}</span>
            <span>${m.label}</span>
          </button>`).join('')}
      </div>
    </div>

    <div class="form-group" style="margin-top: var(--sp-3)">
      <label class="form-label" for="pf-cause">Cause supposée <span class="optional">(optionnel)</span></label>
      <textarea class="form-textarea" id="pf-cause" name="cause" placeholder="D'où vient ce problème selon toi ?">${existing?.cause ?? ''}</textarea>
    </div>

    <div class="form-group" style="margin-top: var(--sp-3)">
      <label class="form-label" for="pf-solution">Solution envisagée <span class="optional">(optionnel)</span></label>
      <textarea class="form-textarea" id="pf-solution" name="solution" placeholder="Quelle solution veux-tu essayer ?">${existing?.solution ?? ''}</textarea>
    </div>

    <div class="form-group" style="margin-top: var(--sp-3)">
      <label class="form-label" for="pf-action">Action <span class="optional">(optionnel)</span></label>
      <textarea class="form-textarea" id="pf-action" name="action" placeholder="Quelle action concrète vas-tu poser ?">${existing?.action ?? ''}</textarea>
    </div>

    <div class="form-group" style="margin-top: var(--sp-3)">
      <label class="form-label" for="pf-result">Résultat <span class="optional">(optionnel)</span></label>
      <textarea class="form-textarea" id="pf-result" name="result" placeholder="Qu'est-ce que ça a donné ?">${existing?.result ?? ''}</textarea>
    </div>

    <p class="form-error" id="pf-error" hidden>Le titre du problème est requis.</p>

    <div class="form-actions">
      <button type="button" class="btn-secondary" id="pf-cancel">Annuler</button>
      <button type="submit" class="btn-primary">${existing ? 'Enregistrer' : 'Créer'}</button>
    </div>
  `;

  wrap.querySelectorAll('[data-importance]').forEach((btn) => {
    btn.addEventListener('click', () => {
      formProblemImportance = btn.dataset.importance;
      wrap.querySelectorAll('[data-importance]').forEach((b) => b.classList.toggle('is-selected', b.dataset.importance === formProblemImportance));
    });
  });

  wrap.querySelectorAll('[data-emotion]').forEach((btn) => {
    btn.addEventListener('click', () => {
      formProblemEmotion = formProblemEmotion === btn.dataset.emotion ? '' : btn.dataset.emotion;
      wrap.querySelectorAll('[data-emotion]').forEach((b) => b.classList.toggle('is-selected', b.dataset.emotion === formProblemEmotion));
    });
  });

  wrap.querySelector('#pf-cancel').addEventListener('click', () => {
    openProblemForm = null;
    renderProblems(screen);
  });

  wrap.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('title')?.toString().trim();
    if (!title) {
      wrap.querySelector('#pf-error').hidden = false;
      wrap.querySelector('#pf-title').focus();
      return;
    }
    const fields = {
      title,
      importance: formProblemImportance,
      emotion: formProblemEmotion,
      cause: formData.get('cause')?.toString() ?? '',
      solution: formData.get('solution')?.toString() ?? '',
      action: formData.get('action')?.toString() ?? '',
      result: formData.get('result')?.toString() ?? '',
    };
    if (existing) {
      store.updateProblem(existing.id, fields);
    } else {
      store.createProblem(fields);
    }
    openProblemForm = null;
    renderProblems(screen);
  });

  return wrap;
}

function problemCard(problem, screen) {
  const status = problemStatusMap[problem.status] ?? problemStatusMap.OPEN;
  const importance = problemImportanceMap[problem.importance] ?? problemImportanceMap.moyenne;
  const emotionMeta = problem.emotion ? (moodMap[problem.emotion] ?? null) : null;

  const card = document.createElement('div');
  card.className = 'card mind-entry';
  card.innerHTML = `
    <div class="mind-entry__top">
      <div>
        <div class="goal-card__title-row">
          <span class="priority-dot" style="background:var(${importance.color})"></span>
          <span class="goal-card__name">${problem.title}</span>
        </div>
        <div class="goal-card__meta-row" style="margin-top:4px">
          <span class="category-tag" style="color:var(${status.color})">${status.label}</span>
          ${emotionMeta ? `<span class="mood-emoji" style="font-size:var(--fs-sm)">${emotionMeta.emoji} ${emotionMeta.label}</span>` : ''}
        </div>
      </div>
      <div class="detail-header-row__actions">
        <button class="icon-btn" aria-label="Modifier" data-edit="${problem.id}">${icons.edit}</button>
        <button class="icon-btn icon-btn--danger" aria-label="Supprimer" data-delete="${problem.id}">${icons.trash}</button>
      </div>
    </div>
    ${problem.cause ? `<p class="mind-entry__text"><strong>Cause :</strong> ${problem.cause}</p>` : ''}
    ${problem.solution ? `<p class="mind-entry__text"><strong>Solution :</strong> ${problem.solution}</p>` : ''}
    ${problem.action ? `<p class="mind-entry__text"><strong>Action :</strong> ${problem.action}</p>` : ''}
    ${problem.result ? `<p class="mind-entry__text"><strong>Résultat :</strong> ${problem.result}</p>` : ''}
    <div class="status-picker" id="status-picker-${problem.id}">
      ${problemStatuses.map((s) => `
        <button type="button" class="tab-btn ${problem.status === s.id ? 'is-active' : ''}" data-status="${s.id}">${s.label}</button>
      `).join('')}
    </div>
  `;

  card.querySelector(`#status-picker-${problem.id}`).querySelectorAll('[data-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.updateProblem(problem.id, { status: btn.dataset.status });
      renderProblems(screen);
    });
  });

  card.querySelector('[data-edit]').addEventListener('click', () => {
    openProblemForm = problem.id;
    renderProblems(screen);
  });

  card.querySelector('[data-delete]').addEventListener('click', () => {
    document.body.appendChild(mindDeleteConfirmSheet(
      { title: 'Supprimer ce problème ?', desc: `« ${problem.title} » sera supprimé définitivement. Cette opération est irréversible.` },
      () => {
        store.deleteProblem(problem.id);
        renderProblems(screen);
      }
    ));
  });

  return card;
}

function renderProblems(screen) {
  const all = store.listProblems();
  const filtered = problemFilter === 'all' ? all : all.filter((p) => p.status === problemFilter);

  screen.innerHTML = '';

  if (openProblemForm !== null) {
    const existing = openProblemForm === 'new' ? null : store.getProblem(openProblemForm);
    screen.appendChild(problemForm(screen, existing));
    return;
  }

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn-primary';
  addBtn.style.width = '100%';
  addBtn.textContent = '+ Nouveau problème';
  addBtn.addEventListener('click', () => {
    openProblemForm = 'new';
    renderProblems(screen);
  });
  screen.appendChild(addBtn);

  const tabRow = document.createElement('div');
  tabRow.className = 'tab-row';
  tabRow.style.marginTop = 'var(--sp-4)';
  tabRow.innerHTML = `
    ${problemStatuses.map((s) => `
      <button class="tab-btn ${problemFilter === s.id ? 'is-active' : ''}" data-filter="${s.id}">${s.label}</button>
    `).join('')}
    <button class="tab-btn ${problemFilter === 'all' ? 'is-active' : ''}" data-filter="all">Tous</button>
  `;
  tabRow.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      problemFilter = btn.dataset.filter;
      renderProblems(screen);
    });
  });
  screen.appendChild(tabRow);

  const list = document.createElement('div');
  list.className = 'mind-history';
  list.style.marginTop = 'var(--sp-4)';
  if (!filtered.length) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-6)">
        ${icons.alertTriangle.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">Aucun problème ici</h2>
        <p class="state-block__desc">Rien à signaler pour ce filtre, ou crée un nouveau problème à traiter.</p>
      </div>`;
  } else {
    filtered.forEach((p) => list.appendChild(problemCard(p, screen)));
  }
  screen.appendChild(list);
}

function leadershipForm(screen) {
  formLeadershipScores = emptyLeadershipScores();

  const wrap = document.createElement('form');
  wrap.className = 'card';
  wrap.id = 'leadership-form';
  wrap.innerHTML = `
    ${leadershipDimensions.map((d) => `
      <div class="mind-slider-row">
        <div class="mind-slider-row__top">
          <label class="form-label" for="ld-${d.id}">${d.label}</label>
          <span class="mind-slider-row__value mono" id="ld-${d.id}-out">${formLeadershipScores[d.id]}</span>
        </div>
        <input class="mind-slider" type="range" min="0" max="10" step="1" id="ld-${d.id}" value="${formLeadershipScores[d.id]}" />
      </div>
    `).join('')}

    <div class="form-group" style="margin-top: var(--sp-4)">
      <label class="form-label" for="ld-note">Note <span class="optional">(optionnel)</span></label>
      <textarea class="form-textarea" id="ld-note" name="note" placeholder="Contexte de cette évaluation..."></textarea>
    </div>

    <div class="form-actions">
      <button type="button" class="btn-secondary" id="ld-cancel">Annuler</button>
      <button type="submit" class="btn-primary">Enregistrer l'évaluation</button>
    </div>
  `;

  leadershipDimensions.forEach((d) => {
    const input = wrap.querySelector(`#ld-${d.id}`);
    const out = wrap.querySelector(`#ld-${d.id}-out`);
    input.addEventListener('input', () => {
      out.textContent = input.value;
      formLeadershipScores[d.id] = Number(input.value);
    });
  });

  wrap.querySelector('#ld-cancel').addEventListener('click', () => {
    showLeadershipForm = false;
    renderLeadership(screen);
  });

  wrap.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    store.createLeadershipScore({
      scores: { ...formLeadershipScores },
      note: formData.get('note')?.toString() ?? '',
    });
    showLeadershipForm = false;
    renderLeadership(screen);
  });

  return wrap;
}

function leadershipScoreCard(entry, screen) {
  const avg = averageLeadershipScore(entry.scores);
  const card = document.createElement('div');
  card.className = 'card mind-entry';
  card.innerHTML = `
    <div class="mind-entry__top">
      <div>
        <div class="mood-row__value">Évaluation du ${formatDate(entry.date)}</div>
        <div class="mind-entry__date">Moyenne : <strong class="mono">${avg ?? '—'}/10</strong></div>
      </div>
      <button class="icon-btn icon-btn--danger" aria-label="Supprimer" data-delete="${entry.id}">${icons.trash}</button>
    </div>
    <div class="leadership-dims">
      ${leadershipDimensions.map((d) => `
        <div class="leadership-dim-row">
          <span class="leadership-dim-row__label">${d.label}</span>
          <div class="progress-track"><div class="progress-fill progress-fill--steel" style="width:${(entry.scores[d.id] ?? 0) * 10}%"></div></div>
          <span class="leadership-dim-row__value mono">${entry.scores[d.id] ?? '—'}</span>
        </div>
      `).join('')}
    </div>
    ${entry.note ? `<p class="mind-entry__text">${entry.note}</p>` : ''}
  `;
  card.querySelector('[data-delete]').addEventListener('click', () => {
    document.body.appendChild(mindDeleteConfirmSheet(
      { title: 'Supprimer cette évaluation ?', desc: 'Cette évaluation de leadership sera supprimée définitivement. Cette opération est irréversible.' },
      () => {
        store.deleteLeadershipScore(entry.id);
        renderLeadership(screen);
      }
    ));
  });
  return card;
}

function renderLeadership(screen) {
  screen.innerHTML = '';

  if (showLeadershipForm) {
    screen.appendChild(leadershipForm(screen));
    return;
  }

  const scores = store.listLeadershipScores();
  const trend = store.getLeadershipTrend();

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn-primary';
  addBtn.style.width = '100%';
  addBtn.textContent = '+ Nouvelle évaluation';
  addBtn.addEventListener('click', () => {
    showLeadershipForm = true;
    renderLeadership(screen);
  });
  screen.appendChild(addBtn);

  if (trend) {
    const trendCard = document.createElement('div');
    trendCard.className = 'card';
    trendCard.style.marginTop = 'var(--sp-4)';
    trendCard.innerHTML = `
      <div class="card__label">Évolution</div>
      ${leadershipDimensions.map((d) => {
        const delta = trend.delta[d.id];
        if (delta == null) return '';
        const sign = delta > 0 ? '+' : '';
        const color = delta > 0 ? 'var(--success-500)' : delta < 0 ? 'var(--danger-500)' : 'var(--text-tertiary)';
        return `
          <div class="leadership-trend-row">
            <span>${d.label}</span>
            <span class="mono" style="color:${color}">${sign}${delta}</span>
          </div>`;
      }).join('')}
    `;
    screen.appendChild(trendCard);
  }

  const list = document.createElement('div');
  list.className = 'mind-history';
  list.id = 'leadership-list';
  list.style.marginTop = 'var(--sp-4)';
  if (!scores.length) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-6)">
        ${icons.target.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">Aucune évaluation pour le moment</h2>
        <p class="state-block__desc">Note-toi sur les 10 dimensions du leadership pour suivre ton évolution.</p>
      </div>`;
  } else {
    scores.forEach((entry) => list.appendChild(leadershipScoreCard(entry, screen)));
  }
  screen.appendChild(list);
}

const xpSourceLabels = {
  mission: 'Mission',
  objectif: 'Objectif',
  habitude: 'Habitude',
  journal: 'Journal',
  projet: 'Projet',
  action: 'Action',
  autre: 'Autre',
};

function xpHistoryRow(entry) {
  const row = document.createElement('div');
  row.className = 'xp-history-row';
  const positive = entry.amount >= 0;
  row.innerHTML = `
    <div class="xp-history-row__info">
      <span class="xp-history-row__label">${entry.label || xpSourceLabels[entry.source] || 'Autre'}</span>
      <span class="xp-history-row__meta">${xpSourceLabels[entry.source] ?? entry.source} · ${formatDate(entry.date)}</span>
    </div>
    <span class="xp-history-row__amount mono" style="color:${positive ? 'var(--success-500)' : 'var(--danger-500)'}">${positive ? '+' : ''}${entry.amount} XP</span>
  `;
  return row;
}

function renderQuotes(screen) {
  const list = filteredQuoteEntries();
  if (quoteIndex >= list.length) quoteIndex = 0;
  if (quoteIndex < 0) quoteIndex = Math.max(0, list.length - 1);
  const entry = list[quoteIndex];

  screen.innerHTML = `
    <div class="category-scroll" id="quote-theme-scroll" style="margin-bottom: var(--sp-4)">
      <button type="button" class="category-chip ${!quoteThemeFilter ? 'is-active' : ''}" data-theme="">Tous</button>
      <button type="button" class="category-chip ${quoteThemeFilter === 'short' ? 'is-active' : ''}" data-theme="short">Citations courtes</button>
      ${scriptThemes.map((t) => `
        <button type="button" class="category-chip ${quoteThemeFilter === t.id ? 'is-active' : ''}" data-theme="${t.id}">${t.label}</button>
      `).join('')}
    </div>

    ${!entry ? `
      <div class="state-block" style="padding-top: var(--sp-6)">
        ${icons.sparkles.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">Aucune citation dans ce thème</h2>
        <p class="state-block__desc">Choisis un autre thème pour continuer la lecture.</p>
      </div>
    ` : `
      <section class="card quote-card quote-card--featured" aria-label="Lecteur de citations">
        ${icons.sparkles.replace('<svg ', '<svg class="quote-card__icon" ')}
        ${entry.kind === 'long' ? `<div class="card__label">${entry.title}</div>` : ''}
        <p class="quote-card__text" style="white-space: pre-line">${entry.text}</p>
        ${entry.kind === 'short' ? `<p class="quote-card__author">— ${entry.title}</p>` : ''}
      </section>

      <div class="mono" style="text-align:center; color:var(--text-tertiary); margin-top: var(--sp-3)">
        ${quoteIndex + 1} / ${list.length}
      </div>

      <div class="quote-card__actions" style="justify-content:center; margin-top: var(--sp-4)">
        <button class="chip" id="quote-prev-btn" aria-label="Précédent">${icons.arrowLeft}Précédent</button>
        <button class="chip" id="quote-next-btn" aria-label="Suivant">Suivant${icons.chevronRight}</button>
      </div>
    `}
  `;

  screen.querySelectorAll('[data-theme]').forEach((btn) => {
    btn.addEventListener('click', () => {
      quoteThemeFilter = btn.dataset.theme;
      quoteIndex = 0;
      renderQuotes(screen);
    });
  });

  screen.querySelector('#quote-prev-btn')?.addEventListener('click', () => {
    quoteIndex = quoteIndex <= 0 ? list.length - 1 : quoteIndex - 1;
    renderQuotes(screen);
  });

  screen.querySelector('#quote-next-btn')?.addEventListener('click', () => {
    quoteIndex = quoteIndex >= list.length - 1 ? 0 : quoteIndex + 1;
    renderQuotes(screen);
  });
}

function renderXp(screen) {
  const summary = store.getXpSummary();
  const history = store.listXpHistory();

  screen.innerHTML = `
    <section class="card" aria-label="Résumé XP">
      <div class="card__label">Niveau ${summary.level} · ${summary.levelName}</div>
      <div class="progress-header">
        <span class="progress-header__title">Progression vers le niveau suivant</span>
        <span class="progress-header__value mono">${summary.progressPct}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${summary.progressPct}%"></div></div>
      <div class="xp-summary-grid">
        <div class="xp-summary-tile">
          <span class="xp-summary-tile__value mono">${summary.xp}</span>
          <span class="xp-summary-tile__label">XP actuel</span>
        </div>
        <div class="xp-summary-tile">
          <span class="xp-summary-tile__value mono">${summary.xpRemaining}</span>
          <span class="xp-summary-tile__label">XP restant</span>
        </div>
        <div class="xp-summary-tile">
          <span class="xp-summary-tile__value mono">${summary.totalEarned}</span>
          <span class="xp-summary-tile__label">XP total gagné</span>
        </div>
      </div>
    </section>

    <div class="card__label" style="margin-top: var(--sp-5)">Historique</div>
    <div class="xp-history-list" id="xp-history-list"></div>
  `;

  const list = screen.querySelector('#xp-history-list');
  if (!history.length) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-6)">
        ${icons.sparkles.replace('<svg ', '<svg class="state-block__icon" ')}
        <h2 class="state-block__title">Aucun XP gagné pour le moment</h2>
        <p class="state-block__desc">Termine une mission ou avance sur un objectif pour commencer à gagner de l'XP.</p>
      </div>`;
  } else {
    history.slice(0, 100).forEach((entry) => list.appendChild(xpHistoryRow(entry)));
  }
}

export function Mind() {
  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">Mind</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/'));
  el.appendChild(header);

  const tabs = document.createElement('div');
  tabs.className = 'tab-row mind-tab-row';
  tabs.style.margin = '0 var(--sp-5)';
  tabs.setAttribute('role', 'tablist');
  tabs.innerHTML = `
    <button class="tab-btn ${activeTab === 'checkin' ? 'is-active' : ''}" data-tab="checkin">Check-in</button>
    <button class="tab-btn ${activeTab === 'history' ? 'is-active' : ''}" data-tab="history">Historique</button>
    <button class="tab-btn ${activeTab === 'stats' ? 'is-active' : ''}" data-tab="stats">Stats</button>
    <button class="tab-btn ${activeTab === 'problems' ? 'is-active' : ''}" data-tab="problems">Problèmes</button>
    <button class="tab-btn ${activeTab === 'leadership' ? 'is-active' : ''}" data-tab="leadership">Leadership</button>
    <button class="tab-btn ${activeTab === 'quotes' ? 'is-active' : ''}" data-tab="quotes">Citations</button>
    <button class="tab-btn ${activeTab === 'xp' ? 'is-active' : ''}" data-tab="xp">XP</button>
    <button class="tab-btn" id="mind-coach-tab" style="color:var(--ember-400)">Mon Coach →</button>
  `;
  el.appendChild(tabs);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-4)';
  el.appendChild(screen);

  if (activeTab === 'checkin') renderCheckin(screen);
  else if (activeTab === 'history') renderHistory(screen);
  else if (activeTab === 'stats') renderStats(screen);
  else if (activeTab === 'problems') renderProblems(screen);
  else if (activeTab === 'leadership') renderLeadership(screen);
  else if (activeTab === 'quotes') renderQuotes(screen);
  else renderXp(screen);

  tabs.querySelector('#mind-coach-tab').addEventListener('click', () => router.navigate('/coach'));

  tabs.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      openProblemForm = null;
      showLeadershipForm = false;
      el.replaceWith(Mind());
    });
  });

  return el;
}
