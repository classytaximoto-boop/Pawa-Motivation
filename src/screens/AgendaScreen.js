import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';

// État local de l'écran (mémoire vive, pas persisté)
let currentDate = todayKey(); // date affichée dans la vue jour
let view = 'day'; // 'day' | 'history'
let searchQuery = '';
let addingTask = null; // { startMin, endMin } quand le formulaire d'ajout est ouvert, ou null
let editingTaskId = null; // id de la tâche en cours d'édition d'horaire, ou null

const START_HOUR = 6; // 06h
const END_HOUR = 24; // jusqu'à minuit (exclu)
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
const PX_PER_MIN = 1.6; // densité verticale de la timeline (~96px/heure)
const RANGE_START_MIN = START_HOUR * 60;
const RANGE_END_MIN = END_HOUR * 60;

const CONGRATS_MESSAGES = [
  'Bravo, une de plus ! Tu tiens ta parole envers toi-même.',
  'Bien joué ! Chaque tâche terminée te rapproche de qui tu veux devenir.',
  'Excellent ! Tu avances, continue comme ça.',
  'Fier de toi ! C\'est exactement cette régularité qui construit la confiance en soi.',
  'Tâche accomplie ! Ton agenda d\'aujourd\'hui prend forme.',
  'Bravo champion, encore un pas de fait.',
];

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtDateLabel(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function shiftDate(dateKey, deltaDays) {
  const d = new Date(`${dateKey}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtHour(h) {
  return `${String(h).padStart(2, '0')}:00`;
}

/** Formate des minutes-depuis-minuit en "HH:MM". */
function fmtMin(min) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Parse une chaîne "HH:MM" en minutes-depuis-minuit. Renvoie null si invalide. */
function parseTimeInput(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value || '').trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function congratsToast(message, xpGained) {
  const toast = document.createElement('div');
  toast.className = 'agenda-toast';
  toast.innerHTML = `
    <div class="agenda-toast__icon">${icons.sparkles || icons.check || ''}</div>
    <div class="agenda-toast__body">
      <div class="agenda-toast__msg">${message}</div>
      <div class="agenda-toast__xp">+${xpGained} XP Agenda</div>
    </div>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 300);
  }, 2400);
}

/**
 * Calcule, pour un ensemble de tâches qui se chevauchent dans le temps, une colonne
 * (index 0..n-1) et le nombre total de colonnes à partager — pour un rendu côte à côte
 * façon Google Calendar. Algorithme glouton classique : on trie par début, on assigne
 * à la première colonne libre, on regroupe ensuite les tâches en "clusters" connectés
 * par chevauchement pour qu'elles partagent toutes la même largeur de colonnes.
 */
function layoutOverlaps(tasks) {
  const items = tasks
    .map((task) => ({ task, ...store.getAgendaTaskRange(task) }))
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const results = [];
  let cluster = [];
  let clusterEnd = -Infinity;

  const flushCluster = () => {
    if (!cluster.length) return;
    const columns = []; // columns[i] = fin de la dernière tâche placée dans cette colonne
    cluster.forEach((item) => {
      let colIndex = columns.findIndex((end) => end <= item.startMin);
      if (colIndex === -1) {
        colIndex = columns.length;
        columns.push(item.endMin);
      } else {
        columns[colIndex] = item.endMin;
      }
      item.col = colIndex;
    });
    const totalCols = columns.length;
    cluster.forEach((item) => results.push({ ...item, totalCols }));
    cluster = [];
  };

  items.forEach((item) => {
    if (cluster.length === 0 || item.startMin < clusterEnd) {
      cluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMin);
    } else {
      flushCluster();
      cluster = [item];
      clusterEnd = item.endMin;
    }
  });
  flushCluster();

  return results;
}

function minToPx(min) {
  return (min - RANGE_START_MIN) * PX_PER_MIN;
}

