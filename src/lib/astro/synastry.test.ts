import { describe, expect, it } from 'vitest';
import { computeChart } from './chart';
import { ELEMENTS, compatibility, elementOf, groupMix, sunPairLine } from './synastry';

const birth = (date: string, time = '12:00') => ({
  date,
  time,
  timeZone: 'Europe/Istanbul',
  lat: 41.0,
  lon: 29.0,
});

describe('compatibility', () => {
  const a = computeChart(birth('1996-03-14'));
  const b = computeChart(birth('1994-11-02'));

  it('dört alan da 1–10 arası tam sayı', () => {
    const c = compatibility(a, b);
    expect(Object.keys(c)).toEqual(['Aşk', 'Arkadaşlık', 'İletişim', 'İş']);
    for (const v of Object.values(c)) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it('aynı iki harita tam örtüşür: her alan ortanın üstünde', () => {
    const c = compatibility(a, a);
    for (const v of Object.values(c)) expect(v).toBeGreaterThan(5);
  });

  it('A–B ile B–A aynı sonucu verir', () => {
    expect(compatibility(a, b)).toEqual(compatibility(b, a));
  });

  it('doğum saati bilinmese de hesaplanır', () => {
    const c = compatibility(computeChart({ ...birth('1996-03-14'), time: null }), b);
    expect(c['Aşk']).toBeGreaterThanOrEqual(1);
  });
});

describe('elementler', () => {
  it('burç dizini % 4', () => {
    expect(ELEMENTS[elementOf(0)]).toBe('Ateş'); // Koç
    expect(ELEMENTS[elementOf(1)]).toBe('Toprak'); // Boğa
    expect(ELEMENTS[elementOf(2)]).toBe('Hava'); // İkizler
    expect(ELEMENTS[elementOf(3)]).toBe('Su'); // Yengeç
    expect(ELEMENTS[elementOf(11)]).toBe('Su'); // Balık
  });

  it('groupMix baskın elementi ve yüzdeyi bulur', () => {
    // Koç, Aslan, Yay (ateş) + Boğa
    const m = groupMix([0, 4, 8, 1]);
    expect(m.counts).toEqual([3, 1, 0, 0]);
    expect(m.total).toBe(4);
    expect(m.dominant).toBe(0);
    expect(m.percent).toBe(75);
  });

  it('boş grup 0 yüzde', () => {
    expect(groupMix([]).percent).toBe(0);
  });

  it('sunPairLine üç durumu ayırır', () => {
    expect(sunPairLine(0, 4)).toMatch(/aynı elementte/);
    expect(sunPairLine(0, 2)).toMatch(/besleyen/);
    expect(sunPairLine(0, 1)).toMatch(/farklı hızlarda/);
  });
});
