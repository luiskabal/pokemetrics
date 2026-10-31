import { derived, get, writable } from 'svelte/store';
import { edition } from './generation-state';
import { GAME_BY_ID, SPECIES_GENERATION } from './generations';
export type CaptureStatus = 'pending' | 'seen' | 'caught';
export interface CaptureProfile { id: string; game: string; name: string; pokemon: Record<number, 'seen' | 'caught'> }
const KEY = 'pokemetrics-captures-v1';
export function validCaptureProfile(value: unknown): value is CaptureProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as CaptureProfile; const era = GAME_BY_ID.get(profile.game)?.generation;
  return !!era && typeof profile.id === 'string' && !!profile.id && typeof profile.name === 'string' && !!profile.name.trim() && profile.name.length <= 64 && !!profile.pokemon && typeof profile.pokemon === 'object' && !Array.isArray(profile.pokemon) && Object.entries(profile.pokemon).every(([id, status]) => Number.isSafeInteger(Number(id)) && (SPECIES_GENERATION.get(Number(id)) ?? Infinity) <= era && (status === 'seen' || status === 'caught'));
}
export function parseCaptureBackup(text: string): CaptureProfile[] {
  const value = JSON.parse(text); if (value?.version !== 1 || value?.format !== 'pokemetrics-captures' || !Array.isArray(value.profiles) || !value.profiles.every(validCaptureProfile)) throw Error('Invalid capture backup'); return value.profiles;
}
function read() { try { const value = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return { profiles: (value?.version === 1 && Array.isArray(value.profiles) ? value.profiles.filter(validCaptureProfile) : []) as CaptureProfile[], selected: typeof value?.selected === 'string' ? value.selected : '' }; } catch { return { profiles: [], selected: '' }; } }
const initial = read();
export const captureProfiles = writable(initial.profiles);
export const captureSelected = writable(initial.selected);
export const captureSaveFailed = writable(false);
export const captureProfile = derived([captureProfiles, captureSelected, edition], ([profiles, selected, game]) => profiles.find(profile => profile.id === selected && profile.game === game) ?? profiles.find(profile => profile.game === game) ?? null);
function persist() { try { localStorage.setItem(KEY, JSON.stringify({ version: 1, selected: get(captureSelected), profiles: get(captureProfiles) })); captureSaveFailed.set(false); } catch { captureSaveFailed.set(true); } }
export function selectCaptureProfile(id: string) { captureSelected.set(id); persist(); }
export function newCaptureProfile(name: string) { const profile = { id: crypto.randomUUID(), game: get(edition), name, pokemon: {} }; captureProfiles.update(profiles => [...profiles, profile]); selectCaptureProfile(profile.id); return profile; }
export function renameCaptureProfile(name: string) { const current = get(captureProfile); if (!current) return; captureProfiles.update(profiles => profiles.map(profile => profile.id === current.id ? { ...profile, name } : profile)); persist(); }
export function setCaptureStatus(id: number, status: CaptureStatus, defaultName: string) {
  const profile = get(captureProfile) ?? newCaptureProfile(defaultName); const pokemon = { ...profile.pokemon }; if (status === 'pending') delete pokemon[id]; else pokemon[id] = status;
  captureProfiles.update(profiles => profiles.map(row => row.id === profile.id ? { ...profile, pokemon } : row)); persist();
}
export function importCaptureProfiles(profiles: CaptureProfile[]) { const incoming = profiles.map(profile => ({ ...profile, id: crypto.randomUUID() })); captureProfiles.update(rows => [...rows, ...incoming]); if (incoming.length) captureSelected.set(incoming[0].id); persist(); }
export function matchesCapture(profile: CaptureProfile | null, id: number, filter: CaptureStatus | 'all') { const status = profile?.pokemon[id] ?? 'pending'; return filter === 'all' || (filter === 'seen' ? status !== 'pending' : status === filter); }
