<script lang="ts">
  import type { Pokemon, ViewMode } from '../lib/model';
  import { defensiveMatchups } from '../lib/effectiveness';
  import { visibleTypes } from '../lib/analysis';
  import { generation } from '../lib/generation-state';
  import { t } from '../lib/i18n';
  import TypeBadge from './TypeBadge.svelte';
  let { pokemon, view }: { pokemon: Pokemon; view: ViewMode } = $props();
  const matchups = $derived(defensiveMatchups(visibleTypes(pokemon, view), view === 'legacy' ? $generation : 'current'));
  const groups = $derived([
    { label: 'weaknesses' as const, entries: matchups.filter(entry => entry.multiplier > 1) },
    { label: 'resistances' as const, entries: matchups.filter(entry => entry.multiplier > 0 && entry.multiplier < 1) },
    { label: 'immunities' as const, entries: matchups.filter(entry => entry.multiplier === 0) },
  ]);
</script>
<section class="detail-section type-matchups" aria-labelledby="matchups-title">
  <h3 id="matchups-title">{$t('defensiveMatchups')}</h3>
  <p class="description">{$t(view === 'legacy' ? 'matchupsHistorical' : 'matchupsCurrent', { generation: $generation })}</p>
  <div class="matchup-groups">{#each groups as group}<div><h4>{$t(group.label)}</h4><div class="matchup-chips">{#each group.entries as entry}<span class="matchup-item" data-attacking-type={entry.type} data-multiplier={entry.multiplier}><TypeBadge type={entry.type}/><strong>×{entry.multiplier}</strong></span>{:else}<span class="stat-note">{$t('none')}</span>{/each}</div></div>{/each}</div>
  <p class="stat-note">{$t('matchupsScope')}</p>
</section>
