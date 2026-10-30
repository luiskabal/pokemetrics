import { afterEach, describe, expect, it, vi } from 'vitest';
import catalog from './locale-data.json';
import { analyzePokemon, filterAndSortPokemon, percentage } from './analysis';
import { LANGUAGE_KEY, LANGUAGES, imageName, localizedName, pokemonName, readLanguage, saveLanguage, statName, translate, typeName } from './localization';
import { LATIN_MESSAGES, MESSAGES } from './messages';
import { STATS, TYPES } from './metadata';
import type { Pokemon } from './model';

afterEach(() => vi.unstubAllGlobals());

const entries: Pokemon[] = [
  { id: 1, name: 'bulbasaur', types: ['grass', 'poison'] },
  { id: 25, name: 'pikachu', types: ['electric'] },
  { id: 122, name: 'mr-mime', types: ['psychic', 'fairy'] },
].map(entry => ({ ...entry, legacyTypes: entry.id === 122 ? ['psychic'] : entry.types, image: null, sprite: null, gameSprites: { 'red-green-japan': { front: null, back: null }, 'red-blue': { front: null, back: null }, yellow: { front: null, back: null } }, height: 7, weight: 69, stats: STATS.map(stat => ({ id: stat.id, value: 45 })) })) as Pokemon[];

describe('catálogo oficial y traducciones', () => {
  it('incluye las 151 especies, los 18 tipos actuales y las seis estadísticas', () => {
    expect(Object.keys(catalog.pokemon)).toHaveLength(151);
    expect(Object.keys(catalog.types).sort()).toEqual(TYPES.map(type => type.id).sort());
    expect(Object.keys(catalog.stats).sort()).toEqual(STATS.map(stat => stat.id).sort());
    for (const names of [...Object.values(catalog.pokemon), ...Object.values(catalog.types), ...Object.values(catalog.stats)]) {
      expect(names.en).toBeTruthy();
      for (const language of LANGUAGES) expect(Object.hasOwn(names, language.id)).toBe(true);
    }
  });

  it('usa los nombres oficiales sin inventar diferencias entre regiones', () => {
    expect(pokemonName('bulbasaur', 'ja')).toBe('フシギダネ');
    expect(pokemonName('pikachu', 'ja')).toBe('ピカチュウ');
    expect(pokemonName('mr-mime', 'ja')).toBe('バリヤード');
    for (const language of ['en', 'es', 'es-419'] as const) expect(pokemonName('bulbasaur', language)).toBe('Bulbasaur');
    expect(typeName('fire', 'es-419')).toBe('Fuego');
    expect(typeName('fire', 'en')).toBe('Fire');
    expect(typeName('fire', 'ja')).toBe('ほのお');
    expect(statName('attack', 'ja')).toBe('こうげき');
    expect(imageName('red-and-green', 'en')).toContain('Red/Green');
  });

  it('resuelve nombres ausentes mediante región, inglés y nombre canónico', () => {
    const names = { en: 'English', es: 'Español', 'es-419': null, ja: null };
    expect(localizedName(names, 'es-419', 'fallback')).toBe('Español');
    expect(localizedName(names, 'ja', 'fallback')).toBe('English');
    expect(localizedName(undefined, 'ja', 'fallback')).toBe('fallback');
  });

  it('mantiene los mismos parámetros en todos los idiomas y variantes regionales', () => {
    const parameters = (text: string) => [...new Set(text.match(/\{\w+\}/g) ?? [])].sort();
    for (const [key, messages] of Object.entries(MESSAGES)) {
      const expected = parameters(messages[0]);
      for (const message of messages) {
        expect(message.length, key).toBeGreaterThan(0);
        expect(parameters(message), key).toEqual(expected);
      }
      const regional = LATIN_MESSAGES[key as keyof typeof MESSAGES];
      if (regional) expect(parameters(regional), key).toEqual(expected);
    }
    expect(translate('en', 'filteredCount', { count: 1, total: 151 })).toBe('1 of 151 Pokémon');
    expect(translate('es', 'pie')).toBe('Circular');
    expect(translate('es-419', 'pie')).toBe('Torta');
  });
});

describe('búsqueda, orden y gráficos multilingües', () => {
  it('reconoce japonés, caracteres de ancho medio y romanización en cualquier idioma', () => {
    for (const language of LANGUAGES) {
      for (const query of ['ピカチュウ', 'ﾋﾟｶﾁｭｳ', 'Pikachu', 'PIKÁ']) expect(filterAndSortPokemon(entries, query, 'number-asc', language.id).map(entry => entry.id)).toEqual([25]);
      for (const query of ['フシギダネ', 'Fushigidane', 'Bulbasaur']) expect(filterAndSortPokemon(entries, query, 'number-asc', language.id).map(entry => entry.id)).toEqual([1]);
    }
  });

  it('conserva la sonoridad japonesa en vez de confundir バ y ハ', () => {
    expect(filterAndSortPokemon(entries, 'バリヤード', 'number-asc').map(entry => entry.id)).toEqual([122]);
    expect(filterAndSortPokemon(entries, 'ハリヤード', 'number-asc')).toEqual([]);
  });

  it('ordena por el nombre visible del idioma activo', () => {
    expect(filterAndSortPokemon(entries, '', 'name-asc', 'en').map(entry => entry.id)).toEqual([1, 122, 25]);
    expect(filterAndSortPokemon(entries, '', 'name-asc', 'ja').map(entry => entry.id)).toEqual([122, 25, 1]);
    expect(filterAndSortPokemon(entries, '', 'name-desc', 'ja').map(entry => entry.id)).toEqual([1, 25, 122]);
  });

  it('cambia las etiquetas sin alterar cantidades, intersecciones ni denominadores', () => {
    for (const language of LANGUAGES) {
      const result = analyzePokemon(entries, new Set(['grass', 'poison']), 'legacy', language.id);
      expect(result.groups.map(group => [group.key, group.count])).toEqual([['grass+poison', 1], ['', 2]]);
      expect(result.groups.reduce((sum, group) => sum + group.count, 0)).toBe(entries.length);
      expect(result.groups[0].label).toBe(`${typeName('grass', language.id)} + ${typeName('poison', language.id)}`);
      expect(result.groups[1].label).toBe(translate(language.id, 'otherPokemon'));
    }
    expect(percentage(32, 151, 'en')).toBe('21.2%');
    expect(percentage(32, 151, 'ja')).toBe('21.2%');
    expect(percentage(32, 151, 'es-419')).toBe('21,2 %');
  });
});

describe('preferencia de idioma', () => {
  it('recupera solo idiomas conocidos y conserva la elección', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
    expect(readLanguage()).toBe('es-419');
    storage.set(LANGUAGE_KEY, 'invalid');
    expect(readLanguage()).toBe('es-419');
    saveLanguage('ja');
    expect(readLanguage()).toBe('ja');
  });

  it('funciona si el navegador bloquea el almacenamiento', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(readLanguage()).toBe('es-419');
    expect(() => saveLanguage('en')).not.toThrow();
  });
});
