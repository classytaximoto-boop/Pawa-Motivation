import { store } from '../utils/store.js';
import { icons } from '../utils/icons.js';
import { quoteOfTheDay } from '../data/quotes.js';
import { AppHeader } from '../components/AppHeader.js';
import { moodMap } from '../data/moods.js';
import { router } from '../utils/router.js';
import { getRandomRecording } from '../utils/voiceStorage.js';
import { getMediaFile } from '../utils/mediaStorage.js';

/** Playlist média la plus pertinente pour chaque type de suggestion Boost Me (voir mediaPlaylists.js). */
const PLAYLIST_BY_BOOST_TYPE = {
  low_motivation: 'when_i_want_to_quit',
  high_stress: 'relaxation',
  deadline: 'focus',
  stuck_goal: 'focus',
  high_motivation: 'before_training',
  default: 'morning_motivation',
};

/**
 * Pioche un média (vidéo ou audio) pertinent pour le type de suggestion
 * courant, en priorisant les favoris de la playlist adaptée, puis n'importe
 * quel média de cette playlist. Renvoie null s'il n'y en a aucun — Boost Me
 * doit toujours pouvoir retomber sur une citation/mission, jamais bloquer.
 */
function pickMediaForBoostType(type) {
  const playlistId = PLAYLIST_BY_BOOST_TYPE[type] || PLAYLIST_BY_BOOST_TYPE.default;
  const inPlaylist = store.listMediaByPlaylist(playlistId).filter((m) => m.category === 'video' || m.category === 'audio');
  if (!inPlaylist.length) return null;
  const favorites = inPlaylist.filter((m) => m.favorite);
  const pool = favorites.length ? favorites : inPlaylist;
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderMood(mood) {
  if (!mood?.current) {
    return `
      <div class="mood-row">
        <div class="mood-row__info">
          <span class="mood-emoji">✨</span>
          <div>
            <div class="mood-row__label">État émotionnel</div>
            <div class="mood-row__value">Pas encore renseigné</div>
          </div>
        </div>
        <button class="chip" data-action="go-mind">Check-in →</button>
      </div>`;
  }
  const meta = moodMap[mood.current.emoji] ?? moodMap.neutral;
  return `
    <div class="mood-row">
      <div class="mood-row__info">
        <span class="mood-emoji">${meta.emoji}</span>
        <div>
          <div class="mood-row__label">État émotionnel</div>
          <div class="mood-row__value">${meta.label}</div>
        </div>
      </div>
      <button class="chip" data-action="go-mind">Détails →</button>
    </div>`;
}

function missionRow(m) {
  return `
    <div class="mission-item ${m.done ? 'is-done' : ''}" data-mission="${m.id}">
      <span class="mission-checkbox">${icons.check}</span>
      <span class="mission-item__text">${m.text}</span>
      <span class="mission-item__xp">+${m.xp} XP</span>
    </div>`;
}

/**
 * Construit le contenu du bottom-sheet Boost Me. Ordre de priorité :
 * 1. Un enregistrement personnel ("MY OWN MOTIVATION"), tiré au sort par
 *    l'appelant pour ne pas écraser systématiquement le reste.
 * 2. Un média (audio ou vidéo) de la bibliothèque, dans la playlist la plus
 *    pertinente pour l'état détecté (voir PLAYLIST_BY_BOOST_TYPE).
 * 3. Sinon, le contenu texte adapté (motivation, objectif, mission, citation).
 * Couvre ainsi toutes les natures de contenu demandées : citation,
 * motivation, audio, vidéo, objectif, mission, message personnel.
 */
async function boostSheetContent(suggestion, ownRecording) {
  const { type, data } = suggestion;

  if (ownRecording) {
    return {
      title: 'Un message de toi, pour toi',
      body: `« ${ownRecording.name} » — écoute-le, c'est fait pour ce moment.`,
      audio: ownRecording,
    };
  }

  const media = pickMediaForBoostType(type);
  if (media) {
    let audioBlob = null;
    if (media.category === 'audio' && media.mediaFileId) {
      try {
        const rec = await getMediaFile(media.mediaFileId);
        audioBlob = rec?.blob || null;
      } catch {
        audioBlob = null;
      }
    }
    return {
      title: media.title || 'Un média pour ce moment',
      body: media.category === 'video' ? 'Une vidéo choisie pour cet instant.' : 'Un son choisi pour cet instant.',
      mediaId: media.id,
      mediaCategory: media.category,
      audio: media.category === 'audio' && audioBlob ? { blob: audioBlob, name: media.title } : null,
    };
  }

  switch (type) {
    case 'low_motivation':
      return {
        title: 'Motivation basse — un pas suffit',
        body: data.message,
        action: data.suggestedAction,
      };
    case 'high_stress':
      return {
        title: 'Stress élevé — on ralentit',
        body: data.message,
        action: data.suggestedAction,
      };
    case 'deadline':
      return {
        title: 'Échéance proche',
        body: `${data.message} Il reste ${data.daysLeft} jour${data.daysLeft > 1 ? 's' : ''}.`,
        goalId: data.goal.id,
      };
    case 'stuck_goal':
      return {
        title: 'Objectif bloqué',
        body: data.message,
        goalId: data.goal.id,
      };
    case 'high_motivation':
      return {
        title: 'Bonne dynamique — vise plus haut',
        body: data.message,
        action: data.suggestedAction,
      };
    default: {
      const quote = quoteOfTheDay();
      return {
        title: 'Petite dose de motivation',
        body: `"${quote.text}" — ${quote.author}`,
      };
    }
  }
}

function boostResultSheet(content) {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-sheet-backdrop';
  backdrop.innerHTML = `
    <div class="confirm-sheet">
      <h2 class="confirm-sheet__title">${content.title}</h2>
      <p class="confirm-sheet__desc">${content.body}</p>
      ${content.audio ? `<audio controls autoplay src="${URL.createObjectURL(content.audio.blob)}" style="width:100%"></audio>` : ''}
      <div class="form-actions">
        <button class="btn-secondary" id="close-boost">Fermer</button>
        ${content.goalId ? `<button class="btn-primary" id="goto-goal">Voir l'objectif</button>` : ''}
        ${content.mediaId && !content.audio ? `<button class="btn-primary" id="goto-media">${content.mediaCategory === 'video' ? 'Voir la vidéo' : 'Écouter'}</button>` : ''}
      </div>
    </div>
  `;
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.remove();
  });
  backdrop.querySelector('#close-boost').addEventListener('click', () => backdrop.remove());
  backdrop.querySelector('#goto-goal')?.addEventListener('click', () => {
    backdrop.remove();
    router.navigate(`/objectifs/${content.goalId}`);
  });
  backdrop.querySelector('#goto-media')?.addEventListener('click', () => {
    backdrop.remove();
    router.navigate(`/media/${content.mediaId}`);
  });
  return backdrop;
}

export function Home() {
  const state = store.get();
  const quote = quoteOfTheDay();
  const doneCount = state.todayMissions.filter((m) => m.done).length;
  const dailyPct = Math.round((doneCount / state.todayMissions.length) * 100) || 0;
  const xpPct = Math.round((state.user.xp / state.user.xpToNextLevel) * 100);

  const el = document.createElement('div');
  el.appendChild(AppHeader());

  const screen = document.createElement('main');
  screen.className = 'screen';
  screen.innerHTML = `
    <section class="quote-card" aria-label="Citation du jour">
      <p class="quote-card__text">"${quote.text}"</p>
      <p class="quote-card__author">— ${quote.author}</p>
    </section>

    <section class="card" aria-label="État émotionnel actuel">
      ${renderMood(state.mood)}
    </section>

    <section class="boost-dial-wrap">
      <button class="boost-dial" id="boost-me-btn" aria-label="Lancer une motivation BOOST">
        <span class="boost-dial__core">
          ${icons.bolt.replace('<svg ', '<svg class="boost-dial__icon" ')}
          <span class="boost-dial__label">BOOST ME</span>
          <span class="boost-dial__sub">Niveau ${state.user.level} · ${state.user.levelName}</span>
        </span>
      </button>
      <p class="boost-dial-caption">Une dose de motivation adaptée à ton moment : citation, rappel d'objectif ou mission du jour.</p>
      <div class="detail-tags-row" style="justify-content:center; margin-top: var(--sp-2)">
        <button class="chip" id="go-coach-btn">${icons.sparkles}Parler à Mon Coach →</button>
        <button class="chip" id="go-abandon-btn">${icons.heart}Je veux abandonner</button>
      </div>
    </section>

    <section class="card" aria-label="Objectif principal du jour">
      <div class="card__label">Objectif principal du jour</div>
      <div class="progress-header">
        <span class="progress-header__title">${state.mainGoalToday.title}</span>
        <span class="progress-header__value mono">${state.mainGoalToday.progress}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${state.mainGoalToday.progress}%"></div>
      </div>
    </section>

    <section class="card" aria-label="Missions du jour">
      <div class="card__label">3 missions du jour</div>
      <div class="mission-list">
        ${state.todayMissions.map(missionRow).join('')}
      </div>
      <button class="chip" id="go-reports-btn" style="margin-top: var(--sp-3)">${icons.notes}Rapport du jour →</button>
    </section>

    <section class="card" aria-label="Progression">
      <div class="progress-header">
        <span class="progress-header__title">Progression quotidienne</span>
        <span class="progress-header__value mono">${dailyPct}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${dailyPct}%"></div>
      </div>
      <div class="progress-header" style="margin-top: var(--sp-4)">
        <span class="progress-header__title">Progression générale</span>
        <span class="progress-header__value mono">${state.overallProgress}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill progress-fill--steel" style="width:${state.overallProgress}%"></div>
      </div>
    </section>

    <section class="stat-grid" aria-label="Statistiques">
      <div class="stat-tile">
        ${icons.flame.replace('<svg ', '<svg class="stat-tile__icon" style="stroke:var(--ember-500)" ')}
        <span class="stat-tile__value mono">${state.user.streak}</span>
        <span class="stat-tile__label">Streak</span>
      </div>
      <div class="stat-tile">
        ${icons.sparkles.replace('<svg ', '<svg class="stat-tile__icon" style="stroke:var(--steel-400)" ')}
        <span class="stat-tile__value mono">${state.user.xp}</span>
        <span class="stat-tile__label">XP · ${xpPct}%</span>
      </div>
      <div class="stat-tile">
        ${icons.compass.replace('<svg ', '<svg class="stat-tile__icon" style="stroke:var(--success-500)" ')}
        <span class="stat-tile__value mono">${state.user.level}</span>
        <span class="stat-tile__label">${state.user.levelName}</span>
      </div>
    </section>

    <section aria-label="Prochaine action importante">
      <div class="card__label" style="padding-left: var(--sp-1)">Prochaine action importante</div>
      <button class="card next-action" id="next-action-btn" style="width:100%; text-align:left">
        <span class="next-action__icon">${icons.compass}</span>
        <span class="next-action__body">
          <span class="next-action__title">${state.nextAction?.title ?? 'Aucune action planifiée'}</span>
          <span class="next-action__meta">${state.nextAction?.meta ?? 'Ajoute un objectif pour commencer'}</span>
        </span>
        <span class="next-action__chevron">${icons.chevronRight}</span>
      </button>
    </section>

    <section class="why-card" aria-label="Pourquoi je fais tout ça">
      ${icons.mind}
      <p class="why-card__text">${state.whyStatement}</p>
    </section>
  `;

  el.appendChild(screen);

  // Interactions
  screen.querySelectorAll('[data-mission]').forEach((row) => {
    row.addEventListener('click', () => {
      store.toggleMission(row.dataset.mission);
      el.replaceWith(Home());
    });
  });

  screen.querySelector('#boost-me-btn')?.addEventListener('click', async () => {
    store.checkInToday();
    screen.querySelector('.boost-dial').animate(
      [{ transform: 'scale(0.94)' }, { transform: 'scale(1)' }],
      { duration: 220, easing: 'cubic-bezier(0.16,1,0.3,1)' }
    );

    const suggestion = store.getBoostSuggestion();
    // Une chance sur trois de piocher un enregistrement perso s'il y en a,
    // pour que "MY OWN MOTIVATION" revienne naturellement sans écraser
    // systématiquement les suggestions adaptatives basées sur l'état réel.
    let ownRecording = null;
    if (Math.random() < 0.33) {
      try {
        ownRecording = await getRandomRecording();
      } catch {
        ownRecording = null;
      }
    }
    const content = await boostSheetContent(suggestion, ownRecording);
    el.appendChild(boostResultSheet(content));
  });

  screen.querySelector('[data-action="go-mind"]')?.addEventListener('click', () => {
    window.location.hash = '#/mind';
  });

  screen.querySelector('#go-reports-btn')?.addEventListener('click', () => {
    window.location.hash = '#/rapports';
  });

  screen.querySelector('#go-coach-btn')?.addEventListener('click', () => {
    router.navigate('/coach');
  });

  screen.querySelector('#go-abandon-btn')?.addEventListener('click', () => {
    router.navigate('/abandon');
  });

  return el;
}
