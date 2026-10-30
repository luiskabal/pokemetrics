<script lang="ts">
  import { percentage, piePath } from '../lib/analysis';
  import type { Analysis } from '../lib/model';
  let { analysis, active, legacy }: { analysis: Analysis; active: boolean; legacy: boolean } = $props();
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
  <div class="section-heading"><h2 id="chart-title">{legacy ? 'Distribución Legacy · Gen I' : 'Distribución por tipo'}</h2><span class="badge chart-kind">◔ Torta</span></div>
  <p class="description chart-description" id="chart-caption">{legacy ? 'Tipos originales de Gen I; cada Pokémon cuenta una sola vez sobre el total de Kanto.' : 'Cada porcentaje se calcula sobre el total de Kanto.'}</p>
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
        <div class="empty-chart" id="empty-chart" aria-hidden="true"><svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="2"><circle cx="40" cy="40" r="30"/><path d="M10 40h20m20 0h20"/><circle cx="40" cy="40" r="10"/><circle cx="40" cy="40" r="4"/></svg></div>
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
  <div class="chart-stats">
    <div class="chart-stat"><div class="chart-stat-label">Pokémon únicos</div><div class="chart-stat-value"><span id="matched">{active ? analysis.matches.length : '—'}</span>{#if active}<small>de {analysis.total}</small>{/if}</div></div>
    <div class="chart-stat"><div class="chart-stat-label">De la generación</div><div class="chart-stat-value" id="coverage">{active ? percentage(analysis.matches.length, analysis.total) : '—'}</div></div>
    <div class="chart-stat"><div class="chart-stat-label">Otros Pokémon</div><div class="chart-stat-value" id="remaining">{active ? analysis.remaining : '—'}</div></div>
  </div>
</section>
