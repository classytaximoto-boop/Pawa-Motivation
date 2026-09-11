import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { traitCategories, suggestedTraitDomains, skillCategories, skillCategoryMap, skillLevels } from '../data/personalDev.js';
import { legalScenarios, didYouKnowFacts, legalDisclaimer } from '../data/legalRights.js';
import { businessPlanSections, milestoneStatuses, milestoneStatusMap } from '../data/businessPlan.js';
import { learningDomains } from '../data/learningContent.js';
import { psychoArticles } from '../data/psychoContent.js';
import { religionsDisclaimer, religionsArticles } from '../data/religionsContent.js';
import { verbalStyles, verbalCategories, verbalSituations, getSituationsByCategory, peopleTypes } from '../data/verbalAttack.js';
import { confidenceTriggersByType } from '../data/confidenceTriggers.js';
import { selfEsteemTriggersByType } from '../data/selfEsteemTriggers.js';

let activeTab = 'traits'; // traits | skills | accomplishments | confidence | selfesteem | legal | business | verbal

/**
 * Appelée depuis un autre écran (ex: bouton "Compétences" sur une tâche de
 * l'Agenda) juste avant `router.navigate('/developpement')`, pour que
 * l'écran Développement s'ouvre directement sur l'onglet Compétences avec
 * le formulaire d'ajout déjà déplié — sans pré-remplir aucun champ.
 */
export function openSkillsAddForm() {
  activeTab = 'skills';
  openSkillForm = true;
}

/**
 * Même principe qu'openSkillsAddForm ci-dessus, mais pour l'onglet
 * Accomplissements (bouton "Accomplissement" sur une tâche de l'Agenda).
 * Il n'y a pas de "formulaire replié" à ouvrir ici — le champ texte est
 * toujours visible dans cet onglet — donc on se contente de sélectionner
 * l'onglet ; router.navigate('/developpement') fait le reste.
 */
export function openAccomplishmentAddForm() {
  activeTab = 'accomplishments';
}
let selectedTraitCategory = 'force';
let selectedTraitDomain = '';
let openSkillForm = false;
let formSkillCategory = 'technique';
let formSkillLevel = 2;
let openMilestoneForm = false;
let openLegalTopic = null;
let dykIndex = Math.floor(Math.random() * 10000); // point de départ aléatoire pour le "Did you know"
let openLearningDomain = null;
let openPsychoArticle = null;
let openReligionArticle = null;
let verbalSubTab = 'situations'; // situations | people
let selectedVerbalCategory = 'quotidien';
let openVerbalSituation = null;
let openPeopleType = null;

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ACCOMPLISHMENT_MOTIVATIONS = [
  'Chaque accomplissement noté renforce ta confiance en toi.',
  'Tu construis ton estime de soi un jour à la fois.',
  'C\'est exactement cette régularité qui bâtit une vraie confiance.',
  'Bravo, tu prends la preuve de ce dont tu es capable.',
  'Un accomplissement de plus, une preuve de plus que tu avances.',
];

const SKILL_MOTIVATIONS = [
  'Une compétence de plus dans ta boîte à outils.',
  'Tu investis en toi — ça paie toujours.',
  'Chaque compétence ajoutée est un pas vers qui tu veux devenir.',
  'Continue, ton potentiel grandit avec chaque compétence notée.',
  'Bien joué, tu élargis ce que tu sais faire.',
];

/**
 * Toast de célébration doré (trophée) — déclenché à l'ajout d'un
 * accomplissement ou d'une compétence. Styles injectés en inline (pas de
 * dépendance à un fichier CSS externe non confirmé dans ce module) : couleur
 * or (#f5b942 / dégradé) pour la coupe, disparition automatique après 2.6s.
 * `kind` détermine uniquement le pool de messages et le sous-texte ; le
 * visuel (icône trophée, dégradé or) est identique dans les deux cas.
 */
