import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { AppHeader } from '../components/AppHeader.js';
import { notificationTypes } from '../data/notificationTypes.js';
import { router } from '../utils/router.js';
import { SecurityService } from '../utils/securityService.js';

const COACH_STYLES = [
  { id: 'direct', label: 'Direct' },
  { id: 'calme', label: 'Calme' },
  { id: 'militaire', label: 'Militaire' },
  { id: 'professionnel', label: 'Professionnel' },
  { id: 'ami', label: 'Ami' },
  { id: 'minimal', label: 'Minimal' },
];

const COACH_DIFFICULTIES = [
  { id: 'doux', label: 'Doux' },
  { id: 'normal', label: 'Normal' },
  { id: 'exigeant', label: 'Exigeant' },
];

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function permissionLabel(state) {
  if (state === 'granted') return { text: 'Autorisées', tone: 'success' };
  if (state === 'denied') return { text: 'Bloquées (à réactiver dans les réglages du navigateur)', tone: 'danger' };
  if (state === 'unsupported') return { text: 'Non supportées sur cet appareil', tone: 'danger' };
  return { text: 'Pas encore demandées', tone: 'default' };
}

function typeRow(type, pref) {
  const row = document.createElement('div');
  row.className = 'card';
  row.style.marginTop = 'var(--sp-2)';
  row.innerHTML = `
    <div class="goal-card__top">
      <div class="goal-card__title-row">
        ${icons[type.icon] || icons.bolt}
        <span class="goal-card__name">${type.label}</span>
      </div>
      <button type="button" class="toggle-switch ${pref.enabled ? 'is-on' : ''}" data-toggle="${type.id}" aria-label="Activer ${type.label}">
        <span class="toggle-switch__knob"></span>
      </button>
    </div>
    <p class="detail-desc" style="margin-top:var(--sp-1)">${type.description}</p>
    <div class="form-group" style="margin-top:var(--sp-2)">
      <input class="form-input" type="time" value="${pref.time}" data-time="${type.id}" ${pref.enabled ? '' : 'disabled'} />
    </div>
  `;
  return row;
}

/** Confirme le remplacement des données actuelles par un fichier de sauvegarde. */
function importConfirmSheet(fileText, onDone) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Restaurer cette sauvegarde ?</h2>
      <p class="confirm-sheet__desc">Toutes les données actuelles de l'app seront remplacées par celles du fichier importé. Cette opération est irréversible.</p>
      <div class="form-actions">
        <button class="btn-secondary" id="cancel-import">Annuler</button>
        <button class="btn-danger" id="confirm-import">Restaurer</button>
      </div>
    </div>
  `;
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.remove();
  });
  backdrop.querySelector('#cancel-import').addEventListener('click', () => backdrop.remove());
  backdrop.querySelector('#confirm-import').addEventListener('click', () => {
    const result = store.restoreBackup(fileText);
    backdrop.remove();
    onDone(result);
  });
  return backdrop;
}

/** Confirme la suppression totale et définitive des données locales. */
function eraseConfirmSheet() {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Tout supprimer ?</h2>
      <p class="confirm-sheet__desc">Objectifs, projets, journal, finances, historique XP... toutes les données de BOOST seront effacées de cet appareil, sans retour possible. Pense à exporter une sauvegarde avant si besoin.</p>
      <div class="form-group" style="margin-top:var(--sp-2)">
        <label class="form-label">Tape SUPPRIMER pour confirmer</label>
        <input class="form-input" type="text" id="erase-confirm-input" autocomplete="off" placeholder="SUPPRIMER" />
      </div>
      <div class="form-actions">
        <button class="btn-secondary" id="cancel-erase">Annuler</button>
        <button class="btn-danger" id="confirm-erase" disabled>Supprimer définitivement</button>
      </div>
    </div>
  `;
  const input = backdrop.querySelector('#erase-confirm-input');
  const confirmBtn = backdrop.querySelector('#confirm-erase');
  input.addEventListener('input', () => {
    confirmBtn.disabled = input.value.trim().toUpperCase() !== 'SUPPRIMER';
  });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.remove();
  });
  backdrop.querySelector('#cancel-erase').addEventListener('click', () => backdrop.remove());
  confirmBtn.addEventListener('click', () => {
    if (confirmBtn.disabled) return;
    store.eraseAllData();
    // Le PIN/config biométrie/masquage vivent hors du store principal
    // (utils/securityService.js) — un "effacer toutes les données" doit
    // aussi les faire disparaître, sinon un ancien PIN survivrait à la
    // remise à zéro et bloquerait l'accès à une zone Secret déjà vidée.
    SecurityService.resetAll();
    backdrop.remove();
    router.navigate('/');
  });
  return backdrop;
}

