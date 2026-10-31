import { afterEach, describe, expect, it, vi } from 'vitest';
import { readTeams, saveTeams, sharedTeam, teamUrl, validTeam } from './teams';
afterEach(() => vi.unstubAllGlobals());
describe('saved teams', () => {
  const team = { id: 'one', name: 'Kanto', game: 'yellow', members: [25, 1, 25] };
  it('preserves duplicates, validates six slots and rejects future species', () => {
    expect(validTeam(team)).toBe(true); expect(validTeam({ ...team, members: Array(7).fill(25) })).toBe(false); expect(validTeam({ ...team, members: [906] })).toBe(false);
    expect(sharedTeam(new URL(teamUrl(new URL('https://example.com/'), team)))?.members).toEqual(team.members);
  });
  it('keeps valid profiles and reports blocked storage', () => {
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ version: 1, teams: [team, { ...team, game: 'bad' }] }), setItem: () => { throw Error('blocked'); } });
    expect(readTeams()).toEqual([team]); expect(saveTeams([team])).toBe(false);
  });
});
