import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
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
    router.navigate('/mind');
    renderMotivationInPlace();
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

function readerBlock({ title, body, onBack }) {
  const wrap = document.createElement('div');
  wrap.className = 'motivation-reader';
  wrap.innerHTML = `
    <button type="button" class="back-btn motivation-reader__back">${icons.arrowLeft} Retour</button>
    <h2 class="motivation-reader__title">${title}</h2>
    <p class="motivation-reader__body">${body.replace(/\n\n/g, '</p><p class="motivation-reader__body">').replace(/\n/g, '<br>')}</p>
  `;
  wrap.querySelector('.motivation-reader__back').addEventListener('click', onBack);
  return wrap;
}

let screenRef = null;

function refreshScreen() {
  if (screenRef) renderBody(screenRef);
}

function renderConfianceTab(screen) {
  if (openScriptId) {
    const script = confidenceScripts.find((s) => s.id === openScriptId);
    screen.innerHTML = '';
    screen.appendChild(readerBlock({
      title: script.title,
      body: script.body,
      onBack: () => { openScriptId = null; refreshScreen(); },
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
    const section = themeCollection.find((s) => s.id === openSectionId);
    if (openItemIndex !== null) {
      const item = section.items[openItemIndex];
      screen.innerHTML = '';
      screen.appendChild(readerBlock({
        title: item.title,
        body: item.body,
        onBack: () => { openItemIndex = null; refreshScreen(); },
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
