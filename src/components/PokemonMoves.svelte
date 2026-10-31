<script lang="ts">
  import { generation, edition } from '../lib/generation-state';
  import { generationInfo } from '../lib/generations';
  import { imageName } from '../lib/localization';
  import { language, t } from '../lib/i18n';
  import { learnedMoveName, loadLearnset, moveGroup } from '../lib/moves';
  import type { Learnset } from '../lib/moves';
  let { id }: { id: number } = $props();
  let data = $state.raw<Learnset | null>(null);
  let localGame = $state<string | null>(null);
  const game = $derived(localGame ?? $edition);
  let failed = $state(false); let retry = $state(0); let limit = $state(20);
  const moves = $derived(data?.games[moveGroup(game)] ?? []);
  $effect.pre(() => { game; limit = 20; });
  $effect(() => { retry; const controller = new AbortController(); data = null; failed = false; void loadLearnset(id, controller.signal).then(value => { if (!controller.signal.aborted) data = value; }).catch(() => { if (!controller.signal.aborted) failed = true; }); return () => controller.abort(); });
</script>
<label class="data-view-label" for="moves-game">{$t('movesGame')}</label><select class="select" id="moves-game" value={game} onchange={event => localGame = event.currentTarget.value}>{#each generationInfo($generation).games as game}<option value={game.id}>{imageName(game.id, $language)}</option>{/each}</select>
<p class="stat-note">{$t('levelMovesHelp')}</p>
{#if failed}<p role="status">{$t('infoError')}</p><button class="btn btn-sm" onclick={() => retry++}>{$t('retry')}</button>
{:else if data}
  {#if moves.length}<table class="comparison-table moves-table"><thead><tr><th>{$t('level')}</th><th>{$t('move')}</th></tr></thead><tbody>{#each moves.slice(0, limit) as move (`${move.id}-${move.level}`)}<tr data-move={move.id}><td>{move.level}</td><td>{learnedMoveName(move, $language)}</td></tr>{/each}</tbody></table>{#if limit < moves.length}<button class="btn btn-sm" onclick={() => limit += 20}>{$t('showMorePokemon', { count: Math.min(20, moves.length - limit) })}</button>{/if}
  {:else}<p class="description">{$t('noGameMoves')}</p>{/if}
{:else}<p role="status">{$t('infoLoading')}</p>{/if}
