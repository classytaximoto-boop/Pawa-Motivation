import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { goalCategoryMap, priorityLevels } from '../data/goalCategories.js';

const priorityMap = Object.fromEntries(priorityLevels.map((p) => [p.id, p]));

const statusLabels = {
  active: 'Actif',
  paused: 'En pause',
  completed: 'Terminé',
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function taskRow(projectId, task, rerender) {
  const row = document.createElement('div');
  row.className = `step-row ${task.done ? 'is-done' : ''}`;
  row.innerHTML = `
    <span class="mission-checkbox" style="width:20px;height:20px">${icons.check}</span>
    <span class="step-row__text">${task.text}</span>
    <button class="step-row__delete" aria-label="Supprimer">${icons.trash}</button>
  `;
  row.querySelector('.mission-checkbox').addEventListener('click', () => {
    store.toggleProjectTask(projectId, task.id);
    rerender();
  });
  row.querySelector('.step-row__delete').addEventListener('click', () => {
    store.deleteProjectTask(projectId, task.id);
    rerender();
  });
  return row;
}

function deleteConfirmSheet(project) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer ce projet ?</h2>
      <p class="confirm-sheet__desc">« ${project.name} » sera supprimé définitivement, avec ses tâches. Cette opération est irréversible.</p>
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
    store.deleteProject(project.id);
    router.navigate('/projets');
  });
  return backdrop;
}

export function ProjetDetail(params = {}) {
  const project = store.getProject(params.id);
  const el = document.createElement('div');

  if (!project) {
    router.navigate('/projets');
    return el;
  }

  const rerender = () => {
    const fresh = ProjetDetail(params);
    el.replaceWith(fresh);
  };

  const cat = goalCategoryMap[project.category] ?? goalCategoryMap.autre;
  const pr = priorityMap[project.priority] ?? priorityMap.moyenne;

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
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/projets'));
  header.querySelector('#edit-btn').addEventListener('click', () => router.navigate(`/projets/${project.id}/modifier`));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-4)';

  screen.innerHTML = `
    <div>
      <div class="detail-tags-row">
        <span class="category-tag" style="color:var(${cat.color})">${icons[cat.icon]}${cat.label}</span>
        <span class="chip"><span class="priority-dot" style="background:var(${pr.color});display:inline-block;margin-right:5px"></span>${pr.label}</span>
        ${project.status === 'completed' ? '<span class="chip" style="color:var(--success-500)">✓ Terminé</span>' : ''}
      </div>
      <h1 class="detail-title" style="margin-top:var(--sp-3)">${project.name}</h1>
    </div>

    ${project.description ? `
    <section class="card">
      <div class="detail-section-title">Description</div>
      <p class="detail-desc">${project.description}</p>
    </section>` : ''}

    <section class="card">
      <div class="progress-header">
        <span class="progress-header__title">Progression</span>
        <span class="progress-header__value mono">${project.progress}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${project.progress}%"></div></div>
    </section>

    <section class="card">
      <div class="detail-meta-grid">
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Deadline</span>
          <span class="detail-meta-item__value">${project.deadline ? fmtDate(project.deadline) : '—'}</span>
        </div>
        ${project.budget != null ? `
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Budget</span>
          <span class="detail-meta-item__value">${project.budget.toLocaleString('fr-FR')} Ar</span>
        </div>` : ''}
      </div>
    </section>

    <section class="card">
      <div class="detail-section-title">Tâches</div>
      <div id="tasks-list"></div>
      <div class="add-inline-row">
        <input class="form-input" id="new-task-input" placeholder="Ajouter une tâche..." />
        <button class="add-inline-btn" id="add-task-btn" aria-label="Ajouter">${icons.plus}</button>
      </div>
    </section>

    <section class="card">
      <div class="detail-section-title">Statut</div>
      <div class="status-picker" id="project-status-picker">
        ${Object.entries(statusLabels).map(([id, label]) => `
          <button type="button" class="tab-btn ${project.status === id ? 'is-active' : ''}" data-status="${id}">${label}</button>
        `).join('')}
      </div>
    </section>
  `;

  const tasksList = screen.querySelector('#tasks-list');
  if (project.tasks.length === 0) {
    tasksList.innerHTML = `<p style="font-size:var(--fs-sm);color:var(--text-tertiary)">Aucune tâche pour l'instant.</p>`;
  } else {
    project.tasks.forEach((t) => tasksList.appendChild(taskRow(project.id, t, rerender)));
  }

  screen.querySelector('#add-task-btn').addEventListener('click', () => {
    const input = screen.querySelector('#new-task-input');
    if (input.value.trim()) {
      store.addProjectTask(project.id, input.value);
      rerender();
    }
  });
  screen.querySelector('#new-task-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      screen.querySelector('#add-task-btn').click();
    }
  });

  screen.querySelector('#project-status-picker').querySelectorAll('[data-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.setProjectStatus(project.id, btn.dataset.status);
      rerender();
    });
  });

  el.appendChild(screen);

  header.querySelector('#delete-btn').addEventListener('click', () => {
    el.appendChild(deleteConfirmSheet(project));
  });

  return el;
}
