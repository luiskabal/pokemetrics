import { writeFile } from 'node:fs/promises';

const languages = ['en', 'es', 'es-419', 'ja'];
const catalog = { source: 'https://pokeapi.co/api/v2/', pokemon: {}, types: {}, stats: {} };
const speciesResponse = await fetch(catalog.source + 'pokemon-species/?limit=10000', { signal: AbortSignal.timeout(30000) });
if (!speciesResponse.ok) throw new Error('Unable to list Pokémon species.');
const speciesIndex = await speciesResponse.json();
if (!Array.isArray(speciesIndex.results) || !speciesIndex.results.length) throw new Error('Empty species catalog.');
const jobs = [
  ...speciesIndex.results.map(species => ({ group: 'pokemon', endpoint: 'pokemon-species', id: Number(species.url.match(/\/(\d+)\/$/)?.[1]) })),
  ...Array.from({ length: 18 }, (_, i) => ({ group: 'types', endpoint: 'type', id: i + 1 })),
  ...Array.from({ length: 6 }, (_, i) => ({ group: 'stats', endpoint: 'stat', id: i + 1 })),
];
let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < jobs.length) {
    const job = jobs[next++];
    const response = await fetch(`${catalog.source}${job.endpoint}/${job.id}/`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`${job.endpoint}/${job.id}: HTTP ${response.status}`);
    const entry = await response.json();
    if (entry.id !== job.id || typeof entry.name !== 'string' || !Array.isArray(entry.names)) throw new Error('Invalid localized resource.');
    const names = Object.fromEntries(entry.names.map(item => [item.language.name, item.name]));
    if (typeof names.en !== 'string' || !names.en.trim()) throw new Error(`Missing English fallback: ${entry.name}`);
    const localized = Object.fromEntries(languages.map(language => {
      const name = language === 'ja' ? names.ja ?? names['ja-hrkt'] : names[language];
      if (name !== undefined && (typeof name !== 'string' || !name.trim())) throw new Error(`Invalid ${language} name: ${entry.name}`);
      return [language, name ?? null];
    }));
    if (job.group === 'pokemon' && typeof names['ja-roma'] === 'string') localized.romanized = names['ja-roma'];
    catalog[job.group][entry.name] = localized;
  }
}));
for (const group of ['pokemon', 'types', 'stats']) catalog[group] = Object.fromEntries(Object.entries(catalog[group]).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(new URL('../src/lib/locale-data.json', import.meta.url), JSON.stringify(catalog, null, 2) + '\n');
console.log(`Saved official names: ${Object.keys(catalog.pokemon).length} Pokémon, ${Object.keys(catalog.types).length} types, ${Object.keys(catalog.stats).length} stats; ${languages.join(', ')}.`);