function celebrationToast(kind) {
  const pool = kind === 'skill' ? SKILL_MOTIVATIONS : ACCOMPLISHMENT_MOTIVATIONS;
  const message = pool[Math.floor(Math.random() * pool.length)];
  const subtext = kind === 'skill' ? 'Nouvelle compétence enregistrée' : 'Nouvel accomplissement noté';

  const toast = document.createElement('div');
  toast.setAttribute('role', 'status');
  toast.style.cssText = `
    position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%) translateY(20px);
    display: flex; align-items: center; gap: 12px;
    background: linear-gradient(135deg, #3a2a06, #1f1704);
    border: 1px solid #f5b942; border-radius: 16px;
    padding: 12px 16px; max-width: 92vw; width: 360px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,185,66,0.15);
    opacity: 0; transition: opacity 0.25s ease, transform 0.25s ease;
    z-index: 9999;
  `;
  toast.innerHTML = `
    <span style="flex-shrink:0; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:radial-gradient(circle, #ffe08a, #f5b942 65%, #b8860b); color:#3a2a06; box-shadow:0 0 12px rgba(245,185,66,0.6);">
      ${icons.trophy || '🏆'}
    </span>
    <span style="min-width:0;">
      <span style="display:block; font-weight:700; color:#ffe9b3; font-size:var(--fs-sm);">${subtext}</span>
      <span style="display:block; color:#f3d9a0; font-size:var(--fs-sm); margin-top:2px;">${message}</span>
    </span>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

// ---------------------------------------------------------------
// Onglet Forces / Faiblesses
// ---------------------------------------------------------------
function renderTraits(screen) {
  const traits = store.listTraits();
  const forces = traits.filter((t) => t.category === 'force');
  const faiblesses = traits.filter((t) => t.category === 'faiblesse');

  screen.innerHTML = `
    <p class="detail-desc">Note honnêtement tes forces et tes points à travailler. Se connaître, c'est la base pour progresser vite.</p>

    <form id="trait-form" class="card" style="margin-top:var(--sp-4);">
      <div class="tab-row" role="tablist" style="margin-bottom:var(--sp-3)">
        ${traitCategories.map((c) => `<button type="button" class="tab-btn ${selectedTraitCategory === c.id ? 'is-active' : ''}" data-trait-cat="${c.id}">${c.label}</button>`).join('')}
      </div>
      <div class="category-scroll" id="trait-domain-scroll">
        ${suggestedTraitDomains.map((d) => `<button type="button" class="category-chip ${selectedTraitDomain === d ? 'is-active' : ''}" data-domain="${d}">${d}</button>`).join('')}
      </div>
      <input class="form-input" id="trait-domain-input" placeholder="Ou précise ici..." style="margin-top:var(--sp-2);" value="${selectedTraitDomain && !suggestedTraitDomains.includes(selectedTraitDomain) ? selectedTraitDomain : ''}" />
      <textarea class="form-textarea" id="trait-note" placeholder="Détaille — un exemple concret aide plus qu'un mot vague." style="margin-top:var(--sp-2);"></textarea>
      <button type="submit" class="btn-primary" style="width:100%; margin-top:var(--sp-3);">Ajouter</button>
    </form>

    <div class="card__label" style="margin-top:var(--sp-5)">Forces (${forces.length})</div>
    <div id="trait-forces-list"></div>

    <div class="card__label" style="margin-top:var(--sp-5)">À travailler (${faiblesses.length})</div>
    <div id="trait-faiblesses-list"></div>
  `;

  function traitRow(t) {
    return `
      <div class="card card--tight" style="margin-top:var(--sp-2); display:flex; justify-content:space-between; align-items:flex-start; gap:var(--sp-2);">
        <div>
          <p style="font-weight:600; margin:0 0 4px 0;">${t.domain}</p>
          ${t.note ? `<p style="color:var(--text-secondary); margin:0; font-size:var(--fs-sm);">${t.note}</p>` : ''}
        </div>
        <button type="button" class="icon-btn" data-delete-trait="${t.id}" aria-label="Supprimer">${icons.trash}</button>
      </div>`;
  }

  const forcesList = screen.querySelector('#trait-forces-list');
  forcesList.innerHTML = forces.length ? forces.map(traitRow).join('') : `<p class="detail-desc">Rien pour l'instant.</p>`;
  const faiblessesList = screen.querySelector('#trait-faiblesses-list');
  faiblessesList.innerHTML = faiblesses.length ? faiblesses.map(traitRow).join('') : `<p class="detail-desc">Rien pour l'instant.</p>`;

  screen.querySelectorAll('[data-trait-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedTraitCategory = btn.dataset.traitCat;
      renderTraits(screen);
    });
  });
  screen.querySelectorAll('[data-domain]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedTraitDomain = btn.dataset.domain;
      renderTraits(screen);
    });
  });
  screen.querySelectorAll('[data-delete-trait]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.deleteTrait(btn.dataset.deleteTrait);
      renderTraits(screen);
    });
  });

  screen.querySelector('#trait-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const domainInput = screen.querySelector('#trait-domain-input').value.trim();
    const domain = domainInput || selectedTraitDomain;
    if (!domain) return;
    store.addTrait({
      domain,
      category: selectedTraitCategory,
      note: screen.querySelector('#trait-note').value,
    });
    selectedTraitDomain = '';
    renderTraits(screen);
  });
}

