/**
 * MediaPlayer — lecteur audio/vidéo réutilisable.
 *
 * Un seul composant pour les deux types : <audio> et <video> partagent la
 * même API HTMLMediaElement (play/pause/currentTime/duration/volume), donc
 * les contrôles (play/pause, seek, volume, progression) sont communs. Seul
 * le plein écran est spécifique à la vidéo, et l'élément <video> s'affiche
 * alors que l'audio reste caché (juste ses contrôles).
 *
 * Playlist : si `playlist` (array de MediaItem) est fourni, les boutons
 * suivant/précédent naviguent dedans et le lecteur enchaîne automatiquement
 * à la fin d'une piste — sans quitter l'écran.
 *
 * Lecture en arrière-plan : la Media Session API (si supportée) donne les
 * métadonnées au système (titre) et les contrôles matériels/notification
 * peuvent piloter play/pause/next/prev. C'est le maximum qu'un navigateur
 * offre sans app native — pas de garantie sur tous les appareils, mais ça
 * ne casse rien là où ce n'est pas supporté (vérifié avant usage).
 */

import { icons } from '../utils/icons.js';
import { store } from '../utils/store.js';
import { getMediaFile } from '../utils/mediaStorage.js';

function fmtTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Résout la source jouable d'un MediaItem : fichier local (IndexedDB) en
 * priorité, sinon l'url externe. Renvoie null si rien n'est jouable
 * (ex. un article/livre sans lien — pas un type de média avec player).
 */
async function resolveSource(item) {
  if (item.mediaFileId) {
    const file = await getMediaFile(item.mediaFileId);
    if (file?.blob) {
      return { src: URL.createObjectURL(file.blob), isObjectUrl: true };
    }
  }
  if (item.url) {
    return { src: item.url, isObjectUrl: false };
  }
  return null;
}

/**
 * Construit le lecteur pour un MediaItem donné.
 * options.playlist : array de MediaItem pour activer suivant/précédent (optionnel).
 * options.onFavoriteChange : rappel après bascule favori, pour rafraîchir l'écran appelant (optionnel).
 */
