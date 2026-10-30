import { LANGUAGES } from './localization';
import type { Language, LocalizedNames } from './localization';
import { VERSION_GENERATIONS, VERSION_GROUP_GENERATIONS } from './generations';

const API = 'https://pokeapi.co/api/v2/';
const KEY = 'pokemetrics-info-v1';
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const clean = (v: unknown): string => { if (typeof v !== 'string') throw Error('Invalid text'); return v.replace(/[\n\r\f]+/g, ' ').replace(/\s+/g, ' ').trim(); };
const idOf = (v: unknown): number => { const id = typeof v === 'string' ? Number(v.match(/\/(\d+)\/$/)?.[1]) : NaN; if (!Number.isSafeInteger(id) || id < 1) throw Error('Invalid resource'); return id; };
const rows = (v: unknown): Record<string, unknown>[] => { if (!Array.isArray(v) || !v.every(record)) throw Error('Invalid list'); return v; };
const localeOf = (row: Record<string, unknown>): string => record(row.language) ? String(row.language.name) : '';
function names(v: unknown, field = 'name'): LocalizedNames {
  const entries = rows(v);
  return Object.fromEntries(LANGUAGES.map(({ id }) => {
    const row = entries.find(row => localeOf(row) === id) ?? (id === 'ja' ? entries.find(row => localeOf(row) === 'ja-hrkt') : undefined);
    return [id, row ? clean(row[field]) : null];
  })) as LocalizedNames;
}
export function translatedText(value: LocalizedNames, language: Language): { text: string; language: Language } | null {
  for (const locale of [...new Set([language, ...(language === 'es-419' ? ['es' as const] : []), 'en' as const])]) if (value[locale]) return { text: value[locale]!, language: locale };
  return null;
}
export interface SpeciesInfo { id: number; name: string; names: LocalizedNames; category: LocalizedNames; generation: number; chainId: number | null; entries: { text: string; language: Language; version: string; versionId: number }[] }
export function parseSpecies(raw: unknown): SpeciesInfo {
  if (!record(raw) || !Number.isSafeInteger(raw.id) || !record(raw.generation)) throw Error('Invalid species');
  return { id: Number(raw.id), name: clean(raw.name), names: names(raw.names), category: names(raw.genera, 'genus'), generation: idOf(raw.generation.url), chainId: record(raw.evolution_chain) ? idOf(raw.evolution_chain.url) : null,
    entries: rows(raw.flavor_text_entries).flatMap(row => {
      const language = localeOf(row) === 'ja-hrkt' ? 'ja' : localeOf(row);
      if (!LANGUAGES.some(locale => locale.id === language)) return [];
      if (!record(row.version)) throw Error('Invalid version');
      return [{ text: clean(row.flavor_text), language: language as Language, version: clean(row.version.name), versionId: idOf(row.version.url) }];
    }),
  };
}
export function descriptionFor(species: SpeciesInfo, language: Language, generation: number | 'current') {
  const entries = species.entries.filter(entry => generation === 'current' || VERSION_GENERATIONS[entry.versionId] === generation).sort((a, b) => b.versionId - a.versionId);
  for (const locale of [...new Set([language, ...(language === 'es-419' ? ['es' as const] : []), 'en' as const])]) {
    const entry = entries.find(entry => entry.language === locale);
    if (entry) return entry;
  }
  return null;
}
interface Slot { slot: number; id: number | null; hidden: boolean }
function slots(raw: unknown): Slot[] { return rows(raw).map(row => { if (!Number.isSafeInteger(row.slot) || Number(row.slot) < 1 || typeof row.is_hidden !== 'boolean') throw Error('Invalid ability slot'); return { slot: Number(row.slot), id: row.ability === null ? null : record(row.ability) ? idOf(row.ability.url) : idOf(null), hidden: row.is_hidden }; }); }
export function abilitiesFor(raw: unknown, generation: number | 'current'): Slot[] {
  if (generation !== 'current' && generation < 3) return [];
  if (!record(raw)) throw Error('Invalid Pokémon');
  const selected = new Map(slots(raw.abilities).map(slot => [slot.slot, slot]));
  if (generation !== 'current') {
    const history = rows(raw.past_abilities).map(row => { if (!record(row.generation)) throw Error('Invalid ability history'); return { generation: idOf(row.generation.url), slots: slots(row.abilities) }; }).sort((a, b) => b.generation - a.generation);
    for (const entry of history) if (entry.generation >= generation) for (const slot of entry.slots) selected.set(slot.slot, slot);
  }
  return [...selected.values()].filter(slot => slot.id !== null).sort((a, b) => a.slot - b.slot);
}
interface AbilityInfo { id: number; name: string; names: LocalizedNames; description: LocalizedNames }
function parseAbility(raw: unknown, generation: number | 'current'): AbilityInfo {
  if (!record(raw)) throw Error('Invalid ability');
  const flavors = rows(raw.flavor_text_entries).filter(row => generation === 'current' || record(row.version_group) && VERSION_GROUP_GENERATIONS[idOf(row.version_group.url)] === generation).sort((a, b) => { if (!record(a.version_group) || !record(b.version_group)) throw Error('Invalid ability version'); return idOf(b.version_group.url) - idOf(a.version_group.url); });
  return { id: Number(raw.id), name: clean(raw.name), names: names(raw.names), description: names(flavors, 'flavor_text') };
}
interface ChainNode { id: number; depth: number }
export function parseChain(raw: unknown): ChainNode[] {
  if (!record(raw)) throw Error('Invalid evolution chain');
  const result: ChainNode[] = [];
  function visit(node: unknown, depth: number) { if (!record(node) || !record(node.species)) throw Error('Invalid evolution'); result.push({ id: idOf(node.species.url), depth }); for (const child of rows(node.evolves_to)) visit(child, depth + 1); }
  visit(raw.chain, 0); return result;
}
const cache = new Map<string, { savedAt: number; value: unknown }>();
try { const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}'); if (record(stored)) for (const [key, value] of Object.entries(stored)) if (record(value) && typeof value.savedAt === 'number') cache.set(key, { savedAt: value.savedAt, value: value.value }); } catch { /* La caché adicional es opcional. */ }
function slim(path: string, raw: unknown): unknown {
  if (!record(raw)) throw Error('Invalid response');
  const fields = path.startsWith('pokemon-species/') ? ['id', 'name', 'names', 'genera', 'generation', 'evolution_chain', 'flavor_text_entries'] : path.startsWith('pokemon/') ? ['id', 'abilities', 'past_abilities'] : path.startsWith('ability/') ? ['id', 'name', 'names', 'flavor_text_entries'] : path.startsWith('version/') ? ['id', 'name', 'names'] : ['id', 'chain'];
  return Object.fromEntries(fields.map(field => [field, ['names', 'genera', 'flavor_text_entries'].includes(field) ? rows(raw[field]).filter(row => LANGUAGES.some(locale => locale.id === localeOf(row)) || localeOf(row) === 'ja-hrkt') : raw[field]]));
}
async function resource<T>(path: string, decode: (raw: unknown) => T, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  const read = (value: unknown) => { if (!record(value) || value.id !== Number(path.split('/')[1])) throw Error('Unexpected resource'); return decode(value); };
  const stored = cache.get(path);
  if (stored && Date.now() - stored.savedAt < 86_400_000) { try { return read(stored.value); } catch { cache.delete(path); } }
  try {
    const response = await fetch(API + path + '/', { signal });
    if (!response.ok) throw Error(`PokéAPI HTTP ${response.status}`);
    const value: unknown = await response.json();
    const result = read(value);
    cache.set(path, { savedAt: Date.now(), value: slim(path, value) });
    try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries([...cache].sort((a, b) => a[1].savedAt - b[1].savedAt).slice(-40)))); } catch { /* La sesión conserva los datos aunque no se puedan guardar. */ }
    return result;
  } catch (error) { if (stored && !signal.aborted) return read(stored.value); throw error; }
}
export interface PokemonInfo { species: SpeciesInfo; evolutions: { species: SpeciesInfo; depth: number }[]; abilities: { info: AbilityInfo; hidden: boolean }[]; versions: Record<string, LocalizedNames> }
export async function loadPokemonInfo(id: number, generation: number | 'current', signal: AbortSignal): Promise<PokemonInfo> {
  const species = await resource(`pokemon-species/${id}`, parseSpecies, signal);
  const nodes = species.chainId ? await resource(`evolution-chain/${species.chainId}`, parseChain, signal) : [{ id, depth: 0 }];
  const evolutions: PokemonInfo['evolutions'] = [];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(4, nodes.length) }, async () => { while (next < nodes.length) { const node = nodes[next++]; const related = await resource(`pokemon-species/${node.id}`, parseSpecies, signal); if (generation === 'current' || related.generation <= generation) evolutions.push({ species: related, depth: node.depth }); } }));
  evolutions.sort((a, b) => nodes.findIndex(node => node.id === a.species.id) - nodes.findIndex(node => node.id === b.species.id));
  const firstDepth = Math.min(...evolutions.map(node => node.depth));
  for (const node of evolutions) node.depth -= firstDepth;
  const selected = generation !== 'current' && generation < 3 ? [] : await resource(`pokemon/${id}`, raw => abilitiesFor(raw, generation), signal);
  const abilities = await Promise.all(selected.map(async slot => ({ hidden: slot.hidden, info: await resource(`ability/${slot.id}`, raw => parseAbility(raw, generation), signal) })));
  const versionIds = [...new Set(LANGUAGES.flatMap(locale => { const entry = descriptionFor(species, locale.id, generation); return entry ? [entry.versionId] : []; }))];
  const versions = Object.fromEntries(await Promise.all(versionIds.map(async versionId => [versionId, await resource(`version/${versionId}`, raw => { if (!record(raw)) throw Error('Invalid version'); return names(raw.names); }, signal)])));
  return { species, evolutions, abilities, versions };
}
