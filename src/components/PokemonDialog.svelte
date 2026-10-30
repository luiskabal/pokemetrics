<script lang="ts">
  import { STATS, TYPE_BY_ID } from '../lib/metadata';
  import type { IllustrationId, ImageSet } from '../lib/metadata';
  import { pokemonName, visibleTypes } from '../lib/analysis';
  import type { Pokemon, ViewMode } from '../lib/model';
  import PokemonImage from './PokemonImage.svelte';
  import TypeBadge from './TypeBadge.svelte';
  import ImageSelector from './ImageSelector.svelte';
  import IllustrationGallery from './IllustrationGallery.svelte';
  import { language, t } from '../lib/i18n';
  import { LOCALES, statName } from '../lib/localization';
  let { pokemon, view, defaultImageSet, defaultIllustration, onClose }: { pokemon: Pokemon | null; view: ViewMode; defaultImageSet: ImageSet; defaultIllustration: IllustrationId; onClose: () => void } = $props();
  let localImageSet = $state<ImageSet | null>(null);
  const imageSet = $derived(localImageSet ?? defaultImageSet);
  let dialog: HTMLDialogElement;
  const types = $derived(pokemon ? visibleTypes(pokemon, view) : []);
  const type = $derived(types.length ? TYPE_BY_ID[types[0]] : null);
  $effect(() => {
    if (pokemon) dialog.showModal();
    else if (dialog.open) dialog.close();
  });
</script>

<dialog bind:this={dialog} class="pokemon-dialog" id="pokemon-dialog" aria-labelledby="pokemon-dialog-name" aria-describedby="pokemon-dialog-view"
  onclose={() => { localImageSet = null; onClose(); }} onpointerdown={event => { if (event.target === dialog) dialog.close(); }}
  style:--pokemon-tint={type?.tint} style:--pokemon-color={type?.color}>
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
      <section class="pokemon-stats" aria-labelledby="pokemon-stats-title">
        <h3 id="pokemon-stats-title">{$t('baseStats')}</h3><p class="stat-note">{$t('statNote')}</p>
        <dl class="stat-list" id="pokemon-stats">
          {#each STATS as stat (stat.id)}
            {@const value = pokemon.stats.find(item => item.id === stat.id)!.value}
            <div class="stat-row"><dt>{statName(stat.id, $language)}</dt><dd><span>{value}</span><span class="stat-track" aria-hidden="true"><span class="stat-fill" style:width={Math.min(value / 255 * 100, 100) + '%'}></span></span></dd></div>
          {/each}
        </dl>
      </section>
    </div>
  {/if}
</dialog>
