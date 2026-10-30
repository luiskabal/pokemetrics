<script lang="ts">
  import { HISTORICAL_ARTWORKS } from '../lib/metadata';
  import { pokemonName } from '../lib/analysis';
  import type { Pokemon } from '../lib/model';
  let { pokemon }: { pokemon: Pokemon } = $props();
  const illustrations = $derived([
    ...HISTORICAL_ARTWORKS.flatMap(version => {
      const url = pokemon.historicalArtworks?.[version.id];
      return url ? [{ id: version.id, label: version.name, url }] : [];
    }),
    ...(pokemon.image ? [{ id: 'current', label: 'Arte actual', url: pokemon.image }] : []),
  ].filter((image, index, images) => images.findIndex(other => other.url === image.url) === index));
  let selectedId = $state<string | null>(null);
  let failedUrls = $state<string[]>([]);
  const current = $derived(illustrations.find(image => image.id === selectedId) ?? illustrations[0]);
</script>

<section class="illustration-gallery" aria-labelledby="illustration-title">
  <div class="section-heading"><h3 id="illustration-title">Ilustraciones oficiales</h3>{#if current}<a class="text-button" href={current.url} target="_blank" rel="noopener noreferrer">Ver imagen ↗</a>{/if}</div>
  <p class="image-scope-note">{illustrations.length > 1 ? 'Pasa el cursor, enfoca una opción o tócala para comparar las ilustraciones.' : 'Se muestran las ilustraciones disponibles para este Pokémon.'}</p>
  {#if current}
    <div class="illustration-stage" id="illustration-stage">
      {#each illustrations as image (image.url)}
        {#if failedUrls.includes(image.url)}
          <p class="illustration-unavailable" hidden={current.id !== image.id}>Esta ilustración no está disponible.</p>
        {:else}
          <img src={image.url} alt={`${pokemonName(pokemon.name)} · Ilustración de ${image.label}`} hidden={current.id !== image.id} width="475" height="475" loading="eager" decoding="async" onerror={() => failedUrls = [...failedUrls, image.url]}/>
        {/if}
      {/each}
    </div>
    {#if illustrations.length > 1}
      <div class="illustration-options" role="group" aria-label="Elegir ilustración">
        {#each illustrations as image (image.id)}
          <button type="button" class="btn btn-sm" aria-pressed={current.id === image.id} data-artwork={image.id}
            onpointerenter={event => { if (event.pointerType === 'mouse') selectedId = image.id; }}
            onfocus={() => selectedId = image.id} onclick={() => selectedId = image.id}>{image.label}</button>
        {/each}
      </div>
    {/if}
    <p class="illustration-caption" role="status" aria-live="polite">{current.label}</p>
  {:else}
    <p class="illustration-unavailable">No hay ilustraciones disponibles.</p>
  {/if}
  {#if pokemon.historicalArtworks === undefined}<p class="image-scope-note">Las ilustraciones históricas se cargarán al actualizar los datos.</p>{/if}
</section>
