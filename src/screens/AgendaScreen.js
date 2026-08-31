import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';

// État local de l'écran (mémoire vive, pas persisté)
let currentDate = todayKey(); // date affichée dans la vue jour
let view = 'day'; // 'day' | 'history'
let searchQuery = '';
let addingHour = null; // heure (0-23) pour laquelle le formulaire d'ajout est ouvert, ou null

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06h à 23h

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
  return d.toISOString().slice(0, 10);
}

function fmtDateLabel(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function shiftDate(dateKey, deltaDays) {
  alert('shiftDate reçoit: dateKey=' + dateKey + ' | deltaDays=' + deltaDays);
  const d = new Date(`${dateKey}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  const result = d.toISOString().slice(0, 10);
  alert('shiftDate retourne: ' + result);
  return result;
}

function fmtHour(h) {
  return `${String(h).padStart(2, '0')}:00`;
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

function taskRow(task, onToggle, onDelete) {
  const row = document.createElement('div');
  row.className = `agenda-task${task.done ? ' is-done' : ''}`;
  row.innerHTML = `
    <button type="button" class="agenda-task__check" aria-label="Terminer">
      ${task.done ? (icons.check || '✓') : ''}
    </button>
    <div class="agenda-task__body">
      <div class="agenda-task__title">${task.title}</div>
      ${task.note ? `<div class="agenda-task__note">${task.note}</div>` : ''}
    </div>
    <button type="button" class="agenda-task__delete" aria-label="Supprimer">${icons.trash || '×'}</button>
  `;
  row.querySelector('.agenda-task__check').addEventListener('click', () => onToggle(task.id));
  row.querySelector('.agenda-task__delete').addEventListener('click', () => onDelete(task.id));
  return row;
}

function addTaskForm(hour, onSubmit, onCancel) {
  const form = document.createElement('form');
  form.className = 'agenda-add-form';
  form.innerHTML = `
    <div class="form-group">
      <label class="form-label" for="f-agenda-title">${icons.edit || ''}Tâche à ${fmtHour(hour)}</label>
      <input class="form-input" type="text" id="f-agenda-title" name="title" placeholder="Ex : Séance de sport" required />
    </div>
    <div class="form-group" style="margin-top:var(--sp-2)">
      <input class="form-input" type="text" name="note" placeholder="Note (optionnel)" />
    </div>
    <div class="form-actions" style="margin-top:var(--sp-3)">
      <button type="button" class="btn-secondary" id="agenda-cancel-btn">Annuler</button>
      <button type="submit" class="btn-primary">${icons.plus || ''}Ajouter</button>
    </div>
  `;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const title = data.get('title')?.toString().trim();
    if (!title) return;
    onSubmit({ title, note: data.get('note')?.toString().trim() || '' });
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
  nav.querySelector('#agenda-prev').addEventListener('click', () => { alert('AVANT prev: ' + currentDate); currentDate = shiftDate(currentDate, -1); alert('APRES prev: ' + currentDate); rerender(); });
  nav.querySelector('#agenda-next').addEventListener('click', () => { alert('AVANT next: ' + currentDate); currentDate = shiftDate(currentDate, 1); alert('APRES next: ' + currentDate); rerender(); });
  wrap.appendChild(nav);

  const tasks = store.getAgendaTasksForDate(currentDate);
  const tasksByHour = {};
  tasks.forEach((t) => { (tasksByHour[t.hour] ??= []).push(t); });

  const grid = document.createElement('div');
  grid.className = 'agenda-grid';

  HOURS.forEach((hour) => {
    const slot = document.createElement('div');
    slot.className = 'agenda-slot';
    slot.innerHTML = `
      <div class="agenda-slot__hour">${fmtHour(hour)}</div>
      <div class="agenda-slot__content"></div>
    `;
    const content = slot.querySelector('.agenda-slot__content');

    (tasksByHour[hour] || []).forEach((task) => {
      content.appendChild(taskRow(
        task,
        (id) => {
          const result = store.toggleAgendaTask(id);
          if (result.justCompleted) {
            const msg = CONGRATS_MESSAGES[Math.floor(Math.random() * CONGRATS_MESSAGES.length)];
            congratsToast(msg, result.xpGained);
          }
          rerender();
        },
        (id) => { store.deleteAgendaTask(id); rerender(); },
      ));
    });

    if (addingHour === hour) {
      content.appendChild(addTaskForm(
        hour,
        ({ title, note }) => {
          store.addAgendaTask({ date: currentDate, hour, title, note });
          addingHour = null;
          rerender();
        },
        () => { addingHour = null; rerender(); },
      ));
    } else {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'agenda-slot__add';
      addBtn.innerHTML = `${icons.plus || '+'}Ajouter`;
      addBtn.addEventListener('click', () => { addingHour = hour; rerender(); });
      content.appendChild(addBtn);
    }

    grid.appendChild(slot);
  });

  wrap.appendChild(grid);
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
      const row = document.createElement('div');
      row.className = `agenda-history-item${task.done ? ' is-done' : ''}`;
      row.innerHTML = `
        <span class="agenda-history-item__hour mono">${fmtHour(task.hour)}</span>
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
