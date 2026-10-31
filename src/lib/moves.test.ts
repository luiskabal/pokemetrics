import { describe, expect, it } from 'vitest';
import { moveGroup, normalizeLearnset } from './moves';
describe('version-specific level learnsets', () => {
  it('separates games and methods, retaining level zero and eliminating duplicates', () => {
    const detail = (game: string, level: number, method = 'level-up') => ({ version_group: { name: game }, level_learned_at: level, move_learn_method: { name: method } });
    const data = normalizeLearnset({ id: 1, moves: [{ move: { name: 'tackle', url: 'https://pokeapi.co/api/v2/move/33/' }, version_group_details: [detail('red-blue', 1), detail('red-blue', 1), detail('yellow', 7), detail('yellow', 0), detail('red-blue', 0, 'machine')] }] });
    expect(data.games['red-blue']).toEqual([{ id: 33, name: 'tackle', level: 1 }]);
    expect(data.games.yellow.map(move => move.level)).toEqual([0, 7]);
    expect(data.games['sun-moon']).toBeUndefined();
    expect(moveGroup('gold')).toBe('gold-silver');
    expect(moveGroup('yellow')).toBe('yellow');
  });
  it('rejects malformed upstream learnsets', () => {
    expect(() => normalizeLearnset({ id: 1 })).toThrow();
    expect(() => normalizeLearnset({ id: 1, moves: [{ move: { name: 'tackle', url: 'invalid' }, version_group_details: [] }] })).toThrow();
  });
});
