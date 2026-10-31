import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { historicalTypes, loadUniverse, regionalDexes } from './universe';
import { readExploration, explorationUrl } from './navigation';
import type { Pokemon } from './model';
afterEach(() => vi.unstubAllGlobals());
describe('game Pokédex universes', () => {
  it('reconstructs the era rather than the introduction-era type', () => {
    const magnemite = { types: ['electric', 'steel'], typeHistory: [{ generation: 1, types: ['electric'] }] } as Pokemon;
    expect(historicalTypes(magnemite, 1)).toEqual(['electric']);
    expect(historicalTypes(magnemite, 2)).toEqual(['electric', 'steel']);
  });
  it('loads all 251 Gen II national species with their Gen II sprites and types', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(readFileSync(new URL('../../public/data/' + url.split('/data/')[1], import.meta.url), 'utf8'))));
    const data = await loadUniverse(2, 'national', 'gold', null, new AbortController().signal);
    expect(data.pokemon).toHaveLength(251);
    expect(data.pokemon.find(entry => entry.id === 81)?.legacyTypes).toEqual(['electric', 'steel']);
    expect(data.pokemon[0].gameSprites.gold.front).toContain('/generation-ii/gold/');
    expect(fetch).toHaveBeenCalledTimes(3);
    expect((await regionalDexes('gold'))[0].entries).toHaveLength(251);
  });
  it('shares the universe, edition and older-species ficha without admitting future species', () => {
    const state = readExploration(new URL('https://example.com/?gen=2&scope=national&edition=silver&pokemon=81'));
    expect(state.pokemonId).toBe(81); expect(state.edition).toBe('silver');
    expect(readExploration(explorationUrl(new URL('https://example.com/'), state))).toEqual(state);
    expect(readExploration(new URL('https://example.com/?gen=2&scope=national&pokemon=906')).pokemonId).toBeNull();
  });
});
