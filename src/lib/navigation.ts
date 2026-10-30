import { GAMES, ILLUSTRATIONS, LEGACY_TYPES, STATS, TYPES } from './metadata';
import type { ImageSet, IllustrationId, TypeId } from './metadata';
import { LANGUAGES } from './localization';
import type { Language } from './localization';
import type { PokemonOrder, ViewMode } from './model';

export interface ExplorationState {
  view: ViewMode; types: TypeId[]; query: string; order: PokemonOrder; chart: 'pie' | 'bars';
  segment: string | null; pokemonId: number | null; illustration: IllustrationId; imageSet: ImageSet; language: Language; onlyFavorites: boolean;
}

export function readExploration(url: URL, fallbackLanguage: Language = 'es-419'): ExplorationState {
  const p = url.searchParams;
  const view = p.get('view') === 'legacy' ? 'legacy' : 'current';
  const types = [...new Set((p.get('types') ?? '').split(',').filter((id): id is TypeId => (view === 'legacy' ? LEGACY_TYPES : TYPES).some(type => type.id === id)))];
  const fields: string[] = ['number', 'name', 'height', 'weight', ...(view === 'legacy' ? ['hp', 'attack', 'defense', 'special', 'speed'] : STATS.map(stat => stat.id))];
  const order = p.get('order') ?? 'number-asc';
  const pokemonId = Number(p.get('pokemon'));
  const rawSegment = p.get('segment');
  const segment = rawSegment === 'other' ? '' : rawSegment && rawSegment.split('+').length <= 2 && rawSegment.split('+').every(type => types.includes(type as TypeId)) ? [...new Set(rawSegment.split('+'))].sort().join('+') : null;
  return {
    view, types, onlyFavorites: p.get('fav') === '1', query: (p.get('q') ?? '').slice(0, 100),
    order: fields.some(field => order === `${field}-asc` || order === `${field}-desc`) ? order as PokemonOrder : 'number-asc',
    chart: p.get('chart') === 'bars' ? 'bars' : 'pie', segment: types.length ? segment : null,
    pokemonId: Number.isInteger(pokemonId) && pokemonId >= 1 && pokemonId <= 151 ? pokemonId : null,
    illustration: ILLUSTRATIONS.some(option => option.id === p.get('art')) ? p.get('art') as IllustrationId : 'red-and-green',
    imageSet: p.get('game') === 'artwork' || GAMES.some(game => game.id === p.get('game')) ? p.get('game') as ImageSet : 'red-green-japan',
    language: LANGUAGES.some(language => language.id === p.get('lang')) ? p.get('lang') as Language : fallbackLanguage,
  };
}

export function explorationUrl(url: URL, state: ExplorationState): URL {
  const result = new URL(url);
  const values = { view: state.view === 'current' ? '' : state.view, types: [...state.types].sort().join(','), q: state.query, order: state.order === 'number-asc' ? '' : state.order, chart: state.chart === 'pie' ? '' : state.chart, segment: state.segment === null ? '' : state.segment || 'other', pokemon: state.pokemonId?.toString() ?? '', art: state.illustration === 'red-and-green' ? '' : state.illustration, game: state.imageSet === 'red-green-japan' ? '' : state.imageSet, lang: state.language };
  for (const [key, value] of Object.entries({ ...values, fav: state.onlyFavorites ? '1' : '' })) { if (value) result.searchParams.set(key, value); else result.searchParams.delete(key); }
  return result;
}
