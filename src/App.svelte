<script lang="ts">
  import { onMount } from 'svelte';
  import { LEGACY_TYPES, TYPES, TYPE_BY_ID } from './lib/metadata';
  import type { IllustrationId, ImageSet, TypeId } from './lib/metadata';
  import type { LoadState, Pokemon, ViewMode } from './lib/model';
  import { analyzePokemon, percentage, pokemonInSegment } from './lib/analysis';
  import { fetchKanto, readCache, writeCache } from './lib/pokeapi';
  import TypeFilters from './components/TypeFilters.svelte';
  import DistributionChart from './components/DistributionChart.svelte';
  import TypeIcon from './components/TypeIcon.svelte';
  import PokemonList from './components/PokemonList.svelte';
  import PokemonDialog from './components/PokemonDialog.svelte';
  import LanguageSelector from './components/LanguageSelector.svelte';
  import { language, t } from './lib/i18n';
  import { LOCALES, pokemonName, saveLanguage, typeName } from './lib/localization';

  const initialCache = readCache();
  let pokemon = $state.raw<Pokemon[]>(initialCache?.pokemon ?? []);
  let savedAt = $state<number | null>(initialCache?.savedAt ?? null);
  let view = $state<ViewMode>('current');
  let imageSet = $state<ImageSet>('red-green-japan');
  let illustration = $state<IllustrationId>('red-and-green');
  let selectedTypes = $state<TypeId[]>([]);
  let selectedSegment = $state<string | null>(null);
  let query = $state('');
  let selectedPokemonId = $state<number | null>(null);
  let loadState = $state<LoadState>({ status: 'loading', completed: 0 });
  let controller: AbortController;
  const legacy = $derived(view === 'legacy');
  const availableTypes = $derived(legacy ? LEGACY_TYPES : TYPES);
  const selected = $derived(new Set(selectedTypes));
  const analysis = $derived(analyzePokemon(pokemon, selected, view, $language));
  const active = $derived(selected.size > 0 && pokemon.length > 0);
  const segment = $derived(analysis.groups.find(group => group.key === selectedSegment));
  const listedPokemon = $derived(segment ? pokemonInSegment(pokemon, selected, view, segment.key) : analysis.matches);
  const updating = $derived(loadState.status === 'loading' || loadState.status === 'refreshing');
  const savedDate = $derived(savedAt === null ? null : new Date(savedAt));
  const selectedPokemon = $derived(selectedPokemonId === null ? null : pokemon.find(entry => entry.id === selectedPokemonId)!);
  const announcement = $derived(active
    ? `${$t(legacy ? 'legacy' : 'current')}. ${$t('announcement', { count: analysis.matches.length, total: analysis.total, percent: percentage(analysis.matches.length, analysis.total, $language) })}`
    : $t('emptyAnnouncement'));
  const connectionMessage = $derived.by(() => {
    if (loadState.completed && loadState.status === 'loading') return $t('loadingProgress', { completed: loadState.completed });
    if (loadState.completed && loadState.status === 'refreshing') return $t('refreshingProgress', { completed: loadState.completed });
    return $t(loadState.status);
  });
  const explanationValues = $derived({
    bulbasaur: pokemonName('bulbasaur', $language), charizard: pokemonName('charizard', $language),
    grass: typeName('grass', $language), poison: typeName('poison', $language),
    fire: typeName('fire', $language), flying: typeName('flying', $language),
  });

  $effect(() => {
    document.documentElement.lang = $language;
    document.title = $t('pageTitle');
    saveLanguage($language);
  });

  function toggleType(type: TypeId): void {
    changeTypes(selected.has(type) ? selectedTypes.filter(id => id !== type) : [...selectedTypes, type]);
  }

  function changeTypes(types: TypeId[]): void {
    selectedTypes = types;
    selectedSegment = null;
  }

  function selectSegment(key: string): void {
    selectedSegment = selectedSegment === key ? null : key;
    query = '';
    document.getElementById('pokemon-section')!.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }

  function changeView(next: ViewMode): void {
    view = next;
    selectedSegment = null;
    if (next === 'legacy') selectedTypes = selectedTypes.filter(id => LEGACY_TYPES.some(type => type.id === id));
  }

  async function load(): Promise<void> {
    controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);
    const status = pokemon.length ? 'refreshing' : 'loading';
    loadState = { status, completed: 0 };
    try {
      pokemon = await fetchKanto(controller.signal, completed => {
        loadState = { status, completed };
      });
      savedAt = writeCache(pokemon);
      loadState = { status: 'ready', completed: 151 };
    } catch {
      controller.abort();
      if (pokemon.length) {
        loadState = { status: 'cached', completed: 151 };
      } else {
        loadState = { status: 'error', completed: 0 };
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  onMount(() => {
    void load();
    return () => controller.abort();
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
  <LanguageSelector/>

  <main>
    <section class="intro" aria-labelledby="page-title">
      <div><p class="eyebrow">{$t('eyebrow')}</p><h1 id="page-title">{$t('title')}</h1><p class="intro-copy">{$t('intro')}</p></div>
      <div class="generation"><span class="badge">I</span><div><strong>{$t('generation')}</strong><small>{$t('region')}</small><small class="generation-hardware" lang="en">GAME BOY · 1996</small></div></div>
    </section>

    <div class="view-controls">
      <div class="join view-switch" role="group" aria-label={$t('typeView')}>
        <button class="btn join-item" id="view-current" type="button" aria-pressed={!legacy} onclick={() => changeView('current')}>{$t('current')}</button>
        <button class="btn join-item" id="view-legacy" type="button" aria-pressed={legacy} onclick={() => changeView('legacy')}>{$t('legacy')}</button>
      </div>
      <p class="view-description">{$t(legacy ? 'legacyDescription' : 'currentDescription')}</p>
    </div>

    {#if loadState.status === 'refreshing'}
      <div class="alert alert-info app-notice" role="status"><span>{$t('refreshingNotice')}</span></div>
    {:else if loadState.status === 'error' || loadState.status === 'cached'}
      <div class="alert alert-warning app-notice" role="status"><span>{connectionMessage}</span><button class="btn btn-sm" type="button" onclick={load}>{$t('retry')}</button></div>
    {/if}

    <section class="overview" aria-label={$t('overview')}>
      <div class="overview-stat"><span class="overview-value" id="total-pokemon">{pokemon.length || '—'}</span><span class="overview-label">{$t('kantoPokemon')}<small>{$t('oneSpecies')}</small></span></div>
      <div class="overview-stat"><span class="overview-value" id="available-types">{availableTypes.length}</span><span class="overview-label">{$t('typesToExplore')}<small>{$t(legacy ? 'originalTypes' : 'currentClassification')}</small></span></div>
      <div class="overview-stat"><span class="overview-value" id="selected-top">{selected.size}</span><span class="overview-label">{$t('selectedTypes')}<small>{$t('liveMix')}</small></span></div>
    </section>

    <div class="workspace">
      <TypeFilters {legacy} {selected} {imageSet} onImageSetChange={value => imageSet = value} disabled={!pokemon.length} onToggle={toggleType} onAll={() => changeTypes(availableTypes.map(type => type.id))} onClear={() => changeTypes([])}/>
      <div class="results">
        <DistributionChart {analysis} {active} {legacy} selectedSegment={segment?.key ?? null} onSegment={selectSegment}/>
        <aside class="explanation"><span class="tip-icon" aria-hidden="true">✧</span><p>
          {#if legacy}
            <strong>{$t('originalExplanationTitle')}</strong> {$t('originalExplanation', explanationValues)}
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
    <PokemonList pokemon={listedPokemon} bind:query segmentLabel={segment?.label ?? null} onClearSegment={() => selectedSegment = null} {view} {illustration} onIllustrationChange={value => illustration = value} hasSelection={selected.size > 0} onOpen={entry => selectedPokemonId = entry.id}/>
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
  </main>

  <footer class="connection" id="connection" data-state={loadState.status}>
    <div>
      <div class="connection-state">
        {#if updating}<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>{:else}<span class="status-dot"></span>{/if}
        <span id="connection-text" role="status">{connectionMessage}</span>
        {#if loadState.status === 'ready'}<button class="btn btn-ghost btn-xs text-button" type="button" onclick={load}>{$t('refresh')}</button>{/if}
      </div>
      {#if savedDate}<p class="cache-updated">{$t('lastLoaded')} <time datetime={savedDate.toISOString()}>{savedDate.toLocaleString(LOCALES[$language], { dateStyle: 'medium', timeStyle: 'short' })}</time></p>{/if}
      {#if updating}<progress class="progress progress-primary connection-progress" value={loadState.completed} max="151" aria-label={$t('loadedPokemon')}></progress>{/if}
    </div>
    <span class="footer-note">{$t('footer')}<br/>{$t('originalForms')}</span>
  </footer>
</div>
<PokemonDialog pokemon={selectedPokemon} {view} defaultImageSet={imageSet} defaultIllustration={illustration} onClose={() => selectedPokemonId = null}/>
