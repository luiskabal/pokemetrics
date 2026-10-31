import type { Pokemon } from './model';
import type { TypeId } from './metadata';
import type { LocalizedNames } from './localization';
import { GENERATIONS, GAME_BY_ID, SPECIES_GENERATION, generationInfo } from './generations';
import { loadGeneration } from './pokeapi';
export type UniverseScope = 'introduced' | 'national' | 'regional';
export interface RegionalDex { id: number; name: string; names: LocalizedNames; groups: string[]; entries: { id: number; number: number }[] }
export async function regionalDexes(game: string): Promise<RegionalDex[]> {
  const { default: data } = await import('./dex-data.json');
  const group = game === 'gold' || game === 'silver' ? 'gold-silver' : game === 'red-green-japan' ? 'red-blue' : game;
  return (data as RegionalDex[]).filter(dex => dex.groups.includes(group));
}
export function historicalTypes(pokemon: Pokemon, era: number): TypeId[] {
  const past = pokemon.typeHistory?.filter(row => row.generation >= era).sort((a, b) => a.generation - b.generation)[0];
  return past?.types ?? pokemon.types;
}
export async function loadUniverse(era: number, scope: UniverseScope, game: string, dexId: number | null, signal: AbortSignal, force = false) {
  if (scope === 'introduced') return loadGeneration(era, signal, force);
  let entries: { id: number; number: number }[];
  if (scope === 'regional') {
    const choices = await regionalDexes(game);
    const dex = dexId === null ? choices[0] : choices.find(dex => dex.id === dexId);
    if (!dex) throw Error('No regional Pokédex for this game');
    entries = dex.entries;
  } else entries = GENERATIONS.filter(g => g.id <= era).flatMap(g => g.speciesIds.map(id => ({ id, number: id })));
  if (entries.some(entry => (SPECIES_GENERATION.get(entry.id) ?? Infinity) > era)) throw Error('Pokédex contains future species');
  const origins = [...new Set(entries.map(entry => SPECIES_GENERATION.get(entry.id)!))];
  const datasets = [];
  for (const origin of origins) { signal.throwIfAborted(); datasets.push(await loadGeneration(origin, signal, force)); }
  const response = await fetch(`${import.meta.env.BASE_URL}data/media-${era}.json`, { signal });
  if (!response.ok) throw Error('Era images unavailable');
  const media = await response.json();
  if (media.generation !== era || media.schemaVersion !== 1 || !media.images || !Number.isSafeInteger(media.savedAt)) throw Error('Invalid era images');
  const byId = new Map(datasets.flatMap(dataset => dataset.pokemon).map(pokemon => [pokemon.id, pokemon]));
  const pokemon = entries.map(entry => {
    const source = byId.get(entry.id); const images = media.images[entry.id];
    if (!source || !images || generationInfo(era).games.some(game => !images[game.id] || [images[game.id].front, images[game.id].back].some(url => url !== null && (typeof url !== 'string' || !url.startsWith('https://'))))) throw Error('Incomplete Pokédex images');
    return { ...source, legacyTypes: historicalTypes(source, era), gameSprites: images, regionalNumber: scope === 'regional' ? entry.number : undefined };
  });
  return { pokemon, savedAt: Math.min(media.savedAt, ...datasets.map(dataset => dataset.savedAt)) };
}
