<script lang="ts">
  import { percentage, piePath } from '../lib/analysis';
  import type { Analysis } from '../lib/model';
  let { analysis, active, legacy }: { analysis: Analysis; active: boolean; legacy: boolean } = $props();
  let chart = $state<'pie' | 'bars'>('pie');
  const slices = $derived.by(() => {
    let start = 0;
    return analysis.groups.map(group => {
      const fraction = group.count / analysis.total;
      const path = piePath(start, fraction);
      start += fraction;
      return { ...group, path };
    });
  });
  const summary = $derived(analysis.groups.map(group => `${group.label}: ${group.count} Pokémon (${percentage(group.count, analysis.total)})`).join('. '));
</script>

<section class="card chart-card" aria-labelledby="chart-title">
  <div class="section-heading chart-heading">
    <h2 id="chart-title">{legacy ? 'Distribución Legacy · Gen I' : 'Distribución por tipo'}</h2>
    <div class="join view-switch chart-switch" role="group" aria-label="Tipo de gráfico">
      <button class="btn join-item" id="chart-pie" type="button" aria-pressed={chart === 'pie'} onclick={() => chart = 'pie'}>Torta</button>
      <button class="btn join-item" id="chart-bars" type="button" aria-pressed={chart === 'bars'} onclick={() => chart = 'bars'}>Barras</button>
    </div>
  </div>
  <p class="description chart-description" id="chart-caption">{legacy ? 'Tipos originales de Gen I; cada Pokémon cuenta una sola vez sobre el total de Kanto.' : 'Cada porcentaje se calcula sobre el total de Kanto.'}</p>
  {#if chart === 'bars' && active}
    <div class="bar-chart" id="bar-chart">
      <p class="bar-scale">Escala: porcentaje de los {analysis.total} Pokémon. Cada uno cuenta una vez.</p>
      <div class="bar-axis" aria-hidden="true"><span>0 %</span><span>25 %</span><span>50 %</span><span>75 %</span><span>100 %</span></div>
      <ul class="bar-list" aria-label="Distribución en barras">
        {#each analysis.groups as group (group.key)}
          <li class="bar-row" data-key={group.key}>
            <div class="bar-label"><span>{group.label}</span><span class="bar-value">{group.count} Pokémon ({percentage(group.count, analysis.total)})</span></div>
            <div class="bar-track" aria-hidden="true"><span class="bar-fill" style:width={group.count / analysis.total * 100 + '%'} style:background={group.color}></span></div>
          </li>
        {/each}
      </ul>
    </div>
  {:else}
  <div class="chart-body">
    <div class="chart-stage">
      {#if active}
        <svg class="pie" id="pie" viewBox="0 0 360 360" role="img" aria-labelledby="chart-title pie-description">
          <desc id="pie-description">{summary}</desc>
          <g id="slices">
            {#each slices as group (group.key)}
              <path class="chart-slice" d={group.path} fill={group.color} data-key={group.key}>
                <title>{group.label}: {group.count} Pokémon ({percentage(group.count, analysis.total)})</title>
              </path>
            {/each}
          </g>
        </svg>
      {:else}
        <div class="empty-chart" class:empty-bars={chart === 'bars'} id="empty-chart" aria-hidden="true"><svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2">{#if chart === 'bars'}<path d="M12 12v56h56"/><path d="M22 48h16v10H22zm0-18h32v10H22zm0-18h44v10H22z"/>{:else}<circle cx="40" cy="40" r="30"/><path d="M10 40h20m20 0h20"/><circle cx="40" cy="40" r="10"/><circle cx="40" cy="40" r="4"/>{/if}</svg></div>
      {/if}
    </div>
    <div>
      {#if active}
        <div class="legend" id="legend" aria-label="Detalle de los segmentos">
          {#each analysis.groups as group (group.key)}
            <div class="legend-item"><span class="swatch" style:background={group.color}></span><div><div class="legend-label">{group.label}</div><div class="legend-value">{group.count} Pokémon ({percentage(group.count, analysis.total)})</div></div></div>
          {/each}
        </div>
      {:else}
        <div class="legend-empty"><div class="empty-mark" aria-hidden="true">↖</div><h3>Un tipo es todo<br/>lo que necesitas para empezar.</h3><p>Selecciona un botón y aquí aparecerán sus Pokémon, su porcentaje y el resto de la generación.</p></div>
      {/if}
    </div>
  </div>
  {/if}
  <div class="chart-stats">
    <div class="chart-stat"><div class="chart-stat-label">Pokémon únicos</div><div class="chart-stat-value"><span id="matched">{active ? analysis.matches.length : '—'}</span>{#if active}<small>de {analysis.total}</small>{/if}</div></div>
    <div class="chart-stat"><div class="chart-stat-label">De la generación</div><div class="chart-stat-value" id="coverage">{active ? percentage(analysis.matches.length, analysis.total) : '—'}</div></div>
    <div class="chart-stat"><div class="chart-stat-label">Otros Pokémon</div><div class="chart-stat-value" id="remaining">{active ? analysis.remaining : '—'}</div></div>
  </div>
</section>