// ---------------------------------------------------------------
// Onglet Compétences
// ---------------------------------------------------------------
function renderSkills(screen) {
  const skills = store.listSkills();

  screen.innerHTML = `
    <p class="detail-desc">Les compétences que tu construis, avec ton niveau actuel. Reviens régulièrement mettre à jour.</p>
    <button type="button" class="btn-primary" id="skill-add-btn" style="width:100%; margin-top:var(--sp-4);">${openSkillForm ? 'Annuler' : '+ Ajouter une compétence'}</button>

    ${openSkillForm ? `
    <form id="skill-form" class="card" style="margin-top:var(--sp-4);">
      <input class="form-input" id="skill-name" placeholder="Nom de la compétence" required />
      <div class="category-scroll" style="margin-top:var(--sp-3)">
        ${skillCategories.map((c) => `<button type="button" class="category-chip ${formSkillCategory === c.id ? 'is-active' : ''}" data-skill-cat="${c.id}">${c.label}</button>`).join('')}
      </div>
      <div class="mind-slider-row" style="margin-top:var(--sp-3)">
        <div class="mind-slider-row__top">
          <label class="form-label">Niveau</label>
          <span class="mind-slider-row__value mono" id="skill-level-out">${skillLevels.find((l) => l.id === formSkillLevel)?.label}</span>
        </div>
        <input class="mind-slider" type="range" min="1" max="5" step="1" id="skill-level" value="${formSkillLevel}" />
      </div>
      <textarea class="form-textarea" id="skill-note" placeholder="Note (optionnel)" style="margin-top:var(--sp-3)"></textarea>
      <button type="submit" class="btn-primary" style="width:100%; margin-top:var(--sp-3);">Enregistrer</button>
    </form>` : ''}

    <div id="skills-list" style="margin-top:var(--sp-4)"></div>

    <div class="card__label" style="margin-top:var(--sp-6)">📚 Compétences à apprendre</div>
    <p class="detail-desc" style="margin-top:2px;">Des pistes concrètes par domaine pour progresser. Touche un domaine pour l'ouvrir.</p>
    <div id="learning-domains" style="margin-top:var(--sp-3); display:flex; flex-direction:column; gap:var(--sp-2);"></div>

    <div class="card__label" style="margin-top:var(--sp-6)">🧠 PSYCHO</div>
    <p class="detail-desc" style="margin-top:2px;">Mémoire, manipulation, respect, écoute — des mécanismes psychologiques expliqués simplement. Touche un article pour l'ouvrir.</p>
    <div id="psycho-articles" style="margin-top:var(--sp-3); display:flex; flex-direction:column; gap:var(--sp-2);"></div>

    <div class="card__label" style="margin-top:var(--sp-6)">🕊️ Religions & croyances</div>
    <p class="detail-desc" style="margin-top:2px;">Comment différentes traditions religieuses envisagent la mort et l'au-delà. Contenu culturel, à titre informatif — aucune religion n'y est présentée comme supérieure aux autres.</p>
    <div id="religions-articles" style="margin-top:var(--sp-3); display:flex; flex-direction:column; gap:var(--sp-2);"></div>
  `;

  const listEl = screen.querySelector('#skills-list');
  if (!skills.length) {
    listEl.innerHTML = `<p class="detail-desc">Aucune compétence enregistrée pour l'instant.</p>`;
  } else {
    listEl.innerHTML = skills.map((s) => {
      const hasEvidence = (s.evidenceCount || 0) > 0;
      const levelLabel = skillLevels.find((l) => l.id === s.level)?.label;
      const metaLine = hasEvidence
        ? `${skillCategoryMap[s.category]?.label ?? s.category} · ${levelLabel} · ${s.xp || 0} XP · ${s.evidenceCount} preuve${s.evidenceCount > 1 ? 's' : ''}`
        : `${skillCategoryMap[s.category]?.label ?? s.category} · ${levelLabel}`;
      return `
      <div class="card card--tight" style="margin-top:var(--sp-2); display:flex; justify-content:space-between; align-items:center; gap:var(--sp-2);">
        <div style="min-width:0;">
          <p style="font-weight:600; margin:0 0 2px 0;">${s.name}</p>
          <p style="font-size:var(--fs-sm); color:var(--text-tertiary); margin:0;">${metaLine}</p>
        </div>
        <button type="button" class="icon-btn" data-delete-skill="${s.id}" aria-label="Supprimer">${icons.trash}</button>
      </div>
    `;
    }).join('');
  }

  screen.querySelector('#skill-add-btn').addEventListener('click', () => {
    openSkillForm = !openSkillForm;
    renderSkills(screen);
  });

  screen.querySelectorAll('[data-delete-skill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.deleteSkill(btn.dataset.deleteSkill);
      renderSkills(screen);
    });
  });

  if (openSkillForm) {
    screen.querySelectorAll('[data-skill-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        formSkillCategory = btn.dataset.skillCat;
        renderSkills(screen);
      });
    });
    const levelInput = screen.querySelector('#skill-level');
    levelInput.addEventListener('input', () => {
      formSkillLevel = Number(levelInput.value);
      screen.querySelector('#skill-level-out').textContent = skillLevels.find((l) => l.id === formSkillLevel)?.label;
    });
    screen.querySelector('#skill-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = screen.querySelector('#skill-name').value.trim();
      if (!name) return;
      store.addSkill({
        name,
        category: formSkillCategory,
        level: formSkillLevel,
        note: screen.querySelector('#skill-note').value,
      });
      celebrationToast('skill');
      openSkillForm = false;
      formSkillCategory = 'technique';
      formSkillLevel = 2;
      renderSkills(screen);
    });
  }

  // --- Compétences à apprendre (contenu statique, par domaine) ---
  const domainsEl = screen.querySelector('#learning-domains');
  domainsEl.innerHTML = learningDomains.map((d) => {
    const isOpen = openLearningDomain === d.id;
    return `
      <div class="card card--tight">
        <button type="button" class="legal-topic-toggle" data-learning-domain="${d.id}" style="width:100%; display:flex; justify-content:space-between; align-items:center; background:none; border:none; color:var(--text-primary); font-weight:600; font-size:var(--fs-md); padding:0; cursor:pointer; text-align:left;">
          <span>${d.icon} ${d.label} <span style="font-weight:400; color:var(--text-tertiary); font-size:var(--fs-sm);">(${d.skills.length})</span></span>
          <span style="transform:${isOpen ? 'rotate(90deg)' : 'none'}; transition:transform 0.15s; flex-shrink:0;">${icons.chevronRight}</span>
        </button>
        ${isOpen ? `
          <div style="margin-top:var(--sp-3); display:flex; flex-direction:column; gap:var(--sp-3);">
            ${d.skills.map((s) => `
              <div style="border-left:2px solid var(--ember-500); padding-left:var(--sp-3);">
                <p style="font-weight:600; margin:0 0 4px 0;">${s.name}</p>
                <p style="margin:0; color:var(--text-secondary); font-size:var(--fs-sm);">${s.desc}</p>
                <ul style="margin:6px 0 0 0; padding-left:18px; color:var(--text-tertiary); font-size:var(--fs-sm);">
                  ${s.pistes.map((p) => `<li style="margin-bottom:2px;">${p}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  domainsEl.querySelectorAll('[data-learning-domain]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openLearningDomain = openLearningDomain === btn.dataset.learningDomain ? null : btn.dataset.learningDomain;
      renderSkills(screen);
    });
  });

  // --- PSYCHO (articles de vulgarisation psycho/neurosciences) ---
  const psychoEl = screen.querySelector('#psycho-articles');
  psychoEl.innerHTML = psychoArticles.map((a) => {
    const isOpen = openPsychoArticle === a.id;
    return `
      <div class="card card--tight">
        <button type="button" class="legal-topic-toggle" data-psycho-article="${a.id}" style="width:100%; display:flex; justify-content:space-between; align-items:center; background:none; border:none; color:var(--text-primary); font-weight:600; font-size:var(--fs-md); padding:0; cursor:pointer; text-align:left; gap:var(--sp-2);">
          <span style="display:block;">${a.title}</span>
          <span style="transform:${isOpen ? 'rotate(90deg)' : 'none'}; transition:transform 0.15s; flex-shrink:0;">${icons.chevronRight}</span>
        </button>
        ${isOpen ? `
          <div style="margin-top:var(--sp-3);">
            <p style="margin:0 0 var(--sp-3) 0; color:var(--text-secondary); font-size:var(--fs-sm); font-style:italic;">${a.intro}</p>
            <div style="display:flex; flex-direction:column; gap:var(--sp-3);">
              ${a.points.map((p) => `
                <div style="border-left:2px solid var(--ember-500); padding-left:var(--sp-3);">
                  <p style="font-weight:600; margin:0 0 4px 0;">${p.heading}</p>
                  <p style="margin:0; color:var(--text-secondary); font-size:var(--fs-sm);">${p.body}</p>
                </div>
              `).join('')}
            </div>
            <div class="mind-disclaimer" style="margin-top:var(--sp-3);">💡 ${a.outro}</div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  psychoEl.querySelectorAll('[data-psycho-article]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openPsychoArticle = openPsychoArticle === btn.dataset.psychoArticle ? null : btn.dataset.psychoArticle;
      renderSkills(screen);
    });
  });

  // --- Religions & croyances (contenu culturel sur la mort et l'au-delà) ---
  const religionsEl = screen.querySelector('#religions-articles');
  religionsEl.innerHTML = religionsArticles.map((a) => {
    const isOpen = openReligionArticle === a.id;
    return `
      <div class="card card--tight">
        <button type="button" class="legal-topic-toggle" data-religion-article="${a.id}" style="width:100%; display:flex; justify-content:space-between; align-items:center; background:none; border:none; color:var(--text-primary); font-weight:600; font-size:var(--fs-md); padding:0; cursor:pointer; text-align:left; gap:var(--sp-2);">
          <span style="display:block;">${a.title}</span>
          <span style="transform:${isOpen ? 'rotate(90deg)' : 'none'}; transition:transform 0.15s; flex-shrink:0;">${icons.chevronRight}</span>
        </button>
        ${isOpen ? `
          <div style="margin-top:var(--sp-3);">
            <p style="margin:0 0 var(--sp-3) 0; color:var(--text-secondary); font-size:var(--fs-sm); font-style:italic;">${a.intro}</p>
            <div style="display:flex; flex-direction:column; gap:var(--sp-3);">
              ${a.points.map((p) => `
                <div style="border-left:2px solid var(--ember-500); padding-left:var(--sp-3);">
                  <p style="font-weight:600; margin:0 0 4px 0;">${p.heading}</p>
                  <p style="margin:0; color:var(--text-secondary); font-size:var(--fs-sm);">${p.body}</p>
                </div>
              `).join('')}
            </div>
            <div class="mind-disclaimer" style="margin-top:var(--sp-3);">💡 ${a.outro}</div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('') + `<div class="mind-disclaimer" style="margin-top:var(--sp-3);">ℹ️ ${religionsDisclaimer}</div>`;

  religionsEl.querySelectorAll('[data-religion-article]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openReligionArticle = openReligionArticle === btn.dataset.religionArticle ? null : btn.dataset.religionArticle;
      renderSkills(screen);
    });
  });
}

