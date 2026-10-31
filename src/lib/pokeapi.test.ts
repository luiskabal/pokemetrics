import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { CACHE_KEY, fetchKanto, isPokemonDataset, loadGeneration, normalizePokemon, parseGenerationDataset, readCache, writeCache } from './pokeapi';
import { STATS } from './metadata';
import { GENERATIONS } from './generations';

function rawPokemon(id = 1) {
  return {
    id, name: 'pokemon-' + id, height: 7, weight: 69,
    types: [{ slot: 2, type: { name: 'poison' } }, { slot: 1, type: { name: 'grass' } }],
    past_types: [] as { generation: { url: string }; types: { slot: number; type: { name: string } }[] }[],
    past_stats: [{ generation: { url: 'https://pokeapi.co/api/v2/generation/1/' }, stats: [{ stat: { name: 'special' }, base_stat: 65 }] }],
    sprites: {
      front_default: 'https://example.com/sprite.png',
      other: { 'official-artwork': {
        front_default: 'https://example.com/artwork.png',
        versions: { 'generation-i': {
          'red-and-blue': { front_default: 'https://example.com/illustrations/red-blue.png' },
          'red-and-green': { front_default: 'https://example.com/illustrations/red-green.png' },
        } },
      } },
      versions: { 'generation-i': {
        'red-green-japan': { front_default: 'https://example.com/red-green/front.png', back_default: 'https://example.com/red-green/back.png' },
        'red-blue': { front_default: 'https://example.com/red-blue/front.png', back_default: 'https://example.com/red-blue/back.png' },
        yellow: { front_default: 'https://example.com/yellow/front.png', back_default: 'https://example.com/yellow/back.png' },
      } },
    },
    stats: STATS.map(stat => ({ stat: { name: stat.id }, base_stat: 45 })),
  };
}

const dataset = () => Array.from({ length: 151 }, (_, index) => normalizePokemon(rawPokemon(index + 1)));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('compact generation datasets', () => {
  const snapshot = () => ({ schemaVersion: 1, generation: 1, savedAt: 1_700_000_000_000, pokemon: dataset() });
  it('validates all nine published datasets and their complete 1025 species', () => {
    let count = 0;
    for (const generation of GENERATIONS) {
      const raw = JSON.parse(readFileSync(new URL(`../../public/data/generation-${generation.id}.json`, import.meta.url), 'utf8'));
      const data = parseGenerationDataset(raw, generation.id);
      expect(data.pokemon.map(pokemon => pokemon.id)).toEqual(generation.speciesIds);
      expect(data.pokemon.every(pokemon => Array.isArray(pokemon.pastStats))).toBe(true);
      count += data.pokemon.length;
    }
    expect(count).toBe(1025);
  });
  it('fetches one compact file and preserves its source date', async () => {
    const data = snapshot(); const setItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem: () => null, setItem });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(data))));
    expect(await loadGeneration(1, new AbortController().signal)).toEqual(data);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/data\/generation-1\.json$/), expect.objectContaining({ cache: 'no-cache' }));
    const stored = JSON.parse(setItem.mock.calls[0][1]);
    expect(stored.savedAt).toBe(data.savedAt); expect(stored.checkedAt).toBeGreaterThan(data.savedAt);
  });
  it('reuses a recently checked cache without changing its age, and supports a forced refresh', async () => {
    const data = snapshot(); const setItem = vi.fn(); const checkedAt = Date.now() - 1000;
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ ...data, checkedAt }), setItem });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(data))));
    expect((await loadGeneration(1, new AbortController().signal)).savedAt).toBe(data.savedAt);
    expect(fetch).not.toHaveBeenCalled(); expect(setItem).not.toHaveBeenCalled();
    await loadGeneration(1, new AbortController().signal, true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('revalidates expired and older caches without checkedAt', async () => {
    for (const checkedAt of [undefined, Date.now() - 86_400_001]) {
      const data = snapshot();
      vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ ...data, checkedAt }), setItem: vi.fn() });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(data))));
      await loadGeneration(1, new AbortController().signal);
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  });
  it('rejects incomplete or mismatched files without overwriting a valid cache or querying REST', async () => {
    const data = snapshot(); const setItem = vi.fn();
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(data), setItem });
    for (const invalid of [{ ...data, generation: 2 }, { ...data, schemaVersion: 2 }, { ...data, savedAt: 1e20 }, { ...data, pokemon: data.pokemon.slice(1) }]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(invalid))));
      await expect(loadGeneration(1, new AbortController().signal)).rejects.toThrow('Invalid generation');
      expect(fetch).toHaveBeenCalledTimes(1); expect(setItem).not.toHaveBeenCalled();
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(loadGeneration(1, new AbortController().signal)).rejects.toThrow('HTTP 503');
    expect(setItem).not.toHaveBeenCalled();
  });
  it('does not write a result after the request is cancelled', async () => {
    const controller = new AbortController(); const setItem = vi.fn(); const data = snapshot();
    vi.stubGlobal('localStorage', { getItem: () => null, setItem });
    vi.stubGlobal('fetch', vi.fn(async () => { controller.abort(); return new Response(JSON.stringify(data)); }));
    await expect(loadGeneration(1, controller.signal)).rejects.toThrow();
    expect(setItem).not.toHaveBeenCalled();
  });
});

