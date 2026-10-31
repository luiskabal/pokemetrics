const PREFIX = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
interface Preview { hash?: string; animated?: boolean; missing?: boolean }
const catalogs = new Map<string, Record<string, Preview>>();
const pending = new Map<string, Promise<void>>();
export const needsMediaPreview = (url: string | null) => !!url && url.startsWith(PREFIX) && (/\.(webp|gif)(?:\?|$)/i.test(url) || url.includes('/official-artwork/'));
function groupFor(url: string): string { const match = url.slice(PREFIX.length).match(/^versions\/(generation-[a-z]+)\/([a-z0-9-]+)\//); return match ? `${match[1]}-${match[2]}` : 'artwork'; }
export function loadMediaCatalog(url: string | null): Promise<void> {
  if (!needsMediaPreview(url)) return Promise.resolve();
  const group = groupFor(url!);
  if (catalogs.has(group)) return Promise.resolve();
  const existing = pending.get(group); if (existing) return existing;
  const request = (async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}media/catalogs/${group}.json`);
    if (!response.ok) throw Error('Image catalog unavailable');
    catalogs.set(group, await response.json());
  })().finally(() => pending.delete(group));
  pending.set(group, request); return request;
}
export function mediaSource(url: string | null | undefined, size: 160 | 320 | 640 = 160): { preview: string | null; animated: boolean } {
  if (!url) return { preview: null, animated: false };
  const entry = url.startsWith(PREFIX) ? catalogs.get(groupFor(url))?.[url.slice(PREFIX.length)] : undefined;
  if (entry?.missing) return { preview: null, animated: false };
  if (entry?.hash) return { preview: `${import.meta.env.BASE_URL}media/pokemon/${entry.hash}-${size}.webp`, animated: entry.animated === true };
  // An unknown animation must be requested explicitly, never downloaded as a fallback thumbnail.
  if (/\.(webp|gif)(?:\?|$)/i.test(url)) return { preview: null, animated: true };
  if (needsMediaPreview(url)) return { preview: null, animated: false };
  return { preview: url, animated: false };
}
