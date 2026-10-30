<script lang="ts">
  import { pokemonName } from '../lib/analysis';
  import type { IllustrationId, ImageSet } from '../lib/metadata';
  import type { Pokemon, SpriteSide } from '../lib/model';
  import { language, t } from '../lib/i18n';
  import { imageName } from '../lib/localization';
  import { GAME_BY_ID } from '../lib/generations';
  import { reducedMotion } from '../lib/motion';
  let { pokemon, imageSet = 'artwork', illustration, side = 'front', eager = false }: { pokemon: Pokemon; imageSet?: ImageSet; illustration?: IllustrationId; side?: SpriteSide; eager?: boolean } = $props();
  const placeholder = $derived('data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><g fill="none" stroke="#a7b79c" stroke-width="3"><circle cx="80" cy="68" r="30"/><path d="M50 68h20m20 0h20"/><circle cx="80" cy="68" r="10"/></g><text x="80" y="125" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#718065">${$t('imageUnavailable')}</text></svg>`));
  const gameIllustration = $derived(illustration?.startsWith('game:') ? illustration.slice(5) : null);
  const illustrationUrl = $derived(illustration === 'current' ? pokemon.image : gameIllustration ? pokemon.gameSprites[gameIllustration]?.front : illustration ? pokemon.historicalArtworks?.[illustration as keyof typeof pokemon.historicalArtworks] : null);
  const pixelSprite = $derived((!!gameIllustration || !illustration && imageSet !== 'artwork') && (GAME_BY_ID.get(gameIllustration ?? imageSet)?.generation ?? 9) <= 5);
  const sources = $derived.by(() => {
    const candidates = illustration
      ? [illustrationUrl, placeholder]
      : imageSet === 'artwork'
        ? [pokemon.image, pokemon.sprite, placeholder]
        : [pokemon.gameSprites[imageSet]?.[side], placeholder];
    return [...new Set(candidates.filter((source): source is string => !!source))];
  });
  const imageLabel = $derived(imageName(illustration ?? imageSet, $language));
</script>

{#key `${$language}:${$reducedMotion}`}
<img src={sources[0]} alt={`${pokemonName(pokemon.name, $language)} · ${imageLabel}${illustration || imageSet === 'artwork' ? '' : ' · ' + $t(side)}`} class:pixel-sprite={pixelSprite} width="240" height="240"
  crossorigin={sources[0].endsWith('.gif') ? 'anonymous' : undefined}
  onload={event => {
    const img = event.currentTarget as HTMLImageElement;
    if (!$reducedMotion || !img.getAttribute('src')?.endsWith('.gif')) return;
    const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    try { canvas.getContext('2d')!.drawImage(img, 0, 0); img.src = canvas.toDataURL('image/png'); }
    catch { img.src = placeholder; }
  }}
  loading={eager ? 'eager' : 'lazy'} decoding="async" onerror={event => {
    const next = sources.indexOf(event.currentTarget.getAttribute('src')!) + 1;
    if (next < sources.length) event.currentTarget.setAttribute('src', sources[next]);
  }}/>
{/key}
