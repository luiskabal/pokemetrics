import { describe, expect, it } from 'vitest';
import { statsForGeneration } from './stats';
import { STATS } from './metadata';
import type { Pokemon } from './model';
import { statName } from './localization';

const pikachu: Pokemon = {
  id: 25, name: 'pikachu', types: ['electric'], legacyTypes: ['electric'],
  image: null, sprite: null, gameSprites: { 'red-green-japan': { front: null, back: null }, 'red-blue': { front: null, back: null }, yellow: { front: null, back: null } },
  height: 4, weight: 60,
  stats: STATS.map((stat, index) => ({ id: stat.id, value: [35, 55, 40, 50, 50, 90][index] })),
  pastStats: [
    { generation: 1, stats: [{ id: 'special', value: 50 }] },
    { generation: 5, stats: [{ id: 'defense', value: 30 }, { id: 'special-defense', value: 40 }] },
  ],
};

describe('estadísticas base según la generación', () => {
  it('reconstruye cinco estadísticas originales sin arrastrar mejoras posteriores', () => {
    expect(statsForGeneration(pikachu, 1)).toEqual([
      { id: 'hp', value: 35 }, { id: 'attack', value: 55 }, { id: 'defense', value: 30 },
      { id: 'special', value: 50 }, { id: 'speed', value: 90 },
    ]);
    expect(statsForGeneration(pikachu, 'current')).toEqual(pikachu.stats);
  });

  it('respeta los límites inclusivos y separa los especiales desde Gen II', () => {
    for (const generation of [2, 5]) {
      expect(statsForGeneration(pikachu, generation)?.map(stat => stat.value)).toEqual([35, 55, 30, 50, 40, 90]);
      expect(statsForGeneration(pikachu, generation)?.some(stat => stat.id === 'special')).toBe(false);
    }
    expect(statsForGeneration(pikachu, 6)).toEqual(pikachu.stats);
  });

  it('elige el cambio más cercano por cada estadística aunque el historial esté desordenado', () => {
    const pokemon: Pokemon = { ...pikachu, pastStats: [
      { generation: 6, stats: [{ id: 'attack', value: 45 }] },
      { generation: 1, stats: [{ id: 'special', value: 50 }] },
      { generation: 5, stats: [{ id: 'attack', value: 35 }, { id: 'defense', value: 30 }] },
    ] };
    const original = JSON.stringify(pokemon);
    expect(statsForGeneration(pokemon, 1)?.find(stat => stat.id === 'attack')?.value).toBe(35);
    expect(statsForGeneration(pokemon, 5)?.find(stat => stat.id === 'attack')?.value).toBe(35);
    expect(statsForGeneration(pokemon, 6)?.find(stat => stat.id === 'attack')?.value).toBe(45);
    expect(statsForGeneration(pokemon, 7)?.find(stat => stat.id === 'attack')?.value).toBe(55);
    expect(JSON.stringify(pokemon)).toBe(original);
  });

  it('no inventa el Especial original a partir de ataque o defensa especiales modernos', () => {
    const hitmonlee: Pokemon = { ...pikachu, id: 106, name: 'hitmonlee', stats: STATS.map((stat, index) => ({ id: stat.id, value: [50, 120, 53, 35, 110, 87][index] })), pastStats: [{ generation: 1, stats: [{ id: 'special', value: 35 }] }] };
    expect(statsForGeneration(hitmonlee, 1)?.find(stat => stat.id === 'special')?.value).toBe(35);
    expect(statsForGeneration(hitmonlee, 'current')?.find(stat => stat.id === 'special-defense')?.value).toBe(110);
    expect(statsForGeneration({ ...hitmonlee, pastStats: [] }, 1)).toBeNull();
  });

  it('señala historial pendiente en caché anterior y permite seguir consultando los datos actuales', () => {
    const { pastStats, ...oldPokemon } = pikachu;
    expect(statsForGeneration(oldPokemon, 1)).toBeNull();
    expect(statsForGeneration(oldPokemon, 2)).toBeNull();
    expect(statsForGeneration(oldPokemon, 'current')).toEqual(pikachu.stats);
  });

  it('conserva extremos de 255 y traduce Especial en los cuatro idiomas', () => {
    const maximum: Pokemon = { ...pikachu, stats: STATS.map(stat => ({ id: stat.id, value: 255 })) };
    expect(statsForGeneration(maximum, 'current')?.every(stat => stat.value === 255)).toBe(true);
    expect(statName('special', 'es')).toBe('Especial');
    expect(statName('special', 'es-419')).toBe('Especial');
    expect(statName('special', 'en')).toBe('Special');
    expect(statName('special', 'ja')).toBe('とくしゅ');
  });
});