function taskBlock(task, startMin, endMin, col, totalCols, onToggle, onDelete, onEdit) {
  const top = minToPx(Math.max(RANGE_START_MIN, startMin));
  const height = Math.max(28, (Math.min(RANGE_END_MIN, endMin) - Math.max(RANGE_START_MIN, startMin)) * PX_PER_MIN);
  const widthPct = 100 / totalCols;
  const leftPct = col * widthPct;

  const block = document.createElement('div');
  block.className = `agenda-block${task.done ? ' is-done' : ''}`;
  block.style.top = `${top}px`;
  block.style.height = `${height}px`;
  block.style.left = `calc(${leftPct}% + ${col > 0 ? 3 : 0}px)`;
  block.style.width = `calc(${widthPct}% - ${totalCols > 1 ? 6 : 0}px)`;

  block.innerHTML = `
    <button type="button" class="agenda-block__check" aria-label="Terminer">
      ${task.done ? (icons.check || '✓') : ''}
    </button>
    <div class="agenda-block__body">
      <div class="agenda-block__time mono">${fmtMin(startMin)} – ${fmtMin(endMin)}</div>
      <div class="agenda-block__title">${task.title}</div>
      ${task.note && height > 52 ? `<div class="agenda-block__note">${task.note}</div>` : ''}
    </div>
    <div class="agenda-block__actions">
      <button type="button" class="agenda-block__edit" aria-label="Modifier l'horaire">${icons.edit || '✎'}</button>
      <button type="button" class="agenda-block__delete" aria-label="Supprimer">${icons.trash || '×'}</button>
    </div>
  `;
  block.querySelector('.agenda-block__check').addEventListener('click', (e) => { e.stopPropagation(); onToggle(task.id); });
  block.querySelector('.agenda-block__delete').addEventListener('click', (e) => { e.stopPropagation(); onDelete(task.id); });
  block.querySelector('.agenda-block__edit').addEventListener('click', (e) => { e.stopPropagation(); onEdit(task); });
  return block;
}

/** Formulaire d'ajout/édition avec deux champs heure (début/fin) libres à la minute. */
function timeRangeForm({ title, initialStart, initialEnd, initialTitle = '', initialNote = '', submitLabel, onSubmit, onCancel }) {
  const form = document.createElement('form');
  form.className = 'agenda-add-form';
  form.innerHTML = `
    <div class="form-group">
      <label class="form-label" for="f-agenda-title">${icons.edit || ''}${title}</label>
      <input class="form-input" type="text" id="f-agenda-title" name="title" placeholder="Ex : Séance de sport" value="${initialTitle}" required />
    </div>
    <div class="form-group" style="margin-top:var(--sp-2)">
      <label class="form-label">Durée</label>
      <div class="agenda-time-range">
        <input class="form-input mono" type="time" id="f-agenda-start" name="start" value="${fmtMin(initialStart)}" required />
        <span class="agenda-time-range__sep">–</span>
        <input class="form-input mono" type="time" id="f-agenda-end" name="end" value="${fmtMin(initialEnd)}" required />
      </div>
    </div>
    <div class="form-group" style="margin-top:var(--sp-2)">
      <input class="form-input" type="text" name="note" placeholder="Note (optionnel)" value="${initialNote}" />
    </div>
    <div class="agenda-form-error" style="display:none"></div>
    <div class="form-actions" style="margin-top:var(--sp-3)">
      <button type="button" class="btn-secondary" id="agenda-cancel-btn">Annuler</button>
      <button type="submit" class="btn-primary">${icons.plus || ''}${submitLabel}</button>
    </div>
  `;
  const errorBox = form.querySelector('.agenda-form-error');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const taskTitle = data.get('title')?.toString().trim();
    if (!taskTitle) return;
    const startMin = parseTimeInput(data.get('start')?.toString());
    const endMin = parseTimeInput(data.get('end')?.toString());
    if (startMin == null || endMin == null) {
      errorBox.textContent = 'Heures invalides.';
      errorBox.style.display = 'block';
      return;
    }
    if (endMin <= startMin) {
      errorBox.textContent = "L'heure de fin doit être après l'heure de début.";
      errorBox.style.display = 'block';
      return;
    }
    onSubmit({
      title: taskTitle,
      note: data.get('note')?.toString().trim() || '',
      startMin,
      endMin,
    });
  });
  form.querySelector('#agenda-cancel-btn').addEventListener('click', onCancel);
  return form;
}