export function Profile() {
  const rerender = () => el.replaceWith(Profile());

  const el = document.createElement('div');
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen';

  const prefs = store.getNotificationPrefs();
  const permission = store.getNotificationPermission();
  const permMeta = permissionLabel(permission);
  const log = store.listNotificationLog();
  const aiEnabled = store.isAIEnabled();
  const coach = store.getCoachSettings();

  screen.innerHTML = `
    <div class="screen-title-row"><h1>Profil</h1></div>

    <div class="card__label">Notifications locales</div>
    <section class="card">
      <div class="goal-card__meta-row">
        <span class="chip">${permMeta.text}</span>
      </div>
      ${permission === 'default' ? `<button type="button" class="btn-primary" id="request-perm-btn" style="margin-top:var(--sp-3)">Autoriser les notifications</button>` : ''}
      <p class="detail-desc" style="margin-top:var(--sp-2)">Ces rappels ne sonnent que si l'application est ouverte au bon moment — sans serveur, un téléphone ne peut pas être réveillé en arrière-plan de façon fiable.</p>
    </section>

    <div class="card__label" style="margin-top: var(--sp-5)">Types de rappel</div>
    <div id="types-list"></div>

    <div class="card__label" style="margin-top: var(--sp-5)">Historique récent</div>
    <div id="log-list"></div>

    <div class="card__label" style="margin-top: var(--sp-5)">Sauvegarde</div>
    <section class="card">
      <p class="detail-desc">Toutes tes données restent sur cet appareil (aucun serveur). Exporte-les régulièrement pour ne rien perdre en cas de changement de téléphone ou de réinstallation.</p>
      <div id="backup-status"></div>
      <button type="button" class="btn-primary" id="export-btn" style="margin-top:var(--sp-3); width:100%;">Exporter mes données (.json)</button>
      <button type="button" class="btn-secondary" id="import-btn" style="margin-top:var(--sp-2); width:100%;">Importer une sauvegarde</button>
      <input type="file" id="import-file-input" accept="application/json,.json" style="display:none" />
    </section>

    <div class="card__label" style="margin-top: var(--sp-5)">Intelligence artificielle</div>
    <section class="card">
      <div class="goal-card__top">
        <div class="goal-card__title-row">
          ${icons.sparkles}
          <span class="goal-card__name">IA activée</span>
        </div>
        <button type="button" class="toggle-switch ${aiEnabled ? 'is-on' : ''}" id="ai-toggle" aria-label="Activer l'IA">
          <span class="toggle-switch__knob"></span>
        </button>
      </div>
      <p class="detail-desc" style="margin-top:var(--sp-1)">
        ${aiEnabled
          ? "Le coach et les rapports IA peuvent envoyer un contexte minimal à un service externe. Secret n'est jamais transmis, quel que soit ce réglage."
          : "IA désactivée : aucune donnée ne quitte cet appareil. Le coach, Boost Me et les rapports continuent de fonctionner en mode local uniquement."}
      </p>
    </section>

    <div class="card__label" style="margin-top: var(--sp-5)">Personnalisation du coach</div>
    <section class="card">
      <p class="detail-desc">Style</p>
      <div class="detail-tags-row" style="margin-top:var(--sp-2)">
        ${COACH_STYLES.map((s) => `<button type="button" class="category-chip ${coach.style === s.id ? 'is-active' : ''}" data-coach-style="${s.id}">${s.label}</button>`).join('')}
      </div>

      <div class="form-group" style="margin-top: var(--sp-4)">
        <label class="form-label" for="f-coach-goal">Objectif principal</label>
        <input class="form-input" type="text" id="f-coach-goal" value="${coach.mainGoal ?? ''}" placeholder="Ce que tu veux accomplir avant tout" />
      </div>
      <div class="form-group" style="margin-top: var(--sp-3)">
        <label class="form-label" for="f-coach-values">Valeurs</label>
        <input class="form-input" type="text" id="f-coach-values" value="${coach.values ?? ''}" placeholder="Ex : discipline, honnêteté, famille" />
      </div>
      <div class="form-group" style="margin-top: var(--sp-3)">
        <label class="form-label" for="f-coach-reasons">Raisons personnelles</label>
        <textarea class="form-textarea" id="f-coach-reasons" placeholder="Pourquoi tu fais tout ça">${coach.personalReasons ?? ''}</textarea>
      </div>
      <div class="form-group" style="margin-top: var(--sp-3)">
        <label class="form-label" for="f-coach-phrase">Phrase de motivation</label>
        <input class="form-input" type="text" id="f-coach-phrase" value="${coach.motivationPhrase ?? ''}" placeholder="Une phrase qui te parle" />
      </div>

      <p class="detail-desc" style="margin-top:var(--sp-4)">Niveau de difficulté souhaité</p>
      <div class="detail-tags-row" style="margin-top:var(--sp-2)">
        ${COACH_DIFFICULTIES.map((d) => `<button type="button" class="category-chip ${coach.difficulty === d.id ? 'is-active' : ''}" data-coach-difficulty="${d.id}">${d.label}</button>`).join('')}
      </div>

      <button type="button" class="btn-primary" id="save-coach-settings-btn" style="margin-top:var(--sp-4); width:100%;">Enregistrer</button>
      <div id="coach-settings-status"></div>
    </section>

    <div class="card__label" style="margin-top: var(--sp-5)">Zone dangereuse</div>
    <section class="card">
      <p class="detail-desc">Efface définitivement toutes les données de BOOST sur cet appareil.</p>
      <button type="button" class="btn-danger" id="erase-btn" style="margin-top:var(--sp-3); width:100%;">Supprimer toutes mes données</button>
    </section>

    <div class="card__label" style="margin-top: var(--sp-5)">À propos</div>
    <section class="card">
      <button type="button" class="chip" id="go-help-btn" style="width:100%; justify-content:center;">${icons.helpCircle} Aide et informations sur l'application</button>
    </section>
  `;

  const typesList = screen.querySelector('#types-list');
  notificationTypes.forEach((t) => typesList.appendChild(typeRow(t, prefs[t.id])));

  const logList = screen.querySelector('#log-list');
  if (log.length === 0) {
    logList.innerHTML = `<p class="detail-desc">Aucune notification envoyée pour l'instant.</p>`;
  } else {
    logList.innerHTML = `
      <div class="card">
        ${log.slice(0, 10).map((n) => `
          <div class="goal-card__meta-row" style="margin-top:var(--sp-1)">
            <span class="chip">${fmtDate(n.date)}</span>
            <span>${n.label}</span>
          </div>`).join('')}
      </div>`;
  }

  el.appendChild(screen);

  screen.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.toggleNotificationType(btn.dataset.toggle);
      rerender();
    });
  });

  screen.querySelectorAll('[data-time]').forEach((input) => {
    input.addEventListener('change', () => {
      store.setNotificationPref(input.dataset.time, { time: input.value });
    });
  });

  screen.querySelector('#request-perm-btn')?.addEventListener('click', async () => {
    await store.requestNotificationPermission();
    rerender();
  });

  const statusBox = screen.querySelector('#backup-status');
  const showStatus = (message, tone = 'success') => {
    statusBox.innerHTML = `<p class="detail-desc" style="margin-top:var(--sp-2); color:${tone === 'success' ? 'var(--success-500)' : 'var(--danger-500)'}">${message}</p>`;
  };

  screen.querySelector('#export-btn').addEventListener('click', () => {
    store.downloadBackup();
    showStatus('Export lancé — vérifie tes téléchargements.');
  });

  const fileInput = screen.querySelector('#import-file-input');
  screen.querySelector('#import-btn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const check = store.parseBackup(text);
      if (!check.ok) {
        showStatus(check.error, 'danger');
        return;
      }
      el.appendChild(importConfirmSheet(text, (result) => {
        if (result.ok) {
          rerender();
        } else {
          showStatus(result.error, 'danger');
        }
      }));
    };
    reader.onerror = () => showStatus('Impossible de lire ce fichier.', 'danger');
    reader.readAsText(file);
  });

  screen.querySelector('#erase-btn').addEventListener('click', () => {
    el.appendChild(eraseConfirmSheet());
  });

  screen.querySelector('#ai-toggle').addEventListener('click', () => {
    store.setAIEnabled(!store.isAIEnabled());
    rerender();
  });

  let selectedCoachStyle = coach.style;
  let selectedCoachDifficulty = coach.difficulty;
  screen.querySelectorAll('[data-coach-style]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCoachStyle = btn.dataset.coachStyle;
      screen.querySelectorAll('[data-coach-style]').forEach((b) => b.classList.toggle('is-active', b.dataset.coachStyle === selectedCoachStyle));
    });
  });
  screen.querySelectorAll('[data-coach-difficulty]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCoachDifficulty = btn.dataset.coachDifficulty;
      screen.querySelectorAll('[data-coach-difficulty]').forEach((b) => b.classList.toggle('is-active', b.dataset.coachDifficulty === selectedCoachDifficulty));
    });
  });

  const coachStatus = screen.querySelector('#coach-settings-status');
  screen.querySelector('#save-coach-settings-btn').addEventListener('click', () => {
    store.updateCoachSettings({
      style: selectedCoachStyle,
      difficulty: selectedCoachDifficulty,
      mainGoal: screen.querySelector('#f-coach-goal').value.trim(),
      values: screen.querySelector('#f-coach-values').value.trim(),
      personalReasons: screen.querySelector('#f-coach-reasons').value.trim(),
      motivationPhrase: screen.querySelector('#f-coach-phrase').value.trim(),
    });
    coachStatus.innerHTML = `<p class="detail-desc" style="margin-top:var(--sp-2); color:var(--success-500)">Préférences du coach enregistrées.</p>`;
  });

  screen.querySelector('#go-help-btn').addEventListener('click', () => {
    router.navigate('/aide');
  });

  return el;
}
