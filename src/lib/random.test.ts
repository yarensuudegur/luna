import { describe, expect, it } from 'vitest';
import { TAROT_COUNT } from './daily';
import { randomInt } from './random';

describe('randomInt', () => {
  it('her zaman [0, n) aralığında kalır', () => {
    for (let i = 0; i < 2000; i++) {
      const v = randomInt(TAROT_COUNT);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(TAROT_COUNT);
    }
  });

  it('78 kartın hepsi çekilebilir, tek bir karta yığılmaz', () => {
    const seen = new Map<number, number>();
    const draws = 20000;
    for (let i = 0; i < draws; i++) {
      const v = randomInt(TAROT_COUNT);
      seen.set(v, (seen.get(v) ?? 0) + 1);
    }
    expect(seen.size).toBe(TAROT_COUNT);
    // Beklenen ≈ 256; hiçbir kart beklenenin iki katını geçmemeli (Yıldız'a yığılma gibi bir sapma olmasın).
    for (const count of seen.values()) expect(count).toBeLessThan((draws / TAROT_COUNT) * 2);
  });

  it('geçersiz n için hata verir', () => {
    expect(() => randomInt(0)).toThrow();
    expect(() => randomInt(1.5)).toThrow();
  });
});
