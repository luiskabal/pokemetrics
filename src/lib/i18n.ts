import { derived, writable } from 'svelte/store';
import { readLanguage, translate } from './localization';
import type { Language, MessageKey } from './localization';

export const language = writable<Language>(readLanguage());
export const t = derived(language, locale => (key: MessageKey, values?: Record<string, string | number>) => translate(locale, key, values));
