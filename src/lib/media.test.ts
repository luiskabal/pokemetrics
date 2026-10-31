import { describe, expect, it } from 'vitest';
import { mediaSource } from './media';

describe('previews of the selected artwork', () => {
  it('uses static previews of the same game and preserves front/back separation', () => {
    const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/';
    const front = mediaSource(base + '906.webp');
    const back = mediaSource(base + 'back/906.webp', 640);
    expect(front.animated).toBe(true);
    expect(front.preview).toMatch(/\/media\/pokemon\/[a-f0-9]+-160\.webp$/);
    expect(back.preview).toMatch(/-640\.webp$/);
    expect(back.preview).not.toBe(front.preview?.replace('-160.', '-640.'));
  });
  it('keeps unavailable images absent and never downloads an unknown animation as a preview', () => {
    expect(mediaSource(null)).toEqual({ preview: null, animated: false });
    expect(mediaSource('https://example.com/new.webp')).toEqual({ preview: null, animated: true });
    expect(mediaSource('https://example.com/new.gif')).toEqual({ preview: null, animated: true });
    const original = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/yellow/25.png';
    expect(mediaSource(original)).toEqual({ preview: original, animated: false });
  });
});
