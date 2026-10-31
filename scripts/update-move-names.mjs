import { readFile, writeFile } from 'node:fs/promises';
const path = new URL('../src/lib/move-names.json', import.meta.url);
const output = JSON.parse(await readFile(path, 'utf8'));
const response = await fetch('https://pokeapi.co/api/v2/move/?limit=3000');
if (!response.ok) throw Error('Move index unavailable');
const { results } = await response.json(); let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => { while (next < results.length) {
  const move = results[next++]; if (output[move.name]?.en) continue;
  const response = await fetch(move.url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error(`Move ${move.name}: HTTP ${response.status}`);
  const data = await response.json();
  output[move.name] = Object.fromEntries(['en', 'es', 'es-419', 'ja'].map(locale => [locale, data.names.find(row => row.language.name === locale)?.name ?? (locale === 'ja' ? data.names.find(row => row.language.name === 'ja-hrkt')?.name : null) ?? null]));
} }));
await writeFile(path, JSON.stringify(output) + '\n');
console.log(`${Object.keys(output).length} localized move names`);
