import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';

// État local de l'écran (mémoire vive, pas persisté) — navigation interne à
// 5 sehatra : 'accueil' | 'categories' | 'preparation' | 'checklist' | 'rapport'.
// Indépendant de l'Agenda : aucune tâche n'est lue ni modifiée par cet écran.
//
// 'preparation' est un écran dédié, affiché avant 'checklist' pour CHAQUE
// étape (Avant puis Pendant puis Après) : l'utilisateur y construit sa liste
// d'items pour l'étape courante, puis "Confirmer" ouvre le stepper de
// vérification (cocher) pour cette même étape. On revient en 'preparation'
// à chaque changement d'étape (Suivant), sauf si cette étape a déjà été
// préparée au moins une fois (préparedSteps) — pour ne pas ré-imposer l'écran
// d'ajout si l'utilisateur revient simplement cocher/décocher.
let stage = 'accueil';
let activeChecklistId = null; // id de la checklist en cours de configuration/vérification
let searchQuery = ''; // filtre texte sur la liste de catégories
let addingCategory = false;
let addingItemForStep = null; // step ('avant'|'pendant'|'apres') en cours d'ajout d'item, ou null
let preparedSteps = new Set(); // steps déjà confirmées au moins une fois pour la checklist active

const STEPS = [
  { id: 'avant', label: 'Avant', numero: 1 },
  { id: 'pendant', label: 'Pendant', numero: 2 },
  { id: 'apres', label: 'Après', numero: 3 },
];

/** Suffixe de couleur par catégorie (voir data/verificationCategories.js — champ
 * `color`), utilisé pour construire les classes --blue/--orange/etc. de
 * pawa-beloha.css. Les catégories personnalisées (sans `color`) retombent sur
 * 'slate', une teinte neutre déjà définie. */
function categoryColorClass(cat) {
  return (cat && cat.color) || 'slate';
}

function resetLocalState() {
  stage = 'accueil';
  activeChecklistId = null;
  searchQuery = '';
  addingCategory = false;
  addingItemForStep = null;
  preparedSteps = new Set();
}

/** Contenu du bandeau de features sous le hero (accueil) — purement
 * informatif, aucune carte n'est cliquable. Voir .pawa-beloha-features. */
const FEATURES = [
  { icon: 'globe', title: 'Universelle', desc: 'Pour toutes vos activités' },
  { icon: 'shieldCheck', title: 'Fiable', desc: 'Réduit les oublis et les risques' },
  { icon: 'bolt', title: 'Simple', desc: 'En quelques clics' },
  { icon: 'notes', title: 'Rapport', desc: 'Preuve de vérification' },
  { icon: 'star', title: 'Votre allié', desc: 'Professionnel ou personnel' },
];

/** Rangée horizontale swipable de cartes-features — voir FEATURES ci-dessus. */
function featuresCarousel() {
  const strip = document.createElement('div');
  strip.className = 'pawa-beloha-features';
  FEATURES.forEach((f) => {
    const card = document.createElement('div');
    card.className = 'pawa-beloha-feature-card';
    card.innerHTML = `
      <span class="pawa-beloha-feature-card__icon">${icons[f.icon] || ''}</span>
      <span class="pawa-beloha-feature-card__title">${f.title}</span>
      <span class="pawa-beloha-feature-card__desc">${f.desc}</span>
    `;
    strip.appendChild(card);
  });
  return strip;
}

/**
 * Sehatra 1 — écran d'accueil : logo, slogan, bouton "Commencer", puis
 * bandeau de features swipable. Purement décoratif/transitionnel — un seul
 * clic sur "Commencer" mène à la sélection de catégorie ; rien n'est créé
 * ni persisté tant que l'utilisateur n'a pas choisi une catégorie à l'étape
 * suivante.
 */
