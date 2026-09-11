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
import { confidenceCharacters, characterUnlockThresholds, getCharacterMatch } from '../data/confidenceCharacters.js';
import { developmentChallenges } from '../data/developmentChallenges.js';
import { behaviorRules, analyzeBehavior } from '../data/behaviorAnalysis.js';
import { pawaModes, calculatePawaModes } from '../data/pawaModes.js';
import { getPawaAnalytics, dimensionLabels } from '../data/pawaAnalytics.js';
import { PawaCoach } from '../components/PawaCoach.js';

let activeTab = 'traits'; // traits | skills | accomplishments | confidence | selfesteem | pawa | characters | evidence | behavior | legal | business | verbal

/**
 * Appelée depuis un autre écran (ex: bouton "Compétences" sur une tâche de
 * l'Agenda) juste avant `router.navigate('/developpement')`, pour que
 * l'écran Développement s'ouvre directement sur l'onglet Compétences avec
 * le formulaire d'ajout déjà déplié — sans pré-remplir aucun champ.
 */
export function openSkillsAddForm() {
  activeTab = 'skills';
  openSkillForm = true;
  formSkillName = '';
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
let formSkillName = ''; // nom en cours de saisie dans "+ Ajouter une compétence" — sert à détecter en direct si ça correspond à une compétence existante (voir renderSkills)
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
let selectedCharacterRank = 1;

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
  // Compétence dont le nom saisi correspond exactement (insensible à la
  // casse) à une compétence déjà existante — détermine si valider le
  // formulaire ajoute une PREUVE sur l'existant (pas de doublon) ou crée
  // une nouvelle compétence, voir plus bas.
  const matchedSkill = skills.find((s) => s.name.trim().toLowerCase() === formSkillName.trim().toLowerCase()) || null;

  screen.innerHTML = `
    <p class="detail-desc">Les compétences que tu construis, avec ton niveau actuel. Reviens régulièrement mettre à jour.</p>
    <button type="button" class="btn-primary" id="skill-add-btn" style="width:100%; margin-top:var(--sp-4);">${openSkillForm ? 'Annuler' : '+ Ajouter une compétence'}</button>

    ${openSkillForm ? `
    <form id="skill-form" class="card" style="margin-top:var(--sp-4);">
      <input class="form-input" id="skill-name" list="existing-skills" placeholder="Nom de la compétence" autocomplete="off" value="${formSkillName.replace(/"/g, '&quot;')}" required />
      <datalist id="existing-skills">
        ${skills.map((s) => `<option value="${s.name.replace(/"/g, '&quot;')}"></option>`).join('')}
      </datalist>
      ${matchedSkill ? `
      <p class="detail-desc" style="margin-top:var(--sp-2);">« ${matchedSkill.name} » existe déjà (niveau ${skillLevels.find((l) => l.id === matchedSkill.level)?.label}). Ajoute une note pour faire progresser cette compétence — pas besoin d'en recréer une.</p>
      <textarea class="form-textarea" id="skill-note" placeholder="Qu'est-ce que tu as fait qui montre ce progrès ?" style="margin-top:var(--sp-3)" required></textarea>
      ` : `
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
      `}
      <button type="submit" class="btn-primary" style="width:100%; margin-top:var(--sp-3);">${matchedSkill ? 'Enregistrer la preuve' : 'Enregistrer'}</button>
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
    if (openSkillForm) formSkillName = '';
    renderSkills(screen);
  });

  screen.querySelectorAll('[data-delete-skill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.deleteSkill(btn.dataset.deleteSkill);
      renderSkills(screen);
    });
  });

  if (openSkillForm) {
    const nameInput = screen.querySelector('#skill-name');
    // Re-render à chaque frappe : c'est ce qui bascule le formulaire entre
    // "nouvelle compétence" (catégorie + niveau) et "preuve sur l'existant"
    // (juste une note) dès que le nom tapé correspond exactement à une
    // compétence déjà présente dans la datalist.
    nameInput.addEventListener('input', () => {
      formSkillName = nameInput.value;
      renderSkills(screen);
    });
    // Redonne le focus + curseur en fin de champ après chaque re-render
    // (sinon la frappe perd le focus à chaque lettre, puisque innerHTML
    // reconstruit le formulaire).
    nameInput.focus();
    nameInput.setSelectionRange(nameInput.value.length, nameInput.value.length);

    if (!matchedSkill) {
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
    }

    screen.querySelector('#skill-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = screen.querySelector('#skill-name').value.trim();
      if (!name) return;
      const note = screen.querySelector('#skill-note').value;
      const existing = skills.find((s) => s.name.trim().toLowerCase() === name.toLowerCase());

      if (existing) {
        // Compétence déjà là : on ajoute une PREUVE, jamais un doublon.
        // Sans note, on n'enregistre rien (pas de gain sans preuve réelle —
        // voir PHILOSOPHIE §13) ; le required sur le textarea protège déjà
        // ce cas côté UI, ce contrôle est une deuxième sécurité.
        if (!note.trim()) return;
        store.addSkillEvidence(existing.id, note);
      } else {
        store.addSkill({
          name,
          category: formSkillCategory,
          level: formSkillLevel,
          note,
        });
      }
      celebrationToast('skill');
      openSkillForm = false;
      formSkillName = '';
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
        // Transparence (§12) : si cette preuve vient d'une tâche dont
        // l'utilisateur a coché des compétences développées, on l'affiche —
        // pour que le trigger ne semble jamais inventé (voir PHILOSOPHIE §13).
        const source = store.getAccomplishmentForEvidence(e.sourceId, e.type);
        const developedSkills = source?.skills?.length ? source.skills : null;
        return `
          <div class="card card--tight" style="margin-top:var(--sp-2);">
            <p style="font-weight:700; margin:0 0 4px 0; letter-spacing:0.02em; font-size:var(--fs-sm); color:var(--ember-500);">${trigger.headline}</p>
            <p style="margin:0;">${e.label}</p>
            ${developedSkills ? `<p class="detail-desc" style="margin:4px 0 0 0;">Développé : ${developedSkills.join(', ')}</p>` : ''}
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
        const source = store.getAccomplishmentForEvidence(e.sourceId);
        return `
          <div class="card card--tight" style="margin-top:var(--sp-2);">
            <p style="font-weight:700; margin:0 0 4px 0; letter-spacing:0.02em; font-size:var(--fs-sm); color:var(--steel-400);">${trigger.headline}</p>
            <p style="margin:0;">${e.label}</p>
            ${source?.skills?.length ? `<p class="detail-desc" style="margin:4px 0 0 0;">Développé : ${source.skills.join(', ')}</p>` : ''}
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


// ---------------------------------------------------------------
// Parcours des 70 personnages — déblocage par XP + profil de ressemblance
// ---------------------------------------------------------------
const CHARACTER_DEFECTS = {
  "James Bond":"Détachement émotionnel","Thomas Shelby":"Autodestruction","Le Professeur (Sergio Marquina)":"Suranalyse",
  "Berlin (Andrés de Fonollosa)":"Arrogance","Muhammad Ali":"Provocation","Nelson Mandela":"Inflexibilité",
  "Leonidas":"Témérité","Michael Corleone":"Isolement","Harvey Specter":"Ego","Alexander le Grand":"Ambition excessive",
  "Jack Ma":"Optimisme excessif","John Wick":"Isolement","Bruce Wayne / Batman":"Obsession","David Goggins":"Exigence extrême",
  "Steve Jobs":"Dureté","Kobe Bryant":"Perfectionnisme","Cristiano Ronaldo":"Ego","Michael Jordan":"Compétitivité excessive",
  "Denzel Washington":"Réserve","Arnold Schwarzenegger":"Ego","Ragnar Lothbrok":"Impulsivité","Vito Corleone":"Contrôle",
  "Jules César":"Ambition","Sun Tzu":"Distance émotionnelle","Winston Churchill":"Entêtement","Tony Stark / Iron Man":"Arrogance",
  "Sherlock Holmes":"Arrogance intellectuelle","Geralt de Riv":"Cynisme","Captain America / Steve Rogers":"Rigidité",
  "Khabib Nurmagomedov":"Rigidité","Tokyo (Silene Oliveira)":"Impulsivité","Nairobi (Ágata Jiménez)":"Émotivité",
  "Palermo (Martín Berrote)":"Ego","Denver (Ricardo de León)":"Réactivité","Helsinki":"Émotions intériorisées",
  "Bogotá":"Tempérament","Marseille (Julián)":"Réserve","Lisbonne / Raquel Murillo":"Émotivité","Alicia Sierra":"Obsession",
  "Gandía":"Agressivité","Arturo Román":"Narcissisme","Moscow (Agustín Ramos)":"Inquiétude","Rio (Aníbal Cortés)":"Dépendance émotionnelle",
  "Manila (Julia Martínez)":"Impulsivité","Oslo":"Peu communicatif","Arthur Shelby":"Impulsivité","Alfie Solomons":"Manipulation",
  "Walter White":"Ego","Saul Goodman / Jimmy McGill":"Manipulation","Tony Montana":"Colère / ego","Frank Underwood":"Manipulation",
  "Don Draper":"Fuite émotionnelle","Conor McGregor":"Arrogance","Dwayne Johnson":"Image très contrôlée","Keanu Reeves":"Discrétion",
  "Lionel Messi":"Réserve","Mike Tyson":"Impulsivité","Napoléon Bonaparte":"Ego / ambition","Gengis Khan":"Brutalité",
  "Neo":"Doute","Light Yagami":"Complexe de supériorité","L":"Isolement","Tyler Durden":"Narcissisme",
  "Ethan Hunt":"Prise de risques","Jason Bourne":"Isolement","Alex Hormozi":"Obsession du travail","Simon Sinek":"Perfectionnisme",
  "Jocko Willink":"Exigence","MrBeast (Jimmy Donaldson)":"Pression de performance","Edd China":"Réserve"
};


function getJourneyProfile() {
  const raw = store.getDevelopmentProfile();
  const latest = store.getLatestLeadershipScore?.();
  const confidence = store.getConfidenceStats?.() || {total:0};
  const esteem = store.getSelfEsteemStats?.() || {total:0};
  const profile = {...raw};
  // Les anciens modules de l'app alimentent aussi la vue, sans changer leur
  // fonctionnement : une évaluation/proof existante devient une petite base.
  profile.confidence = (profile.confidence || 0) + confidence.total * 1.5;
  profile.selfEsteem = (profile.selfEsteem || 0) + esteem.total * 1.5;
  if (latest?.scores) {
    const s = latest.scores;
    profile.leadership = (profile.leadership || 0) + (s.leadershipEquipe || 0) * 1.2;
    profile.communication = (profile.communication || 0) + (s.communication || 0) * .8;
    profile.decisionMaking = (profile.decisionMaking || 0) + (s.decision || 0) * .8;
    profile.emotionalControl = (profile.emotionalControl || 0) + (s.gestionEmotionnelle || 0) * .8;
    profile.discipline = (profile.discipline || 0) + (s.discipline || 0) * .8;
  }
  // Le profil comportemental devient vivant : les émotions récentes, la
  // fréquence des actions et leur récence influencent légèrement le profil
  // utilisé pour la ressemblance avec les personnages.
  const behavior = analyzeBehavior(store.get());
  (behavior.trend || []).forEach(({dimension, signal}) => {
    if (!Number.isFinite(signal) || !dimension) return;
    profile[dimension] = (profile[dimension] || 0) + signal * 2.2;
  });
  return profile;
}

function normalizeJourneyProfile(raw) {
  const out = {};
  Object.keys(raw).forEach(k => {
    if (k === 'actions') return;
    // Courbe lente : il faut de nombreuses preuves réelles pour approcher 100%.
    out[k] = Math.min(1, 1 - Math.exp(-(Number(raw[k]) || 0) / 55));
  });
  return out;
}

function formatJourneyXp(n) {
  if (n >= 1000000) return `${(n/1000000).toFixed(n % 1000000 ? 2 : 0)}M`;
  if (n >= 1000) return `${(n/1000).toFixed(n % 1000 ? 1 : 0)}k`;
  return String(n);
}

function renderPawaMode(screen) {
  const profile = normalizeJourneyProfile(getJourneyProfile());
  const behavior = analyzeBehavior(store.get());
  const modes = calculatePawaModes(profile);
  const top = modes[0];
  const weakest = (behavior.weakest || []).slice(0,4);
  const labels = {confidence:'Confiance',selfEsteem:'Estime de soi',leadership:'Leadership',charisma:'Charisme',calm:'Calme',discipline:'Discipline',communication:'Communication',assertiveness:'Assertivité',courage:'Courage',resilience:'Résilience',decisionMaking:'Décision',emotionalControl:'Contrôle émotionnel',socialCourage:'Courage social',focus:'Focus',adaptability:'Adaptabilité'};
  const strategic = modes.filter(m=>['strategist','observer','influence','unmanipulable'].includes(m.id));
  const analytics = getPawaAnalytics(store.get());
  const xpq = analytics.xp || {earned:0,todayXp:0,last7:0,average:0,count:0,bySource:{}};
  const activeIds = store.getActivePawaModes();
  const activeModes = modes.filter(m => activeIds.includes(m.id));
  const instructionModes = activeModes.length ? activeModes : [top];
  const priorityInstructions = instructionModes.flatMap(m => m.actions.map(action => ({ mode:m, action })));
  screen.innerHTML = `
    <div class="card" style="border:1px solid var(--accent-500);">
      <div style="display:flex;align-items:center;gap:12px;"><div style="font-size:40px;">🔥</div><div><strong style="font-size:var(--fs-xl);">Mode de Pawa</strong><p class="detail-desc" style="margin:3px 0 0;">Ton profil évolue automatiquement à partir de tes données existantes. Rien n’est réécrit.</p></div></div>
      <div class="card card--tight" style="margin-top:14px;background:var(--surface-2);"><div style="display:flex;align-items:center;gap:12px;"><span style="font-size:34px;">${top.icon}</span><div style="flex:1;"><strong>${top.label}</strong><div class="detail-desc">Mode dominant actuel</div></div><strong style="font-size:24px;">${top.score}%</strong></div><p class="detail-desc" style="margin-top:8px;">${top.description}</p><div style="height:8px;background:var(--surface-3);border-radius:99px;overflow:hidden;"><div style="height:100%;width:${top.score}%;background:linear-gradient(90deg,#141f6a,#c32643);border-radius:99px;"></div></div></div>
    </div>

    <div class="card__label" style="margin-top:var(--sp-5);">🧬 Tes indicateurs réels</div>
    <div class="card card--tight" style="margin-top:var(--sp-2);">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        <div><div class="detail-desc">BEAST</div><strong style="font-size:22px;">${analytics.gapToBeast.score}%</strong></div>
        <div><div class="detail-desc">INTÉGRITÉ</div><strong style="font-size:22px;">${analytics.integrity}%</strong></div>
        <div><div class="detail-desc">RECOVERY</div><strong style="font-size:22px;">${analytics.recovery}%</strong></div>
      </div>
      <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div style="padding:9px;border-radius:10px;background:var(--surface-2);"><div class="detail-desc">XP aujourd'hui</div><strong>+${xpq.todayXp}</strong></div>
        <div style="padding:9px;border-radius:10px;background:var(--surface-2);"><div class="detail-desc">XP 7 jours</div><strong>+${xpq.last7}</strong></div>
      </div>
    </div>

    <div class="card__label" style="margin-top:var(--sp-5);">📊 Notes des compétences</div>
    <div class="card card--tight" style="margin-top:var(--sp-2);">
      ${analytics.strongest.slice(0,5).map(x=>`<div style="margin:8px 0;"><div style="display:flex;justify-content:space-between;font-size:12px;"><span>${escapeHtml(x.label)}</span><strong>${x.score}/100</strong></div><div style="height:6px;background:var(--surface-3);border-radius:99px;margin-top:4px;"><div style="height:100%;width:${x.score}%;background:var(--accent-500);border-radius:99px;"></div></div></div>`).join('')}
      <div style="margin-top:10px;padding:9px;border-radius:10px;background:var(--surface-2);"><strong>Priorité</strong><span class="detail-desc"> : ${analytics.weakest.slice(0,2).map(x=>`${escapeHtml(x.label)} (${x.score}/100)`).join(' · ')}</span></div>
    </div>

    <div class="card__label" style="margin-top:var(--sp-5);">⚡ Tous tes modes</div>
    <p class="detail-desc" style="margin-top:6px;">Active un ou plusieurs modes. Les données restent intactes ; les analyses et instructions s'adaptent automatiquement aux modes actifs.</p>
    <div style="display:flex;flex-direction:column;gap:9px;margin-top:var(--sp-2);">${modes.map(m=>{ const active=activeIds.includes(m.id); return `<div class="card card--tight" style="border:1px solid ${active?'var(--accent-500)':'var(--border-color, var(--surface-3))'};"><div style="display:flex;align-items:center;gap:10px;"><span style="font-size:25px;">${m.icon}</span><div style="flex:1;"><strong>${m.label}</strong><div class="detail-desc">${escapeHtml(m.description)}</div></div><strong>${m.score}%</strong><button type="button" class="btn-primary" data-pawa-mode="${m.id}" style="width:auto;min-width:88px;padding:8px 11px;">${active?'✓ ACTIVÉ':'ACTIVER'}</button></div><div style="height:6px;background:var(--surface-3);border-radius:99px;margin-top:8px;"><div style="height:100%;width:${m.score}%;background:var(--accent-500);border-radius:99px;"></div></div></div>`;}).join('')}</div>

    <div class="card__label" style="margin-top:var(--sp-5);">🧭 ${activeModes.length ? 'Modes actifs — tes instructions' : 'Instructions du mode dominant'}</div>
    <div class="card card--tight" style="margin-top:var(--sp-2);"><p class="detail-desc">${activeModes.length ? 'Chaque mode activé devient une priorité comportementale. L’application utilisera ces priorités dans tes prochaines analyses et recommandations.' : 'Aucun mode n’est activé : les instructions suivent automatiquement ton mode dominant actuel.'}</p>${priorityInstructions.slice(0,9).map((x,i)=>`<div style="margin-top:9px;padding:10px;border-radius:12px;background:var(--surface-2);"><strong>${x.mode.icon} ${x.mode.label} · ${i+1}</strong><div style="margin-top:4px;">${escapeHtml(x.action)}</div></div>`).join('')}</div>

    <div class="card__label" style="margin-top:var(--sp-5);">♟️ Mode STRATÈGE — entraînement</div>
    <div class="card card--tight" style="margin-top:var(--sp-2);"><p class="detail-desc">Le but n’est pas de manipuler. Le système t’entraîne à observer, anticiper, comprendre les intérêts et choisir une réponse maîtrisée.</p>${strategic.map(m=>`<div style="margin-top:12px;padding:10px;border-radius:12px;background:var(--surface-2);"><div style="display:flex;justify-content:space-between;"><strong>${m.icon} ${m.label}</strong><strong>${m.score}%</strong></div><p class="detail-desc" style="margin-top:4px;">${escapeHtml(m.description)}</p><ul style="margin:6px 0 0 18px;padding:0;">${m.actions.map(a=>`<li style="margin:4px 0;font-size:12px;">${escapeHtml(a)}</li>`).join('')}</ul></div>`).join('')}</div>

    <div class="card__label" style="margin-top:var(--sp-5);">🎯 Ce qui doit changer maintenant</div>
    <div class="card card--tight" style="margin-top:var(--sp-2);">${weakest.map(x=>`<div style="display:flex;justify-content:space-between;gap:10px;margin:8px 0;"><span>${labels[x.key]||x.key}</span><strong>${Math.round(x.value*100)}%</strong></div><div style="height:6px;background:var(--surface-3);border-radius:99px;"><div style="height:100%;width:${Math.round(x.value*100)}%;background:var(--accent-500);border-radius:99px;"></div></div>`).join('') || '<p class="detail-desc">Continue les check-ins et les épreuves pour obtenir des signaux fiables.</p>'}</div>

  `;
  screen.appendChild(PawaCoach());

  screen.querySelectorAll('[data-pawa-mode]').forEach(btn => btn.addEventListener('click', () => {
    store.togglePawaMode(btn.dataset.pawaMode);
    renderPawaMode(screen);
  }));
}

function renderCharacters(screen) {
  const xpSummary = store.getXpSummary();
  const totalXp = xpSummary.totalEarned;
  const profile = normalizeJourneyProfile(getJourneyProfile());
  const unlocked = confidenceCharacters.filter((_,i)=>totalXp >= characterUnlockThresholds[i]).length;
  const selected = confidenceCharacters.find(c => c.rank === selectedCharacterRank) || confidenceCharacters[0];
  const selectedIndex = selected.rank - 1;
  const selectedUnlocked = totalXp >= characterUnlockThresholds[selectedIndex];
  const match = getCharacterMatch(selected, profile);
  const topMatches = confidenceCharacters.map(c=>({c,match:getCharacterMatch(c,profile)})).sort((a,b)=>b.match-a.match).slice(0,5);
  const traitLabels = {confidence:'Confiance',leadership:'Leadership',charisma:'Charisme',calm:'Calme',discipline:'Discipline'};
  const challengeForTrait = {
    confidence:['fear_action','hard_decision','social_direct'], leadership:['leadership_responsibility','leadership_coordinate','lead_by_example'],
    charisma:['social_stranger','public_speaking','social_direct'], calm:['calm_pressure','ignore_provocation','verbal_attack'], discipline:['promise_kept','focus_distraction','difficult_task']
  };
  const weakest = Object.keys(selected.traits).map(k=>({key:k,gap:Math.max(0,(selected.traits[k]||0)-(profile[k]||0))})).sort((a,b)=>b.gap-a.gap).slice(0,3);
  const instructions = weakest.flatMap(({key}) => (challengeForTrait[key]||[]).map(id=>developmentChallenges.find(c=>c.id===id))).filter(Boolean).slice(0,5);
  const defect = CHARACTER_DEFECTS[selected.name] || 'Risque : déséquilibrer une qualité en allant trop loin.';

  screen.innerHTML = `
    <div class="card" style="margin-top:var(--sp-2);">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="font-size:38px;">🏆</div><div style="flex:1;"><strong style="font-size:var(--fs-lg);">Parcours des 70 personnages</strong><p class="detail-desc" style="margin:3px 0 0;">${unlocked}/70 débloqués · ${formatJourneyXp(totalXp)} XP à vie</p></div>
      </div>
      <div style="margin-top:var(--sp-3);height:10px;border-radius:99px;background:var(--surface-3);overflow:hidden;"><div style="height:100%;width:${Math.min(100,totalXp/5000000*100)}%;background:linear-gradient(90deg,#c32643,#f5b942);"></div></div>
      <p class="detail-desc" style="margin-top:8px;">Chaque personnage est un modèle de traits à travailler, pas une identité à copier.</p>
    </div>

    <div class="card__label" style="margin-top:var(--sp-5);">Ton personnage actuel le plus proche</div>
    <div class="card card--tight" style="margin-top:var(--sp-2);border:1px solid var(--accent-500);">
      <div style="display:flex;align-items:center;gap:12px;"><div style="font-size:42px;">${topMatches[0]?.c.avatar||'🎭'}</div><div><strong>${topMatches[0]?.c.name||'—'}</strong><div class="detail-desc">${topMatches[0]?.match||0}% de ressemblance comportementale</div></div></div>
      <p class="detail-desc" style="margin-top:10px;">Cette ressemblance est calculée à partir des comportements que tu enregistres dans l’application. Elle peut changer avec tes actions.</p>
    </div>

    <div class="card__label" style="margin-top:var(--sp-5);">Fiche du personnage #${selected.rank}</div>
    <div class="card" style="margin-top:var(--sp-2);">
      <div style="display:flex;align-items:center;gap:14px;"><div style="width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--surface-3);font-size:35px;">${selected.avatar}</div><div style="flex:1;"><strong style="font-size:var(--fs-lg);">${selected.name}</strong><div class="detail-desc">${selected.domain}</div><div class="detail-desc" style="margin-top:4px;">${selectedUnlocked?'🔓 Débloqué':'🔒 Objectif : '+formatJourneyXp(characterUnlockThresholds[selectedIndex])+' XP'}</div></div></div>
      <div style="height:9px;background:var(--surface-3);border-radius:99px;margin-top:14px;overflow:hidden;"><div style="height:100%;width:${match}%;background:linear-gradient(90deg,#141f6a,#c32643);"></div></div>
      <p style="margin:8px 0 0;"><strong>${match}%</strong> de proximité avec ce modèle</p>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-top:14px;">
        ${Object.entries(selected.traits).map(([k,v])=>`<div style="text-align:center;"><div style="font-size:11px;color:var(--text-tertiary);">${traitLabels[k]}</div><strong>${Math.round(v*100)}</strong><div style="font-size:10px;color:var(--text-tertiary);">toi ${Math.round((profile[k]||0)*100)}</div></div>`).join('')}
      </div>
      <div class="card card--tight" style="margin-top:14px;"><strong>⚠️ Point à surveiller</strong><p class="detail-desc" style="margin-top:5px;">${escapeHtml(defect)}</p></div>
      <div class="card card--tight" style="margin-top:10px;"><strong>🎯 Pour devenir davantage comme lui</strong><p class="detail-desc" style="margin-top:5px;">Tu dois surtout travailler les écarts les plus importants entre ton profil et ses traits.</p>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:9px;">${weakest.map(({key,gap})=>`<div><div style="display:flex;justify-content:space-between;font-size:12px;"><span>${traitLabels[key]}</span><strong>${Math.round(gap*100)} pts à combler</strong></div><div style="height:6px;background:var(--surface-3);border-radius:99px;margin-top:4px;"><div style="height:100%;width:${Math.min(100,gap*100)}%;background:var(--accent-500);border-radius:99px;"></div></div></div>`).join('')}</div>
      </div>
      <div style="margin-top:12px;"><strong>📋 Tes instructions</strong><div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">${instructions.length?instructions.map(c=>`<div class="card card--tight"><strong>${escapeHtml(c.title)}</strong><p class="detail-desc" style="margin-top:4px;">${escapeHtml(c.prompt)}</p><span class="mono" style="font-size:11px;">+${c.xp} XP · ${escapeHtml(c.category)}</span></div>`).join(''):'<p class="detail-desc">Continue à enregistrer des épreuves pour obtenir un plan plus précis.</p>'}</div></div>
    </div>

    <div class="card__label" style="margin-top:var(--sp-5);">Choisis un personnage — 1 par 1</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:var(--sp-2);">
      ${confidenceCharacters.map(c=>{const i=c.rank-1, u=totalXp>=characterUnlockThresholds[i], m=getCharacterMatch(c,profile); return `<button type="button" data-character-rank="${c.rank}" class="card card--tight" style="text-align:left;border:1px solid ${c.rank===selected.rank?'var(--accent-500)':'var(--border-subtle)'};opacity:${u?1:.72};"><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:25px;filter:${u?'none':'grayscale(1)'};">${u?c.avatar:'🔒'}</span><span style="min-width:0;"><strong style="font-size:12px;">#${c.rank} ${u?escapeHtml(c.name):'Verrouillé'}</strong><small style="display:block;color:var(--text-tertiary);margin-top:2px;">${u?m+'% · '+escapeHtml(c.domain):formatJourneyXp(characterUnlockThresholds[i])+' XP'}</small></span></div></button>`}).join('')}
    </div>
  `;
  screen.querySelectorAll('[data-character-rank]').forEach(btn=>btn.addEventListener('click',()=>{selectedCharacterRank=Number(btn.dataset.characterRank);renderCharacters(screen);}));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function renderBehavior(screen) {
  const state = store.get();
  const analysis = analyzeBehavior(state);
  const profile = normalizeJourneyProfile(getJourneyProfile());
  const matched = confidenceCharacters.map(c=>({c,match:getCharacterMatch(c,profile)})).sort((a,b)=>b.match-a.match).slice(0,3);
  const weakest = analysis.weakest || [];
  const emotionLabels = Object.fromEntries([
    ['happy','Content'],['sad','Triste'],['angry','En colère'],['fearful','Peur'],['surprised','Surpris'],['disgusted','Dégoûté'],['calm','Calme'],['miss','Manque'],['neutral','Neutre'],['determination','Détermination'],['ambition','Ambition'],['fear_of_failure','Peur de l’échec'],['need_validation','Besoin de validation'],['frustration','Frustration'],['pressure','Pression'],['insecurity','Insécurité'],['pride','Fierté'],['control_obsession','Contrôle'],['emotional_exhaustion','Épuisement'],['anxious','Anxieux'],['overwhelmed','Submergé'],['lonely','Solitude'],['jealous','Jalousie'],['shame','Honte'],['relief','Soulagement'],['gratitude','Gratitude'],['hope','Espoir'],['disappointment','Déception'],['boredom','Ennui'],['confidence','Assurance'],['confusion','Confusion']
  ]);
  const dimLabels={confidence:'Confiance',selfEsteem:'Estime de soi',leadership:'Leadership',charisma:'Charisme',calm:'Calme',discipline:'Discipline',communication:'Communication',assertiveness:'Assertivité',courage:'Courage',resilience:'Résilience',decisionMaking:'Décision',emotionalControl:'Contrôle émotionnel',socialCourage:'Courage social'};
  const trendTop=(analysis.trend||[]).slice(0,5);
  screen.innerHTML=`
    <div class="card"><strong>🧠 Behavior — profil vivant</strong><p class="detail-desc" style="margin-top:5px;">L’analyse évolue avec tes check-ins, tes émotions et tes épreuves. Les signaux récents pèsent davantage que les anciens. Elle décrit des tendances observées dans l’application, pas ta personnalité entière et ne constitue pas un diagnostic.</p></div>

    <div class="card__label" style="margin-top:var(--sp-5);">🧬 Mesure comportementale</div>
    <div class="card card--tight" style="margin-top:var(--sp-2);"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;"><div><strong style="font-size:20px;">${getPawaAnalytics(state).gapToBeast.score}%</strong><div class="detail-desc">Beast</div></div><div><strong style="font-size:20px;">${getPawaAnalytics(state).integrity}%</strong><div class="detail-desc">Intégrité</div></div><div><strong style="font-size:20px;">${getPawaAnalytics(state).recovery}%</strong><div class="detail-desc">Recovery</div></div></div></div>

    <div class="card__label" style="margin-top:var(--sp-5);">🎭 Ton profil actuel</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:var(--sp-2);">${matched.map(({c,match},i)=>`<div class="card card--tight"><div style="display:flex;align-items:center;gap:10px;"><span style="font-size:29px;">${c.avatar}</span><div style="flex:1;"><strong>${i===0?'#1 tendance actuelle · ':''}#${c.rank} ${escapeHtml(c.name)}</strong><div class="detail-desc">${match}% · ${escapeHtml(c.domain)}</div></div></div><div style="height:7px;background:var(--surface-3);border-radius:99px;margin-top:8px;"><div style="height:100%;width:${match}%;background:linear-gradient(90deg,#141f6a,#c32643);border-radius:99px;"></div></div></div>`).join('')}</div>

    <div class="card__label" style="margin-top:var(--sp-5);">💭 Émotions qui reviennent le plus</div>
    <div class="card card--tight" style="margin-top:var(--sp-2);"><div style="display:flex;gap:7px;flex-wrap:wrap;">${(analysis.dominantEmotions||[]).map(e=>`<span style="padding:7px 9px;border-radius:999px;background:var(--surface-2);font-size:12px;"><strong>${escapeHtml(emotionLabels[e.mood]||e.mood)}</strong> · ${e.count}</span>`).join('') || '<span class="detail-desc">Pas encore assez de check-ins.</span>'}</div><p class="detail-desc" style="margin-top:9px;">Ces émotions servent de signaux : leur répétition peut modifier certaines tendances comportementales.</p></div>

    <div class="card__label" style="margin-top:var(--sp-5);">🧠 Behavior du jour / récent</div>
    <div class="card card--tight" style="margin-top:var(--sp-2);">
      ${(analysis.recentBehavior||[]).length ? (analysis.recentBehavior||[]).slice(0,5).map(e=>`<div style="padding:9px 0;border-bottom:1px solid var(--border-subtle);"><div style="font-size:11px;color:var(--text-tertiary);">${new Date(e.date||e.createdAt).toLocaleString('fr-FR')}</div>${(e.badTraits||[]).length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px;">${e.badTraits.map(t=>`<span class="chip">⚠️ ${escapeHtml(t)}</span>`).join('')}</div>`:''}${e.recentSpeech?`<div style="margin-top:7px;padding:8px;border-left:3px solid var(--accent-500);background:var(--surface-2);"><strong>🗣️ Parole récente :</strong> « ${escapeHtml(e.recentSpeech)} »</div>`:''}${e.situation?`<div class="detail-desc" style="margin-top:5px;">Situation : ${escapeHtml(e.situation)}</div>`:''}</div>`).join('') : '<p class="detail-desc">Aucun behavior check-in récent. Fais ton check-in dans Mind pour enregistrer tes comportements du jour.</p>'}
      <div class="detail-desc" style="margin-top:8px;">Les paroles sont analysées par signaux textuels simples ; elles ne sont pas interprétées comme une vérité absolue.</div>
    </div>

    <div class="card__label" style="margin-top:var(--sp-5);">📈 Ce que tes actions montrent</div>
    <div class="card card--tight" style="margin-top:var(--sp-2);">${trendTop.map(x=>`<div style="margin:9px 0;"><div style="display:flex;justify-content:space-between;font-size:12px;"><span>${dimLabels[x.dimension]||x.dimension}</span><strong>${x.level}% signal</strong></div><div style="height:7px;background:var(--surface-3);border-radius:99px;margin-top:4px;"><div style="height:100%;width:${x.level}%;background:var(--accent-500);border-radius:99px;"></div></div></div>`).join('') || '<p class="detail-desc">Enregistre des épreuves et des check-ins pour construire ton historique.</p>'}</div>

    <div class="card__label" style="margin-top:var(--sp-5);">⚠️ Mauvais côtés / tendances à corriger</div>
    <div style="display:flex;flex-direction:column;gap:9px;margin-top:var(--sp-2);">${analysis.results?.length?analysis.results.map(r=>`<div class="card card--tight"><div style="display:flex;gap:10px;align-items:flex-start;"><span style="font-size:25px;">${r.icon}</span><div style="flex:1;"><div><strong>${escapeHtml(r.label)}</strong><span style="float:right;font-size:11px;color:var(--text-tertiary);">${r.score}% · fiabilité ${r.confidence}%</span></div><p class="detail-desc" style="margin-top:5px;">${escapeHtml(r.text||'Tendance calculée à partir des données enregistrées.')}</p><div style="margin-top:8px;padding:9px;border-radius:10px;background:var(--surface-2);"><strong>→ Ce que tu dois faire</strong><p class="detail-desc" style="margin-top:4px;">${escapeHtml(r.instruction)}</p></div><div class="detail-desc" style="margin-top:6px;">Signaux : ${r.actionHits} actions · ${r.moodHits} émotions · ${r.checkinHits||0} behavior · ${r.speechHits||0} paroles</div></div></div></div>`).join(''):`<div class="card card--tight"><strong>Pas encore de tendance forte.</strong><p class="detail-desc" style="margin-top:4px;">Continue à enregistrer honnêtement tes comportements et émotions. L’analyse deviendra plus précise avec l’historique.</p></div>`}</div>

    <div class="card__label" style="margin-top:var(--sp-5);">🎯 Tes 5 priorités de progression</div>
    <div class="card card--tight" style="margin-top:var(--sp-2);">${weakest.map(x=>`<div style="margin:9px 0;"><div style="display:flex;justify-content:space-between;font-size:12px;"><span>${dimLabels[x.key]||x.key}</span><strong>${Math.round(x.value*100)}%</strong></div><div style="height:7px;background:var(--surface-3);border-radius:99px;margin-top:4px;"><div style="height:100%;width:${Math.round(x.value*100)}%;background:var(--accent-500);border-radius:99px;"></div></div></div>`).join('')}</div>
  `;
}

function renderDevelopmentEvidence(screen) {
  const evidence = store.listDevelopmentEvidence();
  const profile = getJourneyProfile();
  const stats = store.getDevelopmentChallengeStats?.() || {dailyXp:0,dailyActions:0,streak:0,maxDailyXp:500,maxDailyActions:5};
  const categories = ['Toutes', ...new Set(developmentChallenges.map(c => c.category))];
  const selectedCategory = renderDevelopmentEvidence.selectedCategory || 'Toutes';
  const visible = selectedCategory === 'Toutes' ? developmentChallenges : developmentChallenges.filter(c => c.category === selectedCategory);
  const disabledReason = (c) => {
    const last = evidence.find(e => e.challengeId === c.id);
    if (!last) return null;
    const elapsed = Date.now() - new Date(last.createdAt).getTime();
    if (elapsed < c.cooldownHours * 3600000) return `Disponible dans ${Math.max(1, Math.ceil((c.cooldownHours*3600000-elapsed)/3600000))} h`;
    return null;
  };

  screen.innerHTML = `
    <div class="card" style="margin-top:var(--sp-2);">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div><strong>Épreuves réelles</strong><p class="detail-desc" style="margin-top:4px;">Tu déclares une action réellement accomplie. L’app calcule le XP, la difficulté, le bonus de régularité et met à jour ton profil.</p></div>
        <div style="font-size:28px;">⚔️</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:var(--sp-3);">
        <div class="card card--tight"><strong>${stats.dailyXp}</strong><div class="detail-desc">XP aujourd’hui / ${stats.maxDailyXp}</div></div>
        <div class="card card--tight"><strong>${stats.dailyActions}</strong><div class="detail-desc">Épreuves / ${stats.maxDailyActions}</div></div>
        <div class="card card--tight"><strong>🔥 ${stats.streak}</strong><div class="detail-desc">Série de jours</div></div>
      </div>
      <div style="height:7px;background:var(--surface-3);border-radius:99px;margin-top:10px;overflow:hidden;"><div style="height:100%;width:${Math.min(100,Math.round(stats.dailyXp/stats.maxDailyXp*100))}%;background:linear-gradient(90deg,#141f6a,#c32643);border-radius:99px;"></div></div>
    </div>

    <div class="category-scroll" style="margin-top:var(--sp-4);">
      ${categories.map(c => `<button type="button" class="category-chip ${selectedCategory===c?'is-active':''}" data-dev-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}
    </div>

    <div class="card__label" style="margin-top:var(--sp-5);">Choisir une épreuve</div>
    <p class="detail-desc" style="margin-top:2px;">Pas de XP libre. Une même épreuve ne peut être validée qu’une fois par période de récupération.</p>
    <div style="display:flex;flex-direction:column;gap:var(--sp-2);margin-top:var(--sp-2);">
      ${visible.map(c => {
        const locked = disabledReason(c);
        const difficultyLabel = {easy:'Facile',normal:'Normale',hard:'Difficile',extreme:'Extrême'}[c.difficulty] || c.difficulty;
        return `<div class="card card--tight" style="border:1px solid var(--border-subtle);opacity:${locked?'0.62':'1'};">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
            <div style="min-width:0;"><div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.06em;">${escapeHtml(c.category)} · ${difficultyLabel}</div><strong style="display:block;margin-top:3px;">${escapeHtml(c.title)}</strong><p class="detail-desc" style="margin-top:5px;">${escapeHtml(c.prompt)}</p></div>
            <span class="mono" style="white-space:nowrap;font-weight:700;">+${c.xp} XP</span>
          </div>
          ${locked ? `<div class="detail-desc" style="margin-top:8px;">⏳ ${locked}</div>` : `<button type="button" class="btn-primary" data-dev-challenge="${c.id}" style="width:100%;margin-top:10px;">J’ai réellement accompli cette épreuve</button>`}
        </div>`;
      }).join('')}
    </div>

    <div class="card__label" style="margin-top:var(--sp-5);">Ton profil de développement</div>
    <div class="category-scroll" style="margin-top:var(--sp-2);">
      ${[['confidence','Confiance'],['selfEsteem','Estime'],['leadership','Leadership'],['charisma','Charisme'],['calm','Calme'],['discipline','Discipline'],['communication','Communication'],['assertiveness','Assertivité'],['courage','Courage'],['resilience','Résilience']].map(([k,l])=>`<span class="category-chip">${l}: ${Math.round(profile[k]||0)}</span>`).join('')}
    </div>

    <div class="card__label" style="margin-top:var(--sp-5);">🧮 Comment ton XP est calculé</div>
    <div class="card card--tight" style="margin-top:var(--sp-2);"><p class="detail-desc">Pour une épreuve : XP de base × difficulté × bonus de réflexion × bonus de série. Le store applique ensuite un plafond de 500 XP et 5 validations par jour. Les notes /100 sont calculées séparément à partir des preuves, de leur récence et des signaux émotionnels.</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;"><span class="category-chip">Aujourd'hui : +${xpq.todayXp}</span><span class="category-chip">7 jours : +${xpq.last7}</span><span class="category-chip">Total : +${xpq.earned}</span></div></div>

    <div class="card__label" style="margin-top:var(--sp-5);">Dernières preuves (${evidence.length})</div>
    <div style="display:flex;flex-direction:column;gap:var(--sp-2);margin-top:var(--sp-2);">
      ${evidence.slice(0,15).map(e=>`<div class="card card--tight"><div style="display:flex;justify-content:space-between;gap:10px;"><strong>${escapeHtml(e.label)}</strong><strong class="mono">+${e.xp} XP</strong></div><div class="detail-desc" style="margin-top:4px;">${escapeHtml(e.type)} · ${escapeHtml(e.difficulty || 'normal')} · ${formatDate(e.createdAt)}${e.reflection ? ` · « ${escapeHtml(e.reflection)} »` : ''}</div></div>`).join('') || '<p class="detail-desc">Aucune preuve enregistrée pour l’instant.</p>'}
    </div>
  `;

  screen.querySelectorAll('[data-dev-category]').forEach(btn => btn.addEventListener('click', () => {
    renderDevelopmentEvidence.selectedCategory = btn.dataset.devCategory;
    renderDevelopmentEvidence(screen);
  }));

  screen.querySelectorAll('[data-dev-challenge]').forEach(btn => btn.addEventListener('click', () => {
    const challenge = developmentChallenges.find(c => c.id === btn.dataset.devChallenge);
    if (!challenge) return;
    const reflection = window.prompt('Preuve rapide : qu’as-tu fait concrètement ? (optionnel, mais 20+ caractères donnent un petit bonus)', '');
    if (reflection === null) return;
    const result = store.recordDevelopmentAction({
      challengeId: challenge.id,
      type: challenge.category,
      label: challenge.prompt,
      xp: challenge.xp,
      dimensions: challenge.dimensions,
      difficulty: challenge.difficulty,
      reflection,
      cooldownHours: challenge.cooldownHours,
      dailyLimit: 5,
      maxDailyXp: 500,
    });
    if (!result?.ok) {
      const messages = {
        cooldown: `Cette épreuve est encore en récupération (${result.hoursLeft} h).`,
        daily_limit: 'Limite quotidienne atteinte : reviens demain.',
        daily_xp_cap: 'Plafond quotidien de XP atteint : reviens demain.',
      };
      window.alert(messages[result.reason] || 'Cette épreuve ne peut pas être validée maintenant.');
      renderDevelopmentEvidence(screen);
      return;
    }
    window.alert(`Épreuve validée ! +${result.evidence.xp} XP · série ${result.streak} jour(s).`);
    renderDevelopmentEvidence(screen);
  }));
}

export function Skills() {
  const el = document.createElement('div');

  // Header (bouton retour + titre) et barre d'onglets regroupés dans un
  // même bloc sticky : sur cet écran, le contenu de certains onglets est
  // long (Business Plan, Droits...) et l'utilisateur doit scroller pour le
  // lire. Sans sticky, le bouton retour scrolle avec le contenu et sort du
  // cadre — il semble alors "ne pas répondre" alors qu'il suffit de
  // remonter en haut de la page pour le retrouver. Voir .dev-sticky-head
  // dans styles/mind.css.
  const stickyHead = document.createElement('div');
  stickyHead.className = 'dev-sticky-head';

  const header = document.createElement('div');
  header.className = 'detail-header-row';
  header.style.padding = 'var(--sp-5) var(--sp-5) 0';
  header.innerHTML = `
    <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
    <h1 style="font-size:var(--fs-xl)">Développement</h1>
  `;
  header.querySelector('.back-btn').addEventListener('click', () => router.navigate('/'));
  stickyHead.appendChild(header);

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
    <button class="tab-btn ${activeTab === 'pawa' ? 'is-active' : ''}" data-tab="pawa">Mode de Pawa</button>
    <button class="tab-btn ${activeTab === 'characters' ? 'is-active' : ''}" data-tab="characters">Personnages</button>
    <button class="tab-btn ${activeTab === 'evidence' ? 'is-active' : ''}" data-tab="evidence">Épreuves</button>
    <button class="tab-btn ${activeTab === 'behavior' ? 'is-active' : ''}" data-tab="behavior">Behavior</button>
    <button class="tab-btn ${activeTab === 'legal' ? 'is-active' : ''}" data-tab="legal">Droits</button>
    <button class="tab-btn ${activeTab === 'business' ? 'is-active' : ''}" data-tab="business">Business Plan</button>
    <button class="tab-btn ${activeTab === 'verbal' ? 'is-active' : ''}" data-tab="verbal">Attaque Verbale</button>
  `;
  stickyHead.appendChild(tabs);
  el.appendChild(stickyHead);

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.style.paddingTop = 'var(--sp-4)';
  el.appendChild(screen);

  // Rendu centralisé des onglets. On conserve le même conteneur DOM au lieu
  // de remplacer tout l'écran avec el.replaceWith(). Cela évite les problèmes
  // de clic/touch sur Android WebView et garantit que les nouveaux onglets
  // (Mode de Pawa, Personnages, Épreuves, Behavior) répondent immédiatement.
  function renderActiveTab() {
    try {
      if (activeTab === 'traits') renderTraits(screen);
      else if (activeTab === 'skills') renderSkills(screen);
      else if (activeTab === 'accomplishments') renderAccomplishments(screen);
      else if (activeTab === 'confidence') renderConfidence(screen);
      else if (activeTab === 'selfesteem') renderSelfEsteem(screen);
      else if (activeTab === 'pawa') renderPawaMode(screen);
      else if (activeTab === 'characters') renderCharacters(screen);
      else if (activeTab === 'evidence') renderDevelopmentEvidence(screen);
      else if (activeTab === 'behavior') renderBehavior(screen);
      else if (activeTab === 'legal') renderLegal(screen);
      else if (activeTab === 'business') renderBusiness(screen);
      else renderVerbal(screen);
    } catch (error) {
      console.error('[Développement] Erreur onglet:', activeTab, error);
      screen.innerHTML = `
        <div class="card" style="border:1px solid var(--accent-500);">
          <strong>Impossible d’ouvrir cet onglet</strong>
          <p class="detail-desc" style="margin-top:6px;">Une erreur est survenue dans le module « ${escapeHtml(activeTab)} ». Les données n’ont pas été modifiées.</p>
          <button type="button" class="btn-primary" id="dev-tab-retry" style="width:100%;margin-top:12px;">Réessayer</button>
        </div>`;
      screen.querySelector('#dev-tab-retry')?.addEventListener('click', renderActiveTab);
    }
  }

  renderActiveTab();

  // Délégation de clic : fonctionne aussi correctement sur Android/WebView et
  // ne dépend pas du remplacement du nœud racine de l'écran.
  tabs.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-tab]');
    if (!btn || !tabs.contains(btn)) return;
    event.preventDefault();
    const nextTab = btn.dataset.tab;
    if (!nextTab) return;

    activeTab = nextTab;
    openSkillForm = false;
    formSkillName = '';
    openMilestoneForm = false;
    openLegalTopic = null;
    openLearningDomain = null;
    openPsychoArticle = null;
    openReligionArticle = null;
    openVerbalSituation = null;
    openPeopleType = null;

    tabs.querySelectorAll('[data-tab]').forEach((tabBtn) => {
      tabBtn.classList.toggle('is-active', tabBtn.dataset.tab === activeTab);
    });

    renderActiveTab();

    const activeButton = tabs.querySelector(`[data-tab="${CSS.escape(activeTab)}"]`);
    activeButton?.scrollIntoView({ block: 'nearest', inline: 'center' });
  });

  // La barre d'onglets défile horizontalement (.mind-tab-row) et compte 8
  // onglets : sans ceci, cliquer un onglet situé hors du cadre visible
  // (ex: "Estime de soi", "Business Plan") ouvre bien son contenu, mais
  // l'onglet lui-même reste caché tant que l'utilisateur ne fait pas glisser
  // la barre à la main — on ne voit alors pas où on est. On recentre donc
  // toujours l'onglet actif dans la vue après le montage de l'écran
  // (ouverture initiale ET après chaque clic, puisque Skills() est
  // entièrement remonté à chaque changement d'onglet — voir el.replaceWith
  // ci-dessus). requestAnimationFrame : `el` n'est pas encore attaché au
  // DOM à ce stade (ni via le router, ni via replaceWith, qui l'attache
  // seulement une fois cette fonction retournée) — scrollIntoView() sur un
  // noeud hors DOM ne fait rien, il faut donc différer d'une frame.
  const activeTabBtn = tabs.querySelector('.tab-btn.is-active');
  if (activeTabBtn) {
    requestAnimationFrame(() => {
      activeTabBtn.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
  }

  return el;
}
