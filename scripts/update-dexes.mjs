import { readFile, writeFile } from 'node:fs/promises';
const data = JSON.parse(await readFile(new URL('../src/lib/generation-data.json', import.meta.url), 'utf8'));
const known = new Set(data.generations.flatMap(g => g.speciesIds));
const index = await (await fetch('https://pokeapi.co/api/v2/pokedex/?limit=200')).json();
const dexes = []; let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => { while (next < index.results.length) {
  const reference = index.results[next++]; const response = await fetch(reference.url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error('Pokédex unavailable');
  const dex = await response.json();
  if (!Array.isArray(dex.pokemon_entries) || !dex.pokemon_entries.length) continue;
  const entries = dex.pokemon_entries.map(row => ({ id: Number(row.pokemon_species.url.match(/\/(\d+)\/$/)[1]), number: row.entry_number }));
  if (entries.some(entry => !known.has(entry.id))) continue;
  dexes.push({ id: dex.id, name: dex.name, names: Object.fromEntries(['en', 'es', 'es-419', 'ja'].map(locale => [locale, dex.names.find(row => row.language.name === locale)?.name ?? null])), groups: dex.version_groups.map(group => group.name), entries });
} }));
await writeFile(new URL('../src/lib/dex-data.json', import.meta.url), JSON.stringify(dexes.sort((a, b) => a.id - b.id)) + '\n');
console.log(`${dexes.length} regional Pokédex definitions validated`);
