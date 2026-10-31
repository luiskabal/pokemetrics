import { describe, expect, it } from 'vitest';
import { defensiveMatchups } from './effectiveness';
const multiplier = (types: Parameters<typeof defensiveMatchups>[0], era: number | 'current', attack: string) => defensiveMatchups(types, era).find(entry => entry.type === attack)?.multiplier;
describe('historical defensive effectiveness', () => {
  it('multiplies both types and preserves immunities', () => {
    expect(multiplier(['fire', 'flying'], 'current', 'rock')).toBe(4);
    expect(multiplier(['grass', 'poison'], 'current', 'grass')).toBe(.25);
    expect(multiplier(['ground', 'flying'], 'current', 'electric')).toBe(0);
  });
  it('uses the actual Gen I ghost, bug and poison rules', () => {
    expect(multiplier(['psychic'], 1, 'ghost')).toBe(0);
    expect(multiplier(['psychic'], 2, 'ghost')).toBe(2);
    expect(multiplier(['grass', 'poison'], 1, 'bug')).toBe(4);
    expect(multiplier(['grass', 'poison'], 2, 'bug')).toBe(1);
    expect(defensiveMatchups(['normal'], 1)).toHaveLength(15);
  });
  it('uses the steel resistances that ended in Gen V', () => {
    expect(multiplier(['steel'], 5, 'ghost')).toBe(.5);
    expect(multiplier(['steel'], 6, 'ghost')).toBe(1);
    expect(multiplier(['steel'], 5, 'dark')).toBe(.5);
  });
});