function dayView(el, rerender) {
  const wrap = document.createElement('div');

  const nav = document.createElement('div');
  nav.className = 'agenda-day-nav';
  nav.innerHTML = `
    <button type="button" class="chip" id="agenda-prev">${icons.chevronLeft || '‹'}</button>
    <div class="agenda-day-nav__label">${fmtDateLabel(currentDate)}</div>
    <button type="button" class="chip" id="agenda-next">${icons.chevronRight || '›'}</button>
  `;
  nav.querySelector('#agenda-prev').addEventListener('click', () => { currentDate = shiftDate(currentDate, -1); rerender(); });
  nav.querySelector('#agenda-next').addEventListener('click', () => { currentDate = shiftDate(currentDate, 1); rerender(); });
  wrap.appendChild(nav);

  const addBar = document.createElement('button');
  addBar.type = 'button';
  addBar.className = 'agenda-add-bar';
  addBar.innerHTML = `${icons.plus || '+'}Ajouter une tâche`;
  addBar.addEventListener('click', () => {
    // Par défaut, propose le créneau suivant l'heure actuelle arrondie, ou 08:00 si hors plage.
    const now = new Date();
    let start = now.getHours() * 60 + Math.ceil(now.getMinutes() / 15) * 15;
    if (start < RANGE_START_MIN || start >= RANGE_END_MIN) start = RANGE_START_MIN + 120;
    addingTask = { startMin: start, endMin: Math.min(RANGE_END_MIN, start + 60) };
    editingTaskId = null;
    rerender();
  });
  wrap.appendChild(addBar);

  if (addingTask) {
    wrap.appendChild(timeRangeForm({
      title: 'Nouvelle tâche',
      initialStart: addingTask.startMin,
      initialEnd: addingTask.endMin,
      submitLabel: 'Ajouter',
      onSubmit: ({ title, note, startMin, endMin }) => {
        store.addAgendaTask({ date: currentDate, hour: Math.floor(startMin / 60), startMin, endMin, title, note });
        addingTask = null;
        rerender();
      },
      onCancel: () => { addingTask = null; rerender(); },
    }));
  }

  const tasks = store.getAgendaTasksForDate(currentDate);
  const editingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null;
  if (editingTask) {
    const range = store.getAgendaTaskRange(editingTask);
    wrap.appendChild(timeRangeForm({
      title: 'Modifier la tâche',
      initialStart: range.startMin,
      initialEnd: range.endMin,
      initialTitle: editingTask.title,
      initialNote: editingTask.note,
      submitLabel: 'Enregistrer',
      onSubmit: ({ title, note, startMin, endMin }) => {
        store.updateAgendaTask(editingTask.id, {
          title, note, startMin, endMin,
          hour: Math.floor(startMin / 60),
          duration: Math.max(1, Math.round((endMin - startMin) / 60)),
        });
        editingTaskId = null;
        rerender();
      },
      onCancel: () => { editingTaskId = null; rerender(); },
    }));
  }

  // Timeline continue : grille d'heures en fond (repères visuels), tâches positionnées
  // en absolu selon leur startMin/endMin réels, chevauchements en colonnes côte à côte.
  const timeline = document.createElement('div');
  timeline.className = 'agenda-timeline';
  timeline.style.height = `${(RANGE_END_MIN - RANGE_START_MIN) * PX_PER_MIN}px`;

  const hourLines = document.createElement('div');
  hourLines.className = 'agenda-timeline__lines';
  HOURS.forEach((hour) => {
    const line = document.createElement('div');
    line.className = 'agenda-hour-line';
    line.style.top = `${minToPx(hour * 60)}px`;
    line.innerHTML = `<span class="agenda-hour-line__label mono">${fmtHour(hour)}</span>`;
    hourLines.appendChild(line);
  });
  timeline.appendChild(hourLines);

  const blocksLayer = document.createElement('div');
  blocksLayer.className = 'agenda-timeline__blocks';

  if (tasks.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'state-block';
    empty.style.padding = 'var(--sp-6) var(--sp-5)';
    empty.innerHTML = `
      <h2 class="state-block__title">Rien de prévu</h2>
      <p class="state-block__desc">Ajoute ta première tâche avec le bouton ci-dessus.</p>
    `;
    wrap.appendChild(empty);
  } else {
    layoutOverlaps(tasks).forEach(({ task, startMin, endMin, col, totalCols }) => {
      blocksLayer.appendChild(taskBlock(
        task,
        startMin,
        endMin,
        col,
        totalCols,
        (id) => {
          const result = store.toggleAgendaTask(id);
          if (result.justCompleted) {
            const msg = CONGRATS_MESSAGES[Math.floor(Math.random() * CONGRATS_MESSAGES.length)];
            congratsToast(msg, result.xpGained);
          }
          rerender();
        },
        (id) => { store.deleteAgendaTask(id); rerender(); },
        (t) => { editingTaskId = t.id; addingTask = null; rerender(); },
      ));
    });
    timeline.appendChild(blocksLayer);
    wrap.appendChild(timeline);
  }

  return wrap;
}

