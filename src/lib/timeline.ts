import { GENERATIONS, SPECIES_GENERATION } from './generations';
import { historicalTypes } from './universe';
import { statsForGeneration } from './stats';
import type { Pokemon } from './model';
export function pokemonTimeline(pokemon: Pokemon) {
  const rows = GENERATIONS.filter(era => era.id >= SPECIES_GENERATION.get(pokemon.id)!).map(era => ({ era, types: historicalTypes(pokemon, era.id), stats: statsForGeneration(pokemon, era.id) }));
  return rows.map((row, index) => {
    const previous = rows[index - 1];
    return { ...row, typeChange: !!previous && previous.types.join(',') !== row.types.join(','), stats: row.stats?.map(stat => { const before = previous?.stats?.find(value => value.id === stat.id)?.value; return { ...stat, delta: before === undefined ? null : stat.value - before }; }) ?? null };
  });
}
