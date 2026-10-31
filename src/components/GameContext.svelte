<script lang="ts">
  import { generation, edition } from '../lib/generation-state';
  import { generationInfo } from '../lib/generations';
  import { regionalDexes } from '../lib/universe';
  import type { RegionalDex, UniverseScope } from '../lib/universe';
  import { localizedName, imageName } from '../lib/localization';
  import { language, t } from '../lib/i18n';
  let { scope, dex, onScope, onEdition, onDex }: { scope: UniverseScope; dex: number | null; onScope: (scope: UniverseScope) => void; onEdition: (game: string) => void; onDex: (id: number) => void } = $props();
  let choices = $state.raw<RegionalDex[]>([]); let failed = $state(false); let loading = $state(false);
  $effect(() => { const game = $edition; if (scope !== 'regional') return; let live = true; choices = []; failed = false; loading = true; void regionalDexes(game).then(value => { if (live) choices = value; }).catch(() => { if (live) failed = true; }).finally(() => { if (live) loading = false; }); return () => { live = false; }; });
</script>
<div class="game-context-controls">
  <label>{$t('contextGame')}<select class="select" id="context-game" value={$edition} onchange={event => onEdition(event.currentTarget.value)}>{#each generationInfo($generation).games as game}<option value={game.id}>{imageName(game.id, $language)}</option>{/each}</select></label>
  <label>{$t('universeScope')}<select class="select" id="universe-scope" value={scope} onchange={event => onScope(event.currentTarget.value as UniverseScope)}><option value="introduced">{$t('scopeIntroduced')}</option><option value="national">{$t('scopeNational')}</option><option value="regional">{$t('scopeRegional')}</option></select></label>
  {#if scope === 'regional'}<label>{$t('regionalDex')}<select class="select" id="regional-dex" disabled={loading || !choices.length} value={dex ?? choices[0]?.id} onchange={event => onDex(Number(event.currentTarget.value))}>{#each choices as choice}<option value={choice.id}>{localizedName(choice.names, $language, choice.name)} · {choice.entries.length}</option>{/each}</select></label>{#if loading}<p class="stat-note">{$t('infoLoading')}</p>{:else if failed || !choices.length}<p class="stat-note">{$t('noRegionalDex')}</p>{/if}{/if}
</div>
<p class="list-help">{$t('scopeHelp')}</p>
