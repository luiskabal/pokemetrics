<script lang="ts">
  import { onMount } from 'svelte';
  import { GAME_CHANNEL, MAX_STATE_BYTES, SAVE_ENGINE, exportGameBackup, readGameBackup, readGameRom } from '../lib/gameboy';
  import type { GameRom, PlayerCommand, PlayerMessage } from '../lib/gameboy';
  import { downloadFile } from '../lib/export';
  import { language, t } from '../lib/i18n';
  import { LOCALES } from '../lib/localization';
  import type { MessageKey } from '../lib/localization';
  let { active }: { active: boolean } = $props();
  let rom = $state.raw<GameRom | null>(null);
  let session = $state('');
  let phase = $state<'empty' | 'loading' | 'ready' | 'playing' | 'paused' | 'error'>('empty');
  let started = $state(false);
  let busy = $state(false);
  let error = $state<MessageKey | null>(null);
  let storageFailed = $state(false);
  let savedAt = $state<number | null>(null);
  let volume = $state(.5);
  let frame = $state<HTMLIFrameElement>();
  let screen = $state<HTMLDivElement>();
  let restoreInput = $state<HTMLInputElement>();
  let requestId = 0;
  let watchdog: ReturnType<typeof setTimeout>;
  const pending = new Map<number, { resolve: (data: PlayerMessage) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  const knownErrors = new Set(['playInvalidRom', 'playInvalidBackup', 'playWrongGame']);

  function send(type: string, data: Record<string, unknown> = {}) {
    frame?.contentWindow?.postMessage({ channel: GAME_CHANNEL, session, type, ...data }, location.origin);
  }
  function command(type: PlayerCommand | 'restore', data: Record<string, unknown> = {}): Promise<PlayerMessage> {
    const id = ++requestId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(Error('playOperationError')); }, 12_000);
      pending.set(id, { resolve, reject, timer });
      send(type, { ...data, requestId: id });
    });
  }
  function showError(value: unknown) { error = value instanceof Error && knownErrors.has(value.message) ? value.message as MessageKey : 'playOperationError'; }

  async function chooseRom(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0]; input.value = '';
    if (!file || busy) return;
    busy = true; error = null;
    try {
      const next = await readGameRom(file);
      if (started) {
        send('pause');
        const saved = await command('save');
        if (!saved.ok && !confirm($t('playSwitchWarning'))) return;
      }
      rom = next; started = false; storageFailed = false; savedAt = null; phase = 'loading'; session = crypto.randomUUID();
      clearTimeout(watchdog);
      watchdog = setTimeout(() => { if (phase === 'loading') { phase = 'error'; error = 'playLoadError'; } }, 45_000);
    } catch (value) { showError(value); }
    finally { busy = false; }
  }

  async function save() {
    busy = true; error = null;
    try { const result = await command('save'); if (!result.ok) storageFailed = true; }
    catch (value) { showError(value); }
    finally { busy = false; }
  }
  async function exportBackup() {
    busy = true; error = null;
    try {
      const result = await command('export');
      if (!result.ok || !result.state || !rom) throw Error('playOperationError');
      const json = await exportGameBackup({ romHash: rom.hash, engine: SAVE_ENGINE, savedAt: result.savedAt!, state: result.state });
      downloadFile(new Blob([json], { type: 'application/json' }), `pokemetrics-${rom.title.replace(/[^a-z0-9-]/gi, '_')}-${rom.hash.slice(0, 12)}.pokemetrics-save.json`);
    } catch (value) { showError(value); }
    finally { busy = false; }
  }
  async function restoreBackup(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0]; input.value = '';
    if (!file || !rom || busy) return;
    busy = true; error = null;
    try {
      if (file.size > MAX_STATE_BYTES * 1.5) throw Error('playInvalidBackup');
      const snapshot = await readGameBackup(await file.text(), rom.hash);
      if (!confirm($t('playRestoreWarning'))) return;
      const result = await command('restore', { state: snapshot.state });
      if (!result.ok) storageFailed = true;
    } catch (value) { showError(value); }
    finally { busy = false; }
  }
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await screen!.requestFullscreen(); }
    catch { error = 'playFullscreenError'; }
  }

  $effect(() => { active; if (rom) send('visibility', { active }); });
  $effect(() => { volume; if (started) send('volume', { volume }); });
  onMount(() => {
    const receive = (event: MessageEvent) => {
      const data = event.data as PlayerMessage;
      if (event.origin !== location.origin || event.source !== frame?.contentWindow || data?.channel !== GAME_CHANNEL || data.session !== session) return;
      if (data.type === 'boot' && rom) {
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--browser-color').trim();
        send('initialize', { bytes: rom.bytes.slice(0), romHash: rom.hash, locale: $language === 'ja' ? 'ja-JA' : $language.startsWith('es') ? 'es-ES' : 'en-US', startLabel: $t('playStart'), color: accent, volume, active });
      } else if (data.type === 'ready') { clearTimeout(watchdog); phase = 'ready'; }
      else if (data.type === 'loading') { phase = 'loading'; clearTimeout(watchdog); watchdog = setTimeout(() => { phase = 'error'; error = 'playLoadError'; }, 45_000); }
      else if (data.type === 'started') { clearTimeout(watchdog); started = true; phase = data.ok ? 'playing' : 'paused'; }
      else if (data.type === 'playing') { phase = 'playing'; frame?.contentWindow?.focus(); }
      else if (data.type === 'paused') phase = 'paused';
      else if (data.type === 'saved' || data.type === 'restored') { savedAt = data.savedAt!; storageFailed = false; }
      else if (data.type === 'save-error') storageFailed = true;
      else if (data.type === 'error') { clearTimeout(watchdog); phase = 'error'; error = 'playLoadError'; }
      else if (data.type === 'response' && data.requestId !== undefined) {
        const request = pending.get(data.requestId);
        if (request) { clearTimeout(request.timer); pending.delete(data.requestId); request.resolve(data); }
      }
    };
    addEventListener('message', receive);
    return () => { removeEventListener('message', receive); clearTimeout(watchdog); for (const request of pending.values()) { clearTimeout(request.timer); request.reject(Error('playOperationError')); } };
  });
