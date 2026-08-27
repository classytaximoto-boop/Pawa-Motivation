import { icons } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { AppHeader } from '../components/AppHeader.js';
import {
  saveRecording,
  renameRecording,
  deleteRecording,
  listRecordings,
} from '../utils/voiceStorage.js';

// Note : getUserMedia (donc l'enregistrement micro) exige un contexte sécurisé
// (HTTPS ou localhost). Une PWA installée servie en HTTP simple ne pourra pas
// enregistrer — c'est une contrainte du navigateur, pas de cette app.

function fmtDuration(seconds) {
  const s = Math.round(seconds || 0);
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${String(rest).padStart(2, '0')}`;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function deleteConfirmSheet(record, onDone) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">Supprimer cet enregistrement ?</h2>
      <p class="confirm-sheet__desc">« ${record.name} » sera supprimé définitivement. Cette opération est irréversible.</p>
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
  backdrop.querySelector('#confirm-delete').addEventListener('click', async () => {
    await deleteRecording(record.id);
    backdrop.remove();
    onDone();
  });
  return backdrop;
}

function recordingRow(record, { onRename, onDelete }) {
  const row = document.createElement('div');
  row.className = 'card';
  row.style.marginTop = 'var(--sp-2)';
  const url = URL.createObjectURL(record.blob);
  row.innerHTML = `
    <div class="goal-card__top">
      <div style="flex:1; min-width:0;">
        <div class="goal-card__title-row">
          ${icons.mic}
          <span class="goal-card__name" id="name-${record.id}">${record.name}</span>
        </div>
        <div class="goal-card__meta-row">
          <span class="chip">${fmtDuration(record.duration)}</span>
          <span class="chip">${fmtDate(record.createdAt)}</span>
        </div>
      </div>
      <div class="detail-header-row__actions">
        <button class="icon-btn" aria-label="Renommer" data-action="rename">${icons.edit}</button>
        <button class="icon-btn icon-btn--danger" aria-label="Supprimer" data-action="delete">${icons.trash}</button>
      </div>
    </div>
    <audio controls src="${url}" style="width:100%; margin-top:var(--sp-3);"></audio>
  `;
  row.querySelector('[data-action="rename"]').addEventListener('click', () => {
    const next = window.prompt('Nouveau nom :', record.name);
    if (next && next.trim()) onRename(record.id, next.trim());
  });
  row.querySelector('[data-action="delete"]').addEventListener('click', () => onDelete(record));
  return row;
}

export function VoiceRecorder() {
  const el = document.createElement('div');
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen';

  screen.innerHTML = `
    <div class="detail-header-row" style="padding:0;">
      <button class="back-btn" aria-label="Retour">${icons.arrowLeft}</button>
      <h1 style="font-size:var(--fs-xl)">My Own Motivation</h1>
    </div>
    <p class="detail-desc" style="margin-top:var(--sp-2)">Enregistre tes propres messages de motivation — ils restent uniquement sur cet appareil.</p>

    <section class="card" style="margin-top:var(--sp-4); display:flex; flex-direction:column; align-items:center; gap:var(--sp-3);">
      <button type="button" class="record-btn" id="record-btn" aria-label="Démarrer l'enregistrement">
        ${icons.mic}
      </button>
      <div id="record-status" class="chip">Prêt à enregistrer</div>
      <div class="form-actions" id="record-controls" style="display:none; width:100%;">
        <button type="button" class="btn-secondary" id="pause-resume-btn">Pause</button>
        <button type="button" class="btn-danger" id="stop-btn">Arrêter</button>
      </div>
      <p class="detail-desc" id="unsupported-msg" style="display:none; text-align:center;">L'enregistrement audio n'est pas supporté sur cet appareil/navigateur.</p>
    </section>

    <div class="card__label" style="margin-top: var(--sp-5)">Mes enregistrements</div>
    <div id="recordings-list"></div>
  `;

  el.appendChild(screen);

  screen.querySelector('.back-btn').addEventListener('click', () => router.navigate('/media'));

  const recordBtn = screen.querySelector('#record-btn');
  const statusEl = screen.querySelector('#record-status');
  const controlsEl = screen.querySelector('#record-controls');
  const pauseResumeBtn = screen.querySelector('#pause-resume-btn');
  const stopBtn = screen.querySelector('#stop-btn');
  const unsupportedMsg = screen.querySelector('#unsupported-msg');
  const listEl = screen.querySelector('#recordings-list');

  let mediaRecorder = null;
  let stream = null;
  let chunks = [];
  let startedAt = null;
  let pausedDurationMs = 0;
  let pauseStartedAt = null;
  let state = 'idle'; // idle | recording | paused

  async function refreshList() {
    listEl.innerHTML = `<div class="skeleton" style="height:64px; border-radius:var(--radius-md);"></div>`;
    let records;
    try {
      records = await listRecordings();
    } catch (e) {
      console.warn('[VoiceRecorder] lecture des enregistrements impossible', e);
      listEl.innerHTML = `
        <div class="state-block state-block--error" style="padding-top: var(--sp-6)">
          ${icons.alertTriangle.replace('<svg ', '<svg class="state-block__icon" ')}
          <h2 class="state-block__title">Impossible de charger tes enregistrements</h2>
          <p class="state-block__desc">Le stockage local de cet appareil semble indisponible (mode privé strict, quota dépassé…). Réessaie plus tard.</p>
        </div>`;
      return;
    }
    listEl.innerHTML = '';
    if (records.length === 0) {
      listEl.innerHTML = `
        <div class="state-block" style="padding-top: var(--sp-6)">
          ${icons.mic.replace('<svg ', '<svg class="state-block__icon" ')}
          <h2 class="state-block__title">Aucun enregistrement</h2>
          <p class="state-block__desc">Ton premier message de motivation n'attend que toi.</p>
        </div>`;
      return;
    }
    records.forEach((r) => {
      listEl.appendChild(recordingRow(r, {
        onRename: async (id, name) => {
          await renameRecording(id, name);
          refreshList();
        },
        onDelete: (record) => {
          el.appendChild(deleteConfirmSheet(record, refreshList));
        },
      }));
    });
  }

  function setUiState(next) {
    state = next;
    if (next === 'idle') {
      recordBtn.classList.remove('is-recording', 'is-paused');
      recordBtn.innerHTML = icons.mic;
      statusEl.textContent = 'Prêt à enregistrer';
      controlsEl.style.display = 'none';
    } else if (next === 'recording') {
      recordBtn.classList.add('is-recording');
      recordBtn.classList.remove('is-paused');
      statusEl.textContent = 'Enregistrement en cours…';
      controlsEl.style.display = 'flex';
      pauseResumeBtn.textContent = 'Pause';
    } else if (next === 'paused') {
      recordBtn.classList.add('is-paused');
      recordBtn.classList.remove('is-recording');
      statusEl.textContent = 'En pause';
      pauseResumeBtn.textContent = 'Reprendre';
    }
  }

  async function startRecording() {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      unsupportedMsg.style.display = 'block';
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      statusEl.textContent = "Permission micro refusée.";
      return;
    }
    chunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      const durationMs = Date.now() - startedAt - pausedDurationMs;
      const name = window.prompt('Nom de cet enregistrement :', `Motivation ${fmtDate(new Date().toISOString())}`) || 'Sans titre';
      try {
        await saveRecording({ name, blob, duration: durationMs / 1000 });
      } catch (e) {
        console.warn('[VoiceRecorder] sauvegarde impossible', e);
        statusEl.textContent = "Échec de la sauvegarde — réessaie.";
      }
      setUiState('idle');
      refreshList();
    };
    mediaRecorder.start();
    startedAt = Date.now();
    pausedDurationMs = 0;
    setUiState('recording');
  }

  function pauseOrResume() {
    if (!mediaRecorder) return;
    if (state === 'recording') {
      mediaRecorder.pause();
      pauseStartedAt = Date.now();
      setUiState('paused');
    } else if (state === 'paused') {
      mediaRecorder.resume();
      pausedDurationMs += Date.now() - pauseStartedAt;
      setUiState('recording');
    }
  }

  function stopRecording() {
    if (!mediaRecorder) return;
    if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  }

  recordBtn.addEventListener('click', () => {
    if (state === 'idle') startRecording();
  });
  pauseResumeBtn.addEventListener('click', pauseOrResume);
  stopBtn.addEventListener('click', stopRecording);

  refreshList();

  return el;
}