// ---------------------------------------------------------------
// Onglet Droits (Madagascar) — dialogues "Pawa mode avocat" vs agent + Did you know
// ---------------------------------------------------------------
function dialogueBubble(turn) {
  const isAgent = turn.type === 'agent';
  return `
    <div style="display:flex; ${isAgent ? '' : 'justify-content:flex-end;'} margin-bottom:var(--sp-2);">
      <div style="max-width:85%; background:${isAgent ? 'var(--bg-surface-raised)' : 'var(--ember-500)'}; color:${isAgent ? 'var(--text-primary)' : '#fff'}; border-radius:var(--radius-md); padding:var(--sp-3);">
        <p style="font-size:var(--fs-xs); text-transform:uppercase; letter-spacing:0.04em; opacity:0.7; margin:0 0 4px 0;">${isAgent ? "Représentant de l'État" : 'Pawa (mode avocat)'}</p>
        <p style="margin:0;">${turn.text}</p>
        ${turn.article ? `<p style="font-size:var(--fs-xs); margin:6px 0 0 0; opacity:0.8; font-style:italic;">📖 ${turn.article}</p>` : ''}
      </div>
    </div>`;
}

function scenarioCard(scenario) {
  const isOpen = openLegalTopic === scenario.id;
  return `
    <div class="card card--tight">
      <button type="button" class="legal-topic-toggle" data-topic="${scenario.id}" style="width:100%; display:flex; justify-content:space-between; align-items:center; background:none; border:none; color:var(--text-primary); font-weight:600; font-size:var(--fs-md); padding:0; cursor:pointer; text-align:left;">
        <span>
          <span style="display:block;">${scenario.title}</span>
          <span style="display:block; font-weight:400; font-size:var(--fs-sm); color:var(--text-tertiary); margin-top:2px;">${scenario.intro}</span>
        </span>
        <span style="transform:${isOpen ? 'rotate(90deg)' : 'none'}; transition:transform 0.15s; flex-shrink:0;">${icons.chevronRight}</span>
      </button>
      ${isOpen ? `
        <div style="margin-top:var(--sp-4);">
          ${scenario.turns.map(dialogueBubble).join('')}
        </div>
        <div class="mind-disclaimer" style="margin-top:var(--sp-2);">
          <strong>À retenir :</strong> ${scenario.keyTakeaway}
        </div>
      ` : ''}
    </div>
  `;
}

