import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';

// État local de l'écran (mémoire vive, pas persisté)
let currentDate = todayKey(); // date affichée dans la vue jour
let view = 'day'; // 'day' | 'history'
let searchQuery = '';
let addingTask = null; // { startMin, endMin } quand le formulaire d'ajout est ouvert, ou null
let editingTaskId = null; // id de la tâche en cours d'édition d'horaire, ou null
let calendarMonthKey = currentDate.slice(0, 7); // "YYYY-MM" du mois affiché dans le mini-calendrier

const START_HOUR = 6; // 06h — borne par défaut proposée à l'ouverture du formulaire d'ajout
const END_HOUR = 24; // jusqu'à minuit (exclu)
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

function shiftMonth(monthKey, delta) {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/** Grille de jours du mois (avec padding avant/après), semaine commençant lundi. */
function buildMonthGrid(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  const firstOfMonth = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  // getDay(): 0=dimanche..6=samedi -> on décale pour que lundi=0
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(`${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
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

/** Carte de tâche dans la grille (cadres 2-7) : heure choisie librement à l'ajout/édition. */
function taskCard(task, startMin, endMin, onToggle, onDelete, onEdit) {
  const card = document.createElement('div');
  card.className = `agenda-block${task.done ? ' is-done' : ''}${task.priority ? ' is-priority' : ''}`;

  card.innerHTML = `
    <button type="button" class="agenda-block__check" aria-label="Terminer">
      ${task.done ? (icons.check || '✓') : ''}
    </button>
    <div class="agenda-block__body">
      <div class="agenda-block__time mono">${fmtMin(startMin)} – ${fmtMin(endMin)}</div>
      <div class="agenda-block__title">${task.priority ? (icons.star || '★ ') : ''}${task.title}</div>
      ${task.note ? `<div class="agenda-block__note">${task.note}</div>` : ''}
    </div>
    <div class="agenda-block__actions">
      <button type="button" class="agenda-block__edit" aria-label="Modifier l'horaire">${icons.edit || '✎'}</button>
      <button type="button" class="agenda-block__delete" aria-label="Supprimer">${icons.trash || '×'}</button>
    </div>
  `;
  card.querySelector('.agenda-block__check').addEventListener('click', (e) => { e.stopPropagation(); onToggle(task.id); });
  card.querySelector('.agenda-block__delete').addEventListener('click', (e) => { e.stopPropagation(); onDelete(task.id); });
  card.querySelector('.agenda-block__edit').addEventListener('click', (e) => { e.stopPropagation(); onEdit(task); });
  return card;
}

/** Formulaire d'ajout/édition avec deux champs heure (début/fin) libres à la minute. */
function timeRangeForm({ title, initialStart, initialEnd, initialTitle = '', initialNote = '', initialPriority = false, submitLabel, onSubmit, onCancel }) {
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
    <label class="agenda-priority-toggle" style="margin-top:var(--sp-3)">
      <input type="checkbox" name="priority" ${initialPriority ? 'checked' : ''} />
      <span class="agenda-priority-toggle__box">${icons.star || ''}</span>
      <span class="agenda-priority-toggle__label">Tâche prioritaire du jour</span>
    </label>
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
      priority: data.get('priority') === 'on',
      startMin,
      endMin,
    });
  });
  form.querySelector('#agenda-cancel-btn').addEventListener('click', onCancel);
  return form;
}

/** Cadre 9 : mini-calendrier mensuel, jour sélectionné en surbrillance bleue. */
function monthCalendar(rerender) {
  const wrap = document.createElement('div');
  wrap.className = 'agenda-calendar';

  const head = document.createElement('div');
  head.className = 'agenda-calendar__head';
  head.innerHTML = `
    <button type="button" class="chip" id="cal-prev">${icons.chevronLeft || '‹'}</button>
    <div class="agenda-calendar__month">${fmtMonthLabel(calendarMonthKey)}</div>
    <button type="button" class="chip" id="cal-next">${icons.chevronRight || '›'}</button>
  `;
  head.querySelector('#cal-prev').addEventListener('click', () => {
    calendarMonthKey = shiftMonth(calendarMonthKey, -1);
    rerender();
  });
  head.querySelector('#cal-next').addEventListener('click', () => {
    calendarMonthKey = shiftMonth(calendarMonthKey, 1);
    rerender();
  });
  wrap.appendChild(head);

  const weekLabels = document.createElement('div');
  weekLabels.className = 'agenda-calendar__weekdays';
  ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach((label, i) => {
    const span = document.createElement('span');
    span.textContent = label;
    span.key = i;
    weekLabels.appendChild(span);
  });
  wrap.appendChild(weekLabels);

  const grid = document.createElement('div');
  grid.className = 'agenda-calendar__grid';
  const today = todayKey();
  buildMonthGrid(calendarMonthKey).forEach((dateKey) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'agenda-calendar__cell';
    if (!dateKey) {
      cell.classList.add('is-empty');
      cell.disabled = true;
    } else {
      cell.textContent = String(Number(dateKey.slice(8, 10)));
      if (dateKey === currentDate) cell.classList.add('is-selected');
      if (dateKey === today) cell.classList.add('is-today');
      const dayTasks = store.getAgendaTasksForDate(dateKey);
      if (dayTasks.length > 0) cell.classList.add('has-tasks');
      cell.addEventListener('click', () => {
        currentDate = dateKey;
        rerender();
      });
    }
    grid.appendChild(cell);
  });
  wrap.appendChild(grid);

  return wrap;
}

/** Cadre 8 : accomplissements du jour + message de motivation. */
function daySummaryCard() {
  const summary = store.getAgendaDaySummary(currentDate);
  const card = document.createElement('div');
  card.className = 'agenda-summary-card';
  const pct = summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;
  card.innerHTML = `
    <div class="agenda-summary-card__icon">${icons.trophy || ''}</div>
    <div class="agenda-summary-card__body">
      <div class="agenda-summary-card__title">Accomplissements du jour</div>
      <div class="agenda-summary-card__stats">
        <span class="agenda-summary-card__stat"><strong>${summary.done}</strong>/${summary.total} tâches</span>
        <span class="agenda-summary-card__stat">${icons.sparkles || ''}+${summary.xpToday} XP</span>
      </div>
      <div class="agenda-summary-card__bar"><div class="agenda-summary-card__bar-fill" style="width:${pct}%"></div></div>
      <p class="agenda-summary-card__msg">${summary.message}</p>
    </div>
  `;
  return card;
}

/** Cadre 1 : tâches prioritaires du jour, en bandeau pleine largeur. */
function priorityBanner(rerender) {
  const priorityTasks = store.getAgendaPriorityTasksForDate(currentDate);
  const card = document.createElement('div');
  card.className = 'agenda-priority-banner';

  if (priorityTasks.length === 0) {
    card.innerHTML = `
      <div class="agenda-priority-banner__icon">${icons.star || ''}</div>
      <div class="agenda-priority-banner__body">
        <div class="agenda-priority-banner__title">Priorités du jour</div>
        <p class="agenda-priority-banner__empty">Marque une tâche comme prioritaire pour la voir ici.</p>
      </div>
    `;
    return card;
  }

  const items = priorityTasks.map((task) => {
    const range = store.getAgendaTaskRange(task);
    return `
      <div class="agenda-priority-item${task.done ? ' is-done' : ''}" data-id="${task.id}">
        <button type="button" class="agenda-priority-item__check" data-check="${task.id}">${task.done ? (icons.check || '✓') : ''}</button>
        <span class="agenda-priority-item__time mono">${fmtMin(range.startMin)}</span>
        <span class="agenda-priority-item__title">${task.title}</span>
      </div>`;
  }).join('');

  card.innerHTML = `
    <div class="agenda-priority-banner__icon">${icons.star || ''}</div>
    <div class="agenda-priority-banner__body">
      <div class="agenda-priority-banner__title">Priorités du jour</div>
      <div class="agenda-priority-banner__list">${items}</div>
    </div>
  `;
  card.querySelectorAll('[data-check]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const result = store.toggleAgendaTask(btn.dataset.check);
      if (result.justCompleted) {
        const msg = CONGRATS_MESSAGES[Math.floor(Math.random() * CONGRATS_MESSAGES.length)];
        congratsToast(msg, result.xpGained);
      }
      rerender();
    });
  });
  return card;
}

function dayView(el, rerender) {
  const wrap = document.createElement('div');

  // Cadre 9 : mini-calendrier mensuel, en haut, avant tout le reste.
  wrap.appendChild(monthCalendar(rerender));

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

  // Cadre 1 : priorités du jour, bandeau pleine largeur.
  wrap.appendChild(priorityBanner(rerender));

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
      onSubmit: ({ title, note, priority, startMin, endMin }) => {
        store.addAgendaTask({ date: currentDate, hour: Math.floor(startMin / 60), startMin, endMin, title, note, priority });
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
      initialPriority: !!editingTask.priority,
      submitLabel: 'Enregistrer',
      onSubmit: ({ title, note, priority, startMin, endMin }) => {
        store.updateAgendaTask(editingTask.id, {
          title, note, priority, startMin, endMin,
          hour: Math.floor(startMin / 60),
          duration: Math.max(1, Math.round((endMin - startMin) / 60)),
        });
        editingTaskId = null;
        rerender();
      },
      onCancel: () => { editingTaskId = null; rerender(); },
    }));
  }

  // Cadres 2-7 : grille 2 colonnes des tâches du jour, triées par heure.
  // L'heure de chaque tâche reste libre à la minute (choisie dans le formulaire) —
  // ce n'est pas une timeline à créneaux fixes, juste un rendu en grille de cartes.
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
    const grid = document.createElement('div');
    grid.className = 'agenda-task-grid';
    tasks
      .slice()
      .sort((a, b) => store.getAgendaTaskRange(a).startMin - store.getAgendaTaskRange(b).startMin)
      .forEach((task) => {
        const { startMin, endMin } = store.getAgendaTaskRange(task);
        grid.appendChild(taskCard(
          task,
          startMin,
          endMin,
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
    wrap.appendChild(grid);
  }

  // Cadre 8 : accomplissements du jour + motivation, bandeau pleine largeur, en bas.
  wrap.appendChild(daySummaryCard());

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
        dateHeader.textContent = fmtDateLabel(task.date);
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
