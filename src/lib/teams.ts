import { GAME_BY_ID, SPECIES_GENERATION } from './generations';
export interface LocalTeam { id: string; game: string; name: string; members: number[] }
const KEY = 'pokemetrics-teams-v1';
export function validTeam(value: unknown): value is LocalTeam {
  if (!value || typeof value !== 'object') return false;
  const team = value as LocalTeam; const era = GAME_BY_ID.get(team.game)?.generation;
  return !!era && typeof team.id === 'string' && team.id.length > 0 && typeof team.name === 'string' && team.name.trim().length > 0 && team.name.length <= 64 && Array.isArray(team.members) && team.members.length <= 6 && team.members.every(id => Number.isSafeInteger(id) && (SPECIES_GENERATION.get(id) ?? Infinity) <= era);
}
export function readTeams(): LocalTeam[] { try { const data = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return data?.version === 1 && Array.isArray(data.teams) ? data.teams.filter(validTeam) : []; } catch { return []; } }
export function saveTeams(teams: LocalTeam[]): boolean { try { localStorage.setItem(KEY, JSON.stringify({ version: 1, teams })); return true; } catch { return false; } }
export function sharedTeam(url: URL): LocalTeam | null {
  if (!url.searchParams.has('members')) return null;
  const team = { id: crypto.randomUUID(), game: url.searchParams.get('edition') ?? 'red-green-japan', name: (url.searchParams.get('teamName') ?? 'Team').slice(0, 64), members: (url.searchParams.get('members') || '').split(',').filter(Boolean).map(Number) };
  return validTeam(team) ? team : null;
}
export function teamUrl(url: URL, team: LocalTeam): string {
  const result = new URL(url); result.searchParams.set('section', 'teams'); result.searchParams.set('gen', String(GAME_BY_ID.get(team.game)!.generation)); result.searchParams.set('edition', team.game); result.searchParams.set('members', team.members.join(',')); result.searchParams.set('teamName', team.name); result.searchParams.delete('pokemon'); return result.href;
}
