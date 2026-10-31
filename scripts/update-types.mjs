import { readFile, writeFile } from 'node:fs/promises';
const { typeGenerations } = JSON.parse(await readFile(new URL('../src/lib/generation-data.json', import.meta.url), 'utf8'));
const ids = Object.keys(typeGenerations);
const raw = []; let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => { while (next < ids.length) {
  const id = ids[next++];
  const response = await fetch(`https://pokeapi.co/api/v2/type/${id}/`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error(`Type ${id}: HTTP ${response.status}`);
  const value = await response.json();
  if (value.name !== id || !Array.isArray(value.past_damage_relations)) throw Error('Invalid type history');
  raw.push(value);
} }));
const charts = {};
for (let generation = 1; generation <= 9; generation++) {
  const available = ids.filter(id => typeGenerations[id] <= generation);
  charts[generation] = {};
  for (const type of raw.filter(type => available.includes(type.name))) {
    const past = type.past_damage_relations.filter(entry => Number(entry.generation.url.match(/\/(\d+)\/$/)?.[1]) >= generation).sort((a, b) => Number(a.generation.url.match(/\/(\d+)\/$/)[1]) - Number(b.generation.url.match(/\/(\d+)\/$/)[1]))[0];
    const relation = past?.damage_relations ?? type.damage_relations;
    const row = Object.fromEntries(available.map(id => [id, 1]));
    for (const [key, multiplier] of [['no_damage_to', 0], ['half_damage_to', .5], ['double_damage_to', 2]]) {
      if (!Array.isArray(relation[key]) || relation[key].some(entry => !ids.includes(entry.name))) throw Error('Invalid type relations');
      for (const target of relation[key]) if (available.includes(target.name)) row[target.name] = multiplier;
    }
    charts[generation][type.name] = row;
  }
}
await writeFile(new URL('../src/lib/type-chart.json', import.meta.url), JSON.stringify(charts) + '\n');
console.log('Validated defensive type charts for nine generations');
