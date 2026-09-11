import { icons } from '../utils/icons.js';
import { confidenceScripts, themeCollection } from '../data/motivationContent.js';

// État local de l'écran (pas persisté) : sous-onglet actif + item ouvert.
let activeSubTab = 'confiance'; // confiance | recueil
let openScriptId = null; // id du script confiance ouvert, ou null (liste)
let openSectionId = null; // id de section ouverte dans le recueil, ou null (liste des sections)
let openItemIndex = null; // index de l'item ouvert dans la section, ou null (liste des items)

function scriptCard(script) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card motivation-card';
  card.innerHTML = `
    <div class="motivation-card__title">${script.title}</div>
    <div class="motivation-card__preview">${script.body.slice(0, 90).replace(/\n/g, ' ')}…</div>
  `;
  card.addEventListener('click', () => {
    openScriptId = script.id;
    refreshScreen();
  });
  return card;
}

function sectionCard(section) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card motivation-card';
  card.innerHTML = `
    <div class="motivation-card__title">${section.title}</div>
    <div class="motivation-card__preview">${section.items.length} texte${section.items.length > 1 ? 's' : ''}</div>
  `;
  card.addEventListener('click', () => {
    openSectionId = section.id;
    openItemIndex = null;
    refreshScreen();
  });
  return card;
}

function itemCard(item, index) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card motivation-card';
  card.innerHTML = `
    <div class="motivation-card__title">${item.title}</div>
    <div class="motivation-card__preview">${item.body.slice(0, 90).replace(/\n/g, ' ')}…</div>
  `;
  card.addEventListener('click', () => {
    openItemIndex = index;
    refreshScreen();
  });
  return card;
}

function readerBlock({ title, body, onBack, onNext, nextLabel }) {
  const wrap = document.createElement('div');
  wrap.className = 'motivation-reader';
  wrap.innerHTML = `
    <div class="motivation-reader__nav">
      <button type="button" class="back-btn motivation-reader__back">${icons.arrowLeft} Retour</button>
      ${onNext ? `<button type="button" class="motivation-reader__next">${nextLabel || 'Suivant'} ${icons.chevronRight}</button>` : ''}
    </div>
    <h2 class="motivation-reader__title">${title}</h2>
    <p class="motivation-reader__body">${body.replace(/\n\n/g, '</p><p class="motivation-reader__body">').replace(/\n/g, '<br>')}</p>
    ${onNext ? `<button type="button" class="btn-primary motivation-reader__next-bottom" style="width:100%">${nextLabel || 'Suivant'} ${icons.chevronRight}</button>` : ''}
  `;
  wrap.querySelector('.motivation-reader__back').addEventListener('click', onBack);
  if (onNext) {
    wrap.querySelectorAll('.motivation-reader__next, .motivation-reader__next-bottom').forEach((btn) => {
      btn.addEventListener('click', onNext);
    });
  }
  return wrap;
}

let screenRef = null;

function refreshScreen() {
  if (screenRef) renderBody(screenRef);
}

function renderConfianceTab(screen) {
  if (openScriptId) {
    const idx = confidenceScripts.findIndex((s) => s.id === openScriptId);
    const script = confidenceScripts[idx];
    const isLast = idx === confidenceScripts.length - 1;
    screen.innerHTML = '';
    screen.appendChild(readerBlock({
      title: script.title,
      body: script.body,
      onBack: () => { openScriptId = null; refreshScreen(); },
      onNext: () => {
        openScriptId = isLast ? confidenceScripts[0].id : confidenceScripts[idx + 1].id;
        refreshScreen();
      },
      nextLabel: isLast ? 'Recommencer' : 'Suivant',
    }));
    return;
  }
  screen.innerHTML = `
    <p class="motivation-intro">Des scripts courts et ciblés pour affronter les menaces, les attaques verbales, l'intimidation, l'autorité, et pour tenir bon quand des gens ou des projets s'en vont.</p>
    <div class="motivation-list" id="confiance-list"></div>
  `;
  const list = screen.querySelector('#confiance-list');
  confidenceScripts.forEach((s) => list.appendChild(scriptCard(s)));
}

function renderRecueilTab(screen) {
  if (openSectionId) {
    const sectionIdx = themeCollection.findIndex((s) => s.id === openSectionId);
    const section = themeCollection[sectionIdx];
    if (openItemIndex !== null) {
      const item = section.items[openItemIndex];
      const isLastItemInSection = openItemIndex === section.items.length - 1;
      const isLastSection = sectionIdx === themeCollection.length - 1;
      screen.innerHTML = '';
      screen.appendChild(readerBlock({
        title: item.title,
        body: item.body,
        onBack: () => { openItemIndex = null; refreshScreen(); },
        onNext: () => {
          if (!isLastItemInSection) {
            openItemIndex = openItemIndex + 1;
          } else {
            // Fin de section : passe à la section suivante (ou boucle à la première), premier item.
            const nextSection = isLastSection ? themeCollection[0] : themeCollection[sectionIdx + 1];
            openSectionId = nextSection.id;
            openItemIndex = 0;
          }
          refreshScreen();
        },
        nextLabel: (isLastItemInSection && isLastSection) ? 'Recommencer' : 'Suivant',
      }));
      return;
    }
    screen.innerHTML = `
      <button type="button" class="back-btn motivation-reader__back" id="back-to-sections">${icons.arrowLeft} Retour aux sections</button>
      <h2 class="motivation-reader__title">${section.title}</h2>
      <div class="motivation-list" id="section-items"></div>
    `;
    screen.querySelector('#back-to-sections').addEventListener('click', () => {
      openSectionId = null;
      refreshScreen();
    });
    const list = screen.querySelector('#section-items');
    section.items.forEach((item, i) => list.appendChild(itemCard(item, i)));
    return;
  }
  screen.innerHTML = `
    <p class="motivation-intro">Le recueil complet, organisé par thème : amour et relations, respect de soi, vérités dures, foi et persévérance, réussite, personnalité, routines, détachement, gratitude, citations.</p>
    <div class="motivation-list" id="recueil-list"></div>
  `;
  const list = screen.querySelector('#recueil-list');
  themeCollection.forEach((section) => list.appendChild(sectionCard(section)));
}

function renderBody(screen) {
  if (activeSubTab === 'confiance') renderConfianceTab(screen);
  else renderRecueilTab(screen);
}

export function Motivation() {
  const el = document.createElement('div');

  const tabs = document.createElement('div');
  tabs.className = 'tab-row mind-tab-row';
  tabs.style.margin = '0 0 var(--sp-4)';
  tabs.setAttribute('role', 'tablist');
  tabs.innerHTML = `
    <button class="tab-btn ${activeSubTab === 'confiance' ? 'is-active' : ''}" data-subtab="confiance">Confiance en soi</button>
    <button class="tab-btn ${activeSubTab === 'recueil' ? 'is-active' : ''}" data-subtab="recueil">Recueil par thème</button>
  `;
  el.appendChild(tabs);

  const screen = document.createElement('div');
  screenRef = screen;
  el.appendChild(screen);

  renderBody(screen);

  tabs.querySelectorAll('[data-subtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeSubTab = btn.dataset.subtab;
      openScriptId = null;
      openSectionId = null;
      openItemIndex = null;
      el.replaceWith(Motivation());
    });
  });

  return el;
}
