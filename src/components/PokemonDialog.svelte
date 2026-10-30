<script lang="ts">
  import { TYPE_BY_ID } from '../lib/metadata';
  import type { IllustrationId, ImageSet } from '../lib/metadata';
  import { pokemonName, visibleTypes } from '../lib/analysis';
  import type { Pokemon, ViewMode } from '../lib/model';
  import PokemonImage from './PokemonImage.svelte';
  import TypeBadge from './TypeBadge.svelte';
  import ImageSelector from './ImageSelector.svelte';
  import IllustrationGallery from './IllustrationGallery.svelte';
  import PokemonStats from './PokemonStats.svelte';
  import ShareLink from './ShareLink.svelte';
  import { language, t } from '../lib/i18n';
  import { LOCALES } from '../lib/localization';
  let { pokemon, view, defaultImageSet, defaultIllustration, onClose, shareUrl }: { pokemon: Pokemon | null; view: ViewMode; defaultImageSet: ImageSet; defaultIllustration: IllustrationId; onClose: () => void; shareUrl: string } = $props();
  let localImageSet = $state<ImageSet | null>(null);
  const imageSet = $derived(localImageSet ?? defaultImageSet);
  let dialog: HTMLDialogElement;
  // close llega después: varias navegaciones rápidas pueden dejar más de un cierre de estado pendiente.
  let pendingStateCloses = 0;
  const types = $derived(pokemon ? visibleTypes(pokemon, view) : []);
  const type = $derived(types.length ? TYPE_BY_ID[types[0]] : null);
  $effect(() => {
    if (pokemon) dialog.showModal();
    else if (dialog.open) { pendingStateCloses++; dialog.close(); }
  });
</script>

<dialog bind:this={dialog} class="pokemon-dialog" id="pokemon-dialog" aria-labelledby="pokemon-dialog-name" aria-describedby="pokemon-dialog-view"
  onclose={() => { localImageSet = null; if (pendingStateCloses) pendingStateCloses--; else onClose(); }} onpointerdown={event => { if (event.target === dialog) dialog.close(); }}
  style:--pokemon-tint={type?.tint} style:--pokemon-color={type?.color} style:--pokemon-ink={type?.ink}>
  {#if pokemon}
    <div class="dialog-content">
      <form method="dialog"><button class="btn btn-circle dialog-close" type="submit" aria-label={$t('closeDetails')}>×</button></form>
      <div class="pokemon-hero">
        <div class="pokemon-artwork">
          <IllustrationGallery {pokemon} {defaultIllustration}/>
        </div>
        <div><p class="dialog-number">{$t('pokedex')} · #{String(pokemon.id).padStart(3, '0')}</p>
          <h2 class="dialog-name" id="pokemon-dialog-name">{pokemonName(pokemon.name, $language)}</h2>
          <p class="dialog-type-caption" id="pokemon-dialog-view">{$t(view === 'legacy' ? 'originalTypes' : 'currentTypes')}</p>
          <div class="pokemon-types">{#each types as type (type)}<TypeBadge {type}/>{/each}</div>
          <dl class="physical-details"><div><dt>{$t('height')}</dt><dd id="pokemon-height">{(pokemon.height / 10).toLocaleString(LOCALES[$language])} m</dd></div><div><dt>{$t('weight')}</dt><dd id="pokemon-weight">{(pokemon.weight / 10).toLocaleString(LOCALES[$language])} kg</dd></div></dl>
          <ShareLink url={shareUrl} id="share-pokemon"/>
        </div>
      </div>
      <details class="sprite-details">
        <summary>{$t('gameImages')}</summary>
        <div class="sprite-detail-content">
          {#if imageSet === 'artwork'}
            <div class="detail-artwork"><PokemonImage {pokemon} {imageSet} eager/></div>
          {:else}
            <div class="sprite-gallery">
              <figure class="sprite-frame"><PokemonImage {pokemon} {imageSet} side="front" eager/><figcaption>{$t('front')}</figcaption></figure>
              <figure class="sprite-frame"><PokemonImage {pokemon} {imageSet} side="back" eager/><figcaption>{$t('back')}</figcaption></figure>
            </div>
          {/if}
          <div>
            <ImageSelector id="dialog-image-set" label={$t('detailImageLocal')} value={imageSet} onChange={value => localImageSet = value}/>
            <p class="image-scope-note">{$t('detailImageLocalHelp')}</p>
          </div>
        </div>
      </details>
      <PokemonStats {pokemon} {view}/>
    </div>
  {/if}
</dialog>
