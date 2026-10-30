import { TYPES, TYPE_BY_ID } from './metadata';
import type { TypeId } from './metadata';
import type { Analysis, ChartGroup, Pokemon, ViewMode } from './model';

export function visibleTypes(pokemon: Pokemon, view: ViewMode): TypeId[] {
  return view === 'legacy' ? pokemon.legacyTypes : pokemon.types;
}

export function analyzePokemon(pokemon: readonly Pokemon[], selected: ReadonlySet<TypeId>, view: ViewMode): Analysis {
  const result: Analysis = { total: pokemon.length, matches: [], groups: [], details: [], remaining: pokemon.length };
  if (!selected.size || !pokemon.length) return result;

  const counts = new Map<TypeId, number>([...selected].map(id => [id, 0]));
  const groups = new Map<string, ChartGroup>();
  for (const entry of pokemon) {
    const matches = visibleTypes(entry, view).filter(type => selected.has(type)).sort();
    const key = matches.join('+');
    for (const type of matches) counts.set(type, counts.get(type)! + 1);
    if (matches.length) result.matches.push(entry);
    if (!groups.has(key)) groups.set(key, {
      key, types: matches, count: 0,
      label: matches.length ? matches.map(type => TYPE_BY_ID[type].name).join(' + ') : 'Otros Pokémon',
      color: groupColor(matches),
    });
    groups.get(key)!.count++;
  }
  result.groups = [...groups.values()].sort((a, b) => {
    if (!a.key) return 1;
    if (!b.key) return -1;
    return b.count - a.count || a.key.localeCompare(b.key);
  });
  result.details = TYPES.filter(type => selected.has(type.id)).map(type => ({ type: type.id, count: counts.get(type.id)! }));
  result.remaining = pokemon.length - result.matches.length;
  return result;
}

function groupColor(types: TypeId[]): string {
  if (!types.length) return '#e0e5db';
  if (types.length === 1) return TYPE_BY_ID[types[0]].color;
  const colors = types.map(type => TYPE_BY_ID[type].color);
  return '#' + [1, 3, 5].map(offset => Math.round(colors.reduce((sum, color) => sum + parseInt(color.slice(offset, offset + 2), 16), 0) / colors.length).toString(16).padStart(2, '0')).join('');
}

export function piePath(start: number, fraction: number): string {
  if (fraction === 1) return 'M 180 26 A 154 154 0 1 1 180 334 A 154 154 0 1 1 180 26 Z';
  const point = (turn: number) => {
    const angle = turn * Math.PI * 2 - Math.PI / 2;
    return `${(180 + 154 * Math.cos(angle)).toFixed(5)} ${(180 + 154 * Math.sin(angle)).toFixed(5)}`;
  };
  return `M 180 180 L ${point(start)} A 154 154 0 ${fraction > .5 ? 1 : 0} 1 ${point(start + fraction)} Z`;
}

export function percentage(count: number, total: number): string {
  return (total ? count / total * 100 : 0).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';
}

const SPECIAL_NAMES = new Map([['nidoran-f', 'Nidoran ♀'], ['nidoran-m', 'Nidoran ♂'], ['mr-mime', 'Mr. Mime'], ['farfetchd', 'Farfetch’d']]);
export function pokemonName(name: string): string {
  return SPECIAL_NAMES.get(name) || name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
