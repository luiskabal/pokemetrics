<script lang="ts">
  import type { Pokemon, PokemonOrder, ViewMode } from '../lib/model';
  import { GEN_I_STATS, ILLUSTRATIONS, STATS } from '../lib/metadata';
  import type { IllustrationId } from '../lib/metadata';
  import { filterAndSortPokemon } from '../lib/analysis';
  import PokemonCard from './PokemonCard.svelte';
  import { language, t } from '../lib/i18n';
  import { imageName, statName } from '../lib/localization';
  let { pokemon, view, illustration, onIllustrationChange, hasSelection, onOpen, query = $bindable(''), segmentLabel, onClearSegment, compareIds, onCompare }: { pokemon: Pokemon[]; view: ViewMode; illustration: IllustrationId; onIllustrationChange: (value: IllustrationId) => void; hasSelection: boolean; onOpen: (pokemon: Pokemon) => void; query?: string; segmentLabel: string | null; onClearSegment: () => void; compareIds: number[]; onCompare: (id: number) => void } = $props();
  let order = $state<PokemonOrder>('number-asc');
  let searchInput: HTMLInputElement;
  const statOptions = $derived(view === 'legacy' ? GEN_I_STATS : STATS);
  const results = $derived(filterAndSortPokemon(pokemon, query, order, $language, view));
  $effect(() => {
    const field = order.slice(0, order.lastIndexOf('-'));
    if (!['number', 'name', 'height', 'weight', ...statOptions.map(stat => stat.id)].includes(field)) order = 'number-asc';
  });
</script>

<section class="pokemon-section" id="pokemon-section" aria-labelledby="pokemon-title">
  <div class="section-heading"><h2 id="pokemon-title">{$t('pokemonList')}</h2><span class="badge pokemon-count" id="pokemon-count" role="status" aria-live="polite">{hasSelection ? $t(query.trim() ? 'filteredCount' : 'pokemonCount', { count: results.length, total: pokemon.length }) : $t('noSelection')}</span></div>
  <p class="description">{$t(segmentLabel ? 'segmentHelp' : view === 'legacy' ? 'listLegacyHelp' : 'listHelp')}</p>
  {#if segmentLabel}<div class="segment-notice"><strong>{$t('segmentSelected', { label: segmentLabel })}</strong><button class="btn btn-sm" id="clear-segment" type="button" onclick={onClearSegment}>{$t('clearSegment')}</button></div>{/if}
  <div class="pokemon-toolbar">
    <div class="pokemon-search">
      <label for="pokemon-search">{$t('search')}</label>
      <div class="search-field">
        <input class="input" id="pokemon-search" type="search" bind:this={searchInput} bind:value={query} disabled={!hasSelection} placeholder={$t('searchPlaceholder')} aria-describedby="pokemon-search-help" autocomplete="off"/>
        {#if query}<button class="btn btn-ghost btn-sm" type="button" disabled={!hasSelection} onclick={() => { query = ''; searchInput.focus(); }} aria-label={$t('clearSearch')}>×</button>{/if}
      </div>
    </div>
    <div class="pokemon-order">
      <label for="pokemon-order">{$t('sort')}</label>
      <select class="select" id="pokemon-order" bind:value={order} disabled={!hasSelection}>
        <option value="number-asc">{$t('numberAsc')}</option>
        <option value="number-desc">{$t('numberDesc')}</option>
        <option value="name-asc">{$t('nameAsc')}</option>
        <option value="name-desc">{$t('nameDesc')}</option>
        {#each [...statOptions, { id: 'height' as const }, { id: 'weight' as const }] as field (field.id)}
          {#each ['desc', 'asc'] as direction}
            <option value={`${field.id}-${direction}`}>{$t('sortMetric', { field: field.id === 'height' || field.id === 'weight' ? $t(field.id) : statName(field.id, $language), direction: $t(direction === 'asc' ? 'ascending' : 'descending') })}</option>
          {/each}
        {/each}
      </select>
    </div>
    <div class="pokemon-illustration">
      <label for="illustration-set">{$t('illustrations')}</label>
      <select class="select" id="illustration-set" value={illustration} onchange={event => onIllustrationChange(event.currentTarget.value as IllustrationId)} aria-describedby="illustration-filter-help">
        {#each ILLUSTRATIONS as option (option.id)}<option value={option.id}>{imageName(option.id, $language)}</option>{/each}
      </select>
    </div>
  </div>
  <p class="list-help" id="pokemon-search-help">{$t(hasSelection ? 'searchHelp' : 'selectHelp')}</p>
  <p class="list-help">{$t('sortHelp')}</p>
  <p class="list-help" id="illustration-filter-help">{$t('illustrationHelp')}</p>
  {#if illustration !== 'current' && pokemon.some(entry => entry.historicalArtworks === undefined)}<p class="list-help">{$t('historicalPending')}</p>{/if}
  {#if results.length}
    <ul class="pokemon-grid" id="pokemon-grid" aria-labelledby="pokemon-title">
      {#each results as entry (entry.id)}<li><PokemonCard pokemon={entry} {view} {illustration} {onOpen}/><div class="card-actions"><button class="btn btn-sm" type="button" data-compare={entry.id} aria-pressed={compareIds.includes(entry.id)} disabled={compareIds.length === 4 && !compareIds.includes(entry.id)} onclick={() => onCompare(entry.id)}>{$t(compareIds.includes(entry.id) ? 'inComparison' : 'compare')}</button></div></li>{/each}
    </ul>
  {:else}
    <div class="pokemon-empty" id="pokemon-empty"><strong>{$t(hasSelection ? 'noMatches' : 'emptyList')}</strong><p>{$t(hasSelection ? query.trim() ? 'searchAgain' : 'typesAgain' : 'selectToDiscover')}</p></div>
  {/if}
</section>
