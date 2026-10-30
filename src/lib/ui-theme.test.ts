import { afterEach, describe, expect, it, vi } from 'vitest';
import { UI_THEME_KEY, UI_THEMES, readUiTheme, resolvedUiTheme, saveUiTheme } from './ui-theme';
import { explorationUrl, readExploration } from './navigation';

afterEach(() => vi.unstubAllGlobals());

describe('apariencia global', () => {
  it('conserva los tres estilos elegidos en cualquier generación y el modo automático por época', () => {
    for (let generation = 1; generation <= 9; generation++) {
      for (const theme of ['original', 'gameboy', 'lab'] as const) expect(resolvedUiTheme(theme, generation)).toBe(theme);
      expect(resolvedUiTheme('auto', generation)).toBe(generation === 1 ? 'gameboy' : 'generation');
    }
  });

  it('recupera la preferencia válida y tolera almacenamiento ausente o bloqueado', () => {
    for (const value of ['original', 'gameboy', 'lab', 'auto', null, 'unknown']) {
      vi.stubGlobal('localStorage', { getItem: () => value });
      expect(readUiTheme()).toBe(value && value !== 'unknown' ? value : 'auto');
    }
    const setItem = vi.fn(); vi.stubGlobal('localStorage', { setItem });
    saveUiTheme('lab'); expect(setItem).toHaveBeenCalledWith(UI_THEME_KEY, 'lab');
    vi.stubGlobal('localStorage', { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } });
    expect(readUiTheme()).toBe('auto'); expect(() => saveUiTheme('original')).not.toThrow();
  });

  it('el enlace prevalece sobre la preferencia local sin cambiar los filtros o el arte', () => {
    for (const theme of UI_THEMES) {
      const url = new URL(`https://example.com/pokemetrics/?gen=2&view=legacy&types=normal&pokemon=175&ui=${theme.id}`);
      const state = readExploration(url, 'ja', 'lab');
      expect(state.uiTheme).toBe(theme.id);
      expect(state.generation).toBe(2); expect(state.pokemonId).toBe(175); expect(state.types).toEqual(['normal']); expect(state.illustration).toBe('gold-and-silver');
      expect(readExploration(explorationUrl(url, state))).toEqual(state);
    }
  });

  it('acepta enlaces antiguos o inválidos y conserva auto explícito al navegar hacia atrás', () => {
    const url = new URL('https://example.com/pokemetrics/?types=grass');
    expect(readExploration(url, 'es', 'original').uiTheme).toBe('original');
    url.searchParams.set('ui', '<script>'); expect(readExploration(url).uiTheme).toBe('auto');
    url.searchParams.set('ui', 'auto');
    const state = readExploration(url, 'es', 'lab');
    const shared = explorationUrl(url, state);
    expect(shared.searchParams.get('ui')).toBe('auto');
    expect(readExploration(shared, 'es', 'lab').uiTheme).toBe('auto');
  });
});