function historyView(rerender) {
  const wrap = document.createElement('div');

  const searchBar = document.createElement('div');
  searchBar.className = 'agenda-search';
  searchBar.innerHTML = `
    <span class="agenda-search__icon">${icons.search || ''}</span>
    <input class="form-input" type="text" id="agenda-search-input" placeholder="Rechercher une tâche..." value="${searchQuery}" />
  `;
  searchBar.querySelector('#agenda-search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    rerender();
  });
  wrap.appendChild(searchBar);

  const results = store.searchAgendaHistory(searchQuery);
  const list = document.createElement('div');
  list.className = 'agenda-history-list';

  if (results.length === 0) {
    list.innerHTML = `
      <div class="state-block" style="padding-top: var(--sp-6)">
        <h2 class="state-block__title">Aucune tâche trouvée</h2>
        <p class="state-block__desc">Essaie un autre mot-clé, ou ajoute des tâches dans la vue Jour.</p>
      </div>`;
  } else {
    let lastDate = null;
    results.forEach((task) => {
      if (task.date !== lastDate) {
        lastDate = task.date;
        const dateHeader = document.createElement('div');
        dateHeader.className = 'agenda-history__date';
        dateHeader.innerHTML = `${icons.calendar || ''}${fmtDateLabel(task.date)}`;
        list.appendChild(dateHeader);
      }
      const range = store.getAgendaTaskRange(task);
      const row = document.createElement('div');
      row.className = `agenda-history-item${task.done ? ' is-done' : ''}`;
      row.innerHTML = `
        <span class="agenda-history-item__hour mono">${fmtMin(range.startMin)}–${fmtMin(range.endMin)}</span>
        <span class="agenda-history-item__title">${task.title}</span>
        ${task.done ? `<span class="chip" style="color:var(--success-500);border-color:var(--success-500)">${icons.check || ''}Fait</span>` : ''}
      `;
      list.appendChild(row);
    });
  }
  wrap.appendChild(list);
  return wrap;
}

export function AgendaScreen() {
  const el = document.createElement('div');

  const header = document.createElement('header');
  header.className = 'screen-header';
  const xpSummary = store.getAgendaXpSummary();
  header.innerHTML = `
    <h1 class="screen-header__title">Agenda</h1>
    <div class="chip" style="color:var(--ember-500);border-color:var(--ember-500)">${icons.sparkles || ''}${xpSummary.xp} XP</div>
  `;
  el.appendChild(header);

  const tabs = document.createElement('div');
  tabs.className = 'agenda-view-tabs';
  tabs.innerHTML = `
    <button type="button" class="agenda-view-tab${view === 'day' ? ' is-active' : ''}" data-view="day">${icons.calendar || ''}Jour</button>
    <button type="button" class="agenda-view-tab${view === 'history' ? ' is-active' : ''}" data-view="history">${icons.clock || ''}Historique</button>
  `;
  tabs.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => { view = btn.dataset.view; rerender(); });
  });
  el.appendChild(tabs);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  function rerender() {
    el.replaceWith(AgendaScreen());
  }

  screen.appendChild(view === 'day' ? dayView(el, rerender) : historyView(rerender));
  el.appendChild(screen);
  return el;
}
