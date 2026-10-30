export const UI_THEMES = [
  { id: 'auto', label: 'themeAuto' },
  { id: 'original', label: 'themeOriginal' },
  { id: 'gameboy', label: 'themeGameboy' },
  { id: 'lab', label: 'themeLab' },
] as const;
export type UiTheme = (typeof UI_THEMES)[number]['id'];
export const UI_THEME_KEY = 'pokemetrics-ui-v1';

export function isUiTheme(value: unknown): value is UiTheme { return UI_THEMES.some(theme => theme.id === value); }

export function readUiTheme(): UiTheme {
  try { const saved = localStorage.getItem(UI_THEME_KEY); return isUiTheme(saved) ? saved : 'auto'; }
  catch { return 'auto'; }
}

export function saveUiTheme(theme: UiTheme): void {
  try { localStorage.setItem(UI_THEME_KEY, theme); }
  catch { /* La apariencia sigue disponible durante esta sesión. */ }
}

export function resolvedUiTheme(theme: UiTheme, generation: number): Exclude<UiTheme, 'auto'> | 'generation' {
  return theme === 'auto' ? generation === 1 ? 'gameboy' : 'generation' : theme;
}
