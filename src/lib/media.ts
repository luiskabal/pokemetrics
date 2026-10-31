import catalog from './media-data.json';

const PREFIX = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
interface Preview { hash?: string; animated?: boolean; missing?: boolean }
const previews: Record<string, Preview> = catalog;
export function mediaSource(url: string | null | undefined, size: 160 | 320 | 640 = 160): { preview: string | null; animated: boolean } {
  if (!url) return { preview: null, animated: false };
  const entry = url.startsWith(PREFIX) ? previews[url.slice(PREFIX.length)] : undefined;
  if (entry?.missing) return { preview: null, animated: false };
  if (entry?.hash) return { preview: `${import.meta.env.BASE_URL}media/pokemon/${entry.hash}-${size}.webp`, animated: entry.animated === true };
  // An unknown animation must be requested explicitly, never downloaded as a fallback thumbnail.
  if (/\.(webp|gif)(?:\?|$)/i.test(url)) return { preview: null, animated: true };
  return { preview: url, animated: false };
}
