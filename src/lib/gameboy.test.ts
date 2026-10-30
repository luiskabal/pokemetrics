import { describe, expect, it } from 'vitest';
import { MAX_ROM_BYTES, SAVE_ENGINE, exportGameBackup, readGameBackup, readGameRom, romTitle, sha256 } from './gameboy';
import type { GameSnapshot } from './gameboy';

function rom(title = 'TEST GAME', color = false): Uint8Array {
  const bytes = new Uint8Array(32768);
  for (let i = 0; i < title.length; i++) bytes[0x134 + i] = title.charCodeAt(i);
  bytes[0x143] = color ? 0x80 : 0;
  let checksum = 0;
  for (let i = 0x134; i <= 0x14c; i++) checksum = (checksum - bytes[i] - 1) & 255;
  bytes[0x14d] = checksum;
  return bytes;
}
describe('juegos locales y copias de partidas', () => {
  it('valida la cabecera y separa archivos con el mismo nombre mediante SHA-256', async () => {
    const first = rom(), second = rom(); second[0x200] = 1;
    const a = await readGameRom(new File([first as BlobPart], 'Pokemon.gb'));
    const b = await readGameRom(new File([second as BlobPart], 'Pokemon.gb'));
    expect(a.title).toBe('TEST GAME'); expect(a.hash).not.toBe(b.hash); expect(a.hash).toHaveLength(64);
    expect((await readGameRom(new File([first as BlobPart], 'renamed.GBC'))).hash).toBe(a.hash);
    expect(romTitle(rom('COLOR GAME', true))).toBe('COLOR GAME');
  });
  it('rechaza archivos incompatibles, truncados o con cabecera dañada', async () => {
    const bad = rom(); bad[0x134]++;
    expect(() => romTitle(bad)).toThrow('playInvalidRom');
    expect(() => romTitle(new Uint8Array(100))).toThrow('playInvalidRom');
    expect(() => romTitle(new Uint8Array(MAX_ROM_BYTES + 16384))).toThrow('playInvalidRom');
    await expect(readGameRom(new File([rom() as BlobPart], 'game.zip'))).rejects.toThrow('playInvalidRom');
  });
  it('recupera exactamente los bytes del estado sin incluir la ROM en la copia', async () => {
    const snapshot: GameSnapshot = { romHash: 'a'.repeat(64), engine: SAVE_ENGINE, savedAt: Date.now(), state: new Uint8Array([0, 255, 127, 10, 128]) };
    const text = await exportGameBackup(snapshot);
    expect(await readGameBackup(text, snapshot.romHash)).toEqual(snapshot);
    expect(text).not.toContain('romBytes');
  });
  it('rechaza una copia de otro juego, otra versión o con contenido corrupto', async () => {
    const snapshot: GameSnapshot = { romHash: 'a'.repeat(64), engine: SAVE_ENGINE, savedAt: 1234, state: new Uint8Array([1, 2, 3]) };
    const text = await exportGameBackup(snapshot);
    await expect(readGameBackup(text, 'b'.repeat(64))).rejects.toThrow('playWrongGame');
    await expect(readGameBackup('{', snapshot.romHash)).rejects.toThrow('playInvalidBackup');
    await expect(readGameBackup(text.replace(SAVE_ENGINE, 'other-core'), snapshot.romHash)).rejects.toThrow('playInvalidBackup');
    const corrupt = JSON.parse(text); corrupt.state = 'AQIE';
    await expect(readGameBackup(JSON.stringify(corrupt), snapshot.romHash)).rejects.toThrow('playInvalidBackup');
    expect(await sha256(snapshot.state)).toBe(JSON.parse(text).checksum);
  });
});
