import { describe, expect, it } from 'vitest';
import { analyzePokemon, filterAndSortPokemon, piePath, pokemonInSegment } from './analysis';
import { chartSvg, pokemonCsv } from './export';
import { STATS } from './metadata';
import type { Pokemon } from './model';

const pikachu: Pokemon = {
  id: 25, name: 'pikachu', types: ['electric'], legacyTypes: ['electric'],
  image: null, sprite: null, gameSprites: {}, height: 4, weight: 60,
  stats: STATS.map((stat, index) => ({ id: stat.id, value: [35, 55, 40, 50, 50, 90][index] })),
  pastStats: [
    { generation: 1, stats: [{ id: 'special', value: 50 }] },
    { generation: 5, stats: [{ id: 'defense', value: 30 }, { id: 'special-defense', value: 40 }] },
  ],
};
const bulbasaur: Pokemon = { ...pikachu, id: 1, name: 'bulbasaur', types: ['grass', 'poison'], legacyTypes: ['grass', 'poison'] };
const sample = [bulbasaur, pikachu, { ...bulbasaur, id: 2, name: 'ivysaur' }];

describe('exportación CSV', () => {
  it('mantiene exactamente la selección, el orden, los tipos secundarios y el idioma', () => {
    const selection = pokemonInSegment(sample, new Set(['grass', 'poison']), 'legacy', 'grass+poison');
    const sorted = filterAndSortPokemon(selection, '', 'number-desc', 'ja');
    const csv = pokemonCsv(sorted, { generation: 1, view: 'legacy', language: 'ja' });
    const rows = csv.trimEnd().split('\r\n');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(rows).toHaveLength(3);
    expect(rows[1]).toContain(',2,"フシギソウ","くさ","どく",');
    expect(rows[2]).toContain(',1,"フシギダネ","くさ","どく",');
    expect(csv).not.toContain('ピカチュウ');
  });

  it('exporta cinco estadísticas originales o seis actuales sin mezclar sus valores', () => {
    const original = pokemonCsv([pikachu], { generation: 1, view: 'legacy', language: 'en' });
    expect(original).toContain('"Special","Speed"');
    expect(original).not.toContain('"Special Defense"');
    expect(original).toContain('1,"Legacy",25,"Pikachu","Electric","",0.4,6,35,55,30,50,90,"Available"');
    const current = pokemonCsv([pikachu], { generation: 1, view: 'current', language: 'en' });
    expect(current).toContain('35,55,40,50,50,90,"Available"');
    const gen2 = pokemonCsv([pikachu], { generation: 2, view: 'legacy', language: 'en' });
    expect(gen2).toContain('35,55,30,50,40,90,"Available"');
  });

  it('deja vacíos los históricos pendientes en lugar de exportar los actuales', () => {
    const { pastStats, ...oldPokemon } = pikachu;
    const csv = pokemonCsv([oldPokemon], { generation: 1, view: 'legacy', language: 'en' });
    expect(csv).toContain('0.4,6,"","","","","","History pending"');
    expect(csv).not.toContain(',35,55,');
  });

  it('escapa comas, comillas y saltos de línea y neutraliza las fórmulas', () => {
    const csv = pokemonCsv([{ ...pikachu, name: '=SUM(1,2)\n"テスト"' }], { generation: 1, view: 'current', language: 'en' });
    expect(csv).toContain('"\'=SUM(1,2)\n""テスト"""');
    expect(csv.endsWith('\r\n')).toBe(true);
    for (const name of ['+1', '@SUM(1)', '  =1', '\t=1']) {
      expect(pokemonCsv([{ ...pikachu, name }], { generation: 1, view: 'current', language: 'en' })).toContain(`"'${name}"`);
    }
  });
});

describe('exportación del gráfico', () => {
  const analysis = analyzePokemon(sample, new Set(['grass', 'poison']), 'legacy', 'en');
  const context = { generation: 1, view: 'legacy', language: 'en' } as const;

  it('conserva el total completo con Otros y porcentajes aunque el listado sea menor', () => {
    const svg = chartSvg(analysis, 'pie', context, 'grass+poison');
    expect(svg).toContain('Total: 3 Pokémon');
    expect(svg).toContain('Other Pokémon');
    expect(svg).toContain('2 Pokémon (66.7%)');
    expect(svg).toContain('1 Pokémon (33.3%)');
    expect(svg).toContain(piePath(0, 2 / 3));
    expect(svg).toContain('stroke="#233b30" stroke-width="4"');
    expect(svg).not.toMatch(/NaN|Infinity|<script|<image/);
  });

  it('usa una escala de 0 a 100 % en barras y admite una torta de un único segmento', () => {
    const svg = chartSvg(analysis, 'bars', context);
    expect(svg).toContain(`width="${2 / 3 * 620}"`);
    expect(svg).toContain('100%');
    const onlyOther = analyzePokemon(sample, new Set(['water']), 'current', 'en');
    const pie = chartSvg(onlyOther, 'pie', context);
    expect(pie).toContain(piePath(0, 1));
    expect(pie).toContain('Water');
    expect(pie).toContain('3 Pokémon (100.0%)');
  });

  it('escapa XML y conserva Unicode, con altura suficiente para todos los grupos', () => {
    const many = { ...analysis, groups: Array.from({ length: 30 }, (_, i) => ({ ...analysis.groups[0], key: String(i), count: 1, label: 'くさ < & "test"' })) };
    const svg = chartSvg(many, 'bars', { generation: 2, view: 'current', language: 'ja' });
    expect(svg).toContain('くさ &lt; &amp; &quot;test&quot;');
    expect(svg).not.toContain('くさ <');
    expect(Number(svg.match(/height="(\d+)"/)![1])).toBeGreaterThan(1500);
    expect(svg).toContain('第二世代');
  });
});