function accueilStage(rerender) {
  const outer = document.createElement('div');

  const wrap = document.createElement('div');
  wrap.className = 'pawa-beloha-hero';
  wrap.innerHTML = `
    <div class="pawa-beloha-hero__hiker" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="4.5" r="2"/><path d="M12 7 9 12l1.5 1 .8-1.5L12 15l-.5 6h1.8L14 15l1-2 1 5.5h1.8L16 12l-2.7-4.5c-.4-.7-1.6-.7-1.3-.5Z"/></svg>
    </div>
    <div class="pawa-beloha-hero__logo">${icons.shieldCheck}</div>
    <h1 class="pawa-beloha-hero__title">PAWA BELOHA</h1>
    <p class="pawa-beloha-hero__subtitle">Universal Verification System</p>
    <p class="pawa-beloha-hero__slogan">Tsy izay tadidiana<br />no azo antoka.<br />Izay nohamarinina<br />no azo antoka.</p>
    <button type="button" class="btn-primary pawa-beloha-hero__cta">Commencer</button>
    <p class="pawa-beloha-hero__tagline">Vérifie · Avance · Sois tranquille</p>
  `;
  wrap.querySelector('.pawa-beloha-hero__cta').addEventListener('click', () => {
    stage = 'categories';
    rerender();
  });
  outer.appendChild(wrap);
  outer.appendChild(featuresCarousel());
  return outer;
}

/**
 * Sehatra 2 — sélection de catégorie : recherche + grille de catégories
 * (base + personnalisées), plus "+ Ajouter une catégorie". Choisir une
 * catégorie crée immédiatement une nouvelle checklist vide (aucun item
 * pré-rempli) et bascule sur le stepper checklist.
 */
function categoriesStage(rerender) {
  const wrap = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'pawa-beloha-cat-header';
  header.innerHTML = `
    <h1 class="pawa-beloha-cat-header__title">PAWA BELOHA</h1>
    <p class="pawa-beloha-cat-header__subtitle">Choisisses une catégorie</p>
  `;
  wrap.appendChild(header);

  const searchBar = document.createElement('div');
  searchBar.className = 'agenda-search';
  searchBar.innerHTML = `
    <span class="agenda-search__icon">${icons.search}</span>
    <input class="form-input" type="text" id="pawa-cat-search" placeholder="Rechercher une activité..." value="${searchQuery}" />
  `;
  searchBar.querySelector('#pawa-cat-search').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    rerender();
  });
  wrap.appendChild(searchBar);

  const allCategories = store.getVerificationCategories();
  const q = searchQuery.trim().toLowerCase();
  const filtered = q ? allCategories.filter((c) => c.label.toLowerCase().includes(q)) : allCategories;

  const list = document.createElement('div');
  list.className = 'pawa-beloha-cat-list';

  function startChecklistForCategory(categoryId, categoryLabel) {
    const checklist = store.createPawaBelohaChecklist({ category: categoryId, title: categoryLabel });
    activeChecklistId = checklist.id;
    addingItemForStep = null;
    preparedSteps = new Set();
    stage = 'preparation';
    rerender();
  }

  filtered.forEach((cat) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'pawa-beloha-cat-row';
    row.innerHTML = `
      <span class="pawa-beloha-cat-row__icon pawa-beloha-cat-row__icon--${categoryColorClass(cat)}">${icons[cat.icon] || icons.folder || ''}</span>
      <span class="pawa-beloha-cat-row__body">
        <span class="pawa-beloha-cat-row__label">${cat.label}</span>
        ${cat.hint ? `<span class="pawa-beloha-cat-row__hint">${cat.hint}</span>` : ''}
      </span>
      <span class="pawa-beloha-cat-row__chevron">${icons.chevronRight || '›'}</span>
    `;
    row.addEventListener('click', () => startChecklistForCategory(cat.id, cat.label));
    list.appendChild(row);
  });

  if (!q) {
    if (addingCategory) {
      const form = document.createElement('form');
      form.className = 'pawa-beloha-inline-form';
      form.innerHTML = `
        <input class="form-input" type="text" name="categoryLabel" placeholder="Nom de la catégorie" required />
        <button type="submit" class="btn-secondary">${icons.plus || ''}Ajouter</button>
      `;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const label = new FormData(form).get('categoryLabel')?.toString().trim();
        if (!label) return;
        const newCat = store.addVerificationCategory(label);
        addingCategory = false;
        if (newCat) startChecklistForCategory(newCat.id, newCat.label);
        else rerender(); // ← inchangé : passe déjà par startChecklistForCategory ci-dessus
      });
      list.appendChild(form);
      setTimeout(() => form.querySelector('input').focus(), 0);
    } else {
      const addRow = document.createElement('button');
      addRow.type = 'button';
      addRow.className = 'pawa-beloha-cat-row pawa-beloha-cat-row--add';
      addRow.innerHTML = `
        <span class="pawa-beloha-cat-row__icon">${icons.plus || '+'}</span>
        <span class="pawa-beloha-cat-row__body">
          <span class="pawa-beloha-cat-row__label">Autre</span>
          <span class="pawa-beloha-cat-row__hint">Créer ma propre checklist</span>
        </span>
      `;
      addRow.addEventListener('click', () => { addingCategory = true; rerender(); });
      list.appendChild(addRow);
    }
  }

  wrap.appendChild(list);
  return wrap;
}

