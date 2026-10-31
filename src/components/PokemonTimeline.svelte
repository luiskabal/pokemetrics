<script lang="ts">
  import type { Pokemon } from '../lib/model';
  import { pokemonTimeline } from '../lib/timeline';
  import { STAT_COLORS } from '../lib/metadata';
  import { language, t } from '../lib/i18n';
  import { localizedName, statName } from '../lib/localization';
  import TypeBadge from './TypeBadge.svelte';
  let { pokemon }: { pokemon: Pokemon } = $props();
  const rows = $derived(pokemonTimeline(pokemon));
</script>
<div class="timeline-content"><p class="stat-note">{$t('timelineHelp')}</p><ol class="pokemon-timeline">{#each rows as row}<li><h3>{localizedName(row.era.names, $language, row.era.roman)}</h3><div class="pokemon-types">{#each row.types as type}<TypeBadge {type}/>{/each}{#if row.typeChange}<span class="badge">{$t('typeChanged')}</span>{/if}</div>{#if row.stats}<div class="team-stat-chips">{#each row.stats as stat}<span style:--stat-color={STAT_COLORS[stat.id]}>{statName(stat.id, $language)} <b>{stat.value}</b>{#if stat.delta}<small class="stat-delta">({stat.delta > 0 ? '+' : ''}{stat.delta})</small>{/if}</span>{/each}</div>{:else}<p>{$t('historicalStatsUnavailable')}</p>{/if}</li>{/each}</ol></div>
