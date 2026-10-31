// SPDX-License-Identifier: GPL-3.0-or-later
import { MAX_STATE_BYTES, SAVE_ENGINE } from './gameboy';
import type { GameSnapshot } from './gameboy';
export interface GameSlot extends GameSnapshot { slot: number; name: string; thumbnail: string | null }

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pokemetrics-play-v1', 2);
    request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains('states')) db.createObjectStore('states', { keyPath: 'romHash' }); db.createObjectStore('slots', { keyPath: ['romHash', 'slot'] }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(Error('Storage blocked'));
  });
}

export async function loadGameSlots(romHash: string): Promise<GameSlot[]> {
  const db = await database();
  try { return await new Promise((resolve, reject) => { const request = db.transaction('slots').objectStore('slots').getAll(IDBKeyRange.bound([romHash, 1], [romHash, 3])); request.onsuccess = () => resolve(request.result.filter(slot => slot.engine === SAVE_ENGINE)); request.onerror = () => reject(request.error); }); } finally { db.close(); }
}
export async function saveGameSlot(slot: GameSlot): Promise<void> {
  const db = await database();
  try { await new Promise<void>((resolve, reject) => { const transaction = db.transaction('slots', 'readwrite'); transaction.objectStore('slots').put(slot); transaction.oncomplete = () => resolve(); transaction.onabort = () => reject(transaction.error); transaction.onerror = () => reject(transaction.error); }); } finally { db.close(); }
}

export async function loadGameSnapshot(romHash: string): Promise<GameSnapshot | null> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('states').objectStore('states').get(romHash);
      request.onsuccess = () => {
        const data = request.result;
        if (!data || data.romHash !== romHash || data.engine !== SAVE_ENGINE || !Number.isSafeInteger(data.savedAt) || data.savedAt <= 0 || !(data.state instanceof Uint8Array) || !data.state.length || data.state.length > MAX_STATE_BYTES) resolve(null);
        else resolve(data);
      };
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

export async function saveGameSnapshot(snapshot: GameSnapshot): Promise<void> {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('states', 'readwrite');
      transaction.objectStore('states').put(snapshot);
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally { db.close(); }
}
