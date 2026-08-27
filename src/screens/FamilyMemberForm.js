import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';

export function FamilyMemberForm(params = {}) {
  const editingId = params.id ?? null;
  const existing = editingId ? store.getFamilyMember(editingId) : null;

  if (editingId && !existing) {
    router.navigate('/family');
    return document.createElement('div');
  }

  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">${existing ? 'Modifier le membre' : 'Nouveau membre'}</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => {
    router.navigate(existing ? `/family/membres/${existing.id}` : '/family');
  });
  el.appendChild(header);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-3)';

  screen.innerHTML = `
    <form id="member-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="f-name">Nom</label>
        <input class="form-input" id="f-name" name="name" placeholder="Ex. Marie" value="${existing?.name ?? ''}" required />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-relation">Relation <span class="optional">(optionnel)</span></label>
        <input class="form-input" id="f-relation" name="relation" placeholder="Ex. Conjointe, Fils, Mère..." value="${existing?.relation ?? ''}" />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-birthday">Anniversaire <span class="optional">(optionnel)</span></label>
        <input class="form-input" type="date" id="f-birthday" name="birthday" value="${existing?.birthday ?? ''}" />
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-notes">Notes <span class="optional">(optionnel)</span></label>
        <textarea class="form-textarea" id="f-notes" name="notes" placeholder="Préférences, souvenirs, idées de cadeaux...">${existing?.notes ?? ''}</textarea>
      </div>

      <p class="form-error" id="form-error" hidden>Le nom est requis.</p>

      <div class="form-actions">
        <button type="button" class="btn-secondary" id="cancel-btn">Annuler</button>
        <button type="submit" class="btn-primary">${existing ? 'Enregistrer' : 'Ajouter'}</button>
      </div>
    </form>
  `;

  el.appendChild(screen);

  screen.querySelector('#cancel-btn').addEventListener('click', () => {
    router.navigate(existing ? `/family/membres/${existing.id}` : '/family');
  });

  screen.querySelector('#member-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name')?.toString().trim();
    const errorEl = screen.querySelector('#form-error');
    if (!name) {
      errorEl.hidden = false;
      screen.querySelector('#f-name').focus();
      return;
    }
    errorEl.hidden = true;

    const fields = {
      name,
      relation: formData.get('relation')?.toString() ?? '',
      birthday: formData.get('birthday')?.toString() ?? '',
      notes: formData.get('notes')?.toString() ?? '',
    };

    if (existing) {
      store.updateFamilyMember(existing.id, fields);
      router.navigate(`/family/membres/${existing.id}`);
    } else {
      const id = store.createFamilyMember(fields);
      router.navigate(`/family/membres/${id}`);
    }
  });

  return el;
}
