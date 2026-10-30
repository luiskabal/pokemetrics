<script lang="ts">
  import { pokemonName } from '../lib/analysis';
  import { IMAGE_SETS } from '../lib/metadata';
  import type { ImageSet } from '../lib/metadata';
  import type { Pokemon, SpriteSide } from '../lib/model';
  let { pokemon, imageSet, side = 'front', eager = false }: { pokemon: Pokemon; imageSet: ImageSet; side?: SpriteSide; eager?: boolean } = $props();
  const placeholder = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><g fill="none" stroke="#a7b79c" stroke-width="3"><circle cx="80" cy="68" r="30"/><path d="M50 68h20m20 0h20"/><circle cx="80" cy="68" r="10"/></g><text x="80" y="125" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#718065">Imagen no disponible</text></svg>');
  const sources = $derived([...new Set((imageSet === 'artwork' ? [pokemon.image, pokemon.sprite, placeholder] : [pokemon.gameSprites[imageSet][side], placeholder]).filter((source): source is string => !!source))]);
  const imageLabel = $derived(IMAGE_SETS.find(option => option.id === imageSet)!.name);
</script>

<img src={sources[0]} alt={`${pokemonName(pokemon.name)} · ${imageLabel}${imageSet === 'artwork' ? '' : side === 'front' ? ' · Frente' : ' · Espalda'}`} class:pixel-sprite={imageSet !== 'artwork'} width="240" height="240"
  loading={eager ? 'eager' : 'lazy'} decoding="async" onerror={event => {
    const next = sources.indexOf(event.currentTarget.getAttribute('src')!) + 1;
    if (next < sources.length) event.currentTarget.setAttribute('src', sources[next]);
  }}/>
