import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function deleteConfirmSheet(habit) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer cette habitude ?</h2>
      <p class="confirm-sheet__desc">Son historique de séries sera supprimé définitivement. Cette opération est irréversible.</p>
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
    store.deleteHabit(habit.id);
    router.navigate('/habitudes');
  });
  return backdrop;
}

export function HabitDetail(params = {}) {
  const habit = store.getHabit(params.id);
  const el = document.createElement('div');

  if (!habit) {
    router.navigate('/habitudes');
    return el;
  }

  const doneToday = store.isHabitDoneToday(habit);
  const streak = store.getHabitStreak(habit);
  const totalCompletions = habit.completions.length;

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = '0 var(--sp-5)';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <div class="detail-header-row__actions">
      <button class="icon-btn" id="edit-btn" aria-label="Modifier">${icons.edit}</button>
      <button class="icon-btn icon-btn--danger" id="delete-btn" aria-label="Supprimer">${icons.trash}</button>
    </div>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/habitudes'));
  header.querySelector('#edit-btn').addEventListener('click', () => router.navigate(`/habitudes/${habit.id}/modifier`));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-4)';

  screen.innerHTML = `
    <div>
      <div class="detail-tags-row">
        ${icons[habit.icon] || icons.flame}
        <span class="chip">${habit.frequency === 'hebdo' ? 'Hebdo' : 'Quotidien'}</span>
      </div>
      <h1 class="detail-title" style="margin-top:var(--sp-3)">${habit.name}</h1>
    </div>

    <section class="card">
      <div class="goal-card__meta-row" style="justify-content:space-around;text-align:center">
        <div>
          <div class="detail-title" style="font-size:var(--fs-xl)">${streak}</div>
          <p class="detail-desc">Série actuelle</p>
        </div>
        <div>
          <div class="detail-title" style="font-size:var(--fs-xl)">${totalCompletions}</div>
          <p class="detail-desc">Total réalisé</p>
        </div>
      </div>
    </section>

    <p class="detail-desc">Créée le ${fmtDate(habit.createdAt)}</p>

    <div class="form-actions">
      <button type="button" class="btn-primary" id="toggle-today-btn">${doneToday ? "Annuler pour aujourd'hui" : "Marquer comme faite aujourd'hui"}</button>
    </div>
  `;

  el.appendChild(screen);

  screen.querySelector('#toggle-today-btn').addEventListener('click', () => {
    store.toggleHabitToday(habit.id);
    el.replaceWith(HabitDetail(params));
  });

  header.querySelector('#delete-btn').addEventListener('click', () => {
    el.appendChild(deleteConfirmSheet(habit));
  });

  return el;
}
