<script lang="ts">
  import { TYPE_BY_ID } from '../lib/metadata';
  import type { ImageSet } from '../lib/metadata';
  import { pokemonName, visibleTypes } from '../lib/analysis';
  import type { Pokemon, ViewMode } from '../lib/model';
  import PokemonImage from './PokemonImage.svelte';
  import TypeBadge from './TypeBadge.svelte';
  let { pokemon, view, imageSet, onOpen }: { pokemon: Pokemon; view: ViewMode; imageSet: ImageSet; onOpen: (pokemon: Pokemon) => void } = $props();
  const types = $derived(visibleTypes(pokemon, view));
</script>

<button type="button" class="card pokemon-card" data-id={pokemon.id} aria-label={`Ver ficha de ${pokemonName(pokemon.name)}, número ${pokemon.id}`}
  aria-haspopup="dialog" aria-controls="pokemon-dialog" onclick={() => onOpen(pokemon)}>
  <span class="pokemon-portrait" style:--pokemon-tint={TYPE_BY_ID[types[0]].tint}><PokemonImage {pokemon} {imageSet}/></span>
  <span class="pokemon-number">#{String(pokemon.id).padStart(3, '0')}</span>
  <span class="pokemon-name">{pokemonName(pokemon.name)}</span>
  <span class="pokemon-types">{#each types as type (type)}<TypeBadge {type}/>{/each}</span>
  <span class="pokemon-card-hint">Ver ficha →</span>
</button>
