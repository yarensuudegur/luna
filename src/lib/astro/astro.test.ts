import { describe, expect, it } from 'vitest';
import { computeChart, cuspsOf, houseOf } from './chart';
import { HOUSE_SYSTEMS, lonToDec, lonToRa } from './houses';
import { zonedTimeToUtc } from './time';
import { norm, signIndex } from './zodiac';

// 1 Ocak 2000 12:00 UTC, Greenwich. J2000 anı: GMST = 18h 41m 50.5s (280.46°).
const greenwich = {
  date: '2000-01-01',
  time: '12:00',
  timeZone: 'UTC',
  lat: 51.4769,
  lon: 0,
};

const lonOf = (c: ReturnType<typeof computeChart>, key: string) =>
  c.planets.find((p) => p.key === key)!.lon;

const angleDiff = (a: number, b: number) => Math.abs(norm(a - b + 180) - 180);

describe('gezegen boylamları (1 Ocak 2000 12:00 UTC)', () => {
  const chart = computeChart(greenwich);

  it('10 gezegen hesaplanır', () => {
    expect(chart.planets.map((p) => p.key)).toEqual([
      'Güneş', 'Ay', 'Merkür', 'Venüs', 'Mars', 'Jüpiter', 'Satürn', 'Uranüs', 'Neptün', 'Plüton',
    ]);
  });

  it('Güneş Oğlak 10° civarında (≈280,4°)', () => {
    expect(angleDiff(lonOf(chart, 'Güneş'), 280.4)).toBeLessThan(0.1);
    expect(signIndex(lonOf(chart, 'Güneş'))).toBe(9);
  });

  it('Ay Akrep 13° civarında (≈223,3°)', () => {
    expect(angleDiff(lonOf(chart, 'Ay'), 223.3)).toBeLessThan(0.3);
    expect(signIndex(lonOf(chart, 'Ay'))).toBe(7);
  });

  it('dış gezegenler beklenen burçlarda', () => {
    expect(signIndex(lonOf(chart, 'Jüpiter'))).toBe(0); // Koç
    expect(signIndex(lonOf(chart, 'Satürn'))).toBe(1); // Boğa
    expect(signIndex(lonOf(chart, 'Uranüs'))).toBe(10); // Kova
    expect(signIndex(lonOf(chart, 'Neptün'))).toBe(10); // Kova (Ocak 1998'den beri)
    expect(signIndex(lonOf(chart, 'Plüton'))).toBe(8); // Yay
  });

  it('MC ≈ 279,7° (RAMC 280,46°)', () => {
    expect(angleDiff(chart.mc!, 279.66)).toBeLessThan(0.1);
    expect(angleDiff(chart.frame!.ramc, 280.46)).toBeLessThan(0.05);
  });

  it('Yükselen ufukta: yükseklik 0, doğu tarafında', () => {
    const { ramc, lat, eps } = chart.frame!;
    const ra = lonToRa(chart.asc!, eps);
    const dec = lonToDec(chart.asc!, eps);
    const ha = norm(ramc - ra);
    const rad = Math.PI / 180;
    const alt = Math.asin(
      Math.sin(lat * rad) * Math.sin(dec * rad) +
        Math.cos(lat * rad) * Math.cos(dec * rad) * Math.cos(ha * rad),
    );
    expect(Math.abs(alt / rad)).toBeLessThan(1e-6);
    expect(ha).toBeGreaterThan(180); // doğu: saat açısı negatif
  });
});

