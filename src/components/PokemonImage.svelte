<script lang="ts">
  import { pokemonName } from '../lib/analysis';
  import type { IllustrationId, ImageSet } from '../lib/metadata';
  import type { Pokemon, SpriteSide } from '../lib/model';
  import { language, t } from '../lib/i18n';
  import { imageName } from '../lib/localization';
  import { GAME_BY_ID } from '../lib/generations';
  import { reducedMotion } from '../lib/motion';
  import { mediaSource, loadMediaCatalog, needsMediaPreview } from '../lib/media';
  let { pokemon, imageSet = 'artwork', illustration, side = 'front', eager = false, detail = false, allowAnimation = false }: { pokemon: Pokemon; imageSet?: ImageSet; illustration?: IllustrationId; side?: SpriteSide; eager?: boolean; detail?: boolean; allowAnimation?: boolean } = $props();
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
  const original = $derived(sources[0] === placeholder ? null : sources[0]);
  let catalogReady = $state(false);
  const media = $derived(catalogReady ? mediaSource(original, detail ? 640 : 160) : { preview: null, animated: false });
  let playing = $state(false);
  let failed = $state(false);
  let imageElement = $state<HTMLImageElement>();
  $effect(() => { original; playing = false; failed = false; });
  $effect(() => {
    const source = original; const needsCatalog = needsMediaPreview(source); let live = true; catalogReady = !needsCatalog;
    if (needsCatalog) void loadMediaCatalog(source).then(() => { if (live) catalogReady = true; }).catch(() => { if (live) failed = true; });
    return () => { live = false; };
  });
  $effect(() => { if ($reducedMotion) playing = false; });
  $effect(() => {
    if (!imageElement || !allowAnimation) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => !entry.isIntersecting)) playing = false; });
    observer.observe(imageElement);
    return () => observer.disconnect();
  });
  const src = $derived(failed ? placeholder : playing && !$reducedMotion && original ? original : media.preview ?? placeholder);
</script>

<img bind:this={imageElement} {src} srcset={!detail && !playing && !failed && media.preview && media.preview !== original ? `${media.preview} 1x, ${mediaSource(original, 320).preview} 2x` : undefined}
  alt={`${pokemonName(pokemon.name, $language)} · ${imageLabel}${illustration || imageSet === 'artwork' ? '' : ' · ' + $t(side)}`} class:pixel-sprite={pixelSprite} width="240" height="240"
  loading={eager ? 'eager' : 'lazy'} decoding="async" onerror={() => { failed = true; playing = false; }}/>
{#if allowAnimation && media.animated}
  <button class="btn btn-sm animation-control" type="button" aria-pressed={playing} disabled={$reducedMotion || failed} onclick={() => playing = !playing}>{$t(playing ? 'stopAnimation' : 'playAnimation')}</button>
  {#if $reducedMotion}<p class="image-scope-note">{$t('animationReducedMotion')}</p>{/if}
{/if}
