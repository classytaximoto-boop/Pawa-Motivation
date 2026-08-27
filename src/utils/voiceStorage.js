/**
 * Stockage des enregistrements vocaux (« MY OWN MOTIVATION »).
 *
 * Pourquoi pas le store principal (localStorage) ? Un Blob audio encodé en
 * base64 peut vite peser plusieurs centaines de Ko à quelques Mo, et
 * localStorage plafonne généralement à 5-10 Mo pour tout le domaine —
 * partagé avec le reste des données BOOST. IndexedDB stocke des Blob natifs
 * (pas de base64, pas de gonflement ~33%) avec un quota bien plus large,
 * et reste 100% offline comme le reste de l'app.
 *
 * Les métadonnées (nom, durée, date) ne sont volontairement pas dupliquées
 * ici : tout — y compris le Blob — vit dans un seul enregistrement par voix,
 * ce qui simplifie l'export/suppression et évite deux sources de vérité.
 */

const DB_NAME = 'boost-voice';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

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
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function uid() {
  return `vr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Enregistre un nouveau blob vocal. Renvoie l'enregistrement complet créé. */
export async function saveRecording({ name, blob, duration }) {
  const db = await openDb();
  const record = {
    id: uid(),
    name: name?.trim() || 'Enregistrement sans nom',
    blob,
    duration: duration || 0,
    createdAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
}

export async function renameRecording(id, name) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result;
      if (!record) return resolve(null);
      record.name = name?.trim() || record.name;
      store.put(record);
    };
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteRecording(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/** Liste tous les enregistrements, du plus récent au plus ancien. */
export async function listRecordings() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const rows = req.result || [];
      rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getRecording(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/** Renvoie un enregistrement au hasard (utilisé par Boost Me). null si aucun. */
export async function getRandomRecording() {
  const all = await listRecordings();
  if (!all.length) return null;
  return all[Math.floor(Math.random() * all.length)];
}
