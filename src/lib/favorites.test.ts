import { afterEach, expect, it, vi } from 'vitest';
import { FAVORITES_KEY, readFavorites, saveFavorites } from './favorites';
afterEach(() => vi.unstubAllGlobals());
it('recupera favoritos únicos y válidos sin aceptar datos corruptos', () => {
  vi.stubGlobal('localStorage', { getItem: () => '[1,25,25,"7",0,-1,null,1.5]' });
  expect(readFavorites()).toEqual([1, 25]);
  vi.stubGlobal('localStorage', { getItem: () => '{' });
  expect(readFavorites()).toEqual([]);
});
it('guarda en el navegador y comunica cuando el almacenamiento está bloqueado', () => {
  const setItem = vi.fn(); vi.stubGlobal('localStorage', { setItem });
  expect(saveFavorites([1, 25])).toBe(true);
  expect(setItem).toHaveBeenCalledWith(FAVORITES_KEY, '[1,25]');
  vi.stubGlobal('localStorage', { setItem: () => { throw Error('blocked'); }, getItem: () => { throw Error('blocked'); } });
  expect(saveFavorites([1])).toBe(false); expect(readFavorites()).toEqual([]);
});
