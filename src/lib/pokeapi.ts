import { GEN_I_STATS, STATS, TYPE_BY_ID } from './metadata';
import type { TypeId } from './metadata';
import type { Pokemon } from './model';
import { GENERATIONS, generationInfo, typesForGeneration } from './generations';

export const CACHE_KEY = 'pokemetrics-kanto-v5';
const API = 'https://pokeapi.co/api/v2/';
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const typeId = (value: unknown): value is TypeId => typeof value === 'string' && Object.hasOwn(TYPE_BY_ID, value);
const validTypes = (value: unknown): value is TypeId[] => Array.isArray(value) && value.length >= 1 && value.length <= 2 && value.every(typeId) && new Set(value).size === value.length;
const positiveInteger = (value: unknown): value is number => Number.isInteger(value) && Number(value) > 0;
const baseStat = (value: unknown): value is number => positiveInteger(value) && value <= 255;
const imageUrl = (value: unknown) => value === null || (typeof value === 'string' && value.startsWith('https://'));
const validGameSprites = (value: unknown, generation: number): value is Pokemon['gameSprites'] => record(value) && generationInfo(generation).games.every(game => {
  const sprites = value[game.id];
  return record(sprites) && imageUrl(sprites.front) && imageUrl(sprites.back);
});
const validHistoricalArtworks = (value: unknown, generation: number) => value === undefined || (record(value) && generationInfo(generation).artworks.every(id => imageUrl(value[id])) && Object.values(value).every(imageUrl));
const historicalStatIds = new Set<string>([...STATS, ...GEN_I_STATS].map(stat => stat.id));
const validPastStats = (value: unknown) => value === undefined || (Array.isArray(value) && value.every(history =>
  record(history) && positiveInteger(history.generation) && Array.isArray(history.stats) && history.stats.length > 0 &&
  history.stats.every(stat => record(stat) && typeof stat.id === 'string' && historicalStatIds.has(stat.id) && baseStat(stat.value)) &&
  new Set(history.stats.map(stat => stat.id)).size === history.stats.length
) && new Set(value.map(history => history.generation)).size === value.length);

function isPokemon(entry: unknown, generation = 1): entry is Pokemon {
    if (!record(entry) || !positiveInteger(entry.id) || !generationInfo(generation).speciesIds.includes(entry.id) ||
      typeof entry.name !== 'string' || !entry.name.length ||
      !validTypes(entry.types) || !validTypes(entry.legacyTypes) || !entry.legacyTypes.every(id => typesForGeneration(generation).some(type => type.id === id)) ||
      (entry.typeHistory !== undefined && (!Array.isArray(entry.typeHistory) || !entry.typeHistory.every(row => record(row) && positiveInteger(row.generation) && validTypes(row.types)))) ||
      !imageUrl(entry.image) || !imageUrl(entry.sprite) || !validGameSprites(entry.gameSprites, generation) || !validHistoricalArtworks(entry.historicalArtworks, generation) ||
      !positiveInteger(entry.height) || !positiveInteger(entry.weight) ||
      !Array.isArray(entry.stats) || entry.stats.length !== STATS.length ||
      !entry.stats.every(stat => record(stat) && STATS.some(item => item.id === stat.id) && baseStat(stat.value)) ||
      new Set(entry.stats.map(stat => stat.id)).size !== STATS.length || !validPastStats(entry.pastStats)) return false;
    return true;
}

export function isPokemonDataset(value: unknown, generation = 1): value is Pokemon[] {
  const expected = generationInfo(generation).speciesIds;
  return Array.isArray(value) && value.length === expected.length && value.every(entry => isPokemon(entry, generation)) && new Set(value.map(entry => entry.id)).size === expected.length;
}

function resourceId(url: unknown): number {
  const match = typeof url === 'string' ? url.match(/\/(\d+)\/$/) : null;
  if (!match || !positiveInteger(Number(match[1]))) throw new Error('Referencia inválida en PokéAPI.');
  return Number(match[1]);
}

