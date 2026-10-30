import type { GameId, HistoricalArtworkId, HistoricalStatId, StatId, TypeId } from './metadata';

export type ViewMode = 'current' | 'legacy';
export type PokemonOrder = `${'number' | 'name' | HistoricalStatId | 'height' | 'weight'}-${'asc' | 'desc'}`;
export type SpriteSide = 'front' | 'back';
export interface Pokemon {
  id: number;
  name: string;
  types: TypeId[];
  legacyTypes: TypeId[];
  image: string | null;
  sprite: string | null;
  gameSprites: Record<GameId, { front: string | null; back: string | null }>;
  historicalArtworks?: Record<HistoricalArtworkId, string | null>;
  height: number;
  weight: number;
  stats: { id: StatId; value: number }[];
  pastStats?: { generation: number; stats: { id: HistoricalStatId; value: number }[] }[];
}

export interface ChartGroup {
  key: string;
  types: TypeId[];
  count: number;
  label: string;
  color: string;
}

export interface Analysis {
  total: number;
  matches: Pokemon[];
  groups: ChartGroup[];
  details: { type: TypeId; count: number }[];
  remaining: number;
}

export interface LoadState {
  status: 'loading' | 'refreshing' | 'ready' | 'cached' | 'error';
  completed: number;
}
