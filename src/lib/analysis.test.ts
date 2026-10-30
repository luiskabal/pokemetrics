import { describe, expect, it } from 'vitest';
import { analyzePokemon, percentage, piePath, pokemonName } from './analysis';
import { LEGACY_TYPES, STATS, TYPES } from './metadata';
import type { TypeId } from './metadata';
import type { Pokemon } from './model';

function pokemon(id: number, types: TypeId[], legacyType = types[0]): Pokemon {
  return { id, name: 'pokemon-' + id, types, legacyType, image: null, sprite: null, height: 7, weight: 69, stats: STATS.map(stat => ({ id: stat.id, value: 45 })) };
}

const sample = [
  pokemon(1, ['grass', 'poison']), pokemon(43, ['grass', 'poison']), pokemon(114, ['grass']),
  pokemon(23, ['poison']), pokemon(7, ['water']), pokemon(81, ['electric', 'steel']),
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

  it('Legacy conserva solo el primer tipo original', () => {
    const result = analyzePokemon(sample, new Set(['grass', 'poison']), 'legacy');
    expect(Object.fromEntries(result.groups.map(group => [group.key, group.count]))).toEqual({ grass: 3, poison: 1, '': 2 });
    expect(result.groups.every(group => group.types.length <= 1)).toBe(true);
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

  it('las 324 parejas de tipos mantienen el total y no duplican Pokémon', () => {
    for (const first of TYPES) for (const second of TYPES) {
      const result = analyzePokemon(sample, new Set([first.id, second.id]), 'current');
      expect(result.groups.reduce((sum, group) => sum + group.count, 0)).toBe(sample.length);
      expect(new Set(result.matches.map(entry => entry.id)).size).toBe(result.matches.length);
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
