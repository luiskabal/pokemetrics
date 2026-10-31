import { STATS, TYPES } from './metadata';
import type { ImageSet, IllustrationId, TypeId } from './metadata';
import { LANGUAGES } from './localization';
import type { Language } from './localization';
import type { PokemonOrder, ViewMode } from './model';
import { GENERATION_BY_ID, SPECIES_GENERATION, defaultIllustration, generationInfo, illustrationOptions, typesForGeneration } from './generations';
import { isUiTheme } from './ui-theme';
import type { UiTheme } from './ui-theme';
import type { UniverseScope } from './universe';

export interface ExplorationState {
  view: ViewMode; types: TypeId[]; query: string; order: PokemonOrder; chart: 'pie' | 'bars';
  segment: string | null; pokemonId: number | null; illustration: IllustrationId; imageSet: ImageSet; language: Language; onlyFavorites: boolean;
  generation: number; against: number | null; uiTheme: UiTheme; section: 'explore' | 'play' | 'teams';
  scope: UniverseScope; edition: string; dex: number | null;
}

export function readExploration(url: URL, fallbackLanguage: Language = 'es-419', fallbackTheme: UiTheme = 'auto'): ExplorationState {
  const p = url.searchParams;
  const generation = GENERATION_BY_ID.has(Number(p.get('gen'))) ? Number(p.get('gen')) : 1;
  const definition = generationInfo(generation);
  const against = Number(p.get('against'));
  const view = p.get('view') === 'legacy' ? 'legacy' : 'current';
  const scope: UniverseScope = p.get('scope') === 'national' || p.get('scope') === 'regional' ? p.get('scope') as UniverseScope : 'introduced';
  const edition = definition.games.some(game => game.id === p.get('edition')) ? p.get('edition')! : definition.games[0].id;
  const types = [...new Set((p.get('types') ?? '').split(',').filter((id): id is TypeId => (view === 'legacy' ? typesForGeneration(generation) : TYPES).some(type => type.id === id)))];
  const fields: string[] = ['number', 'name', 'height', 'weight', ...(view === 'legacy' && generation === 1 ? ['hp', 'attack', 'defense', 'special', 'speed'] : STATS.map(stat => stat.id))];
  const order = p.get('order') ?? 'number-asc';
  const pokemonId = Number(p.get('pokemon'));
  const rawSegment = p.get('segment');
  const segment = rawSegment === 'other' ? '' : rawSegment && rawSegment.split('+').length <= 2 && rawSegment.split('+').every(type => types.includes(type as TypeId)) ? [...new Set(rawSegment.split('+'))].sort().join('+') : null;
  return {
    scope, edition, dex: scope === 'regional' && Number.isSafeInteger(Number(p.get('dex'))) && Number(p.get('dex')) > 0 ? Number(p.get('dex')) : null,
    section: p.get('section') === 'teams' ? 'teams' : p.get('section') === 'play' ? 'play' : 'explore',
    uiTheme: isUiTheme(p.get('ui')) ? p.get('ui') as UiTheme : fallbackTheme,
    view, types, generation, against: GENERATION_BY_ID.has(against) && against !== generation ? against : null, onlyFavorites: p.get('fav') === '1', query: (p.get('q') ?? '').slice(0, 100),
    order: fields.some(field => order === `${field}-asc` || order === `${field}-desc`) ? order as PokemonOrder : 'number-asc',
    chart: p.get('chart') === 'bars' ? 'bars' : 'pie', segment: types.length ? segment : null,
    pokemonId: (scope === 'introduced' ? SPECIES_GENERATION.get(pokemonId) === generation : (SPECIES_GENERATION.get(pokemonId) ?? Infinity) <= generation) ? pokemonId : null,
    illustration: illustrationOptions(generation).some(option => option.id === p.get('art')) ? p.get('art') as IllustrationId : scope === 'introduced' ? defaultIllustration(generation) : `game:${edition}`,
    imageSet: p.get('game') === 'artwork' || definition.games.some(game => game.id === p.get('game')) ? p.get('game') as ImageSet : definition.games[0].id,
    language: LANGUAGES.some(language => language.id === p.get('lang')) ? p.get('lang') as Language : fallbackLanguage,
  };
}

export function explorationUrl(url: URL, state: ExplorationState): URL {
  const result = new URL(url);
  const values = { gen: state.generation === 1 ? '' : String(state.generation), against: state.against?.toString() ?? '', view: state.view === 'current' ? '' : state.view, types: [...state.types].sort().join(','), q: state.query, order: state.order === 'number-asc' ? '' : state.order, chart: state.chart === 'pie' ? '' : state.chart, segment: state.segment === null ? '' : state.segment || 'other', pokemon: state.pokemonId?.toString() ?? '', art: state.illustration === (state.scope === 'introduced' ? defaultIllustration(state.generation) : `game:${state.edition}`) ? '' : state.illustration, game: state.imageSet === generationInfo(state.generation).games[0].id ? '' : state.imageSet, lang: state.language };
  for (const [key, value] of Object.entries({ ...values, scope: state.scope === 'introduced' ? '' : state.scope, edition: state.edition === generationInfo(state.generation).games[0].id ? '' : state.edition, dex: state.dex?.toString() ?? '', section: state.section === 'explore' ? '' : state.section, ui: state.uiTheme, fav: state.onlyFavorites ? '1' : '' })) { if (value) result.searchParams.set(key, value); else result.searchParams.delete(key); }
  return result;
}
