import { describe, expect, it } from 'vitest';
import { computeChart, cuspsOf, moonPhaseName, nextMoonEvent } from '@/lib/astro';
import { DAILY, DEEP_CATEGORIES } from './content';
import { buildReading } from './reading';
import { rng } from './rng';
import { computeTransits } from './transits';
import type { Natal } from './transits';

const chart = computeChart({
  date: '1995-03-14',
  time: '09:30',
  timeZone: 'Europe/Istanbul',
  lat: 41.01,
  lon: 28.97,
});
const natal: Natal = { planets: chart.planets, asc: chart.asc, cusps: cuspsOf(chart, 'Placidus') };

describe('rng', () => {
  it('aynı tohum aynı diziyi verir, farklı tohum farklı', () => {
    const a = rng('x');
    const b = rng('x');
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(rng('x')()).not.toBe(rng('y')());
  });
});

describe('transitler', () => {
  const tr = computeTransits('2026-10-18', natal);

  it('Ay ve Güneş için burç ve ev verir', () => {
    expect(tr.moon.sign).toBeGreaterThanOrEqual(0);
    expect(tr.moon.sign).toBeLessThan(12);
    expect(tr.moon.house).toBeGreaterThanOrEqual(1);
    expect(tr.moon.house).toBeLessThanOrEqual(12);
    expect(tr.sun.house).not.toBeNull();
  });

  it('18 Ekim 2026 Güneşi Terazi’nin sonunda (≈205°)', () => {
    expect(tr.sun.lon).toBeGreaterThan(204);
    expect(tr.sun.lon).toBeLessThan(207);
  });

  it('açılar orb sınırında ve güce göre sıralı', () => {
    expect(tr.aspects.length).toBeLessThanOrEqual(6);
    for (let i = 1; i < tr.aspects.length; i++) {
      expect(tr.aspects[i - 1].strength).toBeGreaterThanOrEqual(tr.aspects[i].strength);
    }
    for (const a of tr.aspects) expect(a.orb).toBeLessThanOrEqual(4);
  });

  it('doğum saati yoksa ev null olur', () => {
    const noTime = computeTransits('2026-10-18', { ...natal, asc: null, cusps: null });
    expect(noTime.moon.house).toBeNull();
    expect(noTime.aspects.every((a) => a.natal !== 'Yükselen')).toBe(true);
  });
});

describe('günlük yorum', () => {
  const tr = computeTransits('2026-10-18', natal);

  it('aynı kullanıcı ve gün için hep aynı metin', () => {
    expect(buildReading('user-1', '2026-10-18', tr)).toEqual(buildReading('user-1', '2026-10-18', tr));
  });

  it('ton yalnızca kapanış cümlesini değiştirir', () => {
    const item = DAILY.find((d) => d.h === buildReading('user-1', '2026-10-18', tr).h)!;
    const soft = buildReading('user-1', '2026-10-18', tr, 'Destekleyici');
    const hard = buildReading('user-1', '2026-10-18', tr, 'Sert');
    expect(soft.body.endsWith(item.s)).toBe(true);
    expect(hard.body.endsWith(item.x)).toBe(true);
    expect(soft.h).toBe(hard.h);
  });

  it('havuzdan gelir ve {ay} yer tutucusu kalmaz', () => {
    const r = buildReading('user-1', '2026-10-18', tr);
    expect(DAILY.map((d) => d.h)).toContain(r.h);
    expect(r.body).not.toContain('{ay}');
    expect(r.dos).toHaveLength(3);
    expect(r.donts).toHaveLength(3);
    expect(r.deep.map((d) => d.k)).toEqual([...DEEP_CATEGORIES]);
  });

  it('gün içinde en fazla bir alan zorluk durumunda', () => {
    for (let d = 1; d <= 28; d++) {
      const key = `2026-10-${String(d).padStart(2, '0')}`;
      const r = buildReading('user-1', key, computeTransits(key, natal));
      expect(r.deep.filter((x) => x.st === 2).length).toBeLessThanOrEqual(1);
    }
  });

  it('günler ve kullanıcılar arasında çeşitlilik var', () => {
    const heads = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      const key = `2026-10-${String(d).padStart(2, '0')}`;
      heads.add(buildReading('user-1', key, computeTransits(key, natal)).h);
    }
    expect(heads.size).toBeGreaterThan(3);
    const other = buildReading('user-2', '2026-10-18', tr);
    expect(other.dos.length).toBe(3);
  });
});

describe('ay olayları', () => {
  it('sonraki yeni ay ya da dolunay 15 gün içinde', () => {
    const from = new Date(2026, 9, 18, 12);
    const ev = nextMoonEvent(from)!;
    expect(['Yeni Ay', 'Dolunay']).toContain(ev.name);
    const days = (ev.date.getTime() - from.getTime()) / 86400000;
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThan(15);
    expect(ev.sign).toBeGreaterThanOrEqual(0);
    expect(ev.sign).toBeLessThan(12);
  });

  it('26 Ekim 2026 dolunaya yakın', () => {
    // 26 Ekim 2026 civarı dolunay.
    expect(moonPhaseName(new Date(Date.UTC(2026, 9, 26, 4)))).toBe('Dolunay');
  });
});
