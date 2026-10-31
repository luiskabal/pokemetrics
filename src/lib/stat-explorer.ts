import { GEN_I_STATS, STATS } from './metadata';
import type { HistoricalStatId } from './metadata';
import type { Pokemon, ViewMode } from './model';
import { statsForGeneration } from './stats';
export interface StatRange { id: HistoricalStatId; min: number; max: number }
export function availableStats(view: ViewMode, era: number) { return view === 'legacy' && era === 1 ? GEN_I_STATS : STATS; }
export function parseRanges(text: string | null): StatRange[] {
  const result: StatRange[] = [];
  for (const part of (text ?? '').split(';')) { const [id, lower, upper] = part.split(':'); const min = Number(lower); const max = Number(upper); if ([...STATS, ...GEN_I_STATS].some(stat => stat.id === id) && !result.some(row => row.id === id) && Number.isInteger(min) && Number.isInteger(max) && min >= 0 && max <= 255 && min <= max) result.push({ id: id as HistoricalStatId, min, max }); }
  return result;
}
export function filterStatRanges(pokemon: Pokemon[], ranges: StatRange[], view: ViewMode, era: number) {
  if (!ranges.length) return pokemon;
  return pokemon.filter(pokemon => { const stats = statsForGeneration(pokemon, view === 'legacy' ? era : 'current'); return ranges.every(range => { const value = stats?.find(stat => stat.id === range.id)?.value; return value !== undefined && value >= range.min && value <= range.max; }); });
}