// ---------------------------------------------------------------
// Onglet Accomplissements — accomplissement du jour (texte libre),
// confiance en soi / estime de soi / points calculés automatiquement
// par l'app (voir store.addAccomplishment). Aucune saisie manuelle de
// ces 3 valeurs : elles apparaissent seulement après validation, pour
// que l'utilisateur découvre le résultat plutôt que de le fixer lui-même.
// ---------------------------------------------------------------
function renderAccomplishments(screen) {
  const list = store.listAccomplishments();
  const stats = store.getAccomplishmentStats();
  const today = new Date().toISOString().slice(0, 10);
  const hasToday = list.some((a) => a.date === today);

  screen.innerHTML = `
    <p class="detail-desc">Note ce que tu as accompli aujourd'hui, même petit. La confiance en soi, l'estime de soi et les points sont calculés automatiquement à partir de ce que tu écris — tu n'as rien à noter toi-même.</p>

    <div class="card" style="margin-top:var(--sp-4); display:flex; justify-content:space-around; text-align:center; gap:var(--sp-2);">
      <div>
        <div class="mono" style="font-size:var(--fs-xl); font-weight:700;">${stats.totalPoints}</div>
        <div class="detail-desc" style="margin:0;">Points totaux</div>
      </div>
      <div>
        <div class="mono" style="font-size:var(--fs-xl); font-weight:700;">${stats.currentStreak}</div>
        <div class="detail-desc" style="margin:0;">Jour${stats.currentStreak > 1 ? 's' : ''} de suite</div>
      </div>
      <div>
        <div class="mono" style="font-size:var(--fs-xl); font-weight:700;">${stats.count}</div>
        <div class="detail-desc" style="margin:0;">Accomplissements</div>
      </div>
    </div>

    ${hasToday ? `
      <div class="mind-disclaimer" style="margin-top:var(--sp-4);">✅ Tu as déjà noté un accomplissement aujourd'hui. Tu peux en ajouter un autre si tu veux.</div>
    ` : ''}

    <form id="accomplishment-form" class="card" style="margin-top:var(--sp-4);">
      <label class="form-label">Accomplissement du jour</label>
      <textarea class="form-textarea" id="accomplishment-text" placeholder="Qu'est-ce que tu as accompli aujourd'hui ? Sois précis, un détail concret compte plus qu'une phrase vague." style="margin-top:var(--sp-2);" required></textarea>
      <button type="submit" class="btn-primary" style="width:100%; margin-top:var(--sp-3);">Valider</button>
    </form>

    <div class="card__label" style="margin-top:var(--sp-5)">Historique (${list.length})</div>
    <div id="accomplishments-list"></div>
  `;

  function scoreBadge(label, value) {
    return `<span class="mono" style="display:inline-flex; align-items:center; gap:4px; font-size:var(--fs-sm); background:var(--surface-2, rgba(255,255,255,0.06)); padding:2px 8px; border-radius:999px;">${label} ${value}/10</span>`;
  }

  function accomplishmentRow(a) {
    // Accomplissements auto-générés (voir store.recordEvidenceFromCompletion)
    // portent `title` + `auto: true` au lieu de `text` — le texte libre saisi
    // à la main reste dans `text` pour ne rien changer côté saisie manuelle.
    const displayText = a.auto ? a.title : a.text;
    return `
      <div class="card card--tight" style="margin-top:var(--sp-2);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:var(--sp-2);">
          <p style="margin:0; flex:1;">${displayText}</p>
          <button type="button" class="icon-btn" data-delete-accomplishment="${a.id}" aria-label="Supprimer">${icons.trash}</button>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:var(--sp-2); align-items:center;">
          ${a.auto ? `<span class="mono" style="font-size:var(--fs-sm); color:var(--accent-steel, #3D9BE9);">🔗 Preuve automatique</span>` : ''}
          <span class="detail-desc" style="margin:0;">${formatDate(a.date)}</span>
          ${scoreBadge('Confiance', a.confidence)}
          ${scoreBadge('Estime', a.selfEsteem)}
          <span class="mono" style="font-weight:700;">+${a.points} pts</span>
        </div>
        ${a.auto && a.skills?.length ? `<div style="margin-top:6px; font-size:var(--fs-sm); color:var(--text-tertiary);">Compétences : ${a.skills.join(', ')}</div>` : ''}
      </div>`;
  }

  const listEl = screen.querySelector('#accomplishments-list');
  listEl.innerHTML = list.length ? list.map(accomplishmentRow).join('') : `<p class="detail-desc">Rien pour l'instant — commence par celui d'aujourd'hui.</p>`;

  listEl.querySelectorAll('[data-delete-accomplishment]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.deleteAccomplishment(btn.dataset.deleteAccomplishment);
      renderAccomplishments(screen);
    });
  });

  screen.querySelector('#accomplishment-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = screen.querySelector('#accomplishment-text').value.trim();
    if (!text) return;
    store.addAccomplishment({ text });
    celebrationToast('accomplishment');
    renderAccomplishments(screen);
  });
}

// ---------------------------------------------------------------
// Onglet Confidence — "I CAN DO IT." — preuves de capacité, distinct de
// l'estime de soi. Affiche des preuves concrètes (voir store.getConfidenceStats()),
// jamais un score seul (voir PHILOSOPHIE §7 du prompt d'origine).
// ---------------------------------------------------------------
const CONFIDENCE_TYPE_LABELS = {
  goal_completed: 'objectifs atteints',
  project_completed: 'projets terminés',
  habit_completed: 'habitudes tenues',
  task_completed: 'tâches accomplies',
  problem_solved: 'problèmes résolus',
  skill_learned: 'compétences apprises',
  kept_word: 'promesses tenues',
};

function renderConfidence(screen) {
  const stats = store.getConfidenceStats();

  screen.innerHTML = `
    <p class="detail-desc">La confiance se construit avec des preuves de capacité réelles — pas avec un score. Chaque action réellement accomplie (objectif, projet, habitude, tâche, problème résolu) en ajoute une ici automatiquement.</p>

    <div class="card" style="margin-top:var(--sp-4); text-align:center;">
      <div class="mono" style="font-size:var(--fs-xl); font-weight:700;">${stats.total}</div>
      <div class="detail-desc" style="margin:0;">Preuve${stats.total > 1 ? 's' : ''} de capacité au total</div>
    </div>

    <div class="card__label" style="margin-top:var(--sp-5)">Par type</div>
    <div id="confidence-type-breakdown" style="margin-top:var(--sp-2); display:flex; flex-direction:column; gap:var(--sp-2);"></div>

    <div class="card__label" style="margin-top:var(--sp-5)">Preuves récentes</div>
    <div id="confidence-recent-list" style="margin-top:var(--sp-2);"></div>
  `;

  const breakdownEl = screen.querySelector('#confidence-type-breakdown');
  const types = Object.entries(stats.countByType);
  breakdownEl.innerHTML = types.length
    ? types.map(([type, count]) => `
        <div class="card card--tight" style="display:flex; justify-content:space-between; align-items:center;">
          <span>${CONFIDENCE_TYPE_LABELS[type] || type}</span>
          <span class="mono" style="font-weight:700;">${count}</span>
        </div>
      `).join('')
    : `<p class="detail-desc">Rien pour l'instant — la première preuve arrive dès ton prochain objectif, projet ou tâche accompli.</p>`;

  const recentEl = screen.querySelector('#confidence-recent-list');
  recentEl.innerHTML = stats.recent.length
    ? stats.recent.slice(0, 8).map((e) => {
        const trigger = (confidenceTriggersByType[e.type] || confidenceTriggersByType.default)[0];
        return `
          <div class="card card--tight" style="margin-top:var(--sp-2);">
            <p style="font-weight:700; margin:0 0 4px 0; letter-spacing:0.02em; font-size:var(--fs-sm); color:var(--ember-500);">${trigger.headline}</p>
            <p style="margin:0;">${e.label}</p>
            <p class="detail-desc" style="margin:4px 0 0 0;">${formatDate(e.date)}</p>
          </div>`;
      }).join('')
    : '';
}

