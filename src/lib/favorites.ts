export const FAVORITES_KEY = 'pokemetrics-favorites-v1';
export function readFavorites(): number[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
    return Array.isArray(value) ? [...new Set(value.filter((id): id is number => Number.isSafeInteger(id) && id > 0))] : [];
  } catch { return []; }
}
export function saveFavorites(ids: readonly number[]): boolean {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids)); return true; }
  catch { return false; }
}
