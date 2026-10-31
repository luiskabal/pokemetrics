<script lang="ts">
  import { TYPE_BY_ID } from '../lib/metadata';
  import type { IllustrationId } from '../lib/metadata';
  import { pokemonName, visibleTypes } from '../lib/analysis';
  import type { Pokemon, ViewMode } from '../lib/model';
  import PokemonImage from './PokemonImage.svelte';
  import TypeBadge from './TypeBadge.svelte';
  import { language, t } from '../lib/i18n';
  let { pokemon, view, illustration, onOpen }: { pokemon: Pokemon; view: ViewMode; illustration: IllustrationId; onOpen: (pokemon: Pokemon) => void } = $props();
  const types = $derived(visibleTypes(pokemon, view));
</script>

<button type="button" class="card pokemon-card" data-id={pokemon.id} aria-label={$t('openPokemon', { name: pokemonName(pokemon.name, $language), id: pokemon.id })}
  aria-haspopup="dialog" aria-controls="pokemon-dialog" onclick={() => onOpen(pokemon)}>
  <span class="pokemon-portrait" style:--pokemon-tint={TYPE_BY_ID[types[0]].tint}><PokemonImage {pokemon} {illustration}/></span>
  <span class="pokemon-number">#{String(pokemon.id).padStart(3, '0')}</span>
  {#if pokemon.regionalNumber !== undefined}<small class="pokemon-number">{$t('regionalNumber', { number: pokemon.regionalNumber })}</small>{/if}
  <span class="pokemon-name">{pokemonName(pokemon.name, $language)}</span>
  <span class="pokemon-types">{#each types as type (type)}<TypeBadge {type}/>{/each}</span>
  <span class="pokemon-card-hint">{$t('viewDetails')}</span>
</button>