// ---------------------------------------------------------------
// Onglet Self-Esteem — "I HAVE VALUE." — preuves de valeur/caractère,
// distinctes des preuves de performance (voir PHILOSOPHIE §8-9).
// ---------------------------------------------------------------
const SELF_ESTEEM_TYPE_LABELS = {
  promise_kept: 'promesses tenues envers toi-même',
  courage: 'actes de courage',
  responsibility: 'responsabilités assumées',
  comeback: 'retours après une pause',
  contribution: 'contributions aux autres',
  growth: 'moments de croissance',
  self_respect: 'moments de respect de soi',
};

function renderSelfEsteem(screen) {
  const stats = store.getSelfEsteemStats();

  screen.innerHTML = `
    <p class="detail-desc">L'estime de soi n'est pas la confiance. Ce n'est pas "je peux le faire", c'est "j'ai de la valeur" — nourrie par les promesses tenues, le courage, la responsabilité, les retours après une pause, plus que par la seule performance.</p>

    <div class="card" style="margin-top:var(--sp-4); text-align:center;">
      <div class="mono" style="font-size:var(--fs-xl); font-weight:700;">${stats.total}</div>
      <div class="detail-desc" style="margin:0;">Preuve${stats.total > 1 ? 's' : ''} de valeur au total</div>
    </div>

    <div class="card__label" style="margin-top:var(--sp-5)">Par type</div>
    <div id="esteem-type-breakdown" style="margin-top:var(--sp-2); display:flex; flex-direction:column; gap:var(--sp-2);"></div>

    <div class="card__label" style="margin-top:var(--sp-5)">Preuves récentes</div>
    <div id="esteem-recent-list" style="margin-top:var(--sp-2);"></div>
  `;

  const breakdownEl = screen.querySelector('#esteem-type-breakdown');
  const types = Object.entries(stats.countByType);
  breakdownEl.innerHTML = types.length
    ? types.map(([type, count]) => `
        <div class="card card--tight" style="display:flex; justify-content:space-between; align-items:center;">
          <span>${SELF_ESTEEM_TYPE_LABELS[type] || type}</span>
          <span class="mono" style="font-weight:700;">${count}</span>
        </div>
      `).join('')
    : `<p class="detail-desc">Rien pour l'instant — ces preuves arrivent avec le temps : une promesse tenue, un retour après une pause, un acte de courage.</p>`;

  const recentEl = screen.querySelector('#esteem-recent-list');
  recentEl.innerHTML = stats.recent.length
    ? stats.recent.slice(0, 8).map((e) => {
        const trigger = (selfEsteemTriggersByType[e.type] || selfEsteemTriggersByType.default)[0];
        return `
          <div class="card card--tight" style="margin-top:var(--sp-2);">
            <p style="font-weight:700; margin:0 0 4px 0; letter-spacing:0.02em; font-size:var(--fs-sm); color:var(--steel-400);">${trigger.headline}</p>
            <p style="margin:0;">${e.label}</p>
            <p class="detail-desc" style="margin:4px 0 0 0;">${formatDate(e.date)}</p>
          </div>`;
      }).join('')
    : '';
}

function renderLegal(screen) {
  const dyk = didYouKnowFacts[dykIndex % didYouKnowFacts.length];

  screen.innerHTML = `
    <p class="detail-desc">Comment réagir face à un représentant de l'État, en dialogue — pas en cours de droit. Basé sur le Code de procédure pénale et le Code pénal malgaches.</p>

    <div class="card" style="margin-top:var(--sp-4); border-left: 3px solid var(--ember-500);">
      <p style="font-size:var(--fs-xs); text-transform:uppercase; letter-spacing:0.04em; color:var(--ember-400); margin:0 0 6px 0;">💡 Le saviez-vous ?</p>
      <p style="margin:0;">${dyk.fact}</p>
      ${dyk.article ? `<p style="font-size:var(--fs-xs); color:var(--text-tertiary); font-style:italic; margin:8px 0 0 0;">📖 ${dyk.article}</p>` : ''}
      <button type="button" id="dyk-next" class="chip" style="margin-top:var(--sp-3);">Suivant →</button>
    </div>

    <div class="mind-disclaimer" style="margin-top:var(--sp-4)">${legalDisclaimer}</div>

    <div class="card__label" style="margin-top:var(--sp-5)">Scénarios</div>
    <div id="legal-topics" style="margin-top:var(--sp-2); display:flex; flex-direction:column; gap:var(--sp-2);"></div>
  `;

  screen.querySelector('#dyk-next').addEventListener('click', () => {
    dykIndex += 1;
    renderLegal(screen);
  });

  const container = screen.querySelector('#legal-topics');
  container.innerHTML = legalScenarios.map(scenarioCard).join('');

  container.querySelectorAll('[data-topic]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openLegalTopic = openLegalTopic === btn.dataset.topic ? null : btn.dataset.topic;
      renderLegal(screen);
    });
  });
}