describe('normalización de PokéAPI', () => {
  it('ordena por slot, conserva las imágenes y extrae las estadísticas', () => {
    const entry = normalizePokemon(rawPokemon());
    expect(entry.types).toEqual(['grass', 'poison']);
    expect(entry.legacyTypes).toEqual(['grass', 'poison']);
    expect(entry.image).toBe('https://example.com/artwork.png');
    expect(entry.stats).toHaveLength(6);
    expect(entry.pastStats).toEqual([{ generation: 1, stats: [{ id: 'special', value: 65 }] }]);
  });

  it('conserva los cambios parciales de estadísticas y sus generaciones inclusivas', () => {
    const raw = rawPokemon(25);
    raw.past_stats.push({ generation: { url: 'https://pokeapi.co/api/v2/generation/5/' }, stats: [{ stat: { name: 'defense' }, base_stat: 30 }, { stat: { name: 'special-defense' }, base_stat: 40 }] });
    expect(normalizePokemon(raw).pastStats).toEqual([
      { generation: 1, stats: [{ id: 'special', value: 65 }] },
      { generation: 5, stats: [{ id: 'defense', value: 30 }, { id: 'special-defense', value: 40 }] },
    ]);
  });

  it('acepta caché v5 sin historial y rechaza historiales corruptos', () => {
    const pokemon = dataset();
    expect(isPokemonDataset(pokemon.map(({ pastStats, ...entry }) => entry))).toBe(true);
    for (const pastStats of [null, {}, [{ generation: 0, stats: [{ id: 'special', value: 50 }] }], [{ generation: 1, stats: [] }], [{ generation: 1, stats: [{ id: 'unknown', value: 50 }] }], [{ generation: 1, stats: [{ id: 'special', value: 256 }] }], [{ generation: 1, stats: [{ id: 'special', value: 50 }, { id: 'special', value: 50 }] }], [{ generation: 1, stats: [{ id: 'special', value: 50 }] }, { generation: 1, stats: [{ id: 'attack', value: 50 }] }]]) {
      expect(isPokemonDataset([{ ...pokemon[0], pastStats }, ...pokemon.slice(1)])).toBe(false);
    }
  });

  it('rechaza estadísticas históricas incompletas y valores fuera de la escala base', () => {
    const raw = rawPokemon();
    expect(() => normalizePokemon({ ...raw, past_stats: undefined })).toThrow();
    expect(() => normalizePokemon({ ...raw, past_stats: [{ generation: { url: 'invalid' }, stats: raw.stats }] })).toThrow();
    expect(() => normalizePokemon({ ...raw, past_stats: [{ generation: { url: 'https://pokeapi.co/api/v2/generation/1/' }, stats: [{ stat: null, base_stat: 50 }] }] })).toThrow();
    for (const value of [0, -1, 1.5, 256]) {
      expect(() => normalizePokemon({ ...raw, stats: raw.stats.map(stat => ({ ...stat, base_stat: value })) })).toThrow();
      expect(() => normalizePokemon({ ...raw, past_stats: [{ ...raw.past_stats[0], stats: [{ stat: { name: 'special' }, base_stat: value }] }] })).toThrow();
    }
  });

  it('conserva los sprites frontal y trasero que entrega cada juego de Gen I', () => {
    const entry = normalizePokemon(rawPokemon());
    expect(entry.gameSprites).toEqual({
      'red-green-japan': { front: 'https://example.com/red-green/front.png', back: 'https://example.com/red-green/back.png' },
      'red-blue': { front: 'https://example.com/red-blue/front.png', back: 'https://example.com/red-blue/back.png' },
      yellow: { front: 'https://example.com/yellow/front.png', back: 'https://example.com/yellow/back.png' },
    });
  });

  it('extrae las ilustraciones históricas sin confundirlas con los sprites del juego', () => {
    const entry = normalizePokemon(rawPokemon());
    expect(entry.historicalArtworks).toEqual({
      'red-and-blue': 'https://example.com/illustrations/red-blue.png',
      'red-and-green': 'https://example.com/illustrations/red-green.png',
    });
    expect(entry.image).toBe('https://example.com/artwork.png');
    expect(entry.gameSprites['red-blue'].front).toBe('https://example.com/red-blue/front.png');
  });

  it('admite ilustraciones históricas ausentes y conserva la compatibilidad con la caché v5', () => {
    const raw = rawPokemon();
    const entry = normalizePokemon({ ...raw, sprites: { ...raw.sprites, other: { 'official-artwork': { front_default: raw.sprites.other['official-artwork'].front_default } } } });
    expect(entry.historicalArtworks).toEqual({ 'red-and-blue': null, 'red-and-green': null });
    const oldPokemon = dataset().map(({ historicalArtworks, ...pokemon }) => pokemon);
    expect(isPokemonDataset(oldPokemon)).toBe(true);
    const savedAt = 1_700_000_000_000;
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ pokemon: oldPokemon, savedAt }) });
    expect(readCache()?.savedAt).toBe(savedAt);
  });

  it('rechaza ilustraciones con enlaces inseguros o estructura corrupta', () => {
    const raw = rawPokemon();
    raw.sprites.other['official-artwork'].versions['generation-i']['red-and-blue'].front_default = 'javascript:alert(1)';
    expect(() => normalizePokemon(raw)).toThrow();
    const pokemon = dataset();
    for (const historicalArtworks of [null, {}, { 'red-and-blue': 3, 'red-and-green': null }, { 'red-and-blue': null, 'red-and-green': 'http://example.com/art.png' }]) {
      expect(isPokemonDataset([{ ...pokemon[0], historicalArtworks }, ...pokemon.slice(1)])).toBe(false);
    }
  });

  it('marca sprites ausentes sin sustituirlos por imágenes de otro juego', () => {
    const raw = rawPokemon();
    const { versions, ...sprites } = raw.sprites;
    const entry = normalizePokemon({ ...raw, sprites: { ...sprites, versions: { 'generation-i': { yellow: { front_default: versions['generation-i'].yellow.front_default, back_default: null } } } } });
    expect(entry.gameSprites['red-blue']).toEqual({ front: null, back: null });
    expect(entry.gameSprites['red-green-japan']).toEqual({ front: null, back: null });
    expect(entry.gameSprites.yellow).toEqual({ front: 'https://example.com/yellow/front.png', back: null });
    expect(normalizePokemon({ ...raw, sprites }).gameSprites.yellow).toEqual({ front: null, back: null });
  });

  it('rechaza enlaces inseguros o campos de sprites inválidos en la respuesta y la caché', () => {
    const raw = rawPokemon();
    raw.sprites.versions['generation-i'].yellow.front_default = 'javascript:alert(1)';
    expect(() => normalizePokemon(raw)).toThrow();
    const pokemon = dataset();
    for (const yellow of [null, { front: false, back: null }, { front: null, back: 'http://example.com/back.png' }]) {
      expect(isPokemonDataset([{ ...pokemon[0], gameSprites: { ...pokemon[0].gameSprites, yellow } }, ...pokemon.slice(1)])).toBe(false);
    }
  });

  it('Clefairy vuelve a Normal en Gen I usando past_types', () => {
    const raw = rawPokemon(35);
    raw.types = [{ slot: 1, type: { name: 'fairy' } }];
    raw.past_types = [{ generation: { url: 'https://pokeapi.co/api/v2/generation/5/' }, types: [{ slot: 1, type: { name: 'normal' } }] }];
    const entry = normalizePokemon(raw);
    expect(entry.types).toEqual(['fairy']);
    expect(entry.legacyTypes).toEqual(['normal']);
  });

  it('usa el registro histórico más antiguo, incluso si llega desordenado', () => {
    const raw = rawPokemon(81);
    raw.types = [{ slot: 1, type: { name: 'electric' } }, { slot: 2, type: { name: 'steel' } }];
    raw.past_types = [
      { generation: { url: 'https://pokeapi.co/api/v2/generation/5/' }, types: [{ slot: 1, type: { name: 'normal' } }] },
      { generation: { url: 'https://pokeapi.co/api/v2/generation/1/' }, types: [{ slot: 1, type: { name: 'electric' } }] },
    ];
    expect(normalizePokemon(raw).legacyTypes).toEqual(['electric']);
  });

  it('conserva los dos tipos de un registro histórico y respeta el orden de sus slots', () => {
    const raw = rawPokemon();
    raw.past_types = [{ generation: { url: 'https://pokeapi.co/api/v2/generation/1/' }, types: raw.types }];
    expect(normalizePokemon(raw).legacyTypes).toEqual(['grass', 'poison']);
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

describe('caché con tipos históricos y sprites por juego', () => {
  it('acepta el formato v5 y rechaza especies repetidas o tipos históricos inválidos', () => {
    const pokemon = dataset();
    expect(isPokemonDataset(pokemon)).toBe(true);
    expect(isPokemonDataset([null, ...pokemon.slice(1)])).toBe(false);
    expect(isPokemonDataset([pokemon[1], ...pokemon.slice(1)])).toBe(false);
    for (const legacyTypes of [[], ['fairy'], ['grass', 'steel'], ['grass', 'grass'], ['grass', 'poison', 'bug']]) {
      expect(isPokemonDataset([{ ...pokemon[0], legacyTypes }, ...pokemon.slice(1)])).toBe(false);
    }
  });

  it('rechaza copias antiguas sin sprites por juego para renovar los datos completos', () => {
    const oldPokemon = dataset().map(({ gameSprites, ...entry }) => entry);
    expect(isPokemonDataset(oldPokemon)).toBe(false);
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ pokemon: oldPokemon, savedAt: 1_700_000_000_000 }) });
    expect(readCache()).toBeNull();
  });

  it('rechaza la caché anterior que solo guardaba el primer tipo original', () => {
    const oldPokemon = dataset().map(({ legacyTypes, ...entry }) => ({ ...entry, legacyType: legacyTypes[0] }));
    expect(isPokemonDataset(oldPokemon)).toBe(false);
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ pokemon: oldPokemon, savedAt: 1_700_000_000_000 }) });
    expect(readCache()).toBeNull();
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
