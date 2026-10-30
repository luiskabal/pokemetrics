import type { StatId, TypeId } from './metadata';

export type ViewMode = 'current' | 'legacy';
export type PokemonOrder = 'number-asc' | 'number-desc' | 'name-asc' | 'name-desc';
export interface Pokemon {
  id: number;
  name: string;
  types: TypeId[];
  legacyTypes: TypeId[];
  image: string | null;
  sprite: string | null;
  height: number;
  weight: number;
  stats: { id: StatId; value: number }[];
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
  message: string;
  completed: number;
}
