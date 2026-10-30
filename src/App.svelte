<script lang="ts">
  import { onMount } from 'svelte';
  import { TYPES, TYPE_BY_ID } from './lib/metadata';
  import type { IllustrationId, ImageSet, TypeId } from './lib/metadata';
  import type { LoadState, Pokemon, ViewMode } from './lib/model';
  import { analyzePokemon, percentage, pokemonInSegment } from './lib/analysis';
  import { fetchGeneration, readCache, writeCache } from './lib/pokeapi';
  import TypeFilters from './components/TypeFilters.svelte';
  import DistributionChart from './components/DistributionChart.svelte';
  import TypeIcon from './components/TypeIcon.svelte';
  import PokemonList from './components/PokemonList.svelte';
  import PokemonDialog from './components/PokemonDialog.svelte';
  import LanguageSelector from './components/LanguageSelector.svelte';
  import PokemonComparison from './components/PokemonComparison.svelte';
  import ShareLink from './components/ShareLink.svelte';
  import { language, t } from './lib/i18n';
  import { LOCALES, localizedName, pokemonName, saveLanguage, typeName } from './lib/localization';
  import { explorationUrl, readExploration } from './lib/navigation';
  import type { ExplorationState } from './lib/navigation';
  import type { PokemonOrder } from './lib/model';
  import { readFavorites, saveFavorites } from './lib/favorites';
  import { generation } from './lib/generation-state';
  import { GENERATIONS, SPECIES_GENERATION, defaultIllustration, generationInfo, typesForGeneration } from './lib/generations';
  import GenerationComparison from './components/GenerationComparison.svelte';
  import AppearanceSelector from './components/AppearanceSelector.svelte';
  import { readUiTheme, resolvedUiTheme, saveUiTheme } from './lib/ui-theme';
  import type { UiTheme } from './lib/ui-theme';

  const initialLocation = readExploration(new URL(location.href), $language, readUiTheme());
  generation.set(initialLocation.generation);
  const initialCache = readCache(initialLocation.generation);
  let dataGeneration = initialLocation.generation;
  language.set(initialLocation.language);
  let pokemon = $state.raw<Pokemon[]>(initialCache?.pokemon ?? []);
  let savedAt = $state<number | null>(initialCache?.savedAt ?? null);
  let view = $state<ViewMode>(initialLocation.view);
  let imageSet = $state<ImageSet>(initialLocation.imageSet);
  let illustration = $state<IllustrationId>(initialLocation.illustration);
  let selectedTypes = $state<TypeId[]>(initialLocation.types);
  let selectedSegment = $state<string | null>(initialLocation.segment);
  let query = $state(initialLocation.query);
  let order = $state<PokemonOrder>(initialLocation.order);
  let chart = $state<'pie' | 'bars'>(initialLocation.chart);
  let uiTheme = $state<UiTheme>(initialLocation.uiTheme);
  let shareUrl = $state(location.href);
  let compareIds = $state<number[]>([]);
  let favoriteIds = $state<number[]>(readFavorites());
  let onlyFavorites = $state(initialLocation.onlyFavorites);
  let favoriteSaveFailed = $state(false);
  let comparisonOpen = $state(false);
  let against = $state<number | null>(initialLocation.against);
  let selectedPokemonId = $state<number | null>(initialLocation.pokemonId);
  let loadState = $state<LoadState>({ status: 'loading', completed: 0 });
  let controller: AbortController | null = null;
  const definition = $derived(generationInfo($generation));
  const eraLabel = $derived(localizedName(definition.names, $language, definition.roman));
  const regionLabel = $derived(localizedName(definition.regionNames, $language, ''));
  const legacy = $derived(view === 'legacy');
  const availableTypes = $derived(legacy ? typesForGeneration($generation) : TYPES);
  const selected = $derived(new Set(selectedTypes));
  const analysis = $derived(analyzePokemon(pokemon, selected, view, $language));
  const active = $derived(selected.size > 0 && pokemon.length > 0);
  const segment = $derived(analysis.groups.find(group => group.key === selectedSegment));
  const favorites = $derived(new Set(favoriteIds));
  const selectedList = $derived(segment ? pokemonInSegment(pokemon, selected, view, segment.key) : analysis.matches);
  const listedPokemon = $derived(onlyFavorites ? (selected.size ? selectedList : pokemon).filter(entry => favorites.has(entry.id)) : selectedList);
  const comparedPokemon = $derived(compareIds.map(id => pokemon.find(entry => entry.id === id)!));
  const updating = $derived(loadState.status === 'loading' || loadState.status === 'refreshing');
  const savedDate = $derived(savedAt === null ? null : new Date(savedAt));
  const selectedPokemon = $derived(pokemon.find(entry => entry.id === selectedPokemonId) ?? null);
  const announcement = $derived(active
    ? `${$t(legacy ? 'legacy' : 'current')}. ${$t('announcement', { count: analysis.matches.length, total: analysis.total, percent: percentage(analysis.matches.length, analysis.total, $language) })}`
    : $t('emptyAnnouncement'));
  const connectionMessage = $derived.by(() => {
    const values = { completed: loadState.completed, total: definition.speciesIds.length };
    if (loadState.completed && loadState.status === 'loading') return $t('loadingProgress', values);
    if (loadState.completed && loadState.status === 'refreshing') return $t('refreshingProgress', values);
    return $t(loadState.status, values);
  });
  const explanationValues = $derived({
    bulbasaur: pokemonName('bulbasaur', $language), charizard: pokemonName('charizard', $language),
    grass: typeName('grass', $language), poison: typeName('poison', $language),
    fire: typeName('fire', $language), flying: typeName('flying', $language),
  });

  $effect(() => {
    document.documentElement.lang = $language;
    document.title = 'Pokémetrics · ' + regionLabel;
    saveLanguage($language);
  });

  $effect(() => {
    const root = document.documentElement;
    root.dataset.generation = String($generation);
    root.dataset.uiTheme = resolvedUiTheme(uiTheme, $generation);
    document.querySelector('meta[name="theme-color"]')!.setAttribute('content', getComputedStyle(root).getPropertyValue('--browser-color').trim());
    saveUiTheme(uiTheme);
  });

  $effect(() => {
    const state: ExplorationState = { view, types: selectedTypes, query, order, chart, segment: selectedSegment, pokemonId: selectedPokemonId, imageSet, illustration, language: $language, onlyFavorites, generation: $generation, against, uiTheme };
    const url = explorationUrl(new URL(location.href), state).href;
    if (url !== location.href) history.replaceState(null, '', url);
    shareUrl = url;
  });

  function checkpoint(): void { history.pushState(null, '', location.href); }

  function restoreLocation(): void {
    const next = readExploration(new URL(location.href), $language);
    view = next.view; selectedTypes = next.types; query = next.query; order = next.order; chart = next.chart;
    selectedSegment = next.segment; selectedPokemonId = next.pokemonId; imageSet = next.imageSet; illustration = next.illustration;
    onlyFavorites = next.onlyFavorites;
    uiTheme = next.uiTheme;
    against = next.against;
    language.set(next.language);
    if ($generation !== next.generation) { compareIds = []; comparisonOpen = false; }
    generation.set(next.generation);
  }

  function openPokemon(id: number | null): void {
    if (id === selectedPokemonId) return;
    if (id !== null && SPECIES_GENERATION.get(id) !== $generation) { changeGeneration(SPECIES_GENERATION.get(id)!, id); return; }
    checkpoint(); selectedPokemonId = id;
  }

  function changeGeneration(id: number, pokemonId: number | null = null): void {
    checkpoint();
    const next = generationInfo(id);
    selectedPokemonId = pokemonId; selectedSegment = null; query = ''; compareIds = []; comparisonOpen = false;
    illustration = defaultIllustration(id); imageSet = next.games[0].id; order = 'number-asc';
    if (legacy) selectedTypes = selectedTypes.filter(type => typesForGeneration(id).some(item => item.id === type));
    if (against === id) against = null;
    generation.set(id);
  }

  function toggleType(type: TypeId): void {
    changeTypes(selected.has(type) ? selectedTypes.filter(id => id !== type) : [...selectedTypes, type]);
  }

  function toggleCompare(id: number): void {
    if (compareIds.includes(id)) {
      compareIds = compareIds.filter(value => value !== id);
      if (compareIds.length < 2) comparisonOpen = false;
    } else if (compareIds.length < 4) compareIds = [...compareIds, id];
  }

  function toggleFavorite(id: number): void {
    favoriteIds = favorites.has(id) ? favoriteIds.filter(value => value !== id) : [...favoriteIds, id];
    favoriteSaveFailed = !saveFavorites(favoriteIds);
  }

  function changeTypes(types: TypeId[]): void {
    checkpoint();
    selectedTypes = types;
    selectedSegment = null;
  }

  function selectSegment(key: string): void {
    checkpoint();
    selectedSegment = selectedSegment === key ? null : key;
    query = '';
    document.getElementById('pokemon-section')!.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }

  function changeView(next: ViewMode): void {
    if (view === next) return;
    checkpoint();
    view = next;
    selectedSegment = null;
    if (next === 'legacy') selectedTypes = selectedTypes.filter(id => typesForGeneration($generation).some(type => type.id === id));
  }

  async function load(id = $generation): Promise<void> {
    controller?.abort();
    const request = new AbortController(); controller = request;
    if (dataGeneration !== id) {
      const cached = readCache(id); pokemon = cached?.pokemon ?? []; savedAt = cached?.savedAt ?? null; dataGeneration = id;
    }
    const timeout = setTimeout(() => request.abort(), 90_000);
    const status = pokemon.length ? 'refreshing' : 'loading';
    loadState = { status, completed: 0 };
    try {
      const entries = await fetchGeneration(id, request.signal, completed => {
        if (controller === request) loadState = { status, completed };
      });
      if (controller !== request) return;
      pokemon = entries;
      savedAt = writeCache(pokemon, id);
      loadState = { status: 'ready', completed: entries.length };
    } catch {
      request.abort();
      if (controller !== request) return;
      if (pokemon.length) {
        loadState = { status: 'cached', completed: pokemon.length };
      } else {
        loadState = { status: 'error', completed: 0 };
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  onMount(() => {
    const unsubscribe = generation.subscribe(id => { void load(id); });
    window.addEventListener('popstate', restoreLocation);
    return () => { unsubscribe(); controller?.abort(); window.removeEventListener('popstate', restoreLocation); };
  });
</script>

<div class="shell">
  <header class="topbar">
    <div class="brand">
      <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#234e42"/><path d="M1 16h30" stroke="#f5f5ef" stroke-width="2.5"/><circle cx="16" cy="16" r="5" fill="#f5f5ef"/><circle cx="16" cy="16" r="2.5" fill="#234e42"/></svg>
      <span>poké<span>metrics</span></span><span class="nav-label">{$t('navLabel')}</span>
    </div>
    <a class="source-link" href="https://pokeapi.co/docs/v2" target="_blank" rel="noopener noreferrer"><span class="status-dot"></span>{$t('source')} <span aria-hidden="true">↗</span></a>
  </header>
  <div class="preferences"><AppearanceSelector value={uiTheme} onChange={value => { if (value !== uiTheme) { checkpoint(); uiTheme = value; } }}/><LanguageSelector/></div>

  <main>
    <section class="intro" aria-labelledby="page-title">
      <div><p class="eyebrow">{$t('generationEyebrow', { total: definition.speciesIds.length })}</p><h1 id="page-title">{$t('regionTitle', { region: regionLabel })}</h1><p class="intro-copy">{$t('generationIntro')}</p></div>
      <div class="generation"><span class="badge">{definition.roman}</span><div><strong>{eraLabel}</strong><small>{$t('regionLabel', { region: regionLabel })}</small><small class="generation-hardware" lang="en">{definition.platform} · {definition.year}</small></div></div>
    </section>

    <div class="generation-controls">
      <div class="image-selector"><label for="generation-select">{$t('chooseGeneration')}</label><select class="select" id="generation-select" value={$generation} onchange={event => changeGeneration(Number(event.currentTarget.value))}>{#each GENERATIONS as option (option.id)}<option value={option.id}>{localizedName(option.names, $language, option.roman)} · {localizedName(option.regionNames, $language, '')}</option>{/each}</select></div>
      <div class="image-selector"><label for="against-generation">{$t('compareGeneration')}</label><select class="select" id="against-generation" value={against ?? ''} onchange={event => { checkpoint(); against = event.currentTarget.value ? Number(event.currentTarget.value) : null; }}><option value="">{$t('noGenerationComparison')}</option>{#each GENERATIONS.filter(option => option.id !== $generation) as option (option.id)}<option value={option.id}>{localizedName(option.names, $language, option.roman)}</option>{/each}</select></div>
    </div>

    <div class="view-controls">
      <div class="join view-switch" role="group" aria-label={$t('typeView')}>
        <button class="btn join-item" id="view-current" type="button" aria-pressed={!legacy} onclick={() => changeView('current')}>{$t('current')}</button>
        <button class="btn join-item" id="view-legacy" type="button" aria-pressed={legacy} onclick={() => changeView('legacy')}>{$t('legacy')}</button>
      </div>
      <p class="view-description">{$t(legacy ? 'legacyDescription' : 'currentDescription', { generation: eraLabel })}</p>
      <ShareLink url={shareUrl} id="share-link"/>
    </div>

    {#if loadState.status === 'refreshing'}
      <div class="alert alert-info app-notice" role="status"><span>{$t('refreshingNotice')}</span></div>
    {:else if loadState.status === 'error' || loadState.status === 'cached'}
      <div class="alert alert-warning app-notice" role="status"><span>{connectionMessage}</span><button class="btn btn-sm" type="button" onclick={() => load()}>{$t('retry')}</button></div>
    {/if}

    <section class="overview" aria-label={$t('overview')}>
      <div class="overview-stat"><span class="overview-value" id="total-pokemon">{pokemon.length || '—'}</span><span class="overview-label">{$t('introducedPokemon')}<small>{$t('oneSpecies')}</small></span></div>
      <div class="overview-stat"><span class="overview-value" id="available-types">{availableTypes.length}</span><span class="overview-label">{$t('typesToExplore')}<small>{$t(legacy ? 'originalTypes' : 'currentClassification')}</small></span></div>
      <div class="overview-stat"><span class="overview-value" id="selected-top">{selected.size}</span><span class="overview-label">{$t('selectedTypes')}<small>{$t('liveMix')}</small></span></div>
    </section>

    <div class="workspace">
      <TypeFilters {legacy} {selected} {imageSet} onImageSetChange={value => { checkpoint(); imageSet = value; }} disabled={!pokemon.length} onToggle={toggleType} onAll={() => changeTypes(availableTypes.map(type => type.id))} onClear={() => changeTypes([])}/>
      <div class="results">
        <DistributionChart {analysis} {active} {legacy} {chart} onChartChange={value => { checkpoint(); chart = value; }} selectedSegment={segment?.key ?? null} onSegment={selectSegment}/>
        <aside class="explanation"><span class="tip-icon" aria-hidden="true">✧</span><p>
          {#if legacy}
            <strong>{$t('originalExplanationTitle')}</strong> {$t('historicalExplanation', { generation: eraLabel, total: definition.speciesIds.length })}
          {:else}
            <strong>{$t('currentExplanationTitle')}</strong> {$t('currentExplanation', explanationValues)}
          {/if}
        </p></aside>
        {#if active}
          <section id="details-section" aria-labelledby="details-title">
            <h2 class="details-heading" id="details-title">{$t('typeDetails')}</h2>
            <p class="details-caption">{$t('typeDetailsHelp')}</p>
            <div class="type-details" id="type-details">
              {#each analysis.details as detail (detail.type)}
                <div class="detail-card" data-type={detail.type}><div class="detail-icon" style:background={TYPE_BY_ID[detail.type].tint} style:color={TYPE_BY_ID[detail.type].ink}><TypeIcon type={detail.type}/></div><div><div class="detail-label">{typeName(detail.type, $language)}</div><div class="detail-value">{$t('countPercent', { count: detail.count, percent: percentage(detail.count, analysis.total, $language) })}</div></div></div>
              {/each}
            </div>
          </section>
        {/if}
      </div>
    </div>
    {#if against !== null}<GenerationComparison {pokemon} other={against} {selected} {view}/>{/if}
    {#if favoriteSaveFailed}<p class="app-notice" role="status">{$t('favoritesSessionOnly')}</p>{/if}
    <PokemonList pokemon={listedPokemon} bind:query bind:order onOrderChange={checkpoint} {favorites} {onlyFavorites} onFavorite={toggleFavorite} onOnlyFavorites={() => { checkpoint(); onlyFavorites = !onlyFavorites; }} {compareIds} onCompare={toggleCompare} segmentLabel={segment?.label ?? null} onClearSegment={() => { checkpoint(); selectedSegment = null; }} {view} {illustration} onIllustrationChange={value => { checkpoint(); illustration = value; }} hasSelection={selected.size > 0 || onlyFavorites} onOpen={entry => openPokemon(entry.id)}/>
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
  </main>

  <footer class="connection" id="connection" data-state={loadState.status}>
    <div>
      <div class="connection-state">
        {#if updating}<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>{:else}<span class="status-dot"></span>{/if}
        <span id="connection-text" role="status">{connectionMessage}</span>
        {#if loadState.status === 'ready'}<button class="btn btn-ghost btn-xs text-button" type="button" onclick={() => load()}>{$t('refresh')}</button>{/if}
      </div>
      {#if savedDate}<p class="cache-updated">{$t('lastLoaded')} <time datetime={savedDate.toISOString()}>{savedDate.toLocaleString(LOCALES[$language], { dateStyle: 'medium', timeStyle: 'short' })}</time></p>{/if}
      {#if updating}<progress class="progress progress-primary connection-progress" value={loadState.completed} max={definition.speciesIds.length} aria-label={$t('loadedPokemon')}></progress>{/if}
    </div>
    <span class="footer-note">{$t('footer')}<br/>{$t('originalForms', { generation: eraLabel })}</span>
  </footer>
</div>
{#if compareIds.length}<aside class="compare-tray" aria-label={$t('compareTitle')}><span role="status">{$t('compareCount', { count: compareIds.length })}</span><button class="btn btn-sm" id="open-comparison" type="button" disabled={compareIds.length < 2} onclick={() => comparisonOpen = true}>{$t('compare')}</button><button class="btn btn-sm" type="button" onclick={() => compareIds = []}>{$t('clear')}</button></aside>{/if}
<PokemonComparison pokemon={comparedPokemon} {view} {illustration} open={comparisonOpen} onClose={() => comparisonOpen = false} onRemove={toggleCompare}/>
<PokemonDialog pokemon={selectedPokemon} {view} {shareUrl} isFavorite={selectedPokemon !== null && favorites.has(selectedPokemon.id)} onFavorite={toggleFavorite} onEvolution={openPokemon} defaultImageSet={imageSet} defaultIllustration={illustration} onClose={() => openPokemon(null)}/>
