// SPDX-License-Identifier: GPL-3.0-or-later
import { GAME_CHANNEL, SAVE_ENGINE } from './lib/gameboy';
import type { PlayerMessage } from './lib/gameboy';
import { loadGameSnapshot, saveGameSnapshot } from './lib/game-storage';

// shortcut: este puente usa la API de EmulatorJS 4.2.3; verificar sus métodos al actualizar el núcleo.
interface Emulator {
  started: boolean; paused: boolean; failedToStart: boolean; pause(): void; play(): void; setVolume(value: number): void;
  on(event: string, callback: () => void): void;
  gameManager: { restart(): void; getState(): Uint8Array; getFrameNum(): number; loadState(state: Uint8Array): void; saveSaveFiles(): void; functions: { simulateInput(player: number, button: number, value: number): void }; FS: { syncfs(populate: boolean, callback: (error: unknown) => void): void } };
}
const runtime = window as unknown as Record<string, unknown> & { EJS_emulator?: Emulator };
const origin = location.origin;
const session = new URL(location.href).searchParams.get('session') ?? '';
let romHash = '';
let active = true;
let started = false;
let restoredState: { state: Uint8Array; frame: number } | null = null;
let saveQueue: Promise<unknown> = Promise.resolve();
const status = document.getElementById('status')!;
const send = (type: string, values: Partial<PlayerMessage> = {}) => parent.postMessage({ channel: GAME_CHANNEL, session, type, ...values }, origin);

function restoreState(state: Uint8Array) {
  const manager = runtime.EJS_emulator!.gameManager;
  restoredState = { state, frame: manager.getFrameNum() };
  manager.loadState(state);
}
function currentState(): Uint8Array {
  const manager = runtime.EJS_emulator!.gameManager;
  // El núcleo encola la carga: hasta que avance un frame, la copia restaurada es el estado que debemos conservar.
  if (restoredState && manager.getFrameNum() !== restoredState.frame) restoredState = null;
  return restoredState?.state ?? manager.getState();
}

function pause() {
  if (!started) return;
  const emulator = runtime.EJS_emulator!;
  emulator.pause();
  for (let button = 0; button < 16; button++) emulator.gameManager.functions.simulateInput(0, button, 0);
  send('paused');
}

function checkpoint(): Promise<boolean> {
  if (!started) return Promise.resolve(true);
  const state = currentState();
  const savedAt = Date.now();
  const task = saveQueue.catch(() => {}).then(async () => {
    try {
      const manager = runtime.EJS_emulator!.gameManager;
      manager.saveSaveFiles();
      await new Promise<void>((resolve, reject) => manager.FS.syncfs(false, error => error ? reject(error) : resolve()));
      await saveGameSnapshot({ romHash, engine: SAVE_ENGINE, state, savedAt });
      send('saved', { savedAt }); return true;
    } catch { send('save-error'); return false; }
  });
  saveQueue = task;
  return task;
}

