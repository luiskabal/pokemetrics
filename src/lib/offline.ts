import { SPECIES_GENERATION } from './generations';
import { loadMediaCatalog, mediaCatalogUrl, mediaSource, needsMediaPreview } from './media';
import type { IllustrationId, ImageSet } from './metadata';
import type { Pokemon } from './model';
import type { UniverseScope } from './universe';
export const OFFLINE_CACHE = 'pokemetrics-offline-content-v1';
const base = import.meta.env.BASE_URL;
export interface OfflinePack { id: string; label: string; savedAt: number; count: number }
export function requiredGenerationPacks(pokemon: Pokemon[]) { return [...new Set(pokemon.map(pokemon => SPECIES_GENERATION.get(pokemon.id)!))].sort((a, b) => a - b).map(era => `${base}data/generation-${era}.json`); }
export async function offlineUrls(pokemon: Pokemon[], era: number, scope: UniverseScope, illustration: IllustrationId, imageSet: ImageSet, moves: boolean, player: boolean, signal: AbortSignal): Promise<string[]> {
  const urls = new Set(requiredGenerationPacks(pokemon));
  if (scope !== 'introduced') urls.add(`${base}data/media-${era}.json`);
  for (const entry of pokemon) {
    signal.throwIfAborted();
    const primary = illustration === 'current' ? entry.image : illustration.startsWith('game:') ? entry.gameSprites[illustration.slice(5)]?.front : entry.historicalArtworks?.[illustration as keyof typeof entry.historicalArtworks];
    const sprites = imageSet === 'artwork' ? [entry.image] : [entry.gameSprites[imageSet]?.front, entry.gameSprites[imageSet]?.back];
    for (const original of [primary, ...sprites]) {
      if (!original) continue;
      if (needsMediaPreview(original)) { await loadMediaCatalog(original); urls.add(mediaCatalogUrl(original)!); for (const size of [160, 320, 640] as const) { const url = mediaSource(original, size).preview; if (url) urls.add(url); } }
      else urls.add(original);
    }
    if (moves) urls.add(`${base}data/moves/${entry.id}.json`);
  }
  if (player) { const response = await fetch(`${base}offline-player.json`, { signal }); if (!response.ok) throw Error('Player list unavailable'); for (const file of await response.json()) urls.add(base + file); }
  return [...urls];
}
export async function downloadOffline(urls: string[], signal: AbortSignal, onProgress: (done: number, total: number) => void) {
  const cache = await caches.open(OFFLINE_CACHE); let next = 0; let done = 0; onProgress(0, urls.length);
  await Promise.all(Array.from({ length: Math.min(4, urls.length) }, async () => {
    while (next < urls.length) { signal.throwIfAborted(); const url = urls[next++]; const existing = await cache.match(url);
      if (!existing || new URL(url, location.href).pathname.includes('/data/')) { const response = await fetch(url, { signal }); if (!response.ok) throw Error(`Download ${response.status}`); await cache.put(url, response); }
      done++; onProgress(done, urls.length);
    }
  }));
}
export async function saveOfflinePack(pack: OfflinePack) { const cache = await caches.open(OFFLINE_CACHE); await cache.put(`${base}offline-pack/${pack.id}.json`, new Response(JSON.stringify(pack), { headers: { 'Content-Type': 'application/json' } })); }
export async function offlineStorage() { const cache = await caches.open(OFFLINE_CACHE); const keys = await cache.keys(); let bytes = 0; const packs: OfflinePack[] = []; for (const key of keys) { const response = (await cache.match(key))!; const data = await response.arrayBuffer(); bytes += data.byteLength; if (key.url.includes('/offline-pack/')) packs.push(JSON.parse(new TextDecoder().decode(data))); } return { bytes, packs }; }
