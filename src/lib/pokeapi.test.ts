import { afterEach, describe, expect, it, vi } from 'vitest';
import { CACHE_KEY, fetchKanto, isPokemonDataset, normalizePokemon, readCache, writeCache } from './pokeapi';
import { STATS } from './metadata';

function rawPokemon(id = 1) {
  return {
    id, name: 'pokemon-' + id, height: 7, weight: 69,
    types: [{ slot: 2, type: { name: 'poison' } }, { slot: 1, type: { name: 'grass' } }],
    past_types: [] as { generation: { url: string }; types: { slot: number; type: { name: string } }[] }[],
    sprites: { front_default: 'https://example.com/sprite.png', other: { 'official-artwork': { front_default: 'https://example.com/artwork.png' } } },
    stats: STATS.map(stat => ({ stat: { name: stat.id }, base_stat: 45 })),
  };
}

const dataset = () => Array.from({ length: 151 }, (_, index) => normalizePokemon(rawPokemon(index + 1)));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('normalización de PokéAPI', () => {
  it('ordena por slot, conserva las imágenes y extrae las estadísticas', () => {
    const entry = normalizePokemon(rawPokemon());
    expect(entry.types).toEqual(['grass', 'poison']);
    expect(entry.legacyType).toBe('grass');
    expect(entry.image).toBe('https://example.com/artwork.png');
    expect(entry.stats).toHaveLength(6);
  });

  it('Clefairy vuelve a Normal en Gen I usando past_types', () => {
    const raw = rawPokemon(35);
    raw.types = [{ slot: 1, type: { name: 'fairy' } }];
    raw.past_types = [{ generation: { url: 'https://pokeapi.co/api/v2/generation/5/' }, types: [{ slot: 1, type: { name: 'normal' } }] }];
    const entry = normalizePokemon(raw);
    expect(entry.types).toEqual(['fairy']);
    expect(entry.legacyType).toBe('normal');
  });

  it('usa el registro histórico más antiguo, incluso si llega desordenado', () => {
    const raw = rawPokemon(81);
    raw.types = [{ slot: 1, type: { name: 'electric' } }, { slot: 2, type: { name: 'steel' } }];
    raw.past_types = [
      { generation: { url: 'https://pokeapi.co/api/v2/generation/5/' }, types: [{ slot: 1, type: { name: 'normal' } }] },
      { generation: { url: 'https://pokeapi.co/api/v2/generation/1/' }, types: [{ slot: 1, type: { name: 'electric' } }] },
    ];
    expect(normalizePokemon(raw).legacyType).toBe('electric');
  });

  it('rechaza tipos desconocidos, slots repetidos y estadísticas incompletas', () => {
    expect(() => normalizePokemon({ ...rawPokemon(), types: [{ slot: 1, type: { name: '__proto__' } }] })).toThrow();
    expect(() => normalizePokemon({ ...rawPokemon(), types: [{ slot: 1, type: { name: 'grass' } }, { slot: 1, type: { name: 'poison' } }] })).toThrow();
    expect(() => normalizePokemon({ ...rawPokemon(), stats: [] })).toThrow();
    expect(() => normalizePokemon(null)).toThrow();
  });
});

describe('consulta de la primera generación', () => {
  it('limita a cuatro las consultas simultáneas y entrega las 151 especies ordenadas', async () => {
    let active = 0;
    let maximum = 0;
    const progress = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('generation/1/')) return new Response(JSON.stringify({ pokemon_species: Array.from({ length: 151 }, (_, index) => ({ url: `https://pokeapi.co/api/v2/pokemon-species/${151 - index}/` })) }));
      const id = Number(url.match(/\/(\d+)\/$/)![1]);
      active++;
      maximum = Math.max(maximum, active);
      await new Promise(resolve => setTimeout(resolve, 1));
      active--;
      return new Response(JSON.stringify(rawPokemon(id)));
    }));
    const result = await fetchKanto(new AbortController().signal, progress);
    expect(maximum).toBe(4);
    expect(result.map(entry => entry.id)).toEqual(Array.from({ length: 151 }, (_, index) => index + 1));
    expect(progress).toHaveBeenLastCalledWith(151);
    expect(fetch).toHaveBeenCalledTimes(152);
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ cache: 'no-cache' }));
  });

  it('rechaza errores HTTP y una generación incompleta antes de consultar Pokémon', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{}', { status: 503 })));
    await expect(fetchKanto(new AbortController().signal, vi.fn())).rejects.toThrow('HTTP 503');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ pokemon_species: [] }))));
    await expect(fetchKanto(new AbortController().signal, vi.fn())).rejects.toThrow('151 especies');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('caché compatible con el HTML original', () => {
  it('acepta el formato v3 y rechaza especies repetidas o corruptas', () => {
    const pokemon = dataset();
    expect(isPokemonDataset(pokemon)).toBe(true);
    expect(isPokemonDataset([null, ...pokemon.slice(1)])).toBe(false);
    expect(isPokemonDataset([pokemon[1], ...pokemon.slice(1)])).toBe(false);
    expect(isPokemonDataset([{ ...pokemon[0], legacyType: 'fairy' }, ...pokemon.slice(1)])).toBe(false);
  });

  it('recupera una copia válida y guarda con el mismo identificador', () => {
    const pokemon = dataset();
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ pokemon, savedAt: 1_700_000_000_000 }), setItem });
    expect(readCache()?.pokemon).toHaveLength(151);
    writeCache(pokemon);
    expect(setItem).toHaveBeenCalledWith(CACHE_KEY, expect.any(String));
  });

  it('conserva la antigüedad de una copia válida y rechaza fechas imposibles', () => {
    const pokemon = dataset();
    const savedAt = 1_700_000_000_000;
    const getItem = vi.fn().mockReturnValue(JSON.stringify({ pokemon, savedAt }));
    vi.stubGlobal('localStorage', { getItem });
    expect(readCache()?.savedAt).toBe(savedAt);
    getItem.mockReturnValue(JSON.stringify({ pokemon, savedAt: 1e20 }));
    expect(readCache()).toBeNull();
  });

  it('devuelve la misma fecha que guarda, incluso si el almacenamiento está bloqueado', () => {
    const savedAt = 1_800_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(savedAt);
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem });
    expect(writeCache(dataset())).toBe(savedAt);
    expect(JSON.parse(setItem.mock.calls[0][1]).savedAt).toBe(savedAt);
    setItem.mockImplementation(() => { throw new Error('Bloqueado'); });
    expect(writeCache(dataset())).toBe(savedAt);
  });

  it('tolera JSON corrupto y almacenamiento bloqueado sin romper la aplicación', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{' });
    expect(readCache()).toBeNull();
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('Bloqueado'); }, setItem: () => { throw new Error('Bloqueado'); } });
    expect(readCache()).toBeNull();
    expect(() => writeCache(dataset())).not.toThrow();
  });
});
