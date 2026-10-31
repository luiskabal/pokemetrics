<script lang="ts">
  import { captureProfile, captureProfiles, captureSaveFailed, selectCaptureProfile, newCaptureProfile, renameCaptureProfile, parseCaptureBackup, importCaptureProfiles } from '../lib/captures';
  import type { CaptureStatus } from '../lib/captures';
  import { edition } from '../lib/generation-state';
  import type { Pokemon } from '../lib/model';
  import { downloadFile } from '../lib/export';
  import { t } from '../lib/i18n';
  let { pokemon, filter, onFilter }: { pokemon: Pokemon[]; filter: CaptureStatus | 'all'; onFilter: (value: CaptureStatus | 'all') => void } = $props();
  let error = $state(false); let input: HTMLInputElement;
  const profiles = $derived($captureProfiles.filter(profile => profile.game === $edition));
  const seen = $derived(pokemon.filter(pokemon => $captureProfile?.pokemon[pokemon.id]).length);
  const caught = $derived(pokemon.filter(pokemon => $captureProfile?.pokemon[pokemon.id] === 'caught').length);
  function backup() { downloadFile(new Blob([JSON.stringify({ format: 'pokemetrics-captures', version: 1, profiles: $captureProfiles })], { type: 'application/json' }), 'pokemetrics-captures.json'); }
  async function restore(event: Event) { const control = event.currentTarget as HTMLInputElement; const file = control.files?.[0]; control.value = ''; if (!file) return; try { if (file.size > 2_000_000) throw Error('Too large'); importCaptureProfiles(parseCaptureBackup(await file.text())); error = false; } catch { error = true; } }
</script>
<details class="capture-tracker"><summary>{$t('captureTitle')} · {$t('captureSummary', { caught, seen, total: pokemon.length })}</summary><p class="stat-note">{$t('captureHelp')}</p><div class="capture-controls"><label>{$t('captureProfile')}<select class="select" id="capture-profile" value={$captureProfile?.id ?? ''} onchange={event => selectCaptureProfile(event.currentTarget.value)}><option value="" disabled>{$t('chooseProfile')}</option>{#each profiles as profile}<option value={profile.id}>{profile.name}</option>{/each}</select></label><label>{$t('profileName')}<input class="input" id="capture-profile-name" maxlength="64" value={$captureProfile?.name ?? ''} disabled={!$captureProfile} onchange={event => renameCaptureProfile(event.currentTarget.value.trim() || $t('captureDefault'))}/></label><button id="new-capture-profile" class="btn btn-sm" onclick={() => newCaptureProfile($t('captureDefault'))}>{$t('newProfile')}</button></div><div class="list-actions"><button class="btn btn-sm" id="export-captures" onclick={backup}>{$t('captureExport')}</button><button class="btn btn-sm" id="import-captures" onclick={() => input.click()}>{$t('captureImport')}</button><input class="sr-only" tabindex="-1" bind:this={input} type="file" accept=".json" aria-label={$t('captureImport')} onchange={restore}/></div>{#if error}<p role="alert">{$t('captureInvalid')}</p>{/if}{#if $captureSaveFailed}<p role="status">{$t('captureStorageError')}</p>{/if}</details>
<div class="capture-filter"><label for="capture-filter">{$t('captureFilter')}</label><select class="select" id="capture-filter" value={filter} onchange={event => onFilter(event.currentTarget.value as CaptureStatus | 'all')}><option value="all">{$t('all')}</option>{#each ['pending', 'seen', 'caught'] as status}<option value={status}>{$t(status as CaptureStatus)}</option>{/each}</select></div>