export function MediaPlayer(item, options = {}) {
  const { playlist = null, onFavoriteChange } = options;
  const isVideo = item.category === 'video';

  const wrap = document.createElement('div');
  wrap.className = 'media-player';

  wrap.innerHTML = `
    <div class="media-player__stage ${isVideo ? '' : 'media-player__stage--audio'}">
      ${isVideo
        ? '<video class="media-player__video" playsinline></video>'
        : `<div class="media-player__audio-art">${icons.media}</div><audio class="media-player__audio"></audio>`}
      <div class="media-player__loading" id="mp-loading">Chargement…</div>
    </div>

    <div class="media-player__title-row">
      <span class="media-player__title">${item.title || 'Sans titre'}</span>
      <button type="button" class="icon-btn" id="mp-fav" aria-label="Favori">${item.favorite ? icons.heartFill : icons.heart}</button>
    </div>

    <div class="media-player__seek-row">
      <span class="mono media-player__time" id="mp-current">0:00</span>
      <input type="range" class="mind-slider media-player__seek" id="mp-seek" min="0" max="100" value="0" />
      <span class="mono media-player__time" id="mp-duration">0:00</span>
    </div>

    <div class="media-player__controls">
      ${playlist ? `<button type="button" class="icon-btn" id="mp-prev" aria-label="Précédent">${icons.skipBack}</button>` : ''}
      <button type="button" class="record-btn media-player__play-btn" id="mp-play" aria-label="Lecture">${icons.play}</button>
      ${playlist ? `<button type="button" class="icon-btn" id="mp-next" aria-label="Suivant">${icons.skipForward}</button>` : ''}
      <div class="media-player__volume">
        <button type="button" class="icon-btn" id="mp-mute" aria-label="Volume">${icons.volume}</button>
        <input type="range" class="mind-slider media-player__volume-slider" id="mp-volume" min="0" max="100" value="100" />
      </div>
      ${isVideo ? `<button type="button" class="icon-btn" id="mp-fullscreen" aria-label="Plein écran">${icons.expand}</button>` : ''}
    </div>

    <p class="media-player__unsupported" id="mp-unsupported" hidden>Ce média n'a ni fichier local ni lien à lire.</p>
  `;

  const mediaEl = wrap.querySelector(isVideo ? '.media-player__video' : '.media-player__audio');
  const loadingEl = wrap.querySelector('#mp-loading');
  const playBtn = wrap.querySelector('#mp-play');
  const favBtn = wrap.querySelector('#mp-fav');
  const seekEl = wrap.querySelector('#mp-seek');
  const currentEl = wrap.querySelector('#mp-current');
  const durationEl = wrap.querySelector('#mp-duration');
  const volumeEl = wrap.querySelector('#mp-volume');
  const muteBtn = wrap.querySelector('#mp-mute');
  const fullscreenBtn = wrap.querySelector('#mp-fullscreen');
  const prevBtn = wrap.querySelector('#mp-prev');
  const nextBtn = wrap.querySelector('#mp-next');
  const unsupportedEl = wrap.querySelector('#mp-unsupported');

  let currentItem = item;
  let objectUrlToRevoke = null;
  let isSeeking = false;
  let lastVolume = 1;

  function setPlayIcon(playing) {
    playBtn.innerHTML = playing ? icons.pause : icons.play;
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Lecture');
  }

  function updateMediaSession(mItem) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: mItem.title || 'BOOST',
        artist: 'BOOST',
      });
      navigator.mediaSession.setActionHandler('play', () => mediaEl.play());
      navigator.mediaSession.setActionHandler('pause', () => mediaEl.pause());
      if (playlist) {
        navigator.mediaSession.setActionHandler('previoustrack', () => goRelative(-1));
        navigator.mediaSession.setActionHandler('nexttrack', () => goRelative(1));
      }
    } catch {
      // Media Session non supportée ou navigateur restrictif — silencieux, pas critique.
    }
  }

  async function loadItem(mItem) {
    currentItem = mItem;
    loadingEl.style.display = 'flex';
    unsupportedEl.hidden = true;
    favBtn.innerHTML = mItem.favorite ? icons.heartFill : icons.heart;
    wrap.querySelector('.media-player__title').textContent = mItem.title || 'Sans titre';

    if (objectUrlToRevoke) {
      URL.revokeObjectURL(objectUrlToRevoke);
      objectUrlToRevoke = null;
    }

    const resolved = await resolveSource(mItem);
    if (!resolved) {
      loadingEl.style.display = 'none';
      unsupportedEl.hidden = false;
      mediaEl.removeAttribute('src');
      return;
    }
    if (resolved.isObjectUrl) objectUrlToRevoke = resolved.src;
    mediaEl.src = resolved.src;
    updateMediaSession(mItem);
  }

  function goRelative(delta) {
    if (!playlist || !playlist.length) return;
    const idx = playlist.findIndex((p) => p.id === currentItem.id);
    const nextIdx = (idx + delta + playlist.length) % playlist.length;
    loadItem(playlist[nextIdx]);
  }

  mediaEl.addEventListener('loadedmetadata', () => {
    loadingEl.style.display = 'none';
    durationEl.textContent = fmtTime(mediaEl.duration);
    seekEl.max = String(Math.floor(mediaEl.duration) || 0);
  });

  mediaEl.addEventListener('timeupdate', () => {
    if (isSeeking) return;
    currentEl.textContent = fmtTime(mediaEl.currentTime);
    seekEl.value = String(Math.floor(mediaEl.currentTime));
  });

  mediaEl.addEventListener('play', () => setPlayIcon(true));
  mediaEl.addEventListener('pause', () => setPlayIcon(false));
  mediaEl.addEventListener('ended', () => {
    setPlayIcon(false);
    if (playlist && playlist.length > 1) {
      goRelative(1);
      // Laisse l'utilisateur relancer manuellement plutôt qu'auto-play enchaîné,
      // pour ne jamais surprendre avec du son qui démarre seul.
    }
  });
  mediaEl.addEventListener('error', () => {
    loadingEl.style.display = 'none';
    unsupportedEl.hidden = false;
    unsupportedEl.textContent = 'Lecture impossible pour ce fichier.';
  });

  playBtn.addEventListener('click', () => {
    if (mediaEl.paused) mediaEl.play().catch(() => {}); else mediaEl.pause();
  });

  seekEl.addEventListener('input', () => {
    isSeeking = true;
    currentEl.textContent = fmtTime(Number(seekEl.value));
  });
  seekEl.addEventListener('change', () => {
    mediaEl.currentTime = Number(seekEl.value);
    isSeeking = false;
  });

  volumeEl.addEventListener('input', () => {
    const v = Number(volumeEl.value) / 100;
    mediaEl.volume = v;
    lastVolume = v || lastVolume;
    muteBtn.innerHTML = v === 0 ? icons.volumeMute : icons.volume;
  });

  muteBtn.addEventListener('click', () => {
    if (mediaEl.volume > 0) {
      mediaEl.volume = 0;
      volumeEl.value = '0';
      muteBtn.innerHTML = icons.volumeMute;
    } else {
      mediaEl.volume = lastVolume || 1;
      volumeEl.value = String(Math.round((lastVolume || 1) * 100));
      muteBtn.innerHTML = icons.volume;
    }
  });

  favBtn.addEventListener('click', () => {
    store.toggleMediaFavorite(currentItem.id);
    const fresh = store.getMediaItem(currentItem.id);
    currentItem = fresh ?? currentItem;
    favBtn.innerHTML = currentItem.favorite ? icons.heartFill : icons.heart;
    onFavoriteChange?.(currentItem);
  });

  if (isVideo) {
    fullscreenBtn.addEventListener('click', () => {
      if (mediaEl.requestFullscreen) mediaEl.requestFullscreen();
      else if (mediaEl.webkitEnterFullscreen) mediaEl.webkitEnterFullscreen(); // iOS Safari
    });
  }

  prevBtn?.addEventListener('click', () => goRelative(-1));
  nextBtn?.addEventListener('click', () => goRelative(1));

  // Nettoyage de l'URL objet quand le lecteur quitte le DOM, pour ne pas
  // garder un Blob référencé indéfiniment.
  const observer = new MutationObserver(() => {
    if (!document.body.contains(wrap)) {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      mediaEl.pause();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  loadItem(item);

  return wrap;
}