/**
 * Sehatra 3 — préparation : écran dédié à la construction de la liste
 * d'items pour l'étape courante (Avant/Pendant/Après), affiché AVANT le
 * stepper de vérification (cocher) de cette même étape — voir `stage`
 * plus haut. Réutilise le header + stepper de checklistStage pour rester
 * visuellement cohérent ; la liste ici n'a ni case à cocher ni "is-checked",
 * seulement titre + réordonner/modifier/supprimer, puisqu'on ne fait que la
 * construire. "Confirmer" bascule vers 'checklist' pour cocher, et marque
 * l'étape comme préparée (on ne repasse plus par cet écran si l'utilisateur
 * revient simplement cocher/décocher sans changer d'étape).
 */
function preparationStage(checklist, rerender) {
  const wrap = document.createElement('div');
  const cat = store.getVerificationCategories().find((c) => c.id === checklist.category);

  const header = document.createElement('div');
  header.className = 'pawa-beloha-checklist-header';
  header.innerHTML = `
    <button type="button" class="pawa-beloha-back" id="pawa-back-to-cats" aria-label="Retour">${icons.chevronLeft || '‹'}</button>
    <span class="pawa-beloha-checklist-header__icon pawa-beloha-checklist-header__icon--${categoryColorClass(cat)}">${(cat && icons[cat.icon]) || icons.folder || ''}</span>
    <span class="pawa-beloha-checklist-header__title">${(cat && cat.label) || checklist.title}</span>
  `;
  header.querySelector('#pawa-back-to-cats').addEventListener('click', () => {
    store.deletePawaBelohaChecklist(checklist.id); // checklist vide abandonnée = pas de trace inutile
    activeChecklistId = null;
    stage = 'categories';
    rerender();
  });
  wrap.appendChild(header);

  // Même stepper que checklistStage, purement indicatif ici (pas cliquable
  // pour sauter une étape non préparée — on avance uniquement via Confirmer).
  const stepper = document.createElement('div');
  stepper.className = 'pawa-beloha-stepper';
  STEPS.forEach((s, idx) => {
    const isActive = checklist.currentStep === s.id;
    const isPast = STEPS.findIndex((x) => x.id === checklist.currentStep) > idx;
    const stepEl = document.createElement('span');
    stepEl.className = `pawa-beloha-step${isActive ? ' is-active' : ''}${isPast ? ' is-past' : ''}`;
    stepEl.innerHTML = `
      <span class="pawa-beloha-step__num">${isPast ? (icons.check) : s.numero}</span>
      <span class="pawa-beloha-step__label">${s.label}</span>
    `;
    stepper.appendChild(stepEl);
    if (idx < STEPS.length - 1) {
      const sep = document.createElement('span');
      sep.className = `pawa-beloha-step__sep${isPast ? ' is-past' : ''}`;
      stepper.appendChild(sep);
    }
  });
  wrap.appendChild(stepper);

  const stepLabelObj = STEPS.find((s) => s.id === checklist.currentStep);
  const stepContextLabel = cat ? cat.label.split(' / ')[0].toLowerCase() : '';
  const items = checklist.steps[checklist.currentStep];

  const title = document.createElement('div');
  title.className = 'pawa-beloha-prep-title';
  title.innerHTML = `<span class="pawa-beloha-prep-title__icon">${icons.plus || ''}Ajouter — ${stepLabelObj.label}${stepContextLabel ? ` ${stepContextLabel}` : ''}</span><span class="mono">${items.length}</span>`;
  wrap.appendChild(title);

  const hint = document.createElement('p');
  hint.className = 'pawa-beloha-prep-hint';
  hint.textContent = 'Ajoute tout ce que tu dois vérifier pour cette étape, puis confirme pour commencer à cocher.';
  wrap.appendChild(hint);

  const listCard = document.createElement('div');
  listCard.className = 'card';
  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'pawa-beloha-empty';
    empty.textContent = 'Aucune vérification ajoutée';
    listCard.appendChild(empty);
  } else {
    const list = document.createElement('div');
    list.className = 'pawa-beloha-check-list';
    items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'pawa-beloha-check-row';
      row.innerHTML = `
        <span class="pawa-beloha-check-row__title">${item.title}</span>
        <div class="pawa-beloha-item-row__actions">
          <button type="button" class="agenda-block__reorder-btn" data-act="up" ${idx === 0 ? 'disabled' : ''} aria-label="Monter">${icons.chevronUp || '▲'}</button>
          <button type="button" class="agenda-block__reorder-btn" data-act="down" ${idx === items.length - 1 ? 'disabled' : ''} aria-label="Descendre">${icons.chevronDown || '▼'}</button>
          <button type="button" class="agenda-block__edit" data-act="edit" aria-label="Modifier">${icons.edit || '✎'}</button>
          <button type="button" class="agenda-block__delete" data-act="remove" aria-label="Supprimer">${icons.trash || '×'}</button>
        </div>
      `;
      row.querySelector('[data-act="remove"]').addEventListener('click', () => {
        store.removePawaBelohaItem(checklist.id, checklist.currentStep, item.id);
        rerender();
      });
      row.querySelector('[data-act="up"]')?.addEventListener('click', () => {
        store.movePawaBelohaItem(checklist.id, checklist.currentStep, item.id, -1);
        rerender();
      });
      row.querySelector('[data-act="down"]')?.addEventListener('click', () => {
        store.movePawaBelohaItem(checklist.id, checklist.currentStep, item.id, 1);
        rerender();
      });
      row.querySelector('[data-act="edit"]').addEventListener('click', () => {
        const nextTitle = window.prompt('Modifier la vérification :', item.title);
        if (nextTitle && nextTitle.trim()) {
          store.updatePawaBelohaItem(checklist.id, checklist.currentStep, item.id, nextTitle.trim());
          rerender();
        }
      });
      list.appendChild(row);
    });
    listCard.appendChild(list);
  }

  const form = document.createElement('form');
  form.className = 'pawa-beloha-prep-form';
  form.innerHTML = `
    <input class="form-input" type="text" name="itemTitle" placeholder="Nom de la vérification" required />
    <button type="submit" class="btn-secondary">${icons.plus || ''}Ajouter</button>
  `;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title2 = new FormData(form).get('itemTitle')?.toString().trim();
    if (!title2) return;
    store.addPawaBelohaItem(checklist.id, checklist.currentStep, title2);
    form.reset();
    rerender();
    // Après rerender, l'input est recréé vide — on lui redonne le focus pour
    // enchaîner l'ajout de plusieurs items sans re-cliquer dans le champ.
    setTimeout(() => {
      const freshInput = wrap.parentElement?.querySelector('.pawa-beloha-prep-form input');
      freshInput?.focus();
    }, 0);
  });
  listCard.appendChild(form);
  wrap.appendChild(listCard);

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'btn-primary pawa-beloha-confirm-btn';
  confirmBtn.textContent = 'Confirmer';
  confirmBtn.disabled = items.length === 0;
  confirmBtn.addEventListener('click', () => {
    if (items.length === 0) return;
    preparedSteps.add(checklist.currentStep);
    stage = 'checklist';
    rerender();
  });
  wrap.appendChild(confirmBtn);

  return wrap;
}

