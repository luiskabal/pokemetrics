import { describe, expect, it } from 'vitest';
import { matchesCapture, parseCaptureBackup, validCaptureProfile } from './captures';
describe('capture profiles', () => {
  const profile = { id: 'one', name: 'Yellow run', game: 'yellow', pokemon: { 1: 'seen' as const, 25: 'caught' as const } };
  it('validates game era and status before accepting a backup', () => { expect(validCaptureProfile(profile)).toBe(true); expect(validCaptureProfile({ ...profile, pokemon: { 906: 'caught' } })).toBe(false); expect(() => parseCaptureBackup(JSON.stringify({ format: 'pokemetrics-captures', version: 1, profiles: [{ ...profile, pokemon: { 1: 'other' } }] }))).toThrow(); });
  it('counts a caught Pokemon as seen and keeps pending distinct', () => { expect(matchesCapture(profile, 25, 'seen')).toBe(true); expect(matchesCapture(profile, 25, 'pending')).toBe(false); expect(matchesCapture(profile, 2, 'pending')).toBe(true); expect(matchesCapture(null, 1, 'caught')).toBe(false); });
});
