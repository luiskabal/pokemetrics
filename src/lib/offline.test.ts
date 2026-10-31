import { describe, expect, it } from 'vitest';
import { requiredGenerationPacks } from './offline';
import type { Pokemon } from './model';
describe('offline download scope', () => {
  it('includes only the introduction packs needed by the selected Pokemon and deduplicates them', () => { expect(requiredGenerationPacks([{ id: 25 }, { id: 152 }, { id: 1 }] as Pokemon[]).map(url => url.split('/').pop())).toEqual(['generation-1.json', 'generation-2.json']); expect(requiredGenerationPacks([{ id: 906 }] as Pokemon[])[0]).toMatch(/generation-9\.json$/); });
});
