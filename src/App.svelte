<script lang="ts">
  import { onMount } from 'svelte';
  import { LEGACY_TYPES, TYPES, TYPE_BY_ID } from './lib/metadata';
  import type { TypeId } from './lib/metadata';
  import type { LoadState, Pokemon, ViewMode } from './lib/model';
  import { analyzePokemon, percentage } from './lib/analysis';
  import { fetchKanto, readCache, writeCache } from './lib/pokeapi';
  import TypeFilters from './components/TypeFilters.svelte';
  import PieChart from './components/PieChart.svelte';
  import TypeIcon from './components/TypeIcon.svelte';
  import PokemonList from './components/PokemonList.svelte';
  import PokemonDialog from './components/PokemonDialog.svelte';

  let pokemon = $state.raw<Pokemon[]>([]);
  let view = $state<ViewMode>('current');
  let selectedTypes = $state<TypeId[]>([]);
  let selectedPokemon = $state.raw<Pokemon | null>(null);
  let loadState = $state<LoadState>({ status: 'loading', message: 'Conectando con PokéAPI…', completed: 0 });
  let controller: AbortController;
  const legacy = $derived(view === 'legacy');
  const availableTypes = $derived(legacy ? LEGACY_TYPES : TYPES);
  const selected = $derived(new Set(selectedTypes));
  const analysis = $derived(analyzePokemon(pokemon, selected, view));
  const active = $derived(selected.size > 0 && pokemon.length > 0);
  const announcement = $derived(active
    ? `${legacy ? 'Vista Legacy. ' : 'Vista actual. '}${analysis.matches.length} Pokémon únicos de ${analysis.total} (${percentage(analysis.matches.length, analysis.total)}).`
    : 'Sin tipos seleccionados. El gráfico está vacío.');

  function toggleType(type: TypeId): void {
    selectedTypes = selected.has(type) ? selectedTypes.filter(id => id !== type) : [...selectedTypes, type];
  }

  function changeView(next: ViewMode): void {
    view = next;
    if (next === 'legacy') selectedTypes = selectedTypes.filter(id => LEGACY_TYPES.some(type => type.id === id));
  }

  async function load(): Promise<void> {
    controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);
    loadState = { status: 'loading', message: 'Consultando la primera generación en PokéAPI…', completed: 0 };
    try {
      pokemon = await fetchKanto(controller.signal, completed => {
        loadState = { status: 'loading', message: `Leyendo tipos actuales e históricos · ${completed} de 151 Pokémon`, completed };
      });
      writeCache(pokemon);
      loadState = { status: 'ready', message: 'Datos listos · 151 Pokémon · Tipos actuales e históricos de PokéAPI', completed: 151 };
    } catch {
      controller.abort();
      const cache = readCache();
      if (cache) {
        pokemon = cache.pokemon;
        loadState = { status: 'cached', message: 'Sin conexión con PokéAPI · Usando datos guardados el ' + new Date(cache.savedAt).toLocaleDateString('es-CL'), completed: 151 };
      } else if (pokemon.length) {
        loadState = { status: 'cached', message: 'Sin conexión con PokéAPI · Se mantienen los últimos datos cargados.', completed: 151 };
      } else {
        loadState = { status: 'error', message: 'No se pudo cargar PokéAPI. Revisa tu conexión y pulsa Reintentar.', completed: 0 };
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
      <span>poké<span>metrics</span></span><span class="nav-label">Explorador de tipos</span>
    </div>
    <a class="source-link" href="https://pokeapi.co/docs/v2" target="_blank" rel="noopener noreferrer"><span class="status-dot"></span>Datos de PokéAPI <span aria-hidden="true">↗</span></a>
  </header>

  <main>
    <section class="intro" aria-labelledby="page-title">
      <div><p class="eyebrow">151 historias. Un universo de tipos.</p><h1 id="page-title">Kanto, en proporción.</h1><p class="intro-copy">Elige tus tipos. Descubre cómo se distribuye la primera generación.</p></div>
      <div class="generation"><span class="badge">I</span><div><strong>Primera generación</strong><small>Región de Kanto</small></div></div>
    </section>

    <div class="view-controls">
      <div class="join view-switch" role="group" aria-label="Visión de tipos">
        <button class="btn join-item" id="view-current" type="button" aria-pressed={!legacy} onclick={() => changeView('current')}>Actual</button>
        <button class="btn join-item" id="view-legacy" type="button" aria-pressed={legacy} onclick={() => changeView('legacy')}>Legacy · Gen I</button>
      </div>
      <p class="view-description">{legacy ? 'Solo el primer tipo original de cada Pokémon. Sin segmentos combinados.' : 'Tipos actuales, con coincidencias entre los tipos seleccionados.'}</p>
    </div>

    {#if loadState.status === 'error' || loadState.status === 'cached'}
      <div class="alert alert-warning app-notice" role="status"><span>{loadState.message}</span><button class="btn btn-sm" type="button" onclick={load}>Reintentar</button></div>
    {/if}

    <section class="overview" aria-label="Resumen de la generación">
      <div class="overview-stat"><span class="overview-value" id="total-pokemon">{pokemon.length || '—'}</span><span class="overview-label">Pokémon en Kanto<small>Una especie, un Pokémon</small></span></div>
      <div class="overview-stat"><span class="overview-value" id="available-types">{availableTypes.length}</span><span class="overview-label">Tipos para explorar<small>{legacy ? 'Primer tipo original · Gen I' : 'Clasificación actual'}</small></span></div>
      <div class="overview-stat"><span class="overview-value" id="selected-top">{selected.size}</span><span class="overview-label">Tipos seleccionados<small>Tu mezcla, en tiempo real</small></span></div>
    </section>

    <div class="workspace">
      <TypeFilters {legacy} {selected} disabled={!pokemon.length} onToggle={toggleType} onAll={() => selectedTypes = availableTypes.map(type => type.id)} onClear={() => selectedTypes = []}/>
      <div class="results">
        <PieChart {analysis} {active} {legacy}/>
        <aside class="explanation"><span class="tip-icon" aria-hidden="true">✧</span><p>
          {#if legacy}
            <strong>Legacy: un tipo por Pokémon.</strong> Se cuenta solo el primer tipo original de Gen I. Bulbasaur cuenta como Planta y Charizard como Fuego. Los tipos secundarios se omiten; al elegir todos, los 151 Pokémon suman 100 % sin segmentos combinados.
          {:else}
            <strong>Dos tipos, un solo Pokémon.</strong> Si seleccionas Planta y Veneno, los Pokémon que comparten ambos van en «Planta + Veneno». Así la torta suma 100 % y cada Pokémon cuenta una sola vez.
          {/if}
        </p></aside>
        {#if active}
          <section id="details-section" aria-labelledby="details-title">
            <h2 class="details-heading" id="details-title">Tus tipos, en detalle</h2>
            <p class="details-caption">{legacy ? 'Cada Pokémon pertenece a un único tipo original. Estos totales no se superponen.' : 'Total por tipo, incluidos los Pokémon compartidos. Estos porcentajes no se suman.'}</p>
            <div class="type-details" id="type-details">
              {#each analysis.details as detail (detail.type)}
                <div class="detail-card" data-type={detail.type}><div class="detail-icon" style:background={TYPE_BY_ID[detail.type].tint} style:color={TYPE_BY_ID[detail.type].ink}><TypeIcon type={detail.type}/></div><div><div class="detail-label">{TYPE_BY_ID[detail.type].name}</div><div class="detail-value">{detail.count} Pokémon ({percentage(detail.count, analysis.total)})</div></div></div>
              {/each}
            </div>
          </section>
        {/if}
      </div>
    </div>
    <PokemonList pokemon={analysis.matches} {view} hasSelection={selected.size > 0} onOpen={entry => selectedPokemon = entry}/>
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
  </main>

  <footer class="connection" id="connection" data-state={loadState.status}>
    <div>
      <div class="connection-state">
        {#if loadState.status === 'loading'}<span class="loading loading-spinner loading-xs" aria-hidden="true"></span>{:else}<span class="status-dot"></span>{/if}
        <span id="connection-text" role="status">{loadState.message}</span>
      </div>
      {#if loadState.status === 'loading'}<progress class="progress progress-primary connection-progress" value={loadState.completed} max="151" aria-label="Pokémon cargados"></progress>{/if}
    </div>
    <span class="footer-note">Hecho para explorar, un tipo a la vez.<br/>Primera generación · Formas originales</span>
  </footer>
</div>
<PokemonDialog pokemon={selectedPokemon} {view} onClose={() => selectedPokemon = null}/>
