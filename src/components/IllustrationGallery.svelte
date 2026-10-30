<script lang="ts">
  import { generation } from '../lib/generation-state';
  import { illustrationOptions } from '../lib/generations';
  import type { IllustrationId } from '../lib/metadata';
  import type { Pokemon } from '../lib/model';
  import PokemonImage from './PokemonImage.svelte';
  import { language, t } from '../lib/i18n';
  import { imageName } from '../lib/localization';
  let { pokemon, defaultIllustration }: { pokemon: Pokemon; defaultIllustration: IllustrationId } = $props();
  const illustrations = $derived(illustrationOptions($generation).map(version => ({ ...version, url: version.id === 'current' ? pokemon.image : version.id.startsWith('game:') ? pokemon.gameSprites[version.id.slice(5)]?.front : pokemon.historicalArtworks?.[version.id as keyof typeof pokemon.historicalArtworks] })));
  let selectedId = $state<IllustrationId | null>(null);
  // Al navegar entre generaciones, la elección anterior puede dejar de existir en la nueva edición.
  const current = $derived(illustrations.find(image => image.id === (selectedId ?? defaultIllustration)) ?? illustrations[0]);
</script>

<section class="illustration-gallery" aria-labelledby="illustration-title">
  <div class="section-heading"><h3 id="illustration-title">{$t('officialIllustrations')}</h3>{#if current.url}<a class="text-button" href={current.url} target="_blank" rel="noopener noreferrer">{$t('viewImage')}</a>{/if}</div>
  <p class="image-scope-note">{$t('compareHelp')}</p>
  <div class="illustration-stage" id="illustration-stage">
    {#each illustrations as image (image.id)}
      <div hidden={current.id !== image.id}><PokemonImage {pokemon} illustration={image.id} eager/></div>
    {/each}
  </div>
  <div class="illustration-options" role="group" aria-label={$t('chooseIllustration')}>
    {#each illustrations as image (image.id)}
      <button type="button" class="btn btn-sm" aria-pressed={current.id === image.id} data-artwork={image.id} disabled={!image.url}
        onpointerenter={event => { if (event.pointerType === 'mouse' && image.url) selectedId = image.id; }}
        onfocus={() => selectedId = image.id} onclick={() => selectedId = image.id}>{imageName(image.id, $language)}</button>
    {/each}
  </div>
  <p class="illustration-caption" role="status" aria-live="polite">{imageName(current.id, $language)}</p>
  {#if pokemon.historicalArtworks === undefined}<p class="image-scope-note">{$t('historicalPending')}</p>{/if}
</section>
