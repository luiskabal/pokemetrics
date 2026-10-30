<script lang="ts">
  import type { Pokemon, PokemonOrder, ViewMode } from '../lib/model';
  import type { ImageSet } from '../lib/metadata';
  import { filterAndSortPokemon } from '../lib/analysis';
  import PokemonCard from './PokemonCard.svelte';
  let { pokemon, view, imageSet, hasSelection, onOpen }: { pokemon: Pokemon[]; view: ViewMode; imageSet: ImageSet; hasSelection: boolean; onOpen: (pokemon: Pokemon) => void } = $props();
  let query = $state('');
  let order = $state<PokemonOrder>('number-asc');
  let searchInput: HTMLInputElement;
  const results = $derived(filterAndSortPokemon(pokemon, query, order));
</script>

<section class="pokemon-section" id="pokemon-section" aria-labelledby="pokemon-title">
  <div class="section-heading"><h2 id="pokemon-title">Los Pokémon de tu selección</h2><span class="badge pokemon-count" id="pokemon-count" role="status" aria-live="polite">{hasSelection ? (query.trim() ? `${results.length} de ${pokemon.length} Pokémon` : pokemon.length + ' Pokémon') : 'Sin selección'}</span></div>
  <p class="description">{view === 'legacy' ? 'Coinciden con al menos uno de sus tipos originales de Gen I. Cada Pokémon aparece una sola vez. Pulsa una tarjeta para ver su ficha.' : 'Coinciden con al menos uno de los tipos seleccionados. Cada Pokémon aparece una sola vez. Pulsa una tarjeta para ver su ficha.'}</p>
  <div class="pokemon-toolbar">
    <div class="pokemon-search">
      <label for="pokemon-search">Buscar en la selección</label>
      <div class="search-field">
        <input class="input" id="pokemon-search" type="search" bind:this={searchInput} bind:value={query} disabled={!hasSelection} placeholder="Nombre o número, ej. Pikachu o #025" aria-describedby="pokemon-search-help" autocomplete="off"/>
        {#if query}<button class="btn btn-ghost btn-sm" type="button" disabled={!hasSelection} onclick={() => { query = ''; searchInput.focus(); }} aria-label="Limpiar búsqueda">×</button>{/if}
      </div>
    </div>
    <div class="pokemon-order">
      <label for="pokemon-order">Ordenar por</label>
      <select class="select" id="pokemon-order" bind:value={order} disabled={!hasSelection}>
        <option value="number-asc">Número: menor a mayor</option>
        <option value="number-desc">Número: mayor a menor</option>
        <option value="name-asc">Nombre: A–Z</option>
        <option value="name-desc">Nombre: Z–A</option>
      </select>
    </div>
  </div>
  <p class="list-help" id="pokemon-search-help">{hasSelection ? 'La búsqueda filtra este listado. Los gráficos siguen mostrando la distribución de los tipos seleccionados sobre los 151 Pokémon.' : 'Selecciona uno o más tipos para buscar entre sus Pokémon. Puedes elegir «Todos» para explorar Kanto completo.'}</p>
  {#if results.length}
    <ul class="pokemon-grid" id="pokemon-grid" aria-labelledby="pokemon-title">
      {#each results as entry (entry.id)}<li><PokemonCard pokemon={entry} {view} {imageSet} {onOpen}/></li>{/each}
    </ul>
  {:else}
    <div class="pokemon-empty" id="pokemon-empty"><strong>{hasSelection ? 'Ningún Pokémon coincide con estos filtros.' : 'Tu selección, con nombre y cara.'}</strong><p>{hasSelection ? (query.trim() ? 'Prueba otro nombre o número, limpia la búsqueda o amplía los tipos seleccionados.' : 'Prueba otro tipo o cambia entre los tipos actuales y los originales de Gen I.') : 'Selecciona un tipo para descubrir sus Pokémon.'}</p></div>
  {/if}
</section>