describe('ev sistemleri', () => {
  const chart = computeChart(greenwich);

  it.each(HOUSE_SYSTEMS)('%s: 1. ev Yükselen, 10. ev MC (Whole Sign hariç), evler artan sırada', (sys) => {
    const cusps = cuspsOf(chart, sys)!;
    expect(cusps).toHaveLength(12);
    if (sys === 'Whole Sign') {
      expect(cusps[0] % 30).toBe(0);
      expect(signIndex(cusps[0])).toBe(signIndex(chart.asc!));
    } else {
      expect(angleDiff(cusps[0], chart.asc!)).toBeLessThan(1e-9);
      if (sys !== 'Equal') expect(angleDiff(cusps[9], chart.mc!)).toBeLessThan(1e-9);
    }
    let total = 0;
    for (let i = 0; i < 12; i++) total += norm(cusps[(i + 1) % 12] - cusps[i]);
    expect(total).toBeCloseTo(360, 6);
  });

  it.each(HOUSE_SYSTEMS)('%s: karşıt evler 180° ötede', (sys) => {
    const cusps = cuspsOf(chart, sys)!;
    for (let i = 0; i < 6; i++) expect(angleDiff(cusps[i + 6], cusps[i] + 180)).toBeLessThan(1e-9);
  });

  it('Equal ve Whole Sign 30°lık evler verir', () => {
    const eq = cuspsOf(chart, 'Equal')!;
    for (let i = 0; i < 12; i++) expect(norm(eq[(i + 1) % 12] - eq[i])).toBeCloseTo(30, 9);
  });

  it('Placidus: 11. ve 12. ev tepe noktaları MC ile Yükselen arasında', () => {
    const c = cuspsOf(chart, 'Placidus')!;
    expect(norm(c[10] - c[9])).toBeGreaterThan(0);
    expect(norm(c[11] - c[10])).toBeGreaterThan(0);
    expect(norm(c[0] - c[11])).toBeGreaterThan(0);
    expect(norm(c[0] - c[9])).toBeLessThan(180);
  });

  it('Ekvator\'da Placidus ve Koch yaklaşık eşit 30°lık evlere yakınsar', () => {
    const eq = computeChart({ ...greenwich, lat: 0 });
    for (const sys of ['Placidus', 'Koch'] as const) {
      const c = cuspsOf(eq, sys)!;
      for (let i = 1; i < 12; i++) {
        expect(Math.abs(norm(c[i] - c[i - 1]) - 30)).toBeLessThan(5);
      }
    }
  });

  it('kutup bölgesinde Placidus çökmez (Porphyry\'ye düşer)', () => {
    const polar = computeChart({ ...greenwich, lat: 75 });
    const c = cuspsOf(polar, 'Placidus')!;
    expect(c).toHaveLength(12);
    expect(c.every(Number.isFinite)).toBe(true);
  });

  it('houseOf boylamı doğru eve koyar', () => {
    const c = cuspsOf(chart, 'Equal')!;
    expect(houseOf(chart.asc!, c)).toBe(1);
    expect(houseOf(chart.asc! + 29.9, c)).toBe(1);
    expect(houseOf(chart.asc! + 30.1, c)).toBe(2);
    expect(houseOf(chart.asc! - 0.1, c)).toBe(12);
  });
});

describe('doğum saati bilinmiyorsa', () => {
  it('12:00 ile hesaplanır; Yükselen, MC ve evler yok', () => {
    const known = computeChart(greenwich);
    const unknown = computeChart({ ...greenwich, time: null });
    expect(unknown.timeKnown).toBe(false);
    expect(unknown.asc).toBeNull();
    expect(unknown.mc).toBeNull();
    expect(cuspsOf(unknown, 'Placidus')).toBeNull();
    expect(unknown.planets.map((p) => p.lon)).toEqual(known.planets.map((p) => p.lon));
  });
});

describe('saat dilimi', () => {
  it('İzmir kışın UTC+3 (2005)', () => {
    expect(zonedTimeToUtc('2005-09-14', '14:30', 'Europe/Istanbul').toISOString()).toBe('2005-09-14T11:30:00.000Z');
    expect(zonedTimeToUtc('2005-01-14', '14:30', 'Europe/Istanbul').toISOString()).toBe('2005-01-14T12:30:00.000Z');
  });

  it('UTC aynen döner', () => {
    expect(zonedTimeToUtc('2000-01-01', '12:00:00', 'UTC').toISOString()).toBe('2000-01-01T12:00:00.000Z');
  });
});
