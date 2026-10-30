import { percentage, piePath, visibleTypes } from './analysis';
import { generationInfo } from './generations';
import { localizedName, pokemonName, statName, translate, typeName } from './localization';
import type { Language } from './localization';
import { GEN_I_STATS, STATS } from './metadata';
import type { Analysis, Pokemon, ViewMode } from './model';
import { statsForGeneration } from './stats';

interface ExportContext { generation: number; view: ViewMode; language: Language }

function csvCell(value: string | number): string {
  if (typeof value === 'number') return String(value);
  // Evita que una celda de texto se ejecute como fórmula al abrirla en una hoja de cálculo.
  if (/^[\s\uFEFF]*[=+\-@]|^[\t\r\n]/.test(value)) value = "'" + value;
  return '"' + value.replaceAll('"', '""') + '"';
}

export function pokemonCsv(pokemon: readonly Pokemon[], context: ExportContext): string {
  const { generation, view, language } = context;
  const fields = view === 'legacy' && generation === 1 ? GEN_I_STATS : STATS;
  const tr = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const rows: (string | number)[][] = [[
    tr('chooseGeneration'), tr('typeView'), '#', 'Pokémon', tr('csvType1'), tr('csvType2'),
    `${tr('height')} (m)`, `${tr('weight')} (kg)`, ...fields.map(field => statName(field.id, language)), tr('csvStatsStatus'),
  ]];
  for (const entry of pokemon) {
    const types = visibleTypes(entry, view);
    const stats = statsForGeneration(entry, view === 'legacy' ? generation : 'current');
    rows.push([
      generation, tr(view), entry.id, pokemonName(entry.name, language),
      typeName(types[0], language), types[1] ? typeName(types[1], language) : '',
      entry.height / 10, entry.weight / 10,
      ...fields.map(field => stats?.find(stat => stat.id === field.id)?.value ?? ''), tr(stats ? 'csvAvailable' : 'csvPending'),
    ]);
  }
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

const xml = (value: string) => value.replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!);

export function chartSvg(analysis: Analysis, chart: 'pie' | 'bars', context: ExportContext, selectedSegment: string | null = null): string {
  const { generation, view, language } = context;
  const title = `Pokémetrics · ${localizedName(generationInfo(generation).names, language, `Gen ${generation}`)} · ${translate(language, view)}`;
  const selected = analysis.details.map(detail => typeName(detail.type, language));
  const filterRows = Array.from({ length: Math.ceil(selected.length / 6) }, (_, i) => selected.slice(i * 6, i * 6 + 6).join(', '));
  const top = 152 + Math.max(0, filterRows.length - 1) * 22;
  const height = top + (chart === 'pie' ? Math.max(360, analysis.groups.length * 34) : analysis.groups.length * 46 + 36) + 72;
  const text = (x: number, y: number, value: string, extra = '') => `<text x="${x}" y="${y}" ${extra}>${xml(value)}</text>`;
  const value = (count: number) => translate(language, 'countPercent', { count, percent: percentage(count, analysis.total, language) });
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}" role="img" aria-labelledby="title description">`,
    `<title id="title">${xml(title)}</title>`,
    `<desc id="description">${xml(analysis.groups.map(group => `${group.label}: ${value(group.count)}`).join('. '))}</desc>`,
    `<rect width="1200" height="${height}" fill="#fff"/>`,
    '<g font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#233b30">',
    text(24, 44, title, 'font-size="28" font-weight="700"'),
    text(24, 80, `${translate(language, chart === 'pie' ? 'pie' : 'bars')} · ${translate(language, 'pokemonCount', { count: analysis.total })}`),
    ...filterRows.map((row, i) => text(24, 112 + i * 22, `${i === 0 ? translate(language, 'selectedTypes') + ': ' : ''}${row}`, 'font-size="16"')),
  ];
  let start = 0;
  analysis.groups.forEach((group, index) => {
    const fraction = group.count / analysis.total;
    const outline = `stroke="${selectedSegment === group.key ? '#233b30' : '#fff'}" stroke-width="${selectedSegment === group.key ? 4 : 1}"`;
    if (chart === 'pie') {
      parts.push(`<path d="${piePath(start, fraction)}" transform="translate(16 ${top})" fill="${group.color}" ${outline}/>`);
      const y = top + 22 + index * 34;
      parts.push(`<rect x="430" y="${y - 15}" width="18" height="18" fill="${group.color}" ${outline}/>`, text(462, y, group.label), text(1176, y, value(group.count), 'text-anchor="end"'));
    } else {
      const y = top + index * 46;
      parts.push(text(24, y + 19, group.label), `<rect x="290" y="${y}" width="620" height="26" rx="3" fill="#edf1e8"/>`, `<rect x="290" y="${y}" width="${fraction * 620}" height="26" rx="3" fill="${group.color}" ${outline}/>`, text(1176, y + 19, value(group.count), 'text-anchor="end"'));
    }
    start += fraction;
  });
  if (chart === 'bars') for (const tick of [0, 25, 50, 75, 100]) parts.push(text(290 + tick * 6.2, top - 12, `${tick}%`, 'font-size="14"'));
  parts.push(text(24, height - 24, `PokéAPI · ${translate(language, 'exportChartTotal', { total: analysis.total })}`, 'font-size="15"'), '</g></svg>');
  return parts.join('\n');
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function chartPng(svg: string): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('SVG image could not load'));
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    const scale = Math.min(2, 4096 / image.naturalHeight);
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const drawing = canvas.getContext('2d');
    if (!drawing) throw new Error('Canvas is unavailable');
    drawing.scale(scale, scale);
    drawing.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}
