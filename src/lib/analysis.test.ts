import { describe, expect, it } from 'vitest';
import { analyzePokemon, filterAndSortPokemon, percentage, piePath, pokemonName } from './analysis';
import { LEGACY_TYPES, STATS, TYPES } from './metadata';
import type { TypeId } from './metadata';
import type { Pokemon } from './model';

function pokemon(id: number, types: TypeId[], legacyTypes = types): Pokemon {
  return { id, name: 'pokemon-' + id, types, legacyTypes, image: null, sprite: null, gameSprites: { 'red-green-japan': { front: null, back: null }, 'red-blue': { front: null, back: null }, yellow: { front: null, back: null } }, height: 7, weight: 69, stats: STATS.map(stat => ({ id: stat.id, value: 45 })) };
}

const sample = [
  pokemon(1, ['grass', 'poison']), pokemon(43, ['grass', 'poison']), pokemon(114, ['grass']),
  pokemon(23, ['poison']), pokemon(7, ['water']), pokemon(81, ['electric', 'steel'], ['electric']),
];

describe('distribución de Pokémon', () => {
  it('empieza sin segmentos ni resultados al no seleccionar tipos', () => {
    const result = analyzePokemon(sample, new Set(), 'current');
    expect(result.groups).toEqual([]);
    expect(result.matches).toEqual([]);
    expect(result.details).toEqual([]);
  });

  it('separa Planta, Veneno y su intersección sin duplicar especies', () => {
    const result = analyzePokemon(sample, new Set(['grass', 'poison']), 'current');
    expect(result.matches.map(entry => entry.id)).toEqual([1, 43, 114, 23]);
    expect(Object.fromEntries(result.groups.map(group => [group.key, group.count]))).toEqual({ 'grass+poison': 2, grass: 1, poison: 1, '': 2 });
    expect(result.details).toEqual([{ type: 'grass', count: 3 }, { type: 'poison', count: 3 }]);
    expect(result.remaining).toBe(2);
  });

  it('Legacy incluye a Bulbasaur al filtrar solo por su tipo secundario Veneno', () => {
    const result = analyzePokemon(sample, new Set(['poison']), 'legacy');
    expect(result.matches.map(entry => entry.id)).toEqual([1, 43, 23]);
    expect(result.details).toEqual([{ type: 'poison', count: 3 }]);
    expect(Object.fromEntries(result.groups.map(group => [group.key, group.count]))).toEqual({ poison: 3, '': 3 });
  });

  it('Legacy conserva ambos tipos originales y agrupa las coincidencias sin duplicarlas', () => {
    const result = analyzePokemon(sample, new Set(['grass', 'poison']), 'legacy');
    expect(Object.fromEntries(result.groups.map(group => [group.key, group.count]))).toEqual({ 'grass+poison': 2, grass: 1, poison: 1, '': 2 });
    expect(result.matches.map(entry => entry.id)).toEqual([1, 43, 114, 23]);
    expect(result.details).toEqual([{ type: 'grass', count: 3 }, { type: 'poison', count: 3 }]);
  });

  it('distingue los tipos originales de los actuales para Magnemite y Clefairy', () => {
    const changed = [pokemon(81, ['electric', 'steel'], ['electric']), pokemon(35, ['fairy'], ['normal'])];
    expect(analyzePokemon(changed, new Set(['steel', 'fairy']), 'current').matches).toHaveLength(2);
    expect(analyzePokemon(changed, new Set(['steel', 'fairy']), 'legacy').matches).toHaveLength(0);
    expect(analyzePokemon(changed, new Set(['normal']), 'legacy').matches.map(entry => entry.id)).toEqual([35]);
  });

  it('muestra el resto completo cuando un tipo no tiene coincidencias', () => {
    const result = analyzePokemon(sample, new Set(['dark']), 'current');
    expect(result.matches).toHaveLength(0);
    expect(result.groups).toEqual([{ key: '', types: [], count: 6, label: 'Otros Pokémon', color: '#e0e5db' }]);
    expect(result.details).toEqual([{ type: 'dark', count: 0 }]);
  });

  it('todos los tipos cubren una sola vez cada especie en ambas vistas', () => {
    for (const view of ['current', 'legacy'] as const) {
      const types = view === 'legacy' ? LEGACY_TYPES : TYPES;
      const result = analyzePokemon(sample, new Set(types.map(type => type.id)), view);
      expect(result.matches).toHaveLength(sample.length);
      expect(result.remaining).toBe(0);
      expect(result.groups.reduce((sum, group) => sum + group.count, 0)).toBe(sample.length);
    }
  });

  it('todas las parejas de tipos mantienen el total y no duplican Pokémon en ambas vistas', () => {
    for (const view of ['current', 'legacy'] as const) {
      const types = view === 'legacy' ? LEGACY_TYPES : TYPES;
      for (const first of types) for (const second of types) {
        const result = analyzePokemon(sample, new Set([first.id, second.id]), view);
        expect(result.groups.reduce((sum, group) => sum + group.count, 0)).toBe(sample.length);
        expect(new Set(result.matches.map(entry => entry.id)).size).toBe(result.matches.length);
      }
    }
  });
});

