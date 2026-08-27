/**
 * Stockage des fichiers média locaux (audio/vidéo importés par l'utilisateur).
 *
 * Même raisonnement que voiceStorage.js : un fichier audio/vidéo peut peser
 * plusieurs dizaines de Mo, largement au-delà de ce que localStorage peut
 * raisonnablement contenir. IndexedDB stocke le Blob natif avec un quota
 * bien plus large, 100% offline.
 *
 * Le MediaItem dans le store principal ne garde qu'une référence légère
 * (mediaFileId) vers l'enregistrement ici — jamais le Blob lui-même.
 */

const DB_NAME = 'boost-media-files';
const DB_VERSION = 1;
const STORE_NAME = 'files';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB non supporté sur cet appareil.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function uid() {
  return `mf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Enregistre un fichier local (File/Blob). Renvoie { id, name, mimeType, size, createdAt }. */
export async function saveMediaFile(file) {
  const db = await openDb();
  const record = {
    id: uid(),
    name: file.name || 'Fichier local',
    mimeType: file.type || '',
    size: file.size || 0,
    blob: file,
    createdAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve({
      id: record.id, name: record.name, mimeType: record.mimeType, size: record.size, createdAt: record.createdAt,
    });
    tx.onerror = () => reject(tx.error);
  });
}

/** Renvoie l'enregistrement complet (avec le Blob) ou null. */
export async function getMediaFile(id) {
  if (!id) return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteMediaFile(id) {
  if (!id) return true;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
