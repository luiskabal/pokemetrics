import data from './generation-data.json';
import { TYPES } from './metadata';
import type { HistoricalArtworkId, IllustrationId, TypeId } from './metadata';
import type { LocalizedNames } from './localization';
export interface GameDefinition { id: string; generation: number; spriteKey: string; names: LocalizedNames }
export interface GenerationDefinition { id: number; slug: string; roman: string; names: LocalizedNames; regionNames: LocalizedNames; platform: string; year: number | null; speciesIds: number[]; games: GameDefinition[]; artworks: HistoricalArtworkId[] }
export const GENERATIONS = data.generations as GenerationDefinition[];
export const GENERATION_BY_ID = new Map(GENERATIONS.map(generation => [generation.id, generation]));
export const GAME_BY_ID = new Map(GENERATIONS.flatMap(generation => generation.games.map(game => [game.id, game] as const)));
export const SPECIES_GENERATION = new Map(GENERATIONS.flatMap(generation => generation.speciesIds.map(id => [id, generation.id] as const)));
export const VERSION_GENERATIONS = data.versionGenerations as Record<string, number>;
export const VERSION_GROUP_GENERATIONS = data.versionGroupGenerations as Record<string, number>;
export function generationInfo(id: number): GenerationDefinition { return GENERATION_BY_ID.get(id)!; }
export function typesForGeneration(id: number) { return TYPES.filter(type => (data.typeGenerations as Record<TypeId, number>)[type.id] <= id); }
export function illustrationOptions(id: number): { id: IllustrationId }[] { const generation = generationInfo(id); return [...generation.artworks.map(id => ({ id })), ...generation.games.map(game => ({ id: `game:${game.id}` as IllustrationId })), { id: 'current' }]; }
export function defaultIllustration(id: number): IllustrationId { const generation = generationInfo(id); return generation.artworks[0] ?? `game:${generation.games[0].id}`; }
