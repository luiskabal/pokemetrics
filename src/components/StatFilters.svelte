<script lang="ts">
  import { availableStats } from '../lib/stat-explorer';
  import type { StatRange } from '../lib/stat-explorer';
  import type { HistoricalStatId } from '../lib/metadata';
  import { STAT_COLORS } from '../lib/metadata';
  import type { ViewMode } from '../lib/model';
  import { generation } from '../lib/generation-state';
  import { language, t } from '../lib/i18n';
  import { statName } from '../lib/localization';
  let { ranges, view, onChange }: { ranges: StatRange[]; view: ViewMode; onChange: (value: StatRange[]) => void } = $props();
  function update(id: HistoricalStatId, field: 'min' | 'max', raw: string) {
    const row = { ...(ranges.find(range => range.id === id) ?? { id, min: 0, max: 255 }) };
    row[field] = raw === '' ? field === 'min' ? 0 : 255 : Math.max(0, Math.min(255, Math.round(Number(raw))));
    if (row.min > row.max) row[field === 'min' ? 'max' : 'min'] = row[field];
    onChange([...ranges.filter(range => range.id !== id), ...(row.min || row.max < 255 ? [row] : [])]);
  }
</script>
<details class="card stat-filters"><summary>{$t('statFilters')}{#if ranges.length} · {ranges.length}{/if}</summary><p class="stat-note">{$t('statFiltersHelp')}</p>{#each availableStats(view, $generation) as stat}{@const range = ranges.find(row => row.id === stat.id)}<div class="stat-filter-row" style:--stat-color={STAT_COLORS[stat.id]}><label for={`min-${stat.id}`}>{statName(stat.id, $language)}</label><input class="input" id={`min-${stat.id}`} type="number" min="0" max="255" placeholder="0" value={range?.min ?? ''} aria-label={`${statName(stat.id, $language)} · ${$t('minimum')}`} onchange={event => update(stat.id, 'min', event.currentTarget.value)}/><span>–</span><input class="input" id={`max-${stat.id}`} type="number" min="0" max="255" placeholder="255" value={range?.max ?? ''} aria-label={`${statName(stat.id, $language)} · ${$t('maximum')}`} onchange={event => update(stat.id, 'max', event.currentTarget.value)}/></div>{/each}<button class="btn btn-sm" disabled={!ranges.length} onclick={() => onChange([])}>{$t('clear')}</button></details>