async function initialize(data: { bytes: ArrayBuffer; romHash: string; locale: string; startLabel: string; color: string; volume: number; active: boolean }) {
  if (romHash || !(data.bytes instanceof ArrayBuffer) || !/^[a-f0-9]{64}$/.test(data.romHash)) return;
  romHash = data.romHash; active = data.active;
  document.documentElement.lang = data.locale === 'ja-JA' ? 'ja' : data.locale === 'es-ES' ? 'es' : 'en';
  runtime.EJS_player = '#game';
  runtime.EJS_core = 'gambatte';
  runtime.EJS_gameUrl = new File([data.bytes], romHash + '.gb');
  runtime.EJS_gameName = romHash;
  runtime.EJS_pathtodata = new URL('emulator/vendor/4.2.3/', location.href).href;
  runtime.EJS_language = ['en-US', 'es-ES', 'ja-JA'].includes(data.locale) ? data.locale : 'en-US';
  runtime.EJS_disableAutoLang = true;
  runtime.EJS_startButtonName = data.startLabel;
  runtime.EJS_color = data.color;
  runtime.EJS_volume = data.volume;
  runtime.EJS_threads = false;
  runtime.EJS_disableDatabases = true;
  runtime.EJS_disableLocalStorage = true;
  runtime.EJS_defaultOptions = { 'save-save-interval': 0, 'save-state-location': 'file', 'virtual-gamepad': matchMedia('(any-pointer: coarse)').matches ? 'enabled' : 'disabled', 'shader': 'disabled' };
  const keys: Record<number, number> = { 0: 90, 2: 16, 3: 13, 4: 38, 5: 40, 6: 37, 7: 39, 8: 88 };
  runtime.EJS_defaultControls = { 0: Object.fromEntries(Array.from({ length: 32 }, (_, index) => [index, { value: keys[index] ?? '' }])), 1: {}, 2: {}, 3: {} };
  runtime.EJS_VirtualGamepadSettings = [
    { type: 'button', text: 'A', id: 'a', location: 'right', left: 81, top: 40, bold: true, input_value: 8 },
    { type: 'button', text: 'B', id: 'b', location: 'right', left: 10, top: 70, bold: true, input_value: 0 },
    { type: 'dpad', id: 'dpad', location: 'left', left: '50%', top: '50%', inputValues: [4, 5, 6, 7] },
    { type: 'button', text: 'Start', id: 'start', location: 'center', left: 60, fontSize: 15, block: true, input_value: 3 },
    { type: 'button', text: 'Select', id: 'select', location: 'center', left: -5, fontSize: 15, block: true, input_value: 2 },
  ];
  runtime.EJS_Buttons = { rightClick: false, contextMenu: false, cheat: false, netplay: false, saveState: false, loadState: false, saveSavFiles: false, loadSavFiles: false, cacheManager: false, screenRecord: false, quickSave: false, quickLoad: false };
  runtime.EJS_onGameStart = async () => {
    started = true;
    try { const saved = await loadGameSnapshot(romHash); if (saved) { restoreState(saved.state); send('restored', { savedAt: saved.savedAt }); } }
    catch { send('save-error'); }
    if (!active || document.hidden) pause();
    send('started', { ok: !runtime.EJS_emulator!.paused });
    setInterval(() => { if (active && !document.hidden && !runtime.EJS_emulator!.paused) void checkpoint(); }, 15_000);
  };
  runtime.EJS_ready = () => {
    const button = document.querySelector<HTMLElement>('.ejs_start_button')!;
    button.setAttribute('role', 'button'); button.tabIndex = 0;
    button.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); button.click(); } });
    // Evita que el clic sintético móvil cambie de destino al recolocarse los controles.
    button.addEventListener('touchend', event => { event.preventDefault(); button.click(); });
    runtime.EJS_emulator!.on('start-clicked', () => send('loading'));
    status.hidden = true; send('ready');
  };
  const script = document.createElement('script');
  script.src = new URL('emulator/vendor/4.2.3/loader.js', location.href).href;
  script.onerror = () => send('error');
  document.head.append(script);
}

addEventListener('message', async event => {
  if (event.source !== parent || event.origin !== origin || event.data?.channel !== GAME_CHANNEL || event.data.session !== session) return;
  const data = event.data;
  try {
    if (data.type === 'initialize') { await initialize(data); return; }
    if (data.type === 'visibility') { active = data.active === true; if (!active) { pause(); await checkpoint(); } return; }
    if (!started) return;
    const emulator = runtime.EJS_emulator!;
    if (data.type === 'pause') { pause(); await checkpoint(); }
    else if (data.type === 'resume' && active) { emulator.play(); send('playing'); }
    else if (data.type === 'volume' && Number.isFinite(data.volume)) emulator.setVolume(Math.max(0, Math.min(1, data.volume)));
    else if (data.type === 'save') { const ok = await checkpoint(); send('response', { requestId: data.requestId, ok }); }
    else if (data.type === 'export') send('response', { requestId: data.requestId, ok: true, state: currentState(), savedAt: Date.now() });
    else if (data.type === 'restore' && data.state instanceof Uint8Array) { pause(); restoreState(data.state); const ok = await checkpoint(); send('response', { requestId: data.requestId, ok }); }
    else if (data.type === 'restart') { pause(); restoredState = null; emulator.gameManager.restart(); send('paused'); }
  } catch { send('error'); if (Number.isInteger(data.requestId)) send('response', { requestId: data.requestId, ok: false }); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); void checkpoint(); } });
addEventListener('pagehide', () => { pause(); void checkpoint(); });
addEventListener('error', () => { pause(); send('error'); });
addEventListener('unhandledrejection', () => { pause(); send('error'); });
if (parent !== window && session) send('boot');