function readTypes(value: unknown): TypeId[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 2) throw new Error('Tipos incompletos en PokéAPI.');
  const slots = value.map(entry => {
    if (!record(entry) || !positiveInteger(entry.slot) || !record(entry.type) || !typeId(entry.type.name)) throw new Error('Tipo inválido en PokéAPI.');
    return { slot: entry.slot, type: entry.type.name };
  }).sort((a, b) => a.slot - b.slot);
  if (slots.some((entry, index) => entry.slot !== index + 1)) throw new Error('Orden de tipos inválido en PokéAPI.');
  return slots.map(entry => entry.type);
}

export function normalizePokemon(value: unknown, generationId = 1): Pokemon {
  if (!record(value) || !Array.isArray(value.past_types) || !record(value.sprites) || !Array.isArray(value.stats) || !Array.isArray(value.past_stats)) throw new Error('Pokémon incompleto en PokéAPI.');
  const types = readTypes(value.types);
  const history = value.past_types.map(entry => {
    if (!record(entry) || !record(entry.generation)) throw new Error('Historial de tipos inválido.');
    return { generation: resourceId(entry.generation.url), types: entry.types };
  }).filter(entry => entry.generation >= generationId).sort((a, b) => a.generation - b.generation)[0];
  // El registro termina en su generación indicada; se usa el más cercano que cubre la época consultada.
  const originalTypes = history ? readTypes(history.types) : types;
  const other = value.sprites.other;
  const artwork = record(other) ? other['official-artwork'] : undefined;
  const artworkVersions = record(artwork) ? artwork.versions : undefined;
  const definition = generationInfo(generationId);
  const historicalArtworks = Object.fromEntries(GENERATIONS.flatMap(era => era.artworks.map(id => {
    const art = record(artworkVersions) ? artworkVersions[era.slug] : undefined;
    const image = record(art) ? art[id] : undefined;
    return [id, record(image) ? image.front_default ?? null : null];
  })));
  const versions = value.sprites.versions;
  const generation = record(versions) ? versions[definition.slug] : undefined;
  const gameSprites = Object.fromEntries(definition.games.map(game => {
    const sprites = record(generation) ? generation[game.spriteKey] : undefined;
    return [game.id, {
      front: record(sprites) ? sprites.front_default ?? null : null,
      back: record(sprites) ? sprites.back_default ?? null : null,
    }];
  }));
  const entry = {
    id: value.id, name: record(value.species) ? value.species.name : value.name, types, legacyTypes: originalTypes,
    typeHistory: value.past_types.map(row => ({ generation: resourceId(row.generation.url), types: readTypes(row.types) })),
    image: record(artwork) ? artwork.front_default ?? null : null,
    sprite: value.sprites.front_default ?? null,
    gameSprites,
    historicalArtworks,
    height: value.height, weight: value.weight,
    stats: value.stats.map(stat => {
      if (!record(stat) || !record(stat.stat)) throw new Error('Estadística incompleta.');
      return { id: stat.stat.name, value: stat.base_stat };
    }),
    pastStats: value.past_stats.map(history => {
      if (!record(history) || !record(history.generation) || !Array.isArray(history.stats)) throw new Error('Historial de estadísticas incompleto.');
      return {
        generation: resourceId(history.generation.url),
        stats: history.stats.map(stat => {
          if (!record(stat) || !record(stat.stat)) throw new Error('Estadística histórica incompleta.');
          return { id: stat.stat.name, value: stat.base_stat };
        }),
      };
    }),
  };
  if (!isPokemon(entry, generationId)) throw new Error('Datos incompletos o inválidos en PokéAPI.');
  return entry;
}

async function fetchJson(path: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(API + path + '/', { signal, cache: 'no-cache' });
  if (!response.ok) throw new Error(`PokéAPI respondió HTTP ${response.status}.`);
  return response.json();
}