/**
 * Sehatra 4 — checklist avec stepper Avant/Pendant/Après. Chaque étape a sa
 * propre liste d'items, construite au préalable sur l'écran de préparation
 * (voir preparationStage ci-dessus). L'utilisateur coche/édite/supprime/
 * réordonne ses items à l'étape active uniquement. "Suivant" repasse par
 * l'écran de préparation de l'étape suivante (si elle n'a encore jamais été
 * préparée) ; sur la dernière étape, le bouton devient "Voir le rapport"
 * (toujours cliquable — le rapport lui-même bloque la finalisation tant que
 * tout n'est pas coché, voir rapportStage()).
 */
function checklistStage(checklist, rerender) {
  const wrap = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'pawa-beloha-checklist-header';
  const cat = store.getVerificationCategories().find((c) => c.id === checklist.category);
  header.innerHTML = `
    <button type="button" class="pawa-beloha-back" id="pawa-back-to-cats" aria-label="Retour">${icons.chevronLeft || '‹'}</button>
    <span class="pawa-beloha-checklist-header__icon pawa-beloha-checklist-header__icon--${categoryColorClass(cat)}">${(cat && icons[cat.icon]) || icons.folder || ''}</span>
    <span class="pawa-beloha-checklist-header__title">${(cat && cat.label) || checklist.title}</span>
  `;
  header.querySelector('#pawa-back-to-cats').addEventListener('click', () => {
    store.deletePawaBelohaChecklist(checklist.id); // checklist vide abandonnée = pas de trace inutile
    activeChecklistId = null;
    stage = 'categories';
    rerender();
  });
  wrap.appendChild(header);

  // Stepper 1-2-3
  const stepper = document.createElement('div');
  stepper.className = 'pawa-beloha-stepper';
  STEPS.forEach((s, idx) => {
    const isActive = checklist.currentStep === s.id;
    const isPast = STEPS.findIndex((x) => x.id === checklist.currentStep) > idx;
    const stepEl = document.createElement('button');
    stepEl.type = 'button';
    stepEl.className = `pawa-beloha-step${isActive ? ' is-active' : ''}${isPast ? ' is-past' : ''}`;
    stepEl.innerHTML = `
      <span class="pawa-beloha-step__num">${isPast ? (icons.check) : s.numero}</span>
      <span class="pawa-beloha-step__label">${s.label}</span>
    `;
    stepEl.addEventListener('click', () => {
      store.setPawaBelohaStep(checklist.id, s.id);
      addingItemForStep = null;
      stage = preparedSteps.has(s.id) ? 'checklist' : 'preparation';
      rerender();
    });
    stepper.appendChild(stepEl);
    if (idx < STEPS.length - 1) {
      const sep = document.createElement('span');
      sep.className = `pawa-beloha-step__sep${isPast ? ' is-past' : ''}`;
      stepper.appendChild(sep);
    }
  });
  wrap.appendChild(stepper);

  // Titre d'étape + compteur (X/Y sur l'étape active uniquement)
  const activeItems = checklist.steps[checklist.currentStep];
  const activeCheckedCount = activeItems.filter((it) => it.checked).length;
  const stepTitle = document.createElement('div');
  stepTitle.className = 'pawa-beloha-step-title';
  const stepLabelObj = STEPS.find((s) => s.id === checklist.currentStep);
  const stepIcons = { avant: icons.sun, pendant: icons.clock, apres: icons.checkCircle };
  const stepIcon = stepIcons[checklist.currentStep] || icons.check || '';
  const stepContextLabel = cat ? cat.label.split(' / ')[0].toLowerCase() : '';
  stepTitle.innerHTML = `
    <span><span class="pawa-beloha-step-title__icon">${stepIcon}</span>${stepLabelObj.label}${stepContextLabel ? ` ${stepContextLabel}` : ''}</span>
    <span class="mono">${activeCheckedCount} / ${activeItems.length}</span>
  `;
  wrap.appendChild(stepTitle);

  // Liste des items de l'étape active
  const listCard = document.createElement('div');
  listCard.className = 'card';
  if (activeItems.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'pawa-beloha-empty';
    empty.textContent = 'Aucune vérification ajoutée';
    listCard.appendChild(empty);
  } else {
    const list = document.createElement('div');
    list.className = 'pawa-beloha-check-list';
    activeItems.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = `pawa-beloha-check-row${item.checked ? ' is-checked' : ''}`;
      row.innerHTML = `
        <button type="button" class="pawa-beloha-check-row__box-btn" data-act="toggle">
          <span class="pawa-beloha-check-row__box">${item.checked ? (icons.check) : ''}</span>
        </button>
        <span class="pawa-beloha-check-row__title">${item.title}</span>
        <div class="pawa-beloha-item-row__actions">
          <button type="button" class="agenda-block__reorder-btn" data-act="up" ${idx === 0 ? 'disabled' : ''} aria-label="Monter">${icons.chevronUp || '▲'}</button>
          <button type="button" class="agenda-block__reorder-btn" data-act="down" ${idx === activeItems.length - 1 ? 'disabled' : ''} aria-label="Descendre">${icons.chevronDown || '▼'}</button>
          <button type="button" class="agenda-block__edit" data-act="edit" aria-label="Modifier">${icons.edit || '✎'}</button>
          <button type="button" class="agenda-block__delete" data-act="remove" aria-label="Supprimer">${icons.trash || '×'}</button>
        </div>
      `;
      row.querySelector('[data-act="toggle"]').addEventListener('click', () => {
        store.togglePawaBelohaItem(checklist.id, checklist.currentStep, item.id);
        rerender();
      });
      row.querySelector('[data-act="remove"]').addEventListener('click', () => {
        store.removePawaBelohaItem(checklist.id, checklist.currentStep, item.id);
        rerender();
      });
      row.querySelector('[data-act="up"]')?.addEventListener('click', () => {
        store.movePawaBelohaItem(checklist.id, checklist.currentStep, item.id, -1);
        rerender();
      });
      row.querySelector('[data-act="down"]')?.addEventListener('click', () => {
        store.movePawaBelohaItem(checklist.id, checklist.currentStep, item.id, 1);
        rerender();
      });
      row.querySelector('[data-act="edit"]').addEventListener('click', () => {
        const nextTitle = window.prompt('Modifier la vérification :', item.title);
        if (nextTitle && nextTitle.trim()) {
          store.updatePawaBelohaItem(checklist.id, checklist.currentStep, item.id, nextTitle.trim());
          rerender();
        }
      });
      list.appendChild(row);
    });
    listCard.appendChild(list);
  }

  if (addingItemForStep === checklist.currentStep) {
    const form = document.createElement('form');
    form.className = 'pawa-beloha-inline-form';
    form.innerHTML = `
      <input class="form-input" type="text" name="itemTitle" placeholder="Nom de la vérification" required />
      <button type="submit" class="btn-secondary">${icons.plus || ''}Ajouter</button>
    `;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = new FormData(form).get('itemTitle')?.toString().trim();
      if (!title) return;
      store.addPawaBelohaItem(checklist.id, checklist.currentStep, title);
      addingItemForStep = null;
      rerender();
    });
    listCard.appendChild(form);
    setTimeout(() => form.querySelector('input').focus(), 0);
  } else {
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'chip';
    addBtn.style.marginTop = 'var(--sp-2)';
    addBtn.innerHTML = `${icons.plus || '+'}Ajouter une vérification`;
    addBtn.addEventListener('click', () => { addingItemForStep = checklist.currentStep; rerender(); });
    listCard.appendChild(addBtn);
  }
  wrap.appendChild(listCard);

  // Bouton de progression : Suivant (avant/pendant) → Voir le rapport (après)
  const isLastStep = checklist.currentStep === 'apres';
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'btn-primary pawa-beloha-next-btn';
  nextBtn.textContent = isLastStep ? 'Voir le rapport' : 'Suivant';
  nextBtn.addEventListener('click', () => {
    if (isLastStep) {
      stage = 'rapport';
      rerender();
      return;
    }
    const currentIdx = STEPS.findIndex((s) => s.id === checklist.currentStep);
    const nextStepId = STEPS[currentIdx + 1].id;
    store.setPawaBelohaStep(checklist.id, nextStepId);
    addingItemForStep = null;
    stage = preparedSteps.has(nextStepId) ? 'checklist' : 'preparation';
    rerender();
  });
  wrap.appendChild(nextBtn);

  return wrap;
}

