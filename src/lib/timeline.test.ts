import { describe, expect, it } from 'vitest';
import { pokemonTimeline } from './timeline';
import type { Pokemon } from './model';
describe('historical timeline', () => {
  it('uses inclusive type/stat changes and does not compare newly introduced stats to Special', () => {
    const pokemon = { id: 81, types: ['electric', 'steel'], typeHistory: [{ generation: 1, types: ['electric'] }], stats: [{ id: 'hp', value: 25 }, { id: 'attack', value: 35 }, { id: 'defense', value: 70 }, { id: 'special-attack', value: 95 }, { id: 'special-defense', value: 55 }, { id: 'speed', value: 45 }], pastStats: [{ generation: 1, stats: [{ id: 'special', value: 95 }] }, { generation: 5, stats: [{ id: 'attack', value: 30 }] }] } as Pokemon;
    const rows = pokemonTimeline(pokemon);
    expect(rows[0].types).toEqual(['electric']); expect(rows[1].typeChange).toBe(true);
    expect(rows[1].stats?.find(stat => stat.id === 'special-attack')?.delta).toBeNull();
    expect(rows[5].stats?.find(stat => stat.id === 'attack')?.delta).toBe(5);
    expect(rows[8].stats?.find(stat => stat.id === 'attack')?.delta).toBe(0);
  });
});
