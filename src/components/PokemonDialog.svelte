<script lang="ts">
  import { tick } from 'svelte';
  import { TYPE_BY_ID } from '../lib/metadata';
  import type { IllustrationId, ImageSet } from '../lib/metadata';
  import { pokemonName, visibleTypes } from '../lib/analysis';
  import type { Pokemon, ViewMode } from '../lib/model';
  import PokemonImage from './PokemonImage.svelte';
  import TypeBadge from './TypeBadge.svelte';
  import ImageSelector from './ImageSelector.svelte';
  import IllustrationGallery from './IllustrationGallery.svelte';
  import PokemonStats from './PokemonStats.svelte';
  import PokemonMatchups from './PokemonMatchups.svelte';
  import ShareLink from './ShareLink.svelte';
  import FavoriteButton from './FavoriteButton.svelte';
  import PokemonDetails from './PokemonDetails.svelte';
  import { language, t } from '../lib/i18n';
  import { LOCALES } from '../lib/localization';
  let { pokemon, view, defaultImageSet, defaultIllustration, onClose, shareUrl, isFavorite, onFavorite, onEvolution }: { pokemon: Pokemon | null; view: ViewMode; defaultImageSet: ImageSet; defaultIllustration: IllustrationId; onClose: () => void; shareUrl: string; isFavorite: boolean; onFavorite: (id: number) => void; onEvolution: (id: number) => void } = $props();
  let localImageSet = $state<ImageSet | null>(null);
  let spritesOpen = $state(false);
  let movesOpen = $state(false);
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
  onclose={() => { localImageSet = null; spritesOpen = false; movesOpen = false; if (pendingStateCloses) pendingStateCloses--; else onClose(); }} onpointerdown={event => { if (event.target === dialog) dialog.close(); }}
  style:--pokemon-tint={type?.tint} style:--pokemon-color={type?.color} style:--pokemon-ink={type?.ink}>
  {#if pokemon}
    {#key pokemon.id}
    <div class="dialog-content">
      <header class="pokemon-dialog-toolbar"><span>#{String(pokemon.id).padStart(3, '0')} · {pokemonName(pokemon.name, $language)}</span><form method="dialog"><button class="btn btn-sm" type="submit" aria-label={$t('closeDetails')}>{$t('backToList')} <span aria-hidden="true">×</span></button></form></header>
      <div class="pokemon-hero">
        <div class="pokemon-artwork">
          <IllustrationGallery {pokemon} {defaultIllustration}/>
        </div>
        <div class="pokemon-identity"><p class="dialog-number">{$t('pokedex')} · #{String(pokemon.id).padStart(3, '0')}</p>
          <h2 class="dialog-name" id="pokemon-dialog-name">{pokemonName(pokemon.name, $language)}</h2>
          <p class="dialog-type-caption" id="pokemon-dialog-view">{$t(view === 'legacy' ? 'originalTypes' : 'currentTypes')}</p>
          <div class="pokemon-types">{#each types as type (type)}<TypeBadge {type}/>{/each}</div>
          <div class="identity-facts"><dl class="physical-details"><div><dt>{$t('height')}</dt><dd id="pokemon-height">{(pokemon.height / 10).toLocaleString(LOCALES[$language])} m</dd></div><div><dt>{$t('weight')}</dt><dd id="pokemon-weight">{(pokemon.weight / 10).toLocaleString(LOCALES[$language])} kg</dd></div></dl>
          <div class="detail-actions"><ShareLink url={shareUrl} id="share-pokemon"/><FavoriteButton {pokemon} active={isFavorite} onToggle={onFavorite}/></div></div>
        </div>
        <PokemonStats {pokemon} {view}/>
      </div>
      <PokemonMatchups {pokemon} {view}/>
      <details class="detail-section" id="pokemon-moves" bind:open={movesOpen}><summary>{$t('levelMoves')}</summary>{#if movesOpen}{#await import('./PokemonMoves.svelte')}<p role="status">{$t('infoLoading')}</p>{:then module}<module.default id={pokemon.id}/>{:catch}<p role="status">{$t('infoError')}</p>{/await}{/if}</details>
      <details class="sprite-details" bind:open={spritesOpen}>
        <summary>{$t('gameImages')}</summary>
        {#if spritesOpen}
        <div class="sprite-detail-content">
          {#if imageSet === 'artwork'}
            <div class="detail-artwork"><PokemonImage {pokemon} {imageSet} eager detail allowAnimation/></div>
          {:else}
            <div class="sprite-gallery">
              <figure class="sprite-frame"><PokemonImage {pokemon} {imageSet} side="front" eager detail allowAnimation/><figcaption>{$t('front')}</figcaption></figure>
              <figure class="sprite-frame"><PokemonImage {pokemon} {imageSet} side="back" eager detail allowAnimation/><figcaption>{$t('back')}</figcaption></figure>
            </div>
          {/if}
          <div>
            <ImageSelector id="dialog-image-set" label={$t('detailImageLocal')} value={imageSet} onChange={value => localImageSet = value}/>
            <p class="image-scope-note">{$t('detailImageLocalHelp')}</p>
          </div>
        </div>
        {/if}
      </details>
      <PokemonDetails {pokemon} {view} onOpen={async id => { localImageSet = null; spritesOpen = false; onEvolution(id); await tick(); dialog.scrollTop = 0; }}/>
    </div>
    {/key}
  {/if}
</dialog>
