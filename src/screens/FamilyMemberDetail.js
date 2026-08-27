import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function dateRow(memberId, entry, rerender) {
  const row = document.createElement('div');
  row.className = 'step-row';
  row.innerHTML = `
    <span class="step-row__text">${entry.label} — ${fmtDate(entry.date)}</span>
    <button class="step-row__delete" aria-label="Supprimer">${icons.trash}</button>
  `;
  row.querySelector('.step-row__delete').addEventListener('click', () => {
    store.deleteFamilyMemberDate(memberId, entry.id);
    rerender();
  });
  return row;
}

function deleteConfirmSheet(member) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer ce membre ?</h2>
      <p class="confirm-sheet__desc">« ${member.name} » sera supprimé définitivement, avec ses dates importantes. Cette opération est irréversible.</p>
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
    store.deleteFamilyMember(member.id);
    router.navigate('/family');
  });
  return backdrop;
}

export function FamilyMemberDetail(params = {}) {
  const member = store.getFamilyMember(params.id);
  const el = document.createElement('div');

  if (!member) {
    router.navigate('/family');
    return el;
  }

  const rerender = () => {
    const fresh = FamilyMemberDetail(params);
    el.replaceWith(fresh);
  };

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
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/family'));
  header.querySelector('#edit-btn').addEventListener('click', () => router.navigate(`/family/membres/${member.id}/modifier`));
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-4)';

  screen.innerHTML = `
    <div>
      <div class="detail-tags-row">
        ${member.relation ? `<span class="chip">${member.relation}</span>` : ''}
      </div>
      <h1 class="detail-title" style="margin-top:var(--sp-3)">${member.name}</h1>
    </div>

    <section class="card">
      <div class="detail-meta-grid">
        <div class="detail-meta-item">
          <span class="detail-meta-item__label">Anniversaire</span>
          <span class="detail-meta-item__value">${member.birthday ? fmtDate(member.birthday) : '—'}</span>
        </div>
      </div>
    </section>

    ${member.notes ? `
    <section class="card">
      <div class="detail-section-title">Notes</div>
      <p class="detail-desc">${member.notes}</p>
    </section>` : ''}

    <section class="card">
      <div class="detail-section-title">Dates importantes</div>
      <div id="dates-list"></div>
      <div class="add-inline-row">
        <input class="form-input" id="new-date-label" placeholder="Ex. Anniversaire de mariage" />
        <input class="form-input" type="date" id="new-date-value" style="max-width:150px" />
        <button class="add-inline-btn" id="add-date-btn" aria-label="Ajouter">${icons.plus}</button>
      </div>
    </section>
  `;

  const list = screen.querySelector('#dates-list');
  if (member.importantDates.length === 0) {
    list.innerHTML = `<p style="font-size:var(--fs-sm);color:var(--text-tertiary)">Aucune date ajoutée pour l'instant.</p>`;
  } else {
    member.importantDates.forEach((d) => list.appendChild(dateRow(member.id, d, rerender)));
  }

  screen.querySelector('#add-date-btn').addEventListener('click', () => {
    const labelInput = screen.querySelector('#new-date-label');
    const dateInput = screen.querySelector('#new-date-value');
    if (labelInput.value.trim() && dateInput.value) {
      store.addFamilyMemberDate(member.id, labelInput.value, dateInput.value);
      rerender();
    }
  });
  screen.querySelector('#new-date-label').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      screen.querySelector('#add-date-btn').click();
    }
  });

  el.appendChild(screen);

  header.querySelector('#delete-btn').addEventListener('click', () => {
    el.appendChild(deleteConfirmSheet(member));
  });

  return el;
}
