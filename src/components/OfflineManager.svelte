<script lang="ts">
  import { onMount } from 'svelte';
  import { OFFLINE_CACHE, offlineUrls, downloadOffline, saveOfflinePack, offlineStorage } from '../lib/offline';
  import type { OfflinePack } from '../lib/offline';
  import type { Pokemon } from '../lib/model';
  import type { IllustrationId, ImageSet } from '../lib/metadata';
  import type { UniverseScope } from '../lib/universe';
  import { generationInfo } from '../lib/generations';
  import { language, t } from '../lib/i18n';
  import { imageName, localizedName, LOCALES } from '../lib/localization';
  interface InstallPrompt extends Event { prompt(): Promise<{ outcome: string }> }
  let { pokemon, era, scope, game, dex, illustration, imageSet }: { dex: number | null; pokemon: Pokemon[]; era: number; scope: UniverseScope; game: string; illustration: IllustrationId; imageSet: ImageSet } = $props();
  let ready = $state(false); let updateWaiting = $state(false); let prompt = $state.raw<InstallPrompt | null>(null); let busy = $state(false); let failed = $state(false); let completed = $state(false); let moves = $state(false); let player = $state(false); let done = $state(0); let total = $state(0); let bytes = $state(0); let packs = $state<OfflinePack[]>([]); let controller: AbortController | null = null;
  async function refreshStorage() { const data = await offlineStorage(); bytes = data.bytes; packs = data.packs; }
  onMount(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !('caches' in window)) return;
    const install = (event: Event) => { event.preventDefault(); prompt = event as InstallPrompt; }; const installed = () => prompt = null;
    window.addEventListener('beforeinstallprompt', install); window.addEventListener('appinstalled', installed);
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(async registration => { updateWaiting = !!registration.waiting; registration.addEventListener('updatefound', () => { const worker = registration.installing; worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) updateWaiting = true; }); }); await navigator.serviceWorker.ready; ready = true; await refreshStorage(); }).catch(() => failed = true);
    return () => { controller?.abort(); window.removeEventListener('beforeinstallprompt', install); window.removeEventListener('appinstalled', installed); };
  });
  async function download() {
    if (busy) return; const list = pokemon; const selectedEra = era; const selectedScope = scope; const art = illustration; const images = imageSet; const includeMoves = moves; const includePlayer = player;
    const label = `${localizedName(generationInfo(era).names, $language, '')} · ${imageName(game, $language)} · ${imageName(illustration, $language)} · ${list.length}`;
    const id = `${era}-${scope}-${game}-${dex ?? 0}-${illustration.replace(':', '-')}-${imageSet}-${includeMoves}-${includePlayer}-${list[0]?.id}-${list.length}`;
    busy = true; failed = false; completed = false; done = 0; total = 0; const task = new AbortController(); controller = task;
    try { const urls = await offlineUrls(list, selectedEra, selectedScope, art, images, includeMoves, includePlayer, task.signal); await downloadOffline(urls, task.signal, (count, size) => { done = count; total = size; }); await saveOfflinePack({ id, label, savedAt: Date.now(), count: list.length }); completed = true; }
    catch { if (!task.signal.aborted) failed = true; }
    finally { task.abort(); busy = false; await refreshStorage().catch(() => failed = true); }
  }
  async function clear() { if (!confirm($t('offlineClearConfirm'))) return; try { await caches.delete(OFFLINE_CACHE); completed = false; await refreshStorage(); } catch { failed = true; } }
</script>
<details class="offline-tools preferences-panel"><summary>{$t('offlineTitle')}{#if packs.length}<small>{packs.length} · {(bytes/1048576).toFixed(1)} MB</small>{/if}</summary><div class="offline-content"><p>{$t('offlineHelp')}</p>{#if prompt}<button class="btn btn-sm" id="install-app" onclick={async () => { await prompt!.prompt(); prompt = null; }}>{$t('installApp')}</button>{:else}<p class="stat-note">{$t('installHelp')}</p>{/if}{#if updateWaiting}<p role="status">{$t('offlineUpdateWaiting')}</p>{/if}<label><input type="checkbox" bind:checked={moves} disabled={busy}/> {$t('offlineMoves')}</label><label><input type="checkbox" bind:checked={player} disabled={busy}/> {$t('offlinePlayer')}</label><div class="list-actions"><button class="btn btn-sm" id="download-offline" disabled={!ready || busy || !pokemon.length} onclick={download}>{$t('offlineDownload', { count: pokemon.length })}</button>{#if busy}<button class="btn btn-sm" id="cancel-offline" onclick={() => controller?.abort()}>{$t('cancel')}</button>{/if}<button class="btn btn-sm" id="clear-offline" disabled={!ready || busy || !bytes} onclick={clear}>{$t('offlineClear')}</button></div>{#if busy}<progress class="progress" aria-label={$t('offlineDownloadProgress')} max={total || undefined} value={total ? done : undefined}></progress><p role="status">{done} / {total || '…'}</p>{/if}{#if completed}<p role="status" id="offline-complete">{$t('offlineComplete')}</p>{/if}{#if failed}<p role="alert">{$t('offlineFailed')}</p>{/if}<p class="stat-note">{$t('offlineStorage', { size: (bytes/1048576).toFixed(1) })}</p><ul>{#each packs as pack}<li>{pack.label} · <time datetime={new Date(pack.savedAt).toISOString()}>{new Date(pack.savedAt).toLocaleDateString(LOCALES[$language])}</time></li>{/each}</ul></div></details>
