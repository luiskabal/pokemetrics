<script lang="ts">
  import type { Pokemon, ViewMode } from '../lib/model';
  import PokemonCard from './PokemonCard.svelte';
  let { pokemon, view, hasSelection, onOpen }: { pokemon: Pokemon[]; view: ViewMode; hasSelection: boolean; onOpen: (pokemon: Pokemon) => void } = $props();
</script>

<section class="pokemon-section" id="pokemon-section" aria-labelledby="pokemon-title">
  <div class="section-heading"><h2 id="pokemon-title">Los Pokémon de tu selección</h2><span class="badge pokemon-count" id="pokemon-count">{hasSelection ? pokemon.length + ' Pokémon' : 'Sin selección'}</span></div>
  <p class="description">{view === 'legacy' ? 'Coinciden con al menos uno de sus tipos originales de Gen I. Cada Pokémon aparece una sola vez. Pulsa una tarjeta para ver su ficha.' : 'Coinciden con al menos uno de los tipos seleccionados. Cada Pokémon aparece una sola vez. Pulsa una tarjeta para ver su ficha.'}</p>
  {#if pokemon.length}
    <ul class="pokemon-grid" id="pokemon-grid" aria-labelledby="pokemon-title">
      {#each pokemon as entry (entry.id)}<li><PokemonCard pokemon={entry} {view} {onOpen}/></li>{/each}
    </ul>
  {:else}
    <div class="pokemon-empty" id="pokemon-empty"><strong>{hasSelection ? 'Ningún Pokémon coincide con estos filtros.' : 'Tu selección, con nombre y cara.'}</strong><p>{hasSelection ? 'Prueba otro tipo o cambia entre los tipos actuales y los originales de Gen I.' : 'Selecciona un tipo para descubrir sus Pokémon.'}</p></div>
  {/if}
</section>
