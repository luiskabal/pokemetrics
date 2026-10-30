<script lang="ts">
  import { generation } from '../lib/generation-state';
  import { generationInfo } from '../lib/generations';
  import { analyzePokemon, percentage } from '../lib/analysis';
  import { fetchGeneration, readCache, writeCache } from '../lib/pokeapi';
  import { localizedName, typeName } from '../lib/localization';
  import { language, t } from '../lib/i18n';
  import type { Pokemon, ViewMode } from '../lib/model';
  import type { TypeId } from '../lib/metadata';
  let { pokemon, other, selected, view }: { pokemon: Pokemon[]; other: number; selected: ReadonlySet<TypeId>; view: ViewMode } = $props();
  let secondary = $state.raw<Pokemon[]>([]);
  let failed = $state(false);
  let loading = $state(false);
  let retry = $state(0);
  const primary = $derived(analyzePokemon(pokemon, selected, view, $language));
  const comparison = $derived(analyzePokemon(secondary, selected, view, $language));
  $effect(() => {
    retry; const id = other; const controller = new AbortController();
    secondary = readCache(id)?.pokemon ?? []; failed = false; loading = true;
    void fetchGeneration(id, controller.signal, () => {}).then(entries => { if (!controller.signal.aborted) { secondary = entries; writeCache(entries, id); } }).catch(() => { if (!controller.signal.aborted) failed = true; }).finally(() => { if (!controller.signal.aborted) loading = false; });
    return () => controller.abort();
  });
</script>
<section class="card generation-comparison" aria-labelledby="generation-comparison-title">
  <h2 id="generation-comparison-title">{$t('generationComparison')}</h2>
  <p class="description">{$t('generationComparisonHelp')}</p>
  {#if loading}<p class="stat-note" role="status">{$t('comparisonLoading')}</p>{/if}
  {#if failed}<p class="stat-note" role="status">{$t('comparisonError')}</p><button class="btn btn-sm" type="button" onclick={() => retry++}>{$t('retry')}</button>{/if}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (La comparación desplazable necesita foco para usar las flechas del teclado.) -->
  <div class="comparison-scroll" role="region" aria-label={$t('generationComparison')} tabindex="0">
    <table class="comparison-table generation-table">
      <thead><tr><th scope="col">{$t('compareField')}</th><th scope="col">{localizedName(generationInfo($generation).names, $language, '')}<small>{primary.total || '—'} Pokémon</small></th><th scope="col">{localizedName(generationInfo(other).names, $language, '')}<small>{comparison.total || '—'} Pokémon</small></th></tr></thead>
      <tbody><tr><th scope="row">{$t('uniquePokemon')}</th><td>{primary.total ? `${primary.matches.length} (${percentage(primary.matches.length, primary.total, $language)})` : '—'}</td><td>{comparison.total ? `${comparison.matches.length} (${percentage(comparison.matches.length, comparison.total, $language)})` : '—'}</td></tr>
        {#each primary.details as detail (detail.type)}<tr data-generation-type={detail.type}><th scope="row">{typeName(detail.type, $language)}</th><td>{detail.count} ({percentage(detail.count, primary.total, $language)})</td><td>{comparison.total ? `${comparison.details.find(item => item.type === detail.type)!.count} (${percentage(comparison.details.find(item => item.type === detail.type)!.count, comparison.total, $language)})` : '—'}</td></tr>{/each}
      </tbody>
    </table>
  </div>
</section>