describe('presentación de resultados', () => {
  it('calcula los porcentajes sobre los 151 Pokémon con formato español', () => {
    expect(percentage(32, 151)).toBe('21,2 %');
    expect(percentage(151, 151)).toBe('100,0 %');
    expect(percentage(0, 0)).toBe('0,0 %');
  });

  it('dibuja una torta completa con dos arcos y controla segmentos mayores a la mitad', () => {
    expect(piePath(0, 1).match(/A 154/g)).toHaveLength(2);
    expect(piePath(0, .75)).toContain('A 154 154 0 1 1');
    expect(piePath(.75, .25)).toContain('A 154 154 0 0 1');
  });

  it('presenta correctamente los nombres especiales de Kanto', () => {
    expect(pokemonName('nidoran-f')).toBe('Nidoran ♀');
    expect(pokemonName('nidoran-m')).toBe('Nidoran ♂');
    expect(pokemonName('mr-mime')).toBe('Mr. Mime');
    expect(pokemonName('farfetchd')).toBe('Farfetch’d');
    expect(pokemonName('bulbasaur')).toBe('Bulbasaur');
  });
});

describe('búsqueda y ordenamiento del listado', () => {
  const entries = [
    { ...pokemon(25, ['electric']), name: 'pikachu' },
    { ...pokemon(122, ['psychic']), name: 'mr-mime' },
    { ...pokemon(1, ['grass', 'poison']), name: 'bulbasaur' },
    { ...pokemon(125, ['electric']), name: 'electabuzz' },
    { ...pokemon(29, ['poison']), name: 'nidoran-f' },
    { ...pokemon(32, ['poison']), name: 'nidoran-m' },
    { ...pokemon(83, ['normal', 'flying']), name: 'farfetchd' },
  ];

  it('busca nombres parciales sin distinguir mayúsculas, acentos ni puntuación', () => {
    for (const query of ['  PIKÁ  ', 'pikachu']) expect(filterAndSortPokemon(entries, query, 'number-asc').map(entry => entry.id)).toEqual([25]);
    expect(filterAndSortPokemon(entries, 'Mr. Mime', 'number-asc').map(entry => entry.id)).toEqual([122]);
    expect(filterAndSortPokemon(entries, 'Farfetch’d', 'number-asc').map(entry => entry.id)).toEqual([83]);
  });

  it('busca el número exacto con o sin # y ceros iniciales', () => {
    for (const query of ['25', '#025', '025', '  #25  ']) expect(filterAndSortPokemon(entries, query, 'number-asc').map(entry => entry.id)).toEqual([25]);
    expect(filterAndSortPokemon(entries, '0', 'number-asc')).toEqual([]);
    expect(filterAndSortPokemon(entries, '#152', 'number-asc')).toEqual([]);
  });

  it('reconoce los nombres y símbolos de ambas formas de Nidoran', () => {
    expect(filterAndSortPokemon(entries, 'nidoran', 'number-asc').map(entry => entry.id)).toEqual([29, 32]);
    for (const query of ['nidoran-f', 'Nidoran ♀']) expect(filterAndSortPokemon(entries, query, 'number-asc').map(entry => entry.id)).toEqual([29]);
    for (const query of ['nidoran-m', 'Nidoran ♂']) expect(filterAndSortPokemon(entries, query, 'number-asc').map(entry => entry.id)).toEqual([32]);
  });

  it('ordena por número o nombre en ambos sentidos sin modificar la selección original', () => {
    const originalIds = entries.map(entry => entry.id);
    expect(filterAndSortPokemon(entries, '', 'number-asc').map(entry => entry.id)).toEqual([1, 25, 29, 32, 83, 122, 125]);
    expect(filterAndSortPokemon(entries, '', 'number-desc').map(entry => entry.id)).toEqual([125, 122, 83, 32, 29, 25, 1]);
    expect(filterAndSortPokemon(entries, '', 'name-asc').map(entry => entry.id)).toEqual([1, 125, 83, 122, 29, 32, 25]);
    expect(filterAndSortPokemon(entries, '', 'name-desc').map(entry => entry.id)).toEqual([25, 32, 29, 122, 83, 125, 1]);
    expect(entries.map(entry => entry.id)).toEqual(originalIds);
  });

  it('mantiene la búsqueda dentro de la selección y admite resultados vacíos', () => {
    expect(filterAndSortPokemon(entries.filter(entry => entry.types.includes('grass')), 'pikachu', 'number-asc')).toEqual([]);
    expect(filterAndSortPokemon([], '', 'name-asc')).toEqual([]);
    expect(filterAndSortPokemon(entries, '   ', 'number-asc')).toHaveLength(entries.length);
    expect(filterAndSortPokemon(entries, 'missingno', 'number-asc')).toEqual([]);
  });
});
