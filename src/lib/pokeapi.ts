import { GAMES, HISTORICAL_ARTWORKS, LEGACY_TYPES, STATS, TYPE_BY_ID } from './metadata';
import type { TypeId } from './metadata';
import type { Pokemon } from './model';

export const CACHE_KEY = 'pokemetrics-kanto-v5';
const API = 'https://pokeapi.co/api/v2/';
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const typeId = (value: unknown): value is TypeId => typeof value === 'string' && Object.hasOwn(TYPE_BY_ID, value);
const validTypes = (value: unknown): value is TypeId[] => Array.isArray(value) && value.length >= 1 && value.length <= 2 && value.every(typeId) && new Set(value).size === value.length;
const positiveInteger = (value: unknown): value is number => Number.isInteger(value) && Number(value) > 0;
const imageUrl = (value: unknown) => value === null || (typeof value === 'string' && value.startsWith('https://'));
const validGameSprites = (value: unknown): value is Pokemon['gameSprites'] => record(value) && GAMES.every(game => {
  const sprites = value[game.id];
  return record(sprites) && imageUrl(sprites.front) && imageUrl(sprites.back);
});
const validHistoricalArtworks = (value: unknown) => value === undefined || (record(value) && HISTORICAL_ARTWORKS.every(artwork => imageUrl(value[artwork.id])));

function isPokemon(entry: unknown): entry is Pokemon {
    if (!record(entry) || !positiveInteger(entry.id) || entry.id > 151 ||
      typeof entry.name !== 'string' || !entry.name.length ||
      !validTypes(entry.types) || !validTypes(entry.legacyTypes) || !entry.legacyTypes.every(id => LEGACY_TYPES.some(type => type.id === id)) ||
      !imageUrl(entry.image) || !imageUrl(entry.sprite) || !validGameSprites(entry.gameSprites) || !validHistoricalArtworks(entry.historicalArtworks) ||
      !positiveInteger(entry.height) || !positiveInteger(entry.weight) ||
      !Array.isArray(entry.stats) || entry.stats.length !== STATS.length ||
      !entry.stats.every(stat => record(stat) && STATS.some(item => item.id === stat.id) && positiveInteger(stat.value)) ||
      new Set(entry.stats.map(stat => stat.id)).size !== STATS.length) return false;
    return true;
}

export function isPokemonDataset(value: unknown): value is Pokemon[] {
  return Array.isArray(value) && value.length === 151 && value.every(isPokemon) && new Set(value.map(entry => entry.id)).size === 151;
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

export function normalizePokemon(value: unknown): Pokemon {
  if (!record(value) || !Array.isArray(value.past_types) || !record(value.sprites) || !Array.isArray(value.stats)) throw new Error('Pokémon incompleto en PokéAPI.');
  const types = readTypes(value.types);
  const history = value.past_types.map(entry => {
    if (!record(entry) || !record(entry.generation)) throw new Error('Historial de tipos inválido.');
    return { generation: resourceId(entry.generation.url), types: entry.types };
  }).sort((a, b) => a.generation - b.generation)[0];
  // Cada registro termina en su generación indicada; el más antiguo también cubre Gen I.
  const originalTypes = history ? readTypes(history.types) : types;
  const other = value.sprites.other;
  const artwork = record(other) ? other['official-artwork'] : undefined;
  const artworkVersions = record(artwork) ? artwork.versions : undefined;
  const generationArtwork = record(artworkVersions) ? artworkVersions['generation-i'] : undefined;
  const historicalArtworks = Object.fromEntries(HISTORICAL_ARTWORKS.map(version => {
    const image = record(generationArtwork) ? generationArtwork[version.id] : undefined;
    return [version.id, record(image) ? image.front_default ?? null : null];
  }));
  const versions = value.sprites.versions;
  const generation = record(versions) ? versions['generation-i'] : undefined;
  const gameSprites = Object.fromEntries(GAMES.map(game => {
    const sprites = record(generation) ? generation[game.id] : undefined;
    return [game.id, {
      front: record(sprites) ? sprites.front_default ?? null : null,
      back: record(sprites) ? sprites.back_default ?? null : null,
    }];
  }));
  const entry = {
    id: value.id, name: value.name, types, legacyTypes: originalTypes,
    image: record(artwork) ? artwork.front_default ?? null : null,
    sprite: value.sprites.front_default ?? null,
    gameSprites,
    historicalArtworks,
    height: value.height, weight: value.weight,
    stats: value.stats.map(stat => {
      if (!record(stat) || !record(stat.stat)) throw new Error('Estadística incompleta.');
      return { id: stat.stat.name, value: stat.base_stat };
    }),
  };
  if (!isPokemon(entry)) throw new Error('Datos incompletos o inválidos en PokéAPI.');
  return entry;
}

async function fetchJson(path: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(API + path + '/', { signal, cache: 'no-cache' });
  if (!response.ok) throw new Error(`PokéAPI respondió HTTP ${response.status}.`);
  return response.json();
}

export async function fetchKanto(signal: AbortSignal, onProgress: (completed: number) => void): Promise<Pokemon[]> {
  const generation = await fetchJson('generation/1', signal);
  if (!record(generation) || !Array.isArray(generation.pokemon_species)) throw new Error('Generación incompleta en PokéAPI.');
  const ids = generation.pokemon_species.map(entry => {
    if (!record(entry)) throw new Error('Especie inválida en PokéAPI.');
    return resourceId(entry.url);
  });
  if (ids.length !== 151 || new Set(ids).size !== 151 || ids.some(id => id > 151)) throw new Error('La generación no contiene las 151 especies de Kanto.');
  const pokemon: Pokemon[] = [];
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < ids.length) {
      signal.throwIfAborted();
      const id = ids[next++];
      // Las formas originales de Kanto comparten ID con su especie; se excluyen variantes.
      const entry = normalizePokemon(await fetchJson('pokemon/' + id, signal));
      if (entry.id !== id) throw new Error('PokéAPI devolvió una especie diferente a la solicitada.');
      pokemon.push(entry);
      onProgress(pokemon.length);
    }
  }));
  return pokemon.sort((a, b) => a.id - b.id);
}

export function readCache(): { pokemon: Pokemon[]; savedAt: number } | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (record(value) && isPokemonDataset(value.pokemon) && positiveInteger(value.savedAt) && Number.isFinite(new Date(value.savedAt).getTime())) return { pokemon: value.pokemon, savedAt: value.savedAt };
  } catch { /* El almacenamiento puede estar bloqueado o contener datos incompletos. */ }
  return null;
}

export function writeCache(pokemon: Pokemon[]): number {
  const savedAt = Date.now();
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ pokemon, savedAt })); }
  catch { /* La consulta funciona aunque el navegador no permita almacenamiento. */ }
  return savedAt;
}
