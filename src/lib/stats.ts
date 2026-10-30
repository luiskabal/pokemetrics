import { GEN_I_STATS, STATS } from './metadata';
import type { HistoricalStatId } from './metadata';
import type { Pokemon } from './model';

export interface BaseStat { id: HistoricalStatId; value: number }

export function statsForGeneration(pokemon: Pokemon, generation: number | 'current'): BaseStat[] | null {
  const values = new Map<HistoricalStatId, number>(pokemon.stats.map(stat => [stat.id, stat.value]));
  if (generation !== 'current') {
    if (pokemon.pastStats === undefined) return null;
    // Los registros son cambios parciales con límite inclusivo; gana el más cercano a la generación consultada por cada stat.
    for (const history of [...pokemon.pastStats].sort((a, b) => b.generation - a.generation)) {
      if (history.generation < generation) continue;
      for (const stat of history.stats) values.set(stat.id, stat.value);
    }
    if (generation === 1 && !values.has('special')) return null;
  }
  return (generation === 1 ? GEN_I_STATS : STATS).map(({ id }) => ({ id, value: values.get(id)! }));
}
