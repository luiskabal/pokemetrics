// SPDX-License-Identifier: GPL-3.0-or-later
export const MAX_ROM_BYTES = 8 * 1024 * 1024;
export const MAX_STATE_BYTES = 4 * 1024 * 1024;
export const SAVE_ENGINE = 'emulatorjs-4.2.3-gambatte-2.0.2';
export interface GameRom { hash: string; title: string; filename: string; bytes: ArrayBuffer }
export interface GameSnapshot { romHash: string; engine: typeof SAVE_ENGINE; savedAt: number; state: Uint8Array }

export function romTitle(bytes: Uint8Array): string {
  if (bytes.length < 32768 || bytes.length > MAX_ROM_BYTES || bytes.length % 16384 !== 0) throw Error('playInvalidRom');
  let checksum = 0;
  for (let i = 0x134; i <= 0x14c; i++) checksum = (checksum - bytes[i] - 1) & 255;
  if (checksum !== bytes[0x14d]) throw Error('playInvalidRom');
  const title = bytes.subarray(0x134, bytes[0x143] & 0x80 ? 0x13f : 0x144);
  return String.fromCharCode(...title).split('\0')[0].replace(/[^\x20-\x7e]/g, '').trim() || 'Game Boy';
}

export async function sha256(bytes: ArrayBuffer | Uint8Array): Promise<string> {
  const data = bytes instanceof Uint8Array ? new Uint8Array(bytes).buffer : bytes;
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function readGameRom(file: File): Promise<GameRom> {
  if (!/\.(gb|gbc)$/i.test(file.name) || file.size > MAX_ROM_BYTES) throw Error('playInvalidRom');
  const bytes = await file.arrayBuffer();
  const title = romTitle(new Uint8Array(bytes));
  return { bytes, title, filename: file.name, hash: await sha256(bytes) };
}

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(binary);
}

export async function exportGameBackup(snapshot: GameSnapshot): Promise<string> {
  return JSON.stringify({ format: 'pokemetrics-save', version: 1, ...snapshot, state: base64(snapshot.state), checksum: await sha256(snapshot.state) });
}

export async function readGameBackup(text: string, romHash: string): Promise<GameSnapshot> {
  if (text.length > MAX_STATE_BYTES * 1.5) throw Error('playInvalidBackup');
  let data;
  try { data = JSON.parse(text); } catch { throw Error('playInvalidBackup'); }
  if (!data || data.format !== 'pokemetrics-save' || data.version !== 1 || data.engine !== SAVE_ENGINE || !Number.isSafeInteger(data.savedAt) || data.savedAt <= 0 || typeof data.state !== 'string' || typeof data.checksum !== 'string') throw Error('playInvalidBackup');
  if (data.romHash !== romHash) throw Error('playWrongGame');
  let state;
  try { state = Uint8Array.from(atob(data.state), character => character.charCodeAt(0)); } catch { throw Error('playInvalidBackup'); }
  if (!state.length || state.length > MAX_STATE_BYTES || await sha256(state) !== data.checksum) throw Error('playInvalidBackup');
  return { romHash, engine: SAVE_ENGINE, savedAt: data.savedAt, state };
}

export const GAME_CHANNEL = 'pokemetrics-game-v1';
export type PlayerCommand = 'pause' | 'resume' | 'save' | 'export' | 'restart';
export interface PlayerMessage { channel: typeof GAME_CHANNEL; session: string; type: string; requestId?: number; ok?: boolean; state?: Uint8Array; savedAt?: number; thumbnail?: string | null }
