<script lang="ts">
  import type { GameId, HistoricalStatId } from '../lib/metadata';
  import type { Pokemon, ViewMode } from '../lib/model';
  import { statsForGeneration } from '../lib/stats';
  import { language, t } from '../lib/i18n';
  import { imageName, statName } from '../lib/localization';
  import { generation } from '../lib/generation-state';
  import { generationInfo } from '../lib/generations';
  import { localizedName } from '../lib/localization';

  let { pokemon, view }: { pokemon: Pokemon; view: ViewMode } = $props();
  let localVersion = $state<GameId | 'current' | null>(null);
  let chart = $state<'radar' | 'bars'>('radar');
  const version = $derived(localVersion ?? (view === 'legacy' ? generationInfo($generation).games[0].id : 'current'));
  const current = $derived(version === 'current');
  const stats = $derived(statsForGeneration(pokemon, current ? 'current' : $generation));
  const summary = $derived(stats?.map(stat => `${statName(stat.id, $language)}: ${stat.value}`).join('. ') ?? '');

  function point(index: number, count: number, fraction = 1) {
    const angle = index * Math.PI * 2 / count;
    return { x: 200 + Math.sin(angle) * 95 * fraction, y: 148 - Math.cos(angle) * 95 * fraction };
  }

  function polygon(values: readonly number[]): string {
    return values.map((value, index) => {
      const position = point(index, values.length, value / 255);
      return `${position.x},${position.y}`;
    }).join(' ');
  }

  function axisLabel(id: HistoricalStatId): string {
    if (id === 'special-attack') return $t('specialAttackShort');
    if (id === 'special-defense') return $t('specialDefenseShort');
    return statName(id, $language);
  }
</script>

<section class="pokemon-stats" aria-labelledby="pokemon-stats-title">
  <div class="section-heading stats-heading">
    <h3 id="pokemon-stats-title">{$t('baseStats')}</h3>
    <div class="join view-switch chart-switch" role="group" aria-label={$t('statsChart')}>
      <button class="btn join-item" id="stats-radar" type="button" aria-pressed={chart === 'radar'} disabled={!stats} onclick={() => chart = 'radar'}>{$t('statsRadar')}</button>
      <button class="btn join-item" id="stats-bars" type="button" aria-pressed={chart === 'bars'} disabled={!stats} onclick={() => chart = 'bars'}>{$t('bars')}</button>
    </div>
  </div>
  <div class="stats-version image-selector">
    <label for="pokemon-stats-version">{$t('statsVersion')}</label>
    <select class="select" id="pokemon-stats-version" value={version} aria-describedby="stats-note" onchange={event => localVersion = event.currentTarget.value as GameId | 'current'}>
      <option value="current">{$t('statsCurrent')}</option>
      {#each generationInfo($generation).games as game (game.id)}<option value={game.id}>{imageName(game.id, $language)}</option>{/each}
    </select>
  </div>
  <p class="stat-note" id="stats-note">{$t(current ? 'statNote' : $generation === 1 ? 'statLegacyNote' : 'statHistoricalNote', { generation: localizedName(generationInfo($generation).names, $language, '') })}</p>
  {#if stats}
    <div class="stats-body" class:stats-body-radar={chart === 'radar'}>
      {#if chart === 'radar'}
        <svg class="stat-radar" id="pokemon-stat-radar" viewBox="0 0 400 320" role="img" aria-labelledby="stat-radar-title stat-radar-description">
          <title id="stat-radar-title">{$t('statsChart')}</title>
          <desc id="stat-radar-description">{summary}</desc>
          {#each [85, 170, 255] as level}
            <polygon class="radar-grid" points={polygon(stats.map(() => level))}/>
          {/each}
          {#each stats as stat, index (stat.id)}
            {@const end = point(index, stats.length)}
            <line class="radar-axis" x1="200" y1="148" x2={end.x} y2={end.y}/>
          {/each}
          <polygon class="radar-shape" points={polygon(stats.map(stat => stat.value))}/>
          {#each stats as stat, index (stat.id)}
            {@const marker = point(index, stats.length, stat.value / 255)}
            {@const label = point(index, stats.length, 1.33)}
            <circle class="radar-marker" cx={marker.x} cy={marker.y} r="3.5"/>
            <text class="radar-label" x={label.x} y={label.y} text-anchor={Math.abs(label.x - 200) < 1 ? 'middle' : label.x > 200 ? 'start' : 'end'}>{axisLabel(stat.id)}<tspan class="radar-value" x={label.x} dy="18">{stat.value}</tspan></text>
          {/each}
        </svg>
      {/if}
      <dl class="stat-list" id="pokemon-stats" class:stat-values={chart === 'radar'}>
        {#each stats as stat (stat.id)}
          <div class="stat-row" data-stat={stat.id}><dt>{statName(stat.id, $language)}</dt><dd><span class="stat-number">{stat.value}</span>{#if chart === 'bars'}<span class="stat-track" aria-hidden="true"><span class="stat-fill" style:width={stat.value / 255 * 100 + '%'}></span></span>{/if}</dd></div>
        {/each}
      </dl>
    </div>
  {:else}
    <p class="stats-pending" role="status">{$t('statsPending')}</p>
  {/if}
  <details class="stats-source-notes"><summary>{$t('statsDataNotes')}</summary><p class="stat-note">{$t('statsDefaultForm')}</p>{#if !current}<p class="stat-note">{$t($generation === 1 ? 'statsShared' : 'statsSharedGeneral')}</p>{/if}<p class="stat-note">{$t('statsScale')}</p></details>
</section>
