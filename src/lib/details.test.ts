import { afterEach, describe, expect, it, vi } from 'vitest';
import { abilitiesFor, descriptionFor, parseChain, parseSpecies, translatedText } from './details';
const ref = (kind: string, id: number) => ({ url: `https://pokeapi.co/api/v2/${kind}/${id}/` });
const label = (language: string, value: string, field = 'name') => ({ language: { name: language }, [field]: value });
const species = {
  id: 1, name: 'bulbasaur', names: [label('en', 'Bulbasaur'), label('ja-hrkt', 'フシギダネ')],
  genera: [label('en', 'Seed Pokémon', 'genus'), label('es', 'Pokémon Semilla', 'genus')],
  generation: ref('generation', 1), evolution_chain: ref('evolution-chain', 1),
  flavor_text_entries: [
    { ...label('en', 'Original\nentry\fhere.', 'flavor_text'), version: { ...ref('version', 3), name: 'yellow' } },
    { ...label('es', 'Entrada moderna.', 'flavor_text'), version: { ...ref('version', 33), name: 'sword' } },
  ],
};
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('información adicional y fidelidad histórica', () => {
  it('limpia saltos de juego y distingue idioma y época del texto de respaldo', () => {
    const info = parseSpecies(species);
    expect(descriptionFor(info, 'es-419', 1)).toMatchObject({ text: 'Original entry here.', language: 'en', version: 'yellow' });
    expect(descriptionFor(info, 'es-419', 'current')).toMatchObject({ text: 'Entrada moderna.', language: 'es' });
    expect(info.names.ja).toBe('フシギダネ');
    expect(translatedText(info.category, 'es-419')).toEqual({ text: 'Pokémon Semilla', language: 'es' });
    expect(() => parseSpecies({ ...species, generation: {} })).toThrow();
  });
  it('reconstruye slots parciales y no atribuye habilidades a Gen I o II', () => {
    const raw = { abilities: [{ slot: 1, is_hidden: false, ability: ref('ability', 65) }, { slot: 3, is_hidden: true, ability: ref('ability', 34) }], past_abilities: [
      { generation: ref('generation', 4), abilities: [{ slot: 3, is_hidden: true, ability: null }] },
      { generation: ref('generation', 5), abilities: [{ slot: 1, is_hidden: false, ability: ref('ability', 55) }] },
    ] };
    expect(abilitiesFor(raw, 1)).toEqual([]); expect(abilitiesFor(raw, 2)).toEqual([]);
    expect(abilitiesFor(raw, 3).map(slot => slot.id)).toEqual([55]);
    expect(abilitiesFor(raw, 5).map(slot => slot.id)).toEqual([55, 34]);
    expect(abilitiesFor(raw, 'current').map(slot => slot.id)).toEqual([65, 34]);
  });
  it('conserva ramas y profundidad de la cadena y rechaza nodos incompletos', () => {
    const node = (id: number, evolves_to: unknown[] = []) => ({ species: ref('pokemon-species', id), evolves_to });
    expect(parseChain({ chain: node(133, [node(134), node(135), node(136)]) })).toEqual([{ id: 133, depth: 0 }, { id: 134, depth: 1 }, { id: 135, depth: 1 }, { id: 136, depth: 1 }]);
    expect(() => parseChain({ chain: {} })).toThrow();
  });
  it('carga al abrir y reutiliza respuestas guardadas; no consulta habilidades de Gen I', async () => {
    vi.resetModules();
    const saved = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value) });
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const value = url.includes('pokemon-species/') ? species : url.includes('evolution-chain/') ? { id: 1, chain: { species: ref('pokemon-species', 1), evolves_to: [] } } : { id: 3, names: [label('es', 'Amarillo')] };
      return new Response(JSON.stringify(value));
    }));
    const { loadPokemonInfo } = await import('./details');
    const info = await loadPokemonInfo(1, 1, new AbortController().signal);
    expect(info.abilities).toEqual([]);
    expect(info.versions['3'].es).toBe('Amarillo');
    expect(fetch).toHaveBeenCalledTimes(3);
    await loadPokemonInfo(1, 1, new AbortController().signal);
    expect(fetch).toHaveBeenCalledTimes(3);
    const controller = new AbortController(); controller.abort();
    await expect(loadPokemonInfo(1, 1, controller.signal)).rejects.toThrow();
  });
});
