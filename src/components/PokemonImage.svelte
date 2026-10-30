<script lang="ts">
  import { pokemonName } from '../lib/analysis';
  import type { Pokemon } from '../lib/model';
  let { pokemon, eager = false }: { pokemon: Pokemon; eager?: boolean } = $props();
  const placeholder = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><g fill="none" stroke="#a7b79c" stroke-width="3"><circle cx="80" cy="68" r="30"/><path d="M50 68h20m20 0h20"/><circle cx="80" cy="68" r="10"/></g><text x="80" y="125" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#718065">Imagen no disponible</text></svg>');
  const sources = $derived([...new Set([pokemon.image, pokemon.sprite, placeholder].filter((source): source is string => !!source))]);
  let fallback = $state(0);
</script>

<img src={sources[Math.min(fallback, sources.length - 1)]} alt={pokemonName(pokemon.name)} width="240" height="240"
  loading={eager ? 'eager' : 'lazy'} decoding="async" onerror={() => { if (fallback < sources.length - 1) fallback++; }}/>