export async function fetchGeneration(generationId: number, signal: AbortSignal, onProgress: (completed: number) => void, onPokemon?: (raw: unknown) => void): Promise<Pokemon[]> {
  const definition = generationInfo(generationId);
  const generation = await fetchJson('generation/' + generationId, signal);
  if (!record(generation) || !Array.isArray(generation.pokemon_species)) throw new Error('Generación incompleta en PokéAPI.');
  const ids = generation.pokemon_species.map(entry => {
    if (!record(entry)) throw new Error('Especie inválida en PokéAPI.');
    return resourceId(entry.url);
  });
  if (ids.length !== definition.speciesIds.length || new Set(ids).size !== ids.length || ids.some(id => !definition.speciesIds.includes(id))) throw new Error(`La generación no contiene las ${definition.speciesIds.length} especies esperadas.`);
  const pokemon: Pokemon[] = [];
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < ids.length) {
      signal.throwIfAborted();
      const id = ids[next++];
      // La forma predeterminada comparte ID con su especie; las variantes quedan fuera del conteo.
      const raw = await fetchJson('pokemon/' + id, signal);
      const entry = normalizePokemon(raw, generationId);
      if (entry.id !== id) throw new Error('PokéAPI devolvió una especie diferente a la solicitada.');
      onPokemon?.(raw);
      pokemon.push(entry);
      onProgress(pokemon.length);
    }
  }));
  return pokemon.sort((a, b) => a.id - b.id);
}

export const fetchKanto = (signal: AbortSignal, onProgress: (completed: number) => void) => fetchGeneration(1, signal, onProgress);
export const cacheKey = (generation: number) => generation === 1 ? CACHE_KEY : `pokemetrics-generation-${generation}-v1`;

export interface GenerationDataset { schemaVersion: 1; generation: number; pokemon: Pokemon[]; savedAt: number }
export function parseGenerationDataset(value: unknown, generation: number): GenerationDataset {
  if (!record(value) || value.schemaVersion !== 1 || value.generation !== generation || !positiveInteger(value.savedAt) || !Number.isFinite(new Date(value.savedAt).getTime()) || !isPokemonDataset(value.pokemon, generation)) throw Error('Invalid generation dataset');
  return { schemaVersion: 1, generation, pokemon: value.pokemon, savedAt: value.savedAt };
}

export function readCache(generation = 1): { pokemon: Pokemon[]; savedAt: number; checkedAt: number } | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(cacheKey(generation)) || 'null');
    if (record(value) && isPokemonDataset(value.pokemon, generation) && positiveInteger(value.savedAt) && Number.isFinite(new Date(value.savedAt).getTime())) return { pokemon: value.pokemon, savedAt: value.savedAt, checkedAt: positiveInteger(value.checkedAt) ? value.checkedAt : 0 };
  } catch { /* El almacenamiento puede estar bloqueado o contener datos incompletos. */ }
  return null;
}

export function writeCache(pokemon: Pokemon[], generation = 1, savedAt = Date.now()): number {
  try { localStorage.setItem(cacheKey(generation), JSON.stringify({ pokemon, savedAt, checkedAt: Date.now() })); }
  catch { /* La consulta funciona aunque el navegador no permita almacenamiento. */ }
  return savedAt;
}

export async function loadGeneration(generation: number, signal: AbortSignal, force = false): Promise<{ pokemon: Pokemon[]; savedAt: number }> {
  signal.throwIfAborted();
  const cached = readCache(generation);
  const age = cached ? Date.now() - cached.checkedAt : Infinity;
  if (!force && cached && cached.pokemon.every(pokemon => pokemon.typeHistory !== undefined) && age >= 0 && age < 86_400_000) return cached;
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(20_000)]);
  const response = await fetch(`${import.meta.env.BASE_URL}data/generation-${generation}.json`, { signal: requestSignal, cache: 'no-cache' });
  if (!response.ok) throw Error(`Generation data HTTP ${response.status}`);
  const dataset = parseGenerationDataset(await response.json(), generation);
  requestSignal.throwIfAborted();
  if (response.headers.get('X-Pokemetrics-Offline') !== '1') writeCache(dataset.pokemon, generation, dataset.savedAt);
  return dataset;
}
