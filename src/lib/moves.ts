import names from './move-names.json';
import type { LocalizedNames, Language } from './localization';
import { localizedName } from './localization';
export interface LearnedMove { id: number; name: string; level: number }
export interface Learnset { id: number; games: Record<string, LearnedMove[]> }
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object';
export function normalizeLearnset(raw: unknown): Learnset {
  if (!record(raw) || !Number.isSafeInteger(raw.id) || !Array.isArray(raw.moves)) throw Error('Invalid learnset');
  const games: Learnset['games'] = {};
  for (const row of raw.moves) {
    if (!record(row) || !record(row.move) || typeof row.move.name !== 'string' || typeof row.move.url !== 'string' || !Array.isArray(row.version_group_details)) throw Error('Invalid move');
    const id = Number(row.move.url.match(/\/(\d+)\/$/)?.[1]);
    if (!Number.isSafeInteger(id) || id < 1) throw Error('Invalid move ID');
    for (const detail of row.version_group_details) {
      if (!record(detail) || !record(detail.move_learn_method) || !record(detail.version_group)) throw Error('Invalid move version');
      if (detail.move_learn_method.name !== 'level-up') continue;
      if (typeof detail.version_group.name !== 'string' || !Number.isSafeInteger(detail.level_learned_at) || Number(detail.level_learned_at) < 0 || Number(detail.level_learned_at) > 100) throw Error('Invalid learned level');
      const list = games[detail.version_group.name] ??= [];
      if (!list.some(move => move.id === id && move.level === detail.level_learned_at)) list.push({ id, name: row.move.name, level: Number(detail.level_learned_at) });
    }
  }
  for (const moves of Object.values(games)) moves.sort((a, b) => a.level - b.level || a.id - b.id);
  return { id: Number(raw.id), games };
}
export const moveGroup = (game: string) => game === 'gold' || game === 'silver' ? 'gold-silver' : game;
export const learnedMoveName = (move: LearnedMove, language: Language) => localizedName((names as Record<string, LocalizedNames>)[move.name], language, move.name.replaceAll('-', ' '));
export async function loadLearnset(id: number, signal: AbortSignal): Promise<Learnset> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/moves/${id}.json`, { signal });
  if (!response.ok) throw Error('Moves unavailable');
  const value = await response.json();
  if (value.id !== id || !record(value.games) || Object.values(value.games).some(rows => !Array.isArray(rows) || rows.some(move => !record(move) || !Number.isSafeInteger(move.id) || typeof move.name !== 'string' || !Number.isSafeInteger(move.level) || Number(move.level) < 0 || Number(move.level) > 100))) throw Error('Invalid learnset file');
  return value;
}
