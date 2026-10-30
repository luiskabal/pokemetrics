import { describe, expect, it } from 'vitest';
import { explorationUrl, readExploration } from './navigation';

describe('enlaces de exploración', () => {
  it('alterna Jugar y Explorar conservando los filtros sin publicar nombres de ROMs ni partidas', () => {
    const state = readExploration(new URL('https://example.com/pokemetrics/?section=play&types=water&gen=2&ui=lab'));
    expect(state.section).toBe('play');
    expect(readExploration(explorationUrl(new URL('https://example.com/pokemetrics/'), state))).toEqual(state);
    const explorer = explorationUrl(new URL('https://example.com/pokemetrics/'), { ...state, section: 'explore' });
    expect(explorer.searchParams.has('section')).toBe(false); expect(explorer.searchParams.get('types')).toBe('water');
    expect(readExploration(new URL('https://example.com/?section=bad')).section).toBe('explore');
  });
  it('conserva selección, intersección, ficha, idioma y controles al compartir', () => {
    const input = new URL('https://example.com/pokemetrics/?view=legacy&types=poison,grass&q=フシギダネ&order=special-desc&chart=bars&segment=grass%2Bpoison&pokemon=1&art=current&game=yellow&lang=ja');
    const state = readExploration(input);
    expect(readExploration(explorationUrl(new URL('https://example.com/pokemetrics/'), state))).toEqual({ ...state, types: ['grass', 'poison'] });
    expect(state.segment).toBe('grass+poison');
    expect(state.pokemonId).toBe(1);
  });
  it('distingue Otros de ningún segmento y conserva la ruta de GitHub Pages', () => {
    const state = readExploration(new URL('https://example.com/pokemetrics/?types=grass&segment=other'));
    expect(state.segment).toBe('');
    const url = explorationUrl(new URL('https://example.com/pokemetrics/'), state);
    expect(url.pathname).toBe('/pokemetrics/');
    expect(url.searchParams.get('segment')).toBe('other');
  });
  it('descarta filtros, estadísticas e identificadores inválidos sin fallar', () => {
    const state = readExploration(new URL('https://example.com/?view=legacy&types=grass,grass,fairy,unknown&order=special-defense-desc&pokemon=999&art=unknown&game=invalid&lang=bad&segment=fire'));
    expect(state.types).toEqual(['grass']);
    expect(state.order).toBe('number-asc');
    expect(state.pokemonId).toBeNull();
    expect(state.segment).toBeNull();
    expect(state.illustration).toBe('red-and-green');
  });
});
