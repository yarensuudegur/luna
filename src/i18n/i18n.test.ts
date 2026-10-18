import { afterEach, describe, expect, it } from 'vitest';
import { weekLabel } from '@/lib/bottle';
import { formatDayMonth, formatTopDate } from '@/lib/date';
import { buildReading, computeTransits } from '@/lib/daily';
import { computeChart, cuspsOf } from '@/lib/astro';
import { i18n, t } from './core';
import { decimal } from './lang';
import { resources } from './resources';

type Json = string | Json[] | { [k: string]: Json };

/** Her yaprağın yolu ve metni. */
function leaves(node: Json, path = ''): Array<[string, string]> {
  if (typeof node === 'string') return [[path, node]];
  if (Array.isArray(node)) return node.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  return Object.entries(node).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
}

const placeholders = (s: string) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();

afterEach(async () => {
  await i18n.changeLanguage('tr');
});

describe('sözlükler', () => {
  const tr = leaves(resources.tr as Json);
  const en = leaves(resources.en as Json);

  it('Türkçe ve İngilizce aynı anahtarlara sahip', () => {
    expect(en.map(([p]) => p)).toEqual(tr.map(([p]) => p));
  });

  it('hiçbir metin boş değil', () => {
    for (const [path, text] of [...tr, ...en]) expect(text.length, path).toBeGreaterThan(0);
  });

  it('yer tutucular iki dilde aynı', () => {
    const enMap = new Map(en);
    for (const [path, text] of tr) {
      expect(placeholders(enMap.get(path) ?? ''), path).toEqual(placeholders(text));
    }
  });

  it('İngilizce metinlerde Türkçe harf kalmamış (özel adlar hariç)', () => {
    const allowed = /Türkiye/g;
    for (const [path, text] of en) {
      if (path.startsWith('planets.') || path.startsWith('settings.relationshipOptions')) continue;
      expect(text.replace(allowed, '').match(/[ğüşıöçĞÜŞİÖÇ]/), `${path}: ${text}`).toBeNull();
    }
  });
});

describe('dile göre biçimler', () => {
  it('Türkçe: tarih, hafta ve ondalık', () => {
    const d = new Date(2026, 9, 18, 12);
    expect(formatTopDate(d)).toBe('PAZ 18 EKİ');
    expect(formatDayMonth(d)).toBe('18 Ekim');
    expect(weekLabel('2026-10-12')).toBe('12–18 Ekim');
    expect(decimal(6.5)).toBe('6,5');
  });

  it('İngilizce: tarih, hafta ve ondalık', async () => {
    await i18n.changeLanguage('en');
    const d = new Date(2026, 9, 18, 12);
    expect(formatTopDate(d)).toBe('SUN OCT 18');
    expect(formatDayMonth(d)).toBe('October 18');
    expect(weekLabel('2026-10-12')).toBe('October 12–18');
    expect(weekLabel('2026-09-28')).toBe('September 28–October 4');
    expect(decimal(6.5)).toBe('6.5');
    expect(t('tabs.index')).toBe('TODAY');
  });
});

describe('günlük yorum İngilizce', () => {
  const chart = computeChart({ date: '1995-03-14', time: '09:30', timeZone: 'Europe/Istanbul', lat: 41.01, lon: 28.97 });
  const natal = { planets: chart.planets, asc: chart.asc, cusps: cuspsOf(chart, 'Placidus') };

  it('uzun yorumdaki cümleler İngilizce ve yer tutucusuz', async () => {
    await i18n.changeLanguage('en');
    for (let d = 1; d <= 20; d++) {
      const key = `2026-10-${String(d).padStart(2, '0')}`;
      const r = buildReading('user-1', key, computeTransits(key, natal), 'en');
      for (const text of [r.h, r.body, ...r.long, ...r.dos, ...r.donts, ...r.deep.map((x) => x.txt)]) {
        expect(text).not.toMatch(/\{\{|\}\}/);
      }
      expect(r.long.at(-1)).toMatch(/Moon|Sun|natal|house/);
    }
  });
});
