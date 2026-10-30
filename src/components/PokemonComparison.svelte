<script lang="ts">
  import { GEN_I_STATS, STATS } from '../lib/metadata';
  import type { IllustrationId } from '../lib/metadata';
  import type { Pokemon, ViewMode } from '../lib/model';
  import { statsForGeneration } from '../lib/stats';
  import { visibleTypes } from '../lib/analysis';
  import { LOCALES, pokemonName, statName } from '../lib/localization';
  import { language, t } from '../lib/i18n';
  import PokemonImage from './PokemonImage.svelte';
  import TypeBadge from './TypeBadge.svelte';
  let { pokemon, view, illustration, open, onClose, onRemove }: { pokemon: Pokemon[]; view: ViewMode; illustration: IllustrationId; open: boolean; onClose: () => void; onRemove: (id: number) => void } = $props();
  let dialog: HTMLDialogElement;
  const fields = $derived(view === 'legacy' ? GEN_I_STATS : STATS);
  const columns = $derived(pokemon.map(entry => ({ pokemon: entry, stats: statsForGeneration(entry, view === 'legacy' ? 1 : 'current') })));
  $effect(() => { if (open) dialog.showModal(); else if (dialog.open) dialog.close(); });
</script>

<dialog class="pokemon-dialog comparison-dialog" id="comparison-dialog" bind:this={dialog} aria-labelledby="comparison-title" onclose={onClose} onpointerdown={event => { if (event.target === dialog) dialog.close(); }}>
  <div class="comparison-content">
    <form method="dialog"><button class="btn dialog-close" type="submit" aria-label={$t('closeComparison')}>×</button></form>
    <h2 id="comparison-title">{$t('compareTitle')}</h2>
    <p class="description">{$t('compareUsing', { view: $t(view === 'legacy' ? 'legacy' : 'current') })}</p>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (La tabla desplazable necesita foco para el desplazamiento nativo con teclado.) -->
    <div class="comparison-scroll" role="region" aria-label={$t('compareTitle')} tabindex="0">
      <table class="comparison-table">
        <caption class="sr-only">{$t('compareTitle')}</caption>
        <thead><tr><th scope="col">{$t('compareField')}</th>{#each columns as column (column.pokemon.id)}<th scope="col"><PokemonImage pokemon={column.pokemon} {illustration}/><strong>{pokemonName(column.pokemon.name, $language)}</strong><small>#{String(column.pokemon.id).padStart(3, '0')}</small><button class="btn btn-ghost btn-xs" type="button" data-remove-compare={column.pokemon.id} onclick={() => onRemove(column.pokemon.id)} aria-label={$t('removeCompare', { name: pokemonName(column.pokemon.name, $language) })}>{$t('remove')}</button></th>{/each}</tr></thead>
        <tbody>
          <tr><th scope="row">{$t(view === 'legacy' ? 'originalTypes' : 'currentTypes')}</th>{#each columns as column (column.pokemon.id)}<td><div class="pokemon-types">{#each visibleTypes(column.pokemon, view) as type}<TypeBadge {type}/>{/each}</div></td>{/each}</tr>
          {#each fields as field (field.id)}
            {@const maximum = Math.max(...columns.map(column => column.stats?.find(stat => stat.id === field.id)?.value ?? 0))}
            <tr data-compare-stat={field.id}><th scope="row">{statName(field.id, $language)}</th>{#each columns as column (column.pokemon.id)}{@const value = column.stats?.find(stat => stat.id === field.id)?.value}<td class:compare-highest={value === maximum}>{value ?? '—'}</td>{/each}</tr>
          {/each}
          <tr><th scope="row">{$t('height')}</th>{#each columns as column (column.pokemon.id)}<td>{(column.pokemon.height / 10).toLocaleString(LOCALES[$language])} m</td>{/each}</tr>
          <tr><th scope="row">{$t('weight')}</th>{#each columns as column (column.pokemon.id)}<td>{(column.pokemon.weight / 10).toLocaleString(LOCALES[$language])} kg</td>{/each}</tr>
        </tbody>
      </table>
    </div>
    <p class="stat-note">{$t('compareHighlight')}</p>
    {#if columns.some(column => !column.stats)}<p class="stats-pending" role="status">{$t('statsPending')}</p>{/if}
  </div>
</dialog>
