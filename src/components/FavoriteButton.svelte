<script lang="ts">
  import type { Pokemon } from '../lib/model';
  import { language, t } from '../lib/i18n';
  import { pokemonName } from '../lib/localization';
  let { pokemon, active, onToggle }: { pokemon: Pokemon; active: boolean; onToggle: (id: number) => void } = $props();
</script>
<button class="btn btn-sm favorite-button" type="button" data-favorite={pokemon.id} aria-pressed={active} aria-label={$t(active ? 'removeFavorite' : 'addFavorite', { name: pokemonName(pokemon.name, $language) })} title={$t(active ? 'removeFavorite' : 'addFavorite', { name: pokemonName(pokemon.name, $language) })} onclick={() => onToggle(pokemon.id)}>{active ? '★' : '☆'}</button>