/**
 * Sehatra 4 — rapport final. Affiche le résumé (total/vérifié/date/heure),
 * un champ "Vérifié par" et "Remarques" à renseigner avant finalisation.
 * "Valider" n'est actif que si tous les items des 3 étapes sont cochés —
 * sinon un message explique ce qui manque encore, sans bloquer l'accès à
 * l'écran lui-même (l'utilisateur peut revenir en arrière compléter).
 */
function rapportStage(checklist, rerender) {
  const wrap = document.createElement('div');
  const summary = store.getPawaBelohaSummary(checklist);
  const allChecked = summary.total > 0 && summary.checkedCount === summary.total;
  const isFinalized = !!checklist.completedAt;
  const cat = store.getVerificationCategories().find((c) => c.id === checklist.category);

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'pawa-beloha-back';
  backBtn.setAttribute('aria-label', 'Retour');
  backBtn.innerHTML = icons.chevronLeft || '‹';
  backBtn.addEventListener('click', () => {
    stage = 'checklist';
    rerender();
  });
  wrap.appendChild(backBtn);

  if (isFinalized) {
    const successCard = document.createElement('div');
    successCard.className = 'pawa-beloha-success';
    const completedDate = new Date(checklist.completedAt);
    const catShort = cat ? cat.label : checklist.title;
    // Confettis décoratifs — quelques pastilles colorées positionnées en dur,
    // purement visuel, aucune animation JS requise (voir pawa-beloha.css).
    const confettiColors = ['#2F6FE8', '#2FB463', '#E8821E', '#7C4FE0', '#1FB3C4'];
    const confettiSpans = Array.from({ length: 10 }).map((_, i) => {
      const left = 8 + (i * 9) % 90;
      const top = (i % 3) * 18 + (i % 2 === 0 ? 4 : 20);
      const rotate = (i * 37) % 360;
      const color = confettiColors[i % confettiColors.length];
      return `<span style="left:${left}%;top:${top}px;background:${color};transform:rotate(${rotate}deg)"></span>`;
    }).join('');

    successCard.innerHTML = `
      <div class="pawa-beloha-success__confetti">${confettiSpans}</div>
      <div class="pawa-beloha-success__icon-wrap">${icons.check}</div>
      <h1 class="pawa-beloha-success__title">Vérification terminée !</h1>
      <p class="pawa-beloha-success__subtitle">${catShort}</p>
      <p class="pawa-beloha-success__subtitle-cat">Avant ${cat ? cat.label.split(' / ')[0].toLowerCase() : ''}</p>
      <div class="pawa-beloha-success__badge">
        <div class="pawa-beloha-success__badge-left">
          <span class="pawa-beloha-success__badge-count">${summary.checkedCount} / ${summary.total}</span>
          <span class="pawa-beloha-success__badge-label">vérifications</span>
        </div>
        <span class="chip pawa-beloha-success__badge-valid">${icons.check || ''}Validé</span>
      </div>
      <div class="pawa-beloha-report-list">
        <div class="pawa-beloha-report-row">
          <span class="pawa-beloha-report-row__icon">${icons.calendar || ''}</span>
          <span class="pawa-beloha-report-row__body">
            <span class="pawa-beloha-report-row__label">Date</span>
            <span class="pawa-beloha-report-row__value mono">${completedDate.toLocaleDateString('fr-FR')}</span>
          </span>
        </div>
        <div class="pawa-beloha-report-row">
          <span class="pawa-beloha-report-row__icon">${icons.clock || ''}</span>
          <span class="pawa-beloha-report-row__body">
            <span class="pawa-beloha-report-row__label">Heure</span>
            <span class="pawa-beloha-report-row__value mono">${completedDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          </span>
        </div>
        <div class="pawa-beloha-report-row">
          <span class="pawa-beloha-report-row__icon">${icons.user || ''}</span>
          <span class="pawa-beloha-report-row__body">
            <span class="pawa-beloha-report-row__label">Vérifié par</span>
            <span class="pawa-beloha-report-row__value">${checklist.verifiedBy || '—'}</span>
          </span>
        </div>
      </div>
      <div class="pawa-beloha-remarks-card">
        <div class="pawa-beloha-remarks-card__label">${icons.notes || ''}Remarques</div>
        <p class="pawa-beloha-remarks-card__value">${checklist.remarks || 'Aucune remarque'}</p>
      </div>
      <div class="pawa-beloha-report-actions">
        <button type="button" class="pawa-beloha-report-actions__main" id="pawa-done-btn">Voir le rapport</button>
        <button type="button" class="pawa-beloha-report-actions__share" id="pawa-share-btn" aria-label="Partager">${icons.share}</button>
      </div>
    `;
    wrap.appendChild(successCard);

    successCard.querySelector('#pawa-share-btn').addEventListener('click', async () => {
      const text = `PAWA BELOHA — ${checklist.title}\n${summary.checkedCount}/${summary.total} vérifications validées\n${new Date(checklist.completedAt).toLocaleString('fr-FR')}\nVérifié par : ${checklist.verifiedBy || '—'}\nRemarques : ${checklist.remarks || 'Aucune remarque'}`;
      if (navigator.share) {
        try { await navigator.share({ title: 'Rapport Pawa Beloha', text }); } catch { /* partage annulé, rien à faire */ }
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    });
    successCard.querySelector('#pawa-done-btn').addEventListener('click', () => {
      activeChecklistId = null;
      stage = 'categories';
      rerender();
    });
    return wrap;
  }

  // Pas encore finalisé : formulaire Vérifié par / Remarques + bouton Valider,
  // désactivé tant que tous les items ne sont pas cochés sur les 3 étapes.
  const form = document.createElement('form');
  form.className = 'card pawa-beloha-rapport-form';
  form.innerHTML = `
    <div class="pawa-beloha-header">
      <span class="pawa-beloha-header__icon">${icons.notes || ''}</span>
      <span class="pawa-beloha-header__title">Résumé de la vérification</span>
    </div>
    <div class="detail-meta-grid" style="margin-top:var(--sp-2)">
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">Total</span>
        <span class="detail-meta-item__value mono">${summary.total}</span>
      </div>
      <div class="detail-meta-item">
        <span class="detail-meta-item__label">Vérifié</span>
        <span class="detail-meta-item__value mono" style="color:${allChecked ? 'var(--success-500)' : 'var(--text-primary)'}">${summary.checkedCount}</span>
      </div>
    </div>
    ${!allChecked ? `<p class="detail-desc" style="margin-top:var(--sp-2);color:var(--warning-500)">Complète toutes les étapes (Avant / Pendant / Après) avant de valider.</p>` : ''}
    <div class="form-group" style="margin-top:var(--sp-3)">
      <label class="form-label" for="f-verified-by">Vérifié par</label>
      <input class="form-input" type="text" id="f-verified-by" name="verifiedBy" value="${checklist.verifiedBy || ''}" placeholder="Ton nom" />
    </div>
    <div class="form-group" style="margin-top:var(--sp-2)">
      <label class="form-label" for="f-remarks">Remarques (optionnel)</label>
      <input class="form-input" type="text" id="f-remarks" name="remarks" value="${checklist.remarks || ''}" />
    </div>
    <button type="submit" class="btn-primary" style="width:100%;margin-top:var(--sp-3)" ${allChecked ? '' : 'disabled'}>${icons.check || ''}Valider</button>
  `;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!allChecked) return;
    const data = new FormData(form);
    store.completePawaBelohaChecklist(checklist.id, {
      verifiedBy: data.get('verifiedBy')?.toString() || '',
      remarks: data.get('remarks')?.toString() || '',
    });
    rerender();
  });
  wrap.appendChild(form);

  return wrap;
}

export function PawaBelohaScreen() {
  const el = document.createElement('div');
  el.className = 'pawa-beloha-screen';

  function rerender() {
    el.replaceWith(PawaBelohaScreen());
  }

  const screen = document.createElement('main');
  screen.className = 'screen';

  if (stage === 'accueil') {
    screen.appendChild(accueilStage(rerender));
  } else if (stage === 'categories') {
    screen.appendChild(categoriesStage(rerender));
  } else if (stage === 'preparation' || stage === 'checklist' || stage === 'rapport') {
    const checklist = activeChecklistId ? store.getPawaBelohaChecklist(activeChecklistId) : null;
    if (!checklist) {
      // Checklist introuvable (supprimée entre-temps) : retour propre à l'accueil.
      resetLocalState();
      screen.appendChild(accueilStage(rerender));
    } else if (stage === 'preparation') {
      screen.appendChild(preparationStage(checklist, rerender));
    } else if (stage === 'checklist') {
      screen.appendChild(checklistStage(checklist, rerender));
    } else {
      screen.appendChild(rapportStage(checklist, rerender));
    }
  }

  el.appendChild(screen);
  return el;
}
