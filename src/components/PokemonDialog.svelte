<script lang="ts">
  import { STATS, TYPE_BY_ID } from '../lib/metadata';
  import type { ImageSet } from '../lib/metadata';
  import { pokemonName, visibleTypes } from '../lib/analysis';
  import type { Pokemon, ViewMode } from '../lib/model';
  import PokemonImage from './PokemonImage.svelte';
  import TypeBadge from './TypeBadge.svelte';
  import ImageSelector from './ImageSelector.svelte';
  import IllustrationGallery from './IllustrationGallery.svelte';
  let { pokemon, view, defaultImageSet, onClose }: { pokemon: Pokemon | null; view: ViewMode; defaultImageSet: ImageSet; onClose: () => void } = $props();
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
      <form method="dialog"><button class="btn btn-circle dialog-close" type="submit" aria-label="Cerrar ficha">×</button></form>
      <div class="pokemon-hero">
        <div class="pokemon-artwork">
          {#if imageSet === 'artwork'}
            <PokemonImage {pokemon} {imageSet} eager/>
          {:else}
            <div class="sprite-gallery">
              <figure class="sprite-frame"><PokemonImage {pokemon} {imageSet} side="front" eager/><figcaption>Frente</figcaption></figure>
              <figure class="sprite-frame"><PokemonImage {pokemon} {imageSet} side="back" eager/><figcaption>Espalda</figcaption></figure>
            </div>
          {/if}
        </div>
        <div><p class="dialog-number">POKÉDEX · #{String(pokemon.id).padStart(3, '0')}</p>
          <h2 class="dialog-name" id="pokemon-dialog-name">{pokemonName(pokemon.name)}</h2>
          <p class="dialog-type-caption" id="pokemon-dialog-view">{view === 'legacy' ? 'Tipos originales · Gen I' : 'Tipos actuales'}</p>
          <div class="pokemon-types">{#each types as type (type)}<TypeBadge {type}/>{/each}</div>
          <ImageSelector id="dialog-image-set" label="Imágenes de esta ficha" value={imageSet} onChange={value => localImageSet = value}/>
          <p class="image-scope-note">Solo cambia esta ficha. Al volver a abrirla se usa el juego elegido en el filtro.</p>
          <dl class="physical-details"><div><dt>Altura</dt><dd id="pokemon-height">{(pokemon.height / 10).toLocaleString('es-CL')} m</dd></div><div><dt>Peso</dt><dd id="pokemon-weight">{(pokemon.weight / 10).toLocaleString('es-CL')} kg</dd></div></dl>
        </div>
      </div>
      <IllustrationGallery {pokemon}/>
      <section class="pokemon-stats" aria-labelledby="pokemon-stats-title">
        <h3 id="pokemon-stats-title">Estadísticas base actuales</h3><p class="stat-note">Datos actuales de PokéAPI, también al consultar la vista Legacy.</p>
        <dl class="stat-list" id="pokemon-stats">
          {#each STATS as stat (stat.id)}
            {@const value = pokemon.stats.find(item => item.id === stat.id)!.value}
            <div class="stat-row"><dt>{stat.name}</dt><dd><span>{value}</span><span class="stat-track" aria-hidden="true"><span class="stat-fill" style:width={Math.min(value / 255 * 100, 100) + '%'}></span></span></dd></div>
          {/each}
        </dl>
      </section>
    </div>
  {/if}
</dialog>