</script>

<section class="game-room" aria-labelledby="play-title">
  <div class="play-heading"><div><p class="play-eyebrow">GAME BOY / GAME BOY COLOR</p><h1 id="play-title">{$t('playTitle')}</h1><p class="description">{$t('playIntro')}</p></div><div class="edition-chips" aria-label={$t('playEditions')}><span style="--edition:#b94b4b">{$t('playRed')}</span><span style="--edition:#3e75b7">{$t('playBlue')}</span><span style="--edition:#b88b20">{$t('playYellow')}</span><span style="--edition:#3b8159">{$t('playGreen')}</span></div></div>
  <div class="card play-library"><label class="rom-label" for="rom-file">{$t(rom ? 'playChangeGame' : 'playLoadRom')}</label><input id="rom-file" class="file-input" type="file" accept=".gb,.gbc" disabled={busy} onchange={chooseRom} aria-describedby="rom-help"/><p class="list-help" id="rom-help">{$t('playRomHelp')}</p>{#if rom}<p class="rom-identity"><strong>{rom.title}</strong><span>{rom.filename}</span><small>SHA-256 · {rom.hash.slice(0, 12)}…</small></p>{/if}</div>
  {#if error}<p class="app-notice play-error" role="alert">{$t(error)}</p>{/if}
  {#if storageFailed}<p class="app-notice play-error" role="status">{$t('playStorageError')}</p>{/if}
  {#if rom}
    <div class="play-screen-shell" bind:this={screen}>
      <div class="play-controls" role="group" aria-label={$t('playControls')}>
        <button class="btn btn-sm" id="game-pause" type="button" disabled={!started || busy} onclick={() => send(phase === 'playing' ? 'pause' : 'resume')}>{$t(phase === 'playing' ? 'playPause' : 'playResume')}</button>
        <button class="btn btn-sm" id="game-save" type="button" disabled={!started || busy} onclick={save}>{$t('playSave')}</button>
        <button class="btn btn-sm" id="game-export" type="button" disabled={!started || busy} onclick={exportBackup}>{$t('playExport')}</button>
        <button class="btn btn-sm" id="game-import" type="button" disabled={!started || busy} onclick={() => restoreInput!.click()}>{$t('playImport')}</button>
        <input class="sr-only" tabindex="-1" aria-label={$t('playImport')} bind:this={restoreInput} type="file" accept=".json" onchange={restoreBackup}/>
        <button class="btn btn-sm" id="game-restart" type="button" disabled={!started || busy} onclick={() => { if (confirm($t('playRestartWarning'))) send('restart'); }}>{$t('playRestart')}</button>
        <button class="btn btn-sm" id="game-fullscreen" type="button" onclick={fullscreen}>{$t('playFullscreen')}</button>
        <label class="play-volume" for="game-volume">{$t('playVolume')}<input class="range range-xs" id="game-volume" type="range" min="0" max="1" step="0.05" bind:value={volume}/></label>
      </div>
      {#key session}<iframe class="game-frame" id="game-frame" bind:this={frame} src={`${import.meta.env.BASE_URL}emulator.html?session=${session}`} title={$t('playFrameTitle')} allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>{/key}
    </div>
    <p class="play-status" role="status">{$t(phase === 'loading' ? 'playLoading' : phase === 'ready' ? 'playReady' : phase === 'paused' ? 'playPaused' : phase === 'playing' ? 'playRunning' : 'playLoadError')}{#if savedAt} · {$t('playLastSave')} <time datetime={new Date(savedAt).toISOString()}>{new Date(savedAt).toLocaleString(LOCALES[$language])}</time>{/if}</p>
  {:else}<div class="play-empty"><div class="play-console" aria-hidden="true"><span>GAME BOY</span><svg viewBox="0 0 160 144" fill="none" stroke="currentColor" stroke-width="3"><path d="M50 45h60v54H50zM58 53h44v30H58zM61 91h9m20 0h5"/><path d="M30 72h12m76 0h12"/></svg><small>● ●</small></div><p>{$t('playEmpty')}</p></div>{/if}
  <div class="play-help"><h2>{$t('playControls')}</h2><p>{$t('playKeyboard')}</p><p>{$t('playSaveHelp')}</p><p>{$t('playLanguageHelp')}</p><p>{$t('playPrivacy')}</p><a href={`${import.meta.env.BASE_URL}emulator/licenses.html`} target="_blank" rel="noopener noreferrer">{$t('playLicenses')} ↗</a></div>
</section>
