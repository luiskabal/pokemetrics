import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false }, appType: 'custom' });
try {
  const { fetchGeneration, parseGenerationDataset } = await server.ssrLoadModule('/src/lib/pokeapi.ts');
  const { normalizeLearnset } = await server.ssrLoadModule('/src/lib/moves.ts');
  const { generations } = JSON.parse(await readFile(new URL('../src/lib/generation-data.json', import.meta.url), 'utf8'));
  const datasets = [];
  const learnsets = [];
  const media = Object.fromEntries(generations.map(era => [era.id, { schemaVersion: 1, generation: era.id, savedAt: Date.now(), images: {} }]));
  for (const generation of generations) {
    const pokemon = await fetchGeneration(generation.id, AbortSignal.timeout(90_000), () => {}, raw => {
      learnsets.push(normalizeLearnset(raw));
      for (const era of generations.filter(era => era.id >= generation.id)) {
        const sprites = raw.sprites.versions[era.slug] ?? {};
        media[era.id].images[raw.id] = Object.fromEntries(era.games.map(game => [game.id, { front: sprites[game.spriteKey]?.front_default ?? null, back: sprites[game.spriteKey]?.back_default ?? null }]));
      }
    });
    datasets.push(parseGenerationDataset({ schemaVersion: 1, generation: generation.id, pokemon, savedAt: Date.now() }, generation.id));
    console.log(`Generation ${generation.id}: ${pokemon.length} species validated`);
  }
  const output = new URL('../public/data/', import.meta.url);
  await mkdir(output, { recursive: true });
  // Publish complete, validated generations only; a failed API read keeps all previous files.
  for (const dataset of datasets) {
    const path = new URL(`generation-${dataset.generation}.json`, output);
    const temporary = new URL(path.href + '.tmp');
    await writeFile(temporary, JSON.stringify(dataset) + '\n');
    await rename(temporary, path);
  }
  const movesDirectory = new URL('moves/', output);
  await mkdir(movesDirectory, { recursive: true });
  for (const moves of learnsets) await writeFile(new URL(`${moves.id}.json`, movesDirectory), JSON.stringify(moves) + '\n');
  for (const value of Object.values(media)) await writeFile(new URL(`media-${value.generation}.json`, output), JSON.stringify(value) + '\n');
} finally { await server.close(); }
