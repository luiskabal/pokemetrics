<script lang="ts">
  import type { Pokemon, PokemonOrder, ViewMode } from '../lib/model';
  import { GEN_I_STATS, STATS } from '../lib/metadata';
  import type { IllustrationId } from '../lib/metadata';
  import { downloadFile, pokemonCsv } from '../lib/export';
  import PokemonCard from './PokemonCard.svelte';
  import FavoriteButton from './FavoriteButton.svelte';
  import { generation } from '../lib/generation-state';
  import { generationInfo } from '../lib/generations';
  import { language, t } from '../lib/i18n';
  import { statName } from '../lib/localization';
  let { pokemon, results, view, illustration, hasSelection, onOpen, onShowFilters, query = $bindable(''), order = $bindable<PokemonOrder>('number-asc'), onOrderChange, segmentLabel, onClearSegment, compareIds, onCompare, favorites, onlyFavorites, onFavorite, onOnlyFavorites }: { pokemon: Pokemon[]; results: Pokemon[]; view: ViewMode; illustration: IllustrationId; hasSelection: boolean; onOpen: (pokemon: Pokemon) => void; onShowFilters: () => void; query?: string; order?: PokemonOrder; onOrderChange: () => void; segmentLabel: string | null; onClearSegment: () => void; compareIds: number[]; onCompare: (id: number) => void; favorites: ReadonlySet<number>; onlyFavorites: boolean; onFavorite: (id: number) => void; onOnlyFavorites: () => void } = $props();
  let searchInput: HTMLInputElement;
  let exportStatus = $state<'exportReady' | 'exportError' | null>(null);
  const statOptions = $derived(view === 'legacy' && $generation === 1 ? GEN_I_STATS : STATS);
  $effect(() => {
    const field = order.slice(0, order.lastIndexOf('-'));
    if (!['number', 'name', 'height', 'weight', ...statOptions.map(stat => stat.id)].includes(field)) order = 'number-asc';
  });
  function exportCsv() {
    try {
      downloadFile(new Blob([pokemonCsv(results, { generation: $generation, view, language: $language })], { type: 'text/csv;charset=utf-8' }), `pokemetrics-gen-${$generation}-${view}.csv`);
      exportStatus = 'exportReady';
    } catch { exportStatus = 'exportError'; }
  }
</script>

<section class="card pokemon-section" id="pokemon-section" aria-labelledby="pokemon-title">
  <div class="section-heading"><h2 id="pokemon-title" tabindex="-1">{$t('pokemonList')}</h2><span class="badge pokemon-count" id="pokemon-count" role="status" aria-live="polite">{hasSelection ? $t(query.trim() ? 'filteredCount' : 'pokemonCount', { count: results.length, total: pokemon.length }) : $t('noSelection')}</span></div>
  <div class="list-actions"><button class="btn btn-sm" id="only-favorites" type="button" aria-pressed={onlyFavorites} onclick={onOnlyFavorites}>{$t('myFavorites', { count: favorites.size })}</button><button class="btn btn-sm" id="export-csv" type="button" disabled={!results.length} onclick={exportCsv} aria-describedby="csv-help">{$t('exportCsv')}</button><span role="status">{exportStatus ? $t(exportStatus) : ''}</span></div>
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
      <select class="select" id="pokemon-order" bind:value={order} onchange={onOrderChange} disabled={!hasSelection}>
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
  </div>
  <details class="list-tools-help"><summary>{$t('listToolsHelp')}</summary>
  <p class="description">{$t(onlyFavorites ? 'favoritesHelp' : segmentLabel ? 'segmentHelp' : view === 'legacy' ? 'listLegacyHelp' : 'listHelp')}</p>
  <p class="list-help" id="pokemon-search-help">{$t(hasSelection ? 'searchHelp' : 'selectHelp', { total: generationInfo($generation).speciesIds.length })}</p>
  <p class="list-help">{$t('sortHelp')}</p>
  <p class="list-help" id="csv-help">{$t('exportCsvHelp')}</p>
  </details>
  {#if illustration.startsWith('game:') && pokemon.some(entry => !entry.gameSprites[illustration.slice(5)]?.front)}<p class="list-help">{$t('missingGameImages')}</p>{/if}
  {#if illustration !== 'current' && pokemon.some(entry => entry.historicalArtworks === undefined)}<p class="list-help">{$t('historicalPending')}</p>{/if}
  {#if results.length}
    <ul class="pokemon-grid" id="pokemon-grid" aria-labelledby="pokemon-title">
      {#each results as entry (entry.id)}<li><PokemonCard pokemon={entry} {view} {illustration} {onOpen}/><div class="card-actions"><button class="btn btn-sm" type="button" data-compare={entry.id} aria-pressed={compareIds.includes(entry.id)} disabled={compareIds.length === 4 && !compareIds.includes(entry.id)} onclick={() => onCompare(entry.id)}>{$t(compareIds.includes(entry.id) ? 'inComparison' : 'compare')}</button><FavoriteButton pokemon={entry} active={favorites.has(entry.id)} onToggle={onFavorite}/></div></li>{/each}
    </ul>
  {:else}
    <div class="pokemon-empty" id="pokemon-empty"><strong>{$t(hasSelection ? 'noMatches' : 'emptyList')}</strong><p>{$t(hasSelection ? query.trim() ? 'searchAgain' : 'typesAgain' : 'selectToDiscover')}</p><button class="btn btn-sm" type="button" onclick={onShowFilters}>{$t('showFilters')}</button></div>
  {/if}
</section>
