import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { traitCategories, suggestedTraitDomains, skillCategories, skillCategoryMap, skillLevels } from '../data/personalDev.js';
import { legalScenarios, didYouKnowFacts, legalDisclaimer } from '../data/legalRights.js';
import { businessPlanSections, milestoneStatuses, milestoneStatusMap } from '../data/businessPlan.js';
import { learningDomains } from '../data/learningContent.js';
import { verbalStyles, verbalCategories, verbalSituations, getSituationsByCategory } from '../data/verbalAttack.js';

let activeTab = 'traits'; // traits | skills | legal | business | verbal
let selectedTraitCategory = 'force';
let selectedTraitDomain = '';
let openSkillForm = false;
let formSkillCategory = 'technique';
let formSkillLevel = 2;
let openMilestoneForm = false;
let openLegalTopic = null;
let dykIndex = Math.floor(Math.random() * 10000); // point de départ aléatoire pour le "Did you know"
let openLearningDomain = null;
let selectedVerbalCategory = 'quotidien';
let openVerbalSituation = null;

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
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
  `;

  const listEl = screen.querySelector('#skills-list');
  if (!skills.length) {
    listEl.innerHTML = `<p class="detail-desc">Aucune compétence enregistrée pour l'instant.</p>`;
  } else {
    listEl.innerHTML = skills.map((s) => `
      <div class="card card--tight" style="margin-top:var(--sp-2); display:flex; justify-content:space-between; align-items:center; gap:var(--sp-2);">
        <div>
          <p style="font-weight:600; margin:0 0 2px 0;">${s.name}</p>
          <p style="font-size:var(--fs-sm); color:var(--text-tertiary); margin:0;">${skillCategoryMap[s.category]?.label ?? s.category} · ${skillLevels.find((l) => l.id === s.level)?.label}</p>
        </div>
        <button type="button" class="icon-btn" data-delete-skill="${s.id}" aria-label="Supprimer">${icons.trash}</button>
      </div>
    `).join('');
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
// Onglet Attaque Verbale — situations + réponses SIGMA / ALPHA / CHARISME
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

function renderVerbal(screen) {
  const situations = getSituationsByCategory(selectedVerbalCategory);

  screen.innerHTML = `
    <p class="detail-desc">Pour répondre avec assurance, pas pour attaquer. Choisis un style qui te ressemble selon le moment : calme (SIGMA), direct (ALPHA), ou avec humour (CHARISME).</p>

    <div class="mind-disclaimer" style="margin-top:var(--sp-3);">
      💡 Objectif : garder ton calme et ta dignité, pas provoquer un conflit. Adapte le ton à la situation réelle et aux personnes en face de toi.
    </div>

    <div class="category-scroll" id="verbal-cat-scroll" style="margin-top:var(--sp-4)">
      ${verbalCategories.map((c) => `<button type="button" class="category-chip ${selectedVerbalCategory === c.id ? 'is-active' : ''}" data-verbal-cat="${c.id}">${c.label}</button>`).join('')}
    </div>

    <div class="card__label" style="margin-top:var(--sp-4)">${situations.length} situation${situations.length > 1 ? 's' : ''}</div>
    <div id="verbal-situations" style="margin-top:var(--sp-2); display:flex; flex-direction:column; gap:var(--sp-2);"></div>
  `;

  const container = screen.querySelector('#verbal-situations');
  container.innerHTML = situations.map(verbalSituationCard).join('');

  container.querySelectorAll('[data-situation]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openVerbalSituation = openVerbalSituation === btn.dataset.situation ? null : btn.dataset.situation;
      renderVerbal(screen);
    });
  });

  screen.querySelectorAll('[data-verbal-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedVerbalCategory = btn.dataset.verbalCat;
      openVerbalSituation = null;
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
      openVerbalSituation = null;
      el.replaceWith(Skills());
    });
  });

  return el;
}
