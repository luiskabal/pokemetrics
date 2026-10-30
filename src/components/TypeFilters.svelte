<script lang="ts">
  import { TYPES } from '../lib/metadata';
  import type { ImageSet, TypeId } from '../lib/metadata';
  import TypeIcon from './TypeIcon.svelte';
  import ImageSelector from './ImageSelector.svelte';
  import { language, t } from '../lib/i18n';
  import { typeName } from '../lib/localization';
  import { generation } from '../lib/generation-state';
  import { typesForGeneration, generationInfo } from '../lib/generations';
  import { localizedName } from '../lib/localization';
  let { legacy, selected, imageSet, onImageSetChange, disabled, onToggle, onAll, onClear }: {
    legacy: boolean; selected: ReadonlySet<TypeId>; imageSet: ImageSet; onImageSetChange: (value: ImageSet) => void; disabled: boolean;
    onToggle: (type: TypeId) => void; onAll: () => void; onClear: () => void;
  } = $props();
  const types = $derived(legacy ? typesForGeneration($generation) : TYPES);
</script>

<aside class="card filters" aria-labelledby="filters-title">
  <div class="section-heading"><h2 id="filters-title">{$t('chooseTypes')}</h2><span class="step">{$t('exploreStep')}</span></div>
  <p class="description" id="filters-help">{$t('filterHelp')}</p>
  <div class="filter-actions">
    <span class="selection-count" id="selection-count">{$t('selectionCount', { count: selected.size, total: types.length })}</span>
    <div class="action-group">
      <button class="btn btn-ghost btn-xs text-button" id="select-all" type="button" {disabled} onclick={onAll}>{$t('all')}</button>
      <button class="btn btn-ghost btn-xs text-button" id="clear" type="button" disabled={disabled || !selected.size} onclick={onClear}>{$t('clear')}</button>
    </div>
  </div>
  <div class="type-grid" id="type-grid" role="group" aria-label={$t('filterTypes')} aria-describedby="filters-help" aria-busy={disabled}>
    {#each types as type (type.id)}
      <button type="button" class="type-button" data-type={type.id} aria-label={typeName(type.id, $language)} aria-pressed={selected.has(type.id)}
        {disabled} onclick={() => onToggle(type.id)}
        style:--color={type.color} style:--tint={type.tint} style:--type-ink={type.ink} style:--on-color={type.on}>
        <TypeIcon type={type.id} /><span>{typeName(type.id, $language)}</span>
      </button>
    {/each}
  </div>
  <p class="filter-footnote"><span aria-hidden="true">ⓘ</span><span id="filter-note">{$t(legacy ? 'historicalTypeNote' : 'currentTypeNoteGeneral', { count: types.length, generation: localizedName(generationInfo($generation).names, $language, '') })}</span></p>
  <div class="filter-images">
    <ImageSelector id="image-set" label={$t('detailImages')} value={imageSet} onChange={onImageSetChange}/>
    <p class="image-scope-note">{$t('detailImagesHelp')}</p>
  </div>
</aside>
