<script lang="ts">
  import { onMount, tick, untrack } from 'svelte';
  import { captureProfile, matchesCapture } from './lib/captures';
  import type { CaptureStatus } from './lib/captures';
  import OfflineManager from './components/OfflineManager.svelte';
  import StatFilters from './components/StatFilters.svelte';
  import { availableStats, filterStatRanges } from './lib/stat-explorer';
  import type { StatRange } from './lib/stat-explorer';
  import { TYPES, TYPE_BY_ID } from './lib/metadata';
  import type { IllustrationId, ImageSet, TypeId, HistoricalStatId } from './lib/metadata';
  import type { LoadState, Pokemon, ViewMode } from './lib/model';
  import { analyzePokemon, filterAndSortPokemon, percentage, pokemonInSegment } from './lib/analysis';
  import { readCache } from './lib/pokeapi';
  import { loadUniverse } from './lib/universe';
  import type { UniverseScope } from './lib/universe';
  import GameContext from './components/GameContext.svelte';
  import TypeFilters from './components/TypeFilters.svelte';
  import DistributionChart from './components/DistributionChart.svelte';
  import TypeIcon from './components/TypeIcon.svelte';
  import PokemonList from './components/PokemonList.svelte';
  import PokemonDialog from './components/PokemonDialog.svelte';
  import LanguageSelector from './components/LanguageSelector.svelte';
  import PokemonComparison from './components/PokemonComparison.svelte';
  import ShareLink from './components/ShareLink.svelte';
  import { language, t } from './lib/i18n';
  import { LANGUAGES, LOCALES, localizedName, pokemonName, saveLanguage, typeName } from './lib/localization';
  import { explorationUrl, readExploration } from './lib/navigation';
  import type { ExplorationState } from './lib/navigation';
  import type { PokemonOrder } from './lib/model';
  import { readFavorites, saveFavorites } from './lib/favorites';
  import { generation, edition } from './lib/generation-state';
  import { GENERATIONS, GAME_BY_ID, SPECIES_GENERATION, defaultIllustration, generationInfo, typesForGeneration } from './lib/generations';
  import GenerationComparison from './components/GenerationComparison.svelte';
  import AppearanceSelector from './components/AppearanceSelector.svelte';
  import { UI_THEMES, readUiTheme, resolvedUiTheme, saveUiTheme } from './lib/ui-theme';
  import type { UiTheme } from './lib/ui-theme';

  const initialLocation = readExploration(new URL(location.href), $language, readUiTheme());
  let section = $state<'explore' | 'play' | 'teams'>(initialLocation.section);
  let gameRoom = $state<Promise<typeof import('./components/GameRoom.svelte')> | null>(initialLocation.section === 'play' ? import('./components/GameRoom.svelte') : null);
  let teamBuilder = $state<Promise<typeof import('./components/TeamBuilder.svelte')> | null>(initialLocation.section === 'teams' ? import('./components/TeamBuilder.svelte') : null);
  const sectionScroll = { explore: 0, play: 0, teams: 0 };
  generation.set(initialLocation.generation);
  edition.set(initialLocation.edition);
  let scope = $state<UniverseScope>(initialLocation.scope);
  let dex = $state<number | null>(initialLocation.dex);
  const initialCache = initialLocation.scope === 'introduced' ? readCache(initialLocation.generation) : null;
  let dataContext = `${initialLocation.generation}/${initialLocation.scope}/${initialLocation.edition}/${initialLocation.dex}`;
  language.set(initialLocation.language);
  let pokemon = $state.raw<Pokemon[]>(initialCache?.pokemon ?? []);
  let savedAt = $state<number | null>(initialCache?.savedAt ?? null);
  let view = $state<ViewMode>(initialLocation.view);
  let imageSet = $state<ImageSet>(initialLocation.imageSet);
  let illustration = $state<IllustrationId>(initialLocation.illustration);
  let selectedTypes = $state<TypeId[]>(initialLocation.types);
  let selectedSegment = $state<string | null>(initialLocation.segment);
  let captureFilter = $state<CaptureStatus | 'all'>(initialLocation.captureFilter ?? 'all');
  let statRanges = $state<StatRange[]>(initialLocation.statRanges ?? []);
  let xStat = $state<HistoricalStatId>(initialLocation.xStat ?? 'attack');
  let yStat = $state<HistoricalStatId>(initialLocation.yStat ?? 'speed');
  $effect(() => { const valid = availableStats(view, $generation).map(stat => stat.id as HistoricalStatId); if (statRanges.some(range => !valid.includes(range.id))) statRanges = statRanges.filter(range => valid.includes(range.id)); if (!valid.includes(xStat)) xStat = 'attack'; if (!valid.includes(yStat)) yStat = 'speed'; });
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
  let referencePokemon = $state.raw<Pokemon | null>(null);
  const referenceLink = $derived.by(() => { const url = new URL(shareUrl); url.searchParams.delete('section'); url.searchParams.set('scope', 'national'); if (referencePokemon) url.searchParams.set('pokemon', String(referencePokemon.id)); return url.href; });
  async function referenceEvolution(id: number) { const era = $generation; const game = $edition; const data = await loadUniverse(era, 'national', game, null, new AbortController().signal); if (section === 'play' && era === $generation && game === $edition) referencePokemon = data.pokemon.find(pokemon => pokemon.id === id) ?? null; }
  let selectedPokemonId = $state<number | null>(initialLocation.pokemonId);
  let loadState = $state<LoadState>({ status: 'loading', completed: 0 });
  let controller: AbortController | null = null;
  const explorerPanels = [{ id: 'list', label: 'pokemonTab' }, { id: 'filters', label: 'filtersTab' }, { id: 'analysis', label: 'analysisTab' }] as const;
  type ExplorerPanel = (typeof explorerPanels)[number]['id'];
  const compactMedia = matchMedia('(max-width: 1199px)');
  let compactLayout = $state(compactMedia.matches);
  let activePanel = $state<ExplorerPanel>('list');
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
  const statResults = $derived(filterStatRanges(filterAndSortPokemon(listedPokemon, query, order, $language, view, $generation), statRanges, view, $generation));
  const listedResults = $derived(statResults.filter(pokemon => matchesCapture($captureProfile, pokemon.id, captureFilter)));
  const comparedPokemon = $derived(compareIds.map(id => pokemon.find(entry => entry.id === id)!));
  const updating = $derived(loadState.status === 'loading' || loadState.status === 'refreshing');
  const savedDate = $derived(savedAt === null ? null : new Date(savedAt));
  const referenceOpen = $derived(section === 'play' && referencePokemon !== null);
  const selectedPokemon = $derived(pokemon.find(entry => entry.id === selectedPokemonId) ?? null);
  const announcement = $derived(active
    ? `${$t(legacy ? 'legacy' : 'current')}. ${$t('announcement', { count: analysis.matches.length, total: analysis.total, percent: percentage(analysis.matches.length, analysis.total, $language) })}`
    : $t('emptyAnnouncement'));
  const connectionMessage = $derived.by(() => {
    const values = { completed: loadState.completed, total: scope === 'introduced' ? definition.speciesIds.length : pokemon.length };
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
    document.title = 'Pokémetrics · ' + (section === 'play' ? $t('appPlay') : section === 'teams' ? $t('appTeams') : regionLabel);
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
    const state: ExplorationState = { captureFilter, statRanges, xStat, yStat, view, types: selectedTypes, query, order, chart, segment: selectedSegment, pokemonId: selectedPokemonId, imageSet, illustration, language: $language, onlyFavorites, generation: $generation, against, uiTheme, section, scope, edition: $edition, dex };
    const url = explorationUrl(new URL(location.href), state).href;
    if (url !== location.href) history.replaceState(null, '', url);
    shareUrl = url;
  });

  function checkpoint(): void { history.pushState(null, '', location.href); }

  function restoreLocation(): void {
    const next = readExploration(new URL(location.href), $language);
    section = next.section;
    scope = next.scope; dex = next.dex; edition.set(next.edition);
    if (section === 'teams' && !teamBuilder) teamBuilder = import('./components/TeamBuilder.svelte');
    if (section === 'play' && !gameRoom) gameRoom = import('./components/GameRoom.svelte');
    captureFilter = next.captureFilter ?? 'all';
    statRanges = next.statRanges ?? []; xStat = next.xStat ?? 'attack'; yStat = next.yStat ?? 'speed';
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
    if (id !== null && !pokemon.some(entry => entry.id === id)) { changeGeneration(SPECIES_GENERATION.get(id)!, id); return; }
    checkpoint(); selectedPokemonId = id;
  }

  async function changeSection(next: 'explore' | 'play' | 'teams'): Promise<void> {
    if (next === section) return;
    sectionScroll[section] = scrollY;
    checkpoint();
    if (next === 'teams' && !teamBuilder) teamBuilder = import('./components/TeamBuilder.svelte');
    if (next === 'play' && !gameRoom) gameRoom = import('./components/GameRoom.svelte');
    section = next;
    await tick();
    document.getElementById(next + '-main')!.focus({ preventScroll: true });
    window.scrollTo({ top: sectionScroll[next], behavior: 'instant' });
  }

  function changeGeneration(id: number, pokemonId: number | null = null): void {
    checkpoint();
    const next = generationInfo(id);
    edition.set(next.games[0].id); dex = null;
    if (pokemonId !== null) scope = 'introduced';
    selectedPokemonId = pokemonId; selectedSegment = null; query = ''; compareIds = []; comparisonOpen = false;
    illustration = scope === 'introduced' ? defaultIllustration(id) : `game:${next.games[0].id}`; imageSet = next.games[0].id; order = 'number-asc';
    if (legacy) selectedTypes = selectedTypes.filter(type => typesForGeneration(id).some(item => item.id === type));
    if (against === id) against = null;
    generation.set(id);
  }

  function changeEdition(game: string): void {
    const era = GAME_BY_ID.get(game)!.generation;
    if (era !== $generation) changeGeneration(era); else checkpoint();
    edition.set(game); dex = null; selectedPokemonId = null; against = null;
    imageSet = game;
    illustration = scope === 'introduced' && game === generationInfo(era).games[0].id ? defaultIllustration(era) : `game:${game}`;
  }
  function changeScope(value: UniverseScope): void {
    checkpoint(); scope = value; illustration = value === 'introduced' ? defaultIllustration($generation) : `game:${$edition}`; dex = null; selectedPokemonId = null; selectedSegment = null; query = ''; compareIds = []; comparisonOpen = false; against = null;
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

  async function selectSegment(key: string): Promise<void> {
    checkpoint();
    selectedSegment = selectedSegment === key ? null : key;
    query = '';
    if (compactLayout) activePanel = 'list';
    await tick();
    document.getElementById('pokemon-section')!.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    document.getElementById('pokemon-title')!.focus({ preventScroll: true });
  }

  async function showPanel(panel: ExplorerPanel, focus = false): Promise<void> {
    activePanel = panel;
    await tick();
    const element = document.getElementById('explorer-' + panel)!;
    if (focus) element.focus({ preventScroll: true });
    element.scrollIntoView({ block: 'start' });
  }

  function panelKeydown(event: KeyboardEvent, index: number): void {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? explorerPanels.length - 1 : event.key === 'ArrowRight' ? (index + 1) % explorerPanels.length : event.key === 'ArrowLeft' ? (index + explorerPanels.length - 1) % explorerPanels.length : null;
    if (next === null) return;
    event.preventDefault();
    const panel = explorerPanels[next].id;
    void showPanel(panel);
    document.getElementById('explorer-tab-' + panel)!.focus();
  }

  function changeView(next: ViewMode): void {
    if (view === next) return;
    checkpoint();
    view = next;
    selectedSegment = null;
    if (next === 'legacy') selectedTypes = selectedTypes.filter(id => typesForGeneration($generation).some(type => type.id === id));
  }

  async function load(id = $generation, force = false): Promise<void> {
    controller?.abort();
    const request = new AbortController(); controller = request;
    const context = `${id}/${scope}/${$edition}/${dex}`;
    if (dataContext !== context) {
      const cached = scope === 'introduced' ? readCache(id) : null; pokemon = cached?.pokemon ?? []; savedAt = cached?.savedAt ?? null; dataContext = context;
    }
    const status = pokemon.length ? 'refreshing' : 'loading';
    loadState = { status, completed: 0 };
    try {
      const dataset = await loadUniverse(id, scope, $edition, dex, request.signal, force);
      if (controller !== request) return;
      pokemon = dataset.pokemon;
      savedAt = dataset.savedAt;
      loadState = { status: 'ready', completed: pokemon.length };
    } catch {
      request.abort();
      if (controller !== request) return;
      if (pokemon.length) {
        loadState = { status: 'cached', completed: pokemon.length };
      } else {
        loadState = { status: 'error', completed: 0 };
      }
    }
  }

  $effect(() => {
    const id = $generation;
    scope; dex; $edition;
    if (section === 'explore') untrack(() => { void load(id); });
    return () => { controller?.abort(); controller = null; };
  });

  onMount(() => {
    const resize = () => { compactLayout = compactMedia.matches; };
    compactMedia.addEventListener('change', resize);
    window.addEventListener('popstate', restoreLocation);
    return () => { window.removeEventListener('popstate', restoreLocation); compactMedia.removeEventListener('change', resize); };
  });
</script>

<div class="shell">
  <header class="topbar site-topbar">
    <div class="brand">
      <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#234e42"/><path d="M1 16h30" stroke="#f5f5ef" stroke-width="2.5"/><circle cx="16" cy="16" r="5" fill="#f5f5ef"/><circle cx="16" cy="16" r="2.5" fill="#234e42"/></svg>
      <span>poké<span>metrics</span></span>
    </div>
    <nav class="site-navigation" aria-label={$t('appSections')}><button class="btn btn-sm" type="button" id="section-explore" aria-pressed={section === 'explore'} onclick={() => changeSection('explore')}>{$t('appExplore')}</button><button class="btn btn-sm" type="button" id="section-play" aria-pressed={section === 'play'} onclick={() => changeSection('play')}>{$t('appPlay')}</button><button class="btn btn-sm" type="button" id="section-teams" aria-pressed={section === 'teams'} onclick={() => changeSection('teams')}>{$t('appTeams')}</button></nav>
    <div class="header-actions">{#if section !== 'teams'}<ShareLink url={shareUrl} id="share-link"/>{/if}<a class="source-link" href="https://pokeapi.co/docs/v2" target="_blank" rel="noopener noreferrer" aria-label={$t('source')}><span class="status-dot"></span><span class="source-label">{$t('source')}</span><span aria-hidden="true">↗</span></a></div>
  </header>
  <details class="preferences-panel"><summary>{$t('displayPreferences')} <small>{$t(UI_THEMES.find(option => option.id === uiTheme)!.label)} · {LANGUAGES.find(option => option.id === $language)!.label}</small></summary><div class="preferences"><AppearanceSelector value={uiTheme} onChange={value => { if (value !== uiTheme) { checkpoint(); uiTheme = value; } }}/><LanguageSelector/></div></details>

  <OfflineManager {pokemon} {dex} era={$generation} {scope} game={$edition} {illustration} {imageSet}/>
  <main id="explore-main" tabindex="-1" hidden={section !== 'explore'}>
    <section class="intro" aria-labelledby="page-title">
      <div><p class="eyebrow">{$t('generationEyebrow', { total: scope === 'introduced' ? definition.speciesIds.length : pokemon.length })}</p><h1 id="page-title">{$t('regionTitle', { region: regionLabel })}</h1><p class="intro-copy">{$t('generationIntro')}</p></div>
      <div class="generation"><span class="badge">{definition.roman}</span><div><strong>{eraLabel}</strong><small>{$t('pokemonCount', { count: scope === 'introduced' ? definition.speciesIds.length : pokemon.length })}</small><small class="generation-hardware" lang="en">{definition.platform} · {definition.year}</small></div></div>
    </section>

    <div class="generation-controls">
      <div class="image-selector"><label for="generation-select">{$t('chooseGeneration')}</label><select class="select" id="generation-select" value={$generation} onchange={event => changeGeneration(Number(event.currentTarget.value))}>{#each GENERATIONS as option (option.id)}<option value={option.id}>{localizedName(option.names, $language, option.roman)} · {localizedName(option.regionNames, $language, '')}</option>{/each}</select></div>
      <div class="image-selector data-view-selector"><span class="data-view-label">{$t('typeView')}</span><div class="join view-switch" role="group" aria-label={$t('typeView')} aria-describedby="view-description">
        <button class="btn join-item" id="view-current" type="button" aria-pressed={!legacy} onclick={() => changeView('current')}>{$t('current')}</button>
        <button class="btn join-item" id="view-legacy" type="button" aria-pressed={legacy} onclick={() => changeView('legacy')}>{$t('legacy')}</button>
      </div></div>
      <p class="sr-only" id="view-description">{$t(legacy ? 'legacyDescription' : 'currentDescription', { generation: eraLabel })}</p>
    </div>

    <GameContext {scope} {dex} onScope={changeScope} onEdition={changeEdition} onDex={value => { checkpoint(); dex = value; selectedPokemonId = null; selectedSegment = null; query = ''; compareIds = []; }}/>
    {#if loadState.status === 'refreshing'}
      <div class="alert alert-info app-notice" role="status"><span>{$t('refreshingNotice')}</span></div>
    {:else if loadState.status === 'cached'}
      <details class="cache-notice"><summary>{$t('usingSavedData')}{#if savedDate} · <time datetime={savedDate.toISOString()}>{savedDate.toLocaleDateString(LOCALES[$language])}</time>{/if}</summary><p>{connectionMessage}</p><button class="btn btn-sm" type="button" onclick={() => load($generation, true)}>{$t('retry')}</button></details>
    {:else if loadState.status === 'error'}
      <div class="alert alert-warning app-notice" role="status"><span>{connectionMessage}</span><button class="btn btn-sm" type="button" onclick={() => load($generation, true)}>{$t('retry')}</button></div>
    {/if}

    {#if compactLayout}<nav class="explorer-navigation" aria-label={$t('explorerSections')}><div role="tablist" aria-label={$t('explorerSections')}>{#each explorerPanels as panel, index (panel.id)}<button class="btn" type="button" role="tab" id={'explorer-tab-' + panel.id} aria-controls={'explorer-' + panel.id} aria-selected={activePanel === panel.id} tabindex={activePanel === panel.id ? 0 : -1} onclick={() => showPanel(panel.id)} onkeydown={event => panelKeydown(event, index)}>{$t(panel.label)}{#if panel.id === 'list'}<small>{listedResults.length}</small>{/if}</button>{/each}</div></nav>{/if}
    <div class="explorer-grid">
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (El panel lateral desplazable necesita foco para poder recorrerlo con teclado.) -->
      <div class="explorer-filters" id="explorer-filters" role={compactLayout ? 'tabpanel' : 'region'} aria-labelledby={compactLayout ? 'explorer-tab-filters' : 'filters-title'} tabindex="0" hidden={compactLayout && activePanel !== 'filters'}>
        <TypeFilters {legacy} {selected} {imageSet} {illustration} onIllustrationChange={value => { checkpoint(); illustration = value; }} onImageSetChange={value => { checkpoint(); imageSet = value; }} disabled={!pokemon.length} onToggle={toggleType} onAll={() => changeTypes(availableTypes.map(type => type.id))} onClear={() => changeTypes([])}/>
        <StatFilters ranges={statRanges} {view} onChange={value => { checkpoint(); statRanges = value; }}/>
        {#if compactLayout}<button class="btn filter-results-button" type="button" onclick={() => showPanel('list', true)}>{$t('showPokemonList')} · {listedResults.length}</button>{/if}
      </div>
      <div class="explorer-list" id="explorer-list" role={compactLayout ? 'tabpanel' : undefined} aria-labelledby={compactLayout ? 'explorer-tab-list' : undefined} tabindex="-1" hidden={compactLayout && activePanel !== 'list'}>
        {#if favoriteSaveFailed}<p class="app-notice" role="status">{$t('favoritesSessionOnly')}</p>{/if}
        <PokemonList universe={pokemon} {captureFilter} onCaptureFilter={value => { checkpoint(); captureFilter = value; }} pokemon={listedPokemon} results={listedResults} bind:query bind:order onOrderChange={checkpoint} {favorites} {onlyFavorites} onFavorite={toggleFavorite} onOnlyFavorites={() => { checkpoint(); onlyFavorites = !onlyFavorites; }} {compareIds} onCompare={toggleCompare} segmentLabel={segment?.label ?? null} onClearSegment={() => { checkpoint(); selectedSegment = null; }} {view} {illustration} hasSelection={selected.size > 0 || onlyFavorites} onOpen={entry => openPokemon(entry.id)} onShowFilters={() => showPanel('filters', true)}/>
      </div>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (El análisis lateral desplazable necesita foco para poder recorrerlo con teclado.) -->
      <div class="explorer-analysis results" id="explorer-analysis" role={compactLayout ? 'tabpanel' : 'region'} aria-labelledby={compactLayout ? 'explorer-tab-analysis' : 'chart-title'} tabindex="0" hidden={compactLayout && activePanel !== 'analysis'}>
        <section class="overview" aria-label={$t('overview')}>
          <div class="overview-stat"><span class="overview-value" id="total-pokemon">{pokemon.length || '—'}</span><span class="overview-label">{$t(scope === 'introduced' ? 'introducedPokemon' : 'universeCount')}<small>{$t('oneSpecies')}</small></span></div>
          <div class="overview-stat"><span class="overview-value" id="available-types">{availableTypes.length}</span><span class="overview-label">{$t('typesToExplore')}<small>{$t(legacy ? 'originalTypes' : 'currentClassification')}</small></span></div>
          <div class="overview-stat"><span class="overview-value" id="selected-top">{selected.size}</span><span class="overview-label">{$t('selectedTypes')}<small>{$t('liveMix')}</small></span></div>
        </section>
        <div class="image-selector"><label for="against-generation">{$t('compareGeneration')}</label><select class="select" id="against-generation" disabled={scope !== 'introduced'} value={against ?? ''} onchange={event => { checkpoint(); against = event.currentTarget.value ? Number(event.currentTarget.value) : null; }}><option value="">{$t('noGenerationComparison')}</option>{#each GENERATIONS.filter(option => option.id !== $generation) as option (option.id)}<option value={option.id}>{localizedName(option.names, $language, option.roman)}</option>{/each}</select></div>
        {#if section === 'explore' && (!compactLayout || activePanel === 'analysis')}{#await import('./components/StatScatter.svelte') then module}<module.default pokemon={listedResults} {view} x={xStat} y={yStat} onAxes={(x, y) => { checkpoint(); xStat = x; yStat = y; }} onOpen={id => openPokemon(id)}/>{/await}{/if}
        <DistributionChart {analysis} {active} {legacy} {chart} onChartChange={value => { checkpoint(); chart = value; }} selectedSegment={segment?.key ?? null} onSegment={selectSegment}/>
        <aside class="explanation"><span class="tip-icon" aria-hidden="true">✧</span><p>
          {#if legacy}
            <strong>{$t('originalExplanationTitle')}</strong> {$t('historicalExplanation', { generation: eraLabel, total: pokemon.length })}
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
        {#if scope === 'introduced' && against !== null && section === 'explore' && (!compactLayout || activePanel === 'analysis')}<GenerationComparison {pokemon} other={against} {selected} {view}/>{/if}
      </div>
    </div>
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
  </main>

  <main id="play-main" tabindex="-1" hidden={section !== 'play'}>{#if gameRoom}{#await gameRoom}<p class="description" role="status">{$t('playLoading')}</p>{:then module}<module.default active={section === 'play'} {referenceOpen} onEdition={game => { referencePokemon = null; changeEdition(game); }} onReference={pokemon => referencePokemon = pokemon}/>{:catch}<p class="app-notice" role="alert">{$t('playLoadError')}</p><button class="btn btn-sm" type="button" onclick={() => gameRoom = import('./components/GameRoom.svelte')}>{$t('retry')}</button>{/await}{/if}</main>

  <main id="teams-main" tabindex="-1" hidden={section !== 'teams'}>{#if teamBuilder}{#await teamBuilder}<p role="status">{$t('infoLoading')}</p>{:then module}<module.default onEdition={changeEdition}/>{:catch}<p role="alert">{$t('infoError')}</p><button class="btn btn-sm" onclick={() => teamBuilder = import('./components/TeamBuilder.svelte')}>{$t('retry')}</button>{/await}{/if}</main>
  <footer class="connection" id="connection" data-state={loadState.status} hidden={section !== 'explore'}>
    <div>
      <div class="connection-state">
        {#if updating}<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>{:else}<span class="status-dot"></span>{/if}
        <span id="connection-text" role="status">{connectionMessage}</span>
        {#if loadState.status === 'ready'}<button class="btn btn-ghost btn-xs text-button" type="button" onclick={() => load($generation, true)}>{$t('refresh')}</button>{/if}
      </div>
      {#if savedDate}<p class="cache-updated">{$t('lastLoaded')} <time datetime={savedDate.toISOString()}>{savedDate.toLocaleString(LOCALES[$language], { dateStyle: 'medium', timeStyle: 'short' })}</time></p>{/if}
      {#if updating}<progress class="progress progress-primary connection-progress" value={loadState.completed} max={scope === 'introduced' ? definition.speciesIds.length : pokemon.length || 1} aria-label={$t('loadedPokemon')}></progress>{/if}
    </div>
    <span class="footer-note">{$t('footer')}<br/>{$t('originalForms', { generation: eraLabel })}</span>
  </footer>
</div>
{#if compareIds.length && section === 'explore'}<aside class="compare-tray" aria-label={$t('compareTitle')}><span role="status">{$t('compareCount', { count: compareIds.length })}</span><button class="btn btn-sm" id="open-comparison" type="button" disabled={compareIds.length < 2} onclick={() => comparisonOpen = true}>{$t('compare')}</button><button class="btn btn-sm" type="button" onclick={() => compareIds = []}>{$t('clear')}</button></aside>{/if}
<PokemonComparison pokemon={comparedPokemon} {view} {illustration} open={comparisonOpen && section === 'explore'} onClose={() => comparisonOpen = false} onRemove={toggleCompare}/>
<PokemonDialog pokemon={section === 'play' ? referencePokemon : section === 'explore' ? selectedPokemon : null} view={section === 'play' ? 'legacy' : view} shareUrl={section === 'play' ? referenceLink : shareUrl} isFavorite={favorites.has((section === 'play' ? referencePokemon : selectedPokemon)?.id ?? 0)} onFavorite={toggleFavorite} onEvolution={section === 'play' ? referenceEvolution : openPokemon} defaultImageSet={section === 'play' ? $edition : imageSet} defaultIllustration={section === 'play' ? `game:${$edition}` : illustration} onClose={() => { if (section === 'play') referencePokemon = null; else openPokemon(null); }}/>
