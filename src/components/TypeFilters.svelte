<script lang="ts">
  import { LEGACY_TYPES, TYPES } from '../lib/metadata';
  import type { TypeId } from '../lib/metadata';
  import TypeIcon from './TypeIcon.svelte';
  let { legacy, selected, disabled, onToggle, onAll, onClear }: {
    legacy: boolean; selected: ReadonlySet<TypeId>; disabled: boolean;
    onToggle: (type: TypeId) => void; onAll: () => void; onClear: () => void;
  } = $props();
  const types = $derived(legacy ? LEGACY_TYPES : TYPES);
</script>

<aside class="card filters" aria-labelledby="filters-title">
  <div class="section-heading"><h2 id="filters-title">Elige los tipos</h2><span class="step">01 / EXPLORA</span></div>
  <p class="description" id="filters-help">Combina uno o más tipos. Vuelve a pulsar un botón para quitarlo del gráfico.</p>
  <div class="filter-actions">
    <span class="selection-count" id="selection-count">{selected.size} de {types.length} seleccionados</span>
    <div class="action-group">
      <button class="btn btn-ghost btn-xs text-button" id="select-all" type="button" {disabled} onclick={onAll}>Todos</button>
      <button class="btn btn-ghost btn-xs text-button" id="clear" type="button" disabled={disabled || !selected.size} onclick={onClear}>Limpiar</button>
    </div>
  </div>
  <div class="type-grid" id="type-grid" role="group" aria-label="Filtrar por tipo de Pokémon" aria-describedby="filters-help" aria-busy={disabled}>
    {#each types as type (type.id)}
      <button type="button" class="type-button" data-type={type.id} aria-label={type.name} aria-pressed={selected.has(type.id)}
        {disabled} onclick={() => onToggle(type.id)}
        style:--color={type.color} style:--tint={type.tint} style:--type-ink={type.ink} style:--on-color={type.on}>
        <TypeIcon type={type.id} /><span>{type.name}</span>
      </button>
    {/each}
  </div>
  <p class="filter-footnote"><span aria-hidden="true">ⓘ</span><span id="filter-note">{legacy
    ? 'Los 15 tipos originales, sin Hada, Acero ni Siniestro. Los tipos secundarios no se cuentan.'
    : 'Incluye tipos actuales como Hada y Acero. Siniestro no tiene Pokémon en esta generación.'}</span></p>
</aside>
