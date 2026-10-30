<script lang="ts">
  import type { Pokemon, PokemonOrder, ViewMode } from '../lib/model';
  import { ILLUSTRATIONS } from '../lib/metadata';
  import type { IllustrationId } from '../lib/metadata';
  import { filterAndSortPokemon } from '../lib/analysis';
  import PokemonCard from './PokemonCard.svelte';
  import { language, t } from '../lib/i18n';
  import { imageName } from '../lib/localization';
  let { pokemon, view, illustration, onIllustrationChange, hasSelection, onOpen }: { pokemon: Pokemon[]; view: ViewMode; illustration: IllustrationId; onIllustrationChange: (value: IllustrationId) => void; hasSelection: boolean; onOpen: (pokemon: Pokemon) => void } = $props();
  let query = $state('');
  let order = $state<PokemonOrder>('number-asc');
  let searchInput: HTMLInputElement;
  const results = $derived(filterAndSortPokemon(pokemon, query, order, $language));
</script>

<section class="pokemon-section" id="pokemon-section" aria-labelledby="pokemon-title">
  <div class="section-heading"><h2 id="pokemon-title">{$t('pokemonList')}</h2><span class="badge pokemon-count" id="pokemon-count" role="status" aria-live="polite">{hasSelection ? $t(query.trim() ? 'filteredCount' : 'pokemonCount', { count: results.length, total: pokemon.length }) : $t('noSelection')}</span></div>
  <p class="description">{$t(view === 'legacy' ? 'listLegacyHelp' : 'listHelp')}</p>
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
  <p class="list-help" id="illustration-filter-help">{$t('illustrationHelp')}</p>
  {#if illustration !== 'current' && pokemon.some(entry => entry.historicalArtworks === undefined)}<p class="list-help">{$t('historicalPending')}</p>{/if}
  {#if results.length}
    <ul class="pokemon-grid" id="pokemon-grid" aria-labelledby="pokemon-title">
      {#each results as entry (entry.id)}<li><PokemonCard pokemon={entry} {view} {illustration} {onOpen}/></li>{/each}
    </ul>
  {:else}
    <div class="pokemon-empty" id="pokemon-empty"><strong>{$t(hasSelection ? 'noMatches' : 'emptyList')}</strong><p>{$t(hasSelection ? query.trim() ? 'searchAgain' : 'typesAgain' : 'selectToDiscover')}</p></div>
  {/if}
</section>