// ---------------------------------------------------------------
// Onglet Business Plan
// ---------------------------------------------------------------
function renderBusiness(screen) {
  const plan = store.get().businessPlan;
  const milestones = store.listBusinessMilestones();
  const reached = milestones.filter((m) => m.status === 'atteint').length;

  screen.innerHTML = `
    <p class="detail-desc">Remplis ton plan section par section. Reviens le mettre à jour au fil de tes avancées.</p>

    <div id="business-sections" style="margin-top:var(--sp-4); display:flex; flex-direction:column; gap:var(--sp-3);"></div>

    <div class="card__label" style="margin-top:var(--sp-5)">Jalons (${reached}/${milestones.length} atteints)</div>
    <button type="button" class="btn-primary" id="milestone-add-btn" style="width:100%; margin-top:var(--sp-2);">${openMilestoneForm ? 'Annuler' : '+ Ajouter un jalon'}</button>

    ${openMilestoneForm ? `
    <form id="milestone-form" class="card" style="margin-top:var(--sp-3);">
      <input class="form-input" id="milestone-title" placeholder="Ex : Premier client payant" required />
      <input class="form-input" id="milestone-date" type="date" style="margin-top:var(--sp-2);" />
      <button type="submit" class="btn-primary" style="width:100%; margin-top:var(--sp-3);">Ajouter</button>
    </form>` : ''}

    <div id="milestones-list" style="margin-top:var(--sp-3)"></div>
  `;

  const sectionsEl = screen.querySelector('#business-sections');
  sectionsEl.innerHTML = businessPlanSections.map((s) => `
    <div class="form-group">
      <label class="form-label">${s.label}</label>
      <textarea class="form-textarea" data-section="${s.id}" placeholder="${s.placeholder}">${plan.sections[s.id] || ''}</textarea>
    </div>
  `).join('');

  sectionsEl.querySelectorAll('[data-section]').forEach((textarea) => {
    let timeout;
    textarea.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        store.updateBusinessPlanSection(textarea.dataset.section, textarea.value);
      }, 400);
    });
  });

  const milestonesList = screen.querySelector('#milestones-list');
  if (!milestones.length) {
    milestonesList.innerHTML = `<p class="detail-desc">Aucun jalon pour l'instant.</p>`;
  } else {
    milestonesList.innerHTML = milestones.map((m) => `
      <div class="card card--tight" style="margin-top:var(--sp-2);">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:var(--sp-2);">
          <div>
            <p style="font-weight:600; margin:0 0 2px 0;">${m.title}</p>
            ${m.targetDate ? `<p style="font-size:var(--fs-sm); color:var(--text-tertiary); margin:0;">Cible : ${formatDate(m.targetDate)}</p>` : ''}
          </div>
          <button type="button" class="icon-btn" data-delete-milestone="${m.id}" aria-label="Supprimer">${icons.trash}</button>
        </div>
        <div class="tab-row" style="margin-top:var(--sp-2)">
          ${milestoneStatuses.map((s) => `<button type="button" class="tab-btn ${m.status === s.id ? 'is-active' : ''}" data-milestone-status="${m.id}|${s.id}">${s.label}</button>`).join('')}
        </div>
      </div>
    `).join('');
  }

  screen.querySelector('#milestone-add-btn').addEventListener('click', () => {
    openMilestoneForm = !openMilestoneForm;
    renderBusiness(screen);
  });

  screen.querySelectorAll('[data-delete-milestone]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.deleteBusinessMilestone(btn.dataset.deleteMilestone);
      renderBusiness(screen);
    });
  });

  screen.querySelectorAll('[data-milestone-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [id, status] = btn.dataset.milestoneStatus.split('|');
      store.updateBusinessMilestone(id, { status });
      renderBusiness(screen);
    });
  });

  if (openMilestoneForm) {
    screen.querySelector('#milestone-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = screen.querySelector('#milestone-title').value.trim();
      if (!title) return;
      store.addBusinessMilestone({
        title,
        targetDate: screen.querySelector('#milestone-date').value,
      });
      openMilestoneForm = false;
      renderBusiness(screen);
    });
  }
}

// ---------------------------------------------------------------
// Onglet Attaque Verbale — situations + types de personnes,
// réponses SIGMA / ALPHA / CHARISME / CONFIANT
// ---------------------------------------------------------------
function verbalStyleBlock(style, lines) {
  return `
    <div style="margin-top:var(--sp-3);">
      <p style="font-size:var(--fs-xs); font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:${style.color}; margin:0 0 6px 0;">${style.label} <span style="font-weight:400; text-transform:none; color:var(--text-tertiary); letter-spacing:0;">— ${style.desc}</span></p>
      ${lines.map((line) => `
        <div style="background:var(--bg-surface-raised); border-left:3px solid ${style.color}; border-radius:var(--radius-sm); padding:var(--sp-2) var(--sp-3); margin-bottom:6px;">
          <p style="margin:0; font-size:var(--fs-sm);">"${line}"</p>
        </div>
      `).join('')}
    </div>`;
}

