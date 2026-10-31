import { describe, expect, it } from 'vitest';
import { filterStatRanges, parseRanges } from './stat-explorer';
import type { Pokemon } from './model';
describe('stat exploration', () => {
  it('validates shared ranges and ignores malformed or duplicated criteria', () => { expect(parseRanges('attack:100:255;attack:0:50;speed:200:100;hp:-1:255;foo:0:255')).toEqual([{ id: 'attack', min: 100, max: 255 }]); });
  it('filters inclusively using historical values without modifying the original data', () => { const pokemon = { stats: [{ id: 'attack', value: 100 }], pastStats: [{ generation: 5, stats: [{ id: 'attack', value: 80 }] }] } as Pokemon; const rows = [pokemon]; expect(filterStatRanges(rows, [{ id: 'attack', min: 100, max: 100 }], 'current', 1)).toEqual(rows); expect(filterStatRanges(rows, [{ id: 'attack', min: 100, max: 100 }], 'legacy', 5)).toEqual([]); expect(pokemon.stats[0].value).toBe(100); });
});
