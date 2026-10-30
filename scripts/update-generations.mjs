import { writeFile } from 'node:fs/promises';
const API = 'https://pokeapi.co/api/v2/';
const languages = ['en', 'es', 'es-419', 'ja'];
const idOf = url => Number(url.match(/\/(\d+)\/$/)?.[1]);
async function get(path) { const response = await fetch(path.startsWith('https:') ? path : API + path, { signal: AbortSignal.timeout(30000) }); if (!response.ok) throw Error(`HTTP ${response.status}: ${path}`); return response.json(); }
async function parallel(items, run) { const result = new Array(items.length); let next = 0; await Promise.all(Array.from({ length: 4 }, async () => { while (next < items.length) { const index = next++; result[index] = await run(items[index]); } })); return result; }
function names(entries, fallback) { return Object.fromEntries(languages.map(locale => [locale, entries.find(entry => entry.language.name === locale)?.name ?? (locale === 'ja' ? entries.find(entry => entry.language.name === 'ja-hrkt')?.name : null) ?? (locale === 'en' ? fallback : null)])); }
const index = await get('generation/?limit=100');
const rawGenerations = await parallel(index.results, entry => get(entry.url));
const groupUrls = [...new Set(rawGenerations.flatMap(entry => entry.version_groups.map(group => group.url)))];
const groups = await parallel(groupUrls, get);
const versionUrls = [...new Set(groups.flatMap(group => group.versions.map(version => version.url)))];
const versions = await parallel(versionUrls, get);
const regionUrls = [...new Set(rawGenerations.map(entry => entry.main_region.url))];
const regions = await parallel(regionUrls, get);
const samples = await parallel(rawGenerations, generation => get(`pokemon/${Math.min(...generation.pokemon_species.map(species => idOf(species.url)))}/`));
const platforms = ['GAME BOY', 'GAME BOY COLOR', 'GAME BOY ADVANCE', 'NINTENDO DS', 'NINTENDO DS', 'NINTENDO 3DS', 'NINTENDO 3DS', 'NINTENDO SWITCH', 'NINTENDO SWITCH'];
const years = [1996, 1999, 2002, 2006, 2010, 2013, 2016, 2019, 2022];
const generations = rawGenerations.map((generation, index) => {
  const selected = groups.filter(group => idOf(group.generation.url) === generation.id).sort((a, b) => a.order - b.order);
  const spriteKeys = Object.keys(samples[index].sprites.versions[generation.name] ?? {}).filter(key => key !== 'icons');
  const games = selected.flatMap(group => {
    const members = versions.filter(version => idOf(version.version_group.url) === group.id);
    const ids = group.name === 'gold-silver' ? ['gold', 'silver'] : [group.name];
    return ids.filter(id => spriteKeys.includes(id) || group === selected[0] || id === 'black-2-white-2').map(id => ({ id, generation: generation.id, spriteKey: id, names: Object.fromEntries(languages.map(locale => [locale, members.filter(member => ids.length === 1 || member.name === id).map(member => names(member.names, member.name)[locale] ?? names(member.names, member.name).en).join(' / ')])) }));
  });
  if (generation.id === 1) games.splice(0, games.length,
    { id: 'red-green-japan', generation: 1, spriteKey: 'red-green-japan', names: { en: 'Red/Green · Japan', es: 'Rojo/Verde · Japón', 'es-419': 'Rojo/Verde · Japón', ja: '赤・緑（日本）' } },
    ...games.filter(game => ['red-blue', 'yellow'].includes(game.id)));
  if (!games.length || !generation.pokemon_species.length) throw Error('Empty generation');
  const region = regions.find(region => region.id === idOf(generation.main_region.url));
  return { id: generation.id, slug: generation.name, roman: generation.name.replace('generation-', '').toUpperCase(), names: names(generation.names, generation.name), regionNames: names(region.names, region.name), platform: platforms[index] ?? '', year: years[index] ?? null, speciesIds: generation.pokemon_species.map(species => idOf(species.url)).sort((a, b) => a - b), games, artworks: generation.id === 1 ? ['red-and-green', 'red-and-blue'] : generation.id === 2 ? ['gold-and-silver'] : [] };
});
const data = { generations, versionGenerations: Object.fromEntries(versions.map(version => [version.id, idOf(groups.find(group => group.id === idOf(version.version_group.url)).generation.url)])), versionGroupGenerations: Object.fromEntries(groups.map(group => [group.id, idOf(group.generation.url)])), typeGenerations: Object.fromEntries(rawGenerations.flatMap(generation => generation.types.map(type => [type.name, generation.id]))) };
await writeFile(new URL('../src/lib/generation-data.json', import.meta.url), JSON.stringify(data, null, 2) + '\n');
console.log(generations.map(generation => `${generation.roman}: ${generation.speciesIds.length} Pokémon, ${generation.games.map(game => game.id).join(', ')}`).join('\n'));
