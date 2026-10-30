import { describe, expect, it } from 'vitest';
import { GENERATIONS, SPECIES_GENERATION, defaultIllustration, generationInfo, typesForGeneration } from './generations';
import { normalizePokemon, isPokemonDataset, cacheKey } from './pokeapi';
import { readExploration } from './navigation';
import { pokemonName } from './localization';
import { STATS } from './metadata';
describe('generaciones y especies originales', () => {
  it('particiona las 1025 especies en nueve generaciones sin duplicarlas', () => {
    expect(GENERATIONS.map(g => g.speciesIds.length)).toEqual([151, 100, 135, 107, 156, 72, 88, 96, 120]);
    expect(SPECIES_GENERATION.size).toBe(1025);
    expect([...SPECIES_GENERATION.keys()].sort((a, b) => a - b)).toEqual(Array.from({ length: 1025 }, (_, i) => i + 1));
    expect(typesForGeneration(1)).toHaveLength(15); expect(typesForGeneration(2)).toHaveLength(17); expect(typesForGeneration(6)).toHaveLength(18);
  });
  it('elige arte original o el primer juego sin sustituir por imágenes modernas', () => {
    expect(defaultIllustration(1)).toBe('red-and-green'); expect(defaultIllustration(2)).toBe('gold-and-silver');
    expect(defaultIllustration(3)).toBe('game:ruby-sapphire'); expect(defaultIllustration(7)).toBe('game:sun-moon');
    expect(cacheKey(1)).toBe('pokemetrics-kanto-v5'); expect(cacheKey(2)).not.toBe(cacheKey(1));
  });
  it('normaliza nombres de especie frente a sufijos de forma y respeta el historial de la época', () => {
    const raw = { id: 175, name: 'togepi-default', species: { name: 'togepi' }, height: 3, weight: 15, types: [{ slot: 1, type: { name: 'fairy' } }], past_types: [{ generation: { url: 'https://pokeapi.co/api/v2/generation/5/' }, types: [{ slot: 1, type: { name: 'normal' } }] }], sprites: { front_default: null, versions: {} }, stats: STATS.map(stat => ({ stat: { name: stat.id }, base_stat: 50 })), past_stats: [] };
    const p = normalizePokemon(raw, 2);
    expect(p.name).toBe('togepi'); expect(p.legacyTypes).toEqual(['normal']);
    expect(pokemonName(p.name, 'ja')).toBe('トゲピー');
    expect(() => normalizePokemon(raw, 1)).toThrow();
    expect(isPokemonDataset([p], 2)).toBe(false);
  });
  it('restaura enlaces de cualquier generación y descarta datos de otra época', () => {
    const state = readExploration(new URL('https://example.com/?gen=2&pokemon=175&view=legacy&types=fairy,steel&against=1&order=special-desc'));
    expect(state.generation).toBe(2); expect(state.against).toBe(1); expect(state.pokemonId).toBe(175); expect(state.types).toEqual(['steel']); expect(state.order).toBe('number-asc');
    expect(state.imageSet).toBe(generationInfo(2).games[0].id);
    expect(readExploration(new URL('https://example.com/?gen=99&pokemon=175')).pokemonId).toBeNull();
  });
});
