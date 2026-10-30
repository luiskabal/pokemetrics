import { TYPES, TYPE_BY_ID } from './metadata';
import type { TypeId } from './metadata';
import type { Analysis, ChartGroup, Pokemon, PokemonOrder, ViewMode } from './model';
import { LOCALES, pokemonAliases, pokemonName, translate, typeName } from './localization';
import type { Language } from './localization';
import { statsForGeneration } from './stats';
export { pokemonName } from './localization';

export function visibleTypes(pokemon: Pokemon, view: ViewMode): TypeId[] {
  return view === 'legacy' ? pokemon.legacyTypes : pokemon.types;
}

export function pokemonInSegment(pokemon: readonly Pokemon[], selected: ReadonlySet<TypeId>, view: ViewMode, key: string): Pokemon[] {
  return pokemon.filter(entry => visibleTypes(entry, view).filter(type => selected.has(type)).sort().join('+') === key);
}

export function analyzePokemon(pokemon: readonly Pokemon[], selected: ReadonlySet<TypeId>, view: ViewMode, language: Language = 'es-419'): Analysis {
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
      label: matches.length ? matches.map(type => typeName(type, language)).join(' + ') : translate(language, 'otherPokemon'),
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

export function percentage(count: number, total: number, language: Language = 'es-419'): string {
  return (total ? count / total * 100 : 0).toLocaleString(LOCALES[language], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + (language.startsWith('es') ? ' %' : '%');
}

const searchText = (text: string) => text.normalize('NFKC').normalize('NFD').replace(/(\p{Script=Latin})\p{M}+/gu, '$1').normalize('NFC').toLowerCase().replace(/♀/g, 'f').replace(/♂/g, 'm').replace(/[^\p{L}\p{N}]/gu, '');

export function filterAndSortPokemon(pokemon: readonly Pokemon[], query: string, order: PokemonOrder, language: Language = 'es-419', view: ViewMode = 'current', generation = 1): Pokemon[] {
  const term = searchText(query);
  const id = /^\d+$/.test(term) ? Number(term) : null;
  const matches = pokemon.filter(entry => !term || (id === null ? pokemonAliases(entry.name).some(name => searchText(name).includes(term)) : entry.id === id));
  const direction = order.endsWith('desc') ? -1 : 1;
  const nameOrder = new Intl.Collator(LOCALES[language], { sensitivity: 'base' });
  if (order.startsWith('number')) return matches.sort((a, b) => direction * (a.id - b.id));
  if (order.startsWith('name')) return matches.sort((a, b) => direction * (nameOrder.compare(pokemonName(a.name, language), pokemonName(b.name, language)) || a.id - b.id));
  const field = order.slice(0, order.lastIndexOf('-'));
  const values = new Map(matches.map(entry => [entry.id, field === 'height' || field === 'weight' ? entry[field] : statsForGeneration(entry, view === 'legacy' ? generation : 'current')?.find(stat => stat.id === field)?.value ?? null]));
  return matches.sort((a, b) => {
    const first = values.get(a.id)!, second = values.get(b.id)!;
    if (first === null || second === null) return first === second ? a.id - b.id : first === null ? 1 : -1;
    return direction * (first - second) || a.id - b.id;
  });
}