function verbalSituationCard(situation) {
  const isOpen = openVerbalSituation === situation.id;
  return `
    <div class="card card--tight">
      <button type="button" class="legal-topic-toggle" data-situation="${situation.id}" style="width:100%; display:flex; justify-content:space-between; align-items:center; background:none; border:none; color:var(--text-primary); font-weight:600; font-size:var(--fs-md); padding:0; cursor:pointer; text-align:left;">
        <span>
          <span style="display:block;">${situation.title}</span>
          <span style="display:block; font-weight:400; font-size:var(--fs-sm); color:var(--text-tertiary); margin-top:2px;">${situation.context}</span>
        </span>
        <span style="transform:${isOpen ? 'rotate(90deg)' : 'none'}; transition:transform 0.15s; flex-shrink:0;">${icons.chevronRight}</span>
      </button>
      ${isOpen ? `
        <div style="margin-top:var(--sp-2);">
          ${verbalStyles.map((style) => verbalStyleBlock(style, situation.responses[style.id] || [])).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function peopleTypeCard(person) {
  const isOpen = openPeopleType === person.id;
  return `
    <div class="card card--tight">
      <button type="button" class="legal-topic-toggle" data-people-type="${person.id}" style="width:100%; display:flex; justify-content:space-between; align-items:center; background:none; border:none; color:var(--text-primary); font-weight:600; font-size:var(--fs-md); padding:0; cursor:pointer; text-align:left;">
        <span style="display:block;">${person.name}</span>
        <span style="transform:${isOpen ? 'rotate(90deg)' : 'none'}; transition:transform 0.15s; flex-shrink:0;">${icons.chevronRight}</span>
      </button>
      ${isOpen ? `
        <div style="margin-top:var(--sp-2);">
          <div class="mind-disclaimer">💡 ${person.tip}</div>
          ${verbalStyles.map((style) => verbalStyleBlock(style, person.phrases[style.id] || [])).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderVerbal(screen) {
  screen.innerHTML = `
    <p class="detail-desc">Pour répondre avec assurance, pas pour attaquer. Choisis un style qui te ressemble selon le moment : calme (SIGMA), direct (ALPHA), avec humour (CHARISME), ou posé (CONFIANT).</p>

    <div class="mind-disclaimer" style="margin-top:var(--sp-3);">
      💡 Objectif : garder ton calme et ta dignité, pas provoquer un conflit. Adapte le ton à la situation réelle et aux personnes en face de toi.
    </div>

    <div class="tab-row" role="tablist" style="margin-top:var(--sp-4)">
      <button type="button" class="tab-btn ${verbalSubTab === 'situations' ? 'is-active' : ''}" data-verbal-subtab="situations">Situations</button>
      <button type="button" class="tab-btn ${verbalSubTab === 'people' ? 'is-active' : ''}" data-verbal-subtab="people">Types de personnes</button>
    </div>

    <div id="verbal-subtab-content" style="margin-top:var(--sp-3);"></div>
  `;

  const content = screen.querySelector('#verbal-subtab-content');

  if (verbalSubTab === 'situations') {
    const situations = getSituationsByCategory(selectedVerbalCategory);
    content.innerHTML = `
      <div class="category-scroll" id="verbal-cat-scroll">
        ${verbalCategories.map((c) => `<button type="button" class="category-chip ${selectedVerbalCategory === c.id ? 'is-active' : ''}" data-verbal-cat="${c.id}">${c.label}</button>`).join('')}
      </div>
      <div class="card__label" style="margin-top:var(--sp-4)">${situations.length} situation${situations.length > 1 ? 's' : ''}</div>
      <div id="verbal-situations" style="margin-top:var(--sp-2); display:flex; flex-direction:column; gap:var(--sp-2);"></div>
    `;

    const container = content.querySelector('#verbal-situations');
    container.innerHTML = situations.map(verbalSituationCard).join('');

    container.querySelectorAll('[data-situation]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openVerbalSituation = openVerbalSituation === btn.dataset.situation ? null : btn.dataset.situation;
        renderVerbal(screen);
      });
    });

    content.querySelectorAll('[data-verbal-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedVerbalCategory = btn.dataset.verbalCat;
        openVerbalSituation = null;
        renderVerbal(screen);
      });
    });
  } else {
    content.innerHTML = `
      <p class="detail-desc">15 profils de personnes qu'on rencontre régulièrement, avec un conseil d'approche et des phrases-clés prêtes à utiliser.</p>
      <div id="verbal-people" style="margin-top:var(--sp-3); display:flex; flex-direction:column; gap:var(--sp-2);"></div>
    `;

    const peopleContainer = content.querySelector('#verbal-people');
    peopleContainer.innerHTML = peopleTypes.map(peopleTypeCard).join('');

    peopleContainer.querySelectorAll('[data-people-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        openPeopleType = openPeopleType === btn.dataset.peopleType ? null : btn.dataset.peopleType;
        renderVerbal(screen);
      });
    });
  }

  screen.querySelectorAll('[data-verbal-subtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      verbalSubTab = btn.dataset.verbalSubtab;
      openVerbalSituation = null;
      openPeopleType = null;
      renderVerbal(screen);
    });
  });
}

export function Skills() {
  const el = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">Développement</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/'));
  el.appendChild(header);

  const tabs = document.createElement('div');
  tabs.className = 'tab-row mind-tab-row';
  tabs.style.margin = '0 var(--sp-5)';
  tabs.setAttribute('role', 'tablist');
  tabs.innerHTML = `
    <button class="tab-btn ${activeTab === 'traits' ? 'is-active' : ''}" data-tab="traits">Forces/Faiblesses</button>
    <button class="tab-btn ${activeTab === 'skills' ? 'is-active' : ''}" data-tab="skills">Compétences</button>
    <button class="tab-btn ${activeTab === 'accomplishments' ? 'is-active' : ''}" data-tab="accomplishments">Accomplissements</button>
    <button class="tab-btn ${activeTab === 'confidence' ? 'is-active' : ''}" data-tab="confidence">Confiance</button>
    <button class="tab-btn ${activeTab === 'selfesteem' ? 'is-active' : ''}" data-tab="selfesteem">Estime de soi</button>
    <button class="tab-btn ${activeTab === 'legal' ? 'is-active' : ''}" data-tab="legal">Droits</button>
    <button class="tab-btn ${activeTab === 'business' ? 'is-active' : ''}" data-tab="business">Business Plan</button>
    <button class="tab-btn ${activeTab === 'verbal' ? 'is-active' : ''}" data-tab="verbal">Attaque Verbale</button>
  `;
  el.appendChild(tabs);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-4)';
  el.appendChild(screen);

  if (activeTab === 'traits') renderTraits(screen);
  else if (activeTab === 'skills') renderSkills(screen);
  else if (activeTab === 'accomplishments') renderAccomplishments(screen);
  else if (activeTab === 'confidence') renderConfidence(screen);
  else if (activeTab === 'selfesteem') renderSelfEsteem(screen);
  else if (activeTab === 'legal') renderLegal(screen);
  else if (activeTab === 'business') renderBusiness(screen);
  else renderVerbal(screen);

  tabs.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      openSkillForm = false;
      openMilestoneForm = false;
      openLegalTopic = null;
      openLearningDomain = null;
      openPsychoArticle = null;
      openReligionArticle = null;
      openVerbalSituation = null;
      openPeopleType = null;
      el.replaceWith(Skills());
    });
  });

  return el;
}
