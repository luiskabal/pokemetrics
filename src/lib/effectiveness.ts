import charts from './type-chart.json';
import type { TypeId } from './metadata';
import { typesForGeneration } from './generations';
const tables = charts as Record<string, Partial<Record<TypeId, Partial<Record<TypeId, number>>>>>;
export function defensiveMatchups(types: readonly TypeId[], generation: number | 'current') {
  const era = generation === 'current' ? 9 : generation;
  return typesForGeneration(era).map(type => ({ type: type.id, multiplier: types.reduce((value, target) => value * tables[era][type.id]![target]!, 1) }));
}
