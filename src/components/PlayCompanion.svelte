<script lang="ts">
  import { generation, edition } from '../lib/generation-state';
  import { GENERATIONS } from '../lib/generations';
  import { loadUniverse } from '../lib/universe';
  import { filterAndSortPokemon } from '../lib/analysis';
  import type { Pokemon } from '../lib/model';
  import { language, t } from '../lib/i18n';
  import { imageName, pokemonName, localizedName } from '../lib/localization';
  import PokemonImage from './PokemonImage.svelte';
  import TypeBadge from './TypeBadge.svelte';
  let { onEdition, onInspect }: { onEdition: (game: string) => void; onInspect: (pokemon: Pokemon) => void } = $props();
  let pool = $state.raw<Pokemon[]>([]); let query = $state(''); let loading = $state(true); let failed = $state(false); let retry = $state(0);
  const results = $derived(filterAndSortPokemon(pool, query, 'number-asc', $language, 'legacy', $generation).slice(0, 12));
  $effect(() => { retry; const era = $generation; const game = $edition; const controller = new AbortController(); pool = []; loading = true; failed = false; void loadUniverse(era, 'national', game, null, controller.signal).then(data => { if (!controller.signal.aborted) pool = data.pokemon; }).catch(() => { if (!controller.signal.aborted) failed = true; }).finally(() => { if (!controller.signal.aborted) loading = false; }); return () => controller.abort(); });
</script>
<div class="play-companion-content"><p class="stat-note">{$t('companionHelp')}</p><label for="companion-game">{$t('contextGame')}</label><select id="companion-game" class="select" value={$edition} onchange={event => onEdition(event.currentTarget.value)}>{#each GENERATIONS as era}<optgroup label={localizedName(era.names, $language, era.roman)}>{#each era.games as game}<option value={game.id}>{imageName(game.id, $language)}</option>{/each}</optgroup>{/each}</select><label for="companion-search">{$t('search')}</label><input id="companion-search" class="input" bind:value={query} placeholder={$t('searchPlaceholder')}/>
  {#if loading}<p role="status">{$t('infoLoading')}</p>{:else if failed}<p role="status">{$t('infoError')}</p><button class="btn btn-sm" onclick={() => retry++}>{$t('retry')}</button>{:else}<ul class="companion-results">{#each results as pokemon}<li><button class="companion-pokemon" data-companion-pokemon={pokemon.id} onclick={() => onInspect(pokemon)}><PokemonImage {pokemon} illustration={`game:${$edition}`}/><span><strong>#{pokemon.id} {pokemonName(pokemon.name, $language)}</strong><span class="pokemon-types">{#each pokemon.legacyTypes as type}<TypeBadge {type}/>{/each}</span></span></button></li>{:else}<li>{$t('noMatches')}</li>{/each}</ul>{/if}
</div>
