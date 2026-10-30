import catalogData from './locale-data.json';
import { LATIN_MESSAGES, MESSAGES } from './messages';
import type { MessageKey } from './messages';
import type { HistoricalStatId, IllustrationId, ImageSet, TypeId } from './metadata';

export const LANGUAGES = [
  { id: 'en', label: 'English', locale: 'en-US' },
  { id: 'es', label: 'Español', locale: 'es-ES' },
  { id: 'es-419', label: 'Español latino', locale: 'es-CL' },
  { id: 'ja', label: '日本語', locale: 'ja-JP' },
] as const;
export type Language = (typeof LANGUAGES)[number]['id'];
export type LocalizedNames = Record<Language, string | null> & { romanized?: string };
const catalog = catalogData as { pokemon: Record<string, LocalizedNames>; types: Record<string, LocalizedNames>; stats: Record<string, LocalizedNames> };
export const LOCALES = Object.fromEntries(LANGUAGES.map(language => [language.id, language.locale])) as Record<Language, string>;
export const LANGUAGE_KEY = 'pokemetrics-language-v1';
export type { MessageKey };

export function translate(language: Language, key: MessageKey, values: Record<string, string | number> = {}): string {
  const message = language === 'es-419' ? LATIN_MESSAGES[key] ?? MESSAGES[key][0] : MESSAGES[key][language === 'en' ? 1 : language === 'ja' ? 2 : 0];
  return message.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
}

export function localizedName(names: LocalizedNames | undefined, language: Language, fallback: string): string {
  return names?.[language] ?? (language === 'es-419' ? names?.es : undefined) ?? names?.en ?? fallback;
}

const SPECIAL_NAMES = new Map([['nidoran-f', 'Nidoran ♀'], ['nidoran-m', 'Nidoran ♂'], ['mr-mime', 'Mr. Mime'], ['farfetchd', 'Farfetch’d']]);
export function pokemonName(name: string, language: Language = 'es-419'): string {
  const fallback = SPECIAL_NAMES.get(name) || name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  return localizedName(catalog.pokemon[name], language, fallback);
}

export function pokemonAliases(name: string): string[] {
  return [...new Set([name, pokemonName(name), ...Object.values(catalog.pokemon[name] ?? {}).filter((value): value is string => typeof value === 'string')])];
}

export function typeName(type: TypeId, language: Language = 'es-419'): string {
  return localizedName(catalog.types[type], language, type);
}

export function statName(stat: HistoricalStatId, language: Language = 'es-419'): string {
  if (stat === 'special') return translate(language, 'specialStat');
  return localizedName(catalog.stats[stat], language, stat);
}

export function imageName(id: ImageSet | IllustrationId, language: Language): string {
  const key: MessageKey = id === 'current' || id === 'artwork' ? 'artCurrent' : id === 'red-and-green' || id === 'red-green-japan' ? 'gameRedGreen' : id === 'yellow' ? 'gameYellow' : 'gameRedBlue';
  return translate(language, key);
}

export function readLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (LANGUAGES.some(language => language.id === saved)) return saved as Language;
  } catch { /* La selección funciona aunque el almacenamiento esté bloqueado. */ }
  return 'es-419';
}

export function saveLanguage(language: Language): void {
  try { localStorage.setItem(LANGUAGE_KEY, language); }
  catch { /* El idioma de esta sesión sigue disponible. */ }
}
