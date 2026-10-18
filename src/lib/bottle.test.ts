import { describe, expect, it } from 'vitest';
import {
  BOTTLE,
  MOODS,
  eveningCountdown,
  eveningHour,
  isEvening,
  monthSlides,
  orbsFor,
  weekData,
  weekKeys,
  weekLabel,
  weekStartKey,
} from './bottle';
import type { MoodMap, MoodValues } from './bottle';

const entry = (over: Partial<MoodValues> = {}) => ({
  values: { mutluluk: 5, enerji: 5, huzur: 5, kaygi: 5, sevgi: 5, motivasyon: 5, ...over },
  note: '',
});

describe('hafta', () => {
  it('pazar günü haftanın 7 günü pazartesiden başlar', () => {
    expect(weekStartKey('2026-10-18')).toBe('2026-10-12');
    const keys = weekKeys('2026-10-18');
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe('2026-10-12');
    expect(keys[6]).toBe('2026-10-18');
  });

  it('pazartesi yeni, boş bir haftadır', () => {
    expect(weekKeys('2026-10-19')).toEqual(['2026-10-19']);
    expect(weekStartKey('2026-10-19')).toBe('2026-10-19');
  });

  it('ay sınırını aşan haftanın etiketi iki ay adı içerir', () => {
    expect(weekLabel('2026-10-12')).toBe('12–18 Ekim');
    expect(weekLabel('2026-09-28')).toBe('28 Eylül–4 Ekim');
  });
});

describe('akşam saati', () => {
  it('ayardan saati okur, bozuksa 21 kullanır', () => {
    expect(eveningHour('22:00')).toBe(22);
    expect(eveningHour('')).toBe(21);
    expect(eveningHour('99:00')).toBe(21);
  });

  it('saatten önce geri sayım verir, sonra boş döner', () => {
    expect(eveningCountdown(new Date(2026, 9, 18, 18, 30), '21:00')).toBe('02:30');
    expect(eveningCountdown(new Date(2026, 9, 18, 21, 0), '21:00')).toBe('');
    expect(isEvening(new Date(2026, 9, 18, 20, 59), '21:00')).toBe(false);
    expect(isEvening(new Date(2026, 9, 18, 21, 0), '21:00')).toBe(true);
  });
});

describe('şişe topları', () => {
  it('her gün 6 top verir ve slotları alttan yukarı sırayla doldurur', () => {
    const orbs = orbsFor(['2026-10-12', '2026-10-13']);
    expect(orbs).toHaveLength(12);
    expect(orbs.map((o) => o.nth)).toEqual([0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5]);
    orbs.forEach((o, i) => expect([o.x, o.y]).toEqual(BOTTLE.slots[i]));
  });

  it('aynı gün için hep aynı sallanmayı üretir', () => {
    expect(orbsFor(['2026-10-12'])).toEqual(orbsFor(['2026-10-12']));
  });

  it('slot sayısını aşınca başa sarar', () => {
    const keys = Array.from({ length: 9 }, (_, i) => `2026-10-0${i + 1}`);
    const orbs = orbsFor(keys);
    expect(orbs).toHaveLength(54);
    expect([orbs[46].x, orbs[46].y]).toEqual(BOTTLE.slots[0]);
  });
});

describe('haftalık özet', () => {
  const moods: MoodMap = {
    '2026-10-12': entry({ huzur: 8, kaygi: 10 }),
    '2026-10-13': entry({ huzur: 7, kaygi: 10 }),
  };

  it('haftanın duygusunu kaygı hariç en yüksek ortalamadan seçer', () => {
    const d = weekData('2026-10-12', weekKeys('2026-10-18'), moods);
    expect(d.best).toBe('Huzur');
    expect(d.keys).toEqual(['2026-10-12', '2026-10-13']);
    expect(d.avg.huzur).toBe('7,5');
    expect(d.avg.kaygi).toBe('10,0');
  });

  it('kayıtsız hafta için tire döner', () => {
    const d = weekData('2026-10-12', weekKeys('2026-10-18'), {});
    expect(d.keys).toEqual([]);
    expect(MOODS.every(([f]) => d.avg[f] === '-')).toBe(true);
  });
});

describe('aylık özet', () => {
  it('kayıt yokken boş slaytlar üretir', () => {
    const s = monthSlides(new Date(2026, 9, 18), {}, {}, () => 0, 'Yaren');
    expect(s).toHaveLength(4);
    expect(s[0][1]).toBe('-');
    expect(s[3]).toEqual(['EKİM BİTİYOR', 'Gelecek ay görüşürüz.', 'Yaren · 2026']);
  });

  it('yalnızca o ayın kayıtlarını sayar', () => {
    const moods: MoodMap = {
      '2026-09-30': entry({ enerji: 10 }),
      '2026-10-05': entry({ enerji: 6, mutluluk: 9 }),
    };
    const s = monthSlides(new Date(2026, 9, 18), moods, { '2026-10-05': 0 }, () => 3, 'Yaren');
    expect(s[0][1]).toBe('Mutluluk.');
    expect(s[1][1]).toBe('5 Ekim.');
    expect(s[1][2]).toBe('Ay Yengeç’te.');
    expect(s[2][1]).toBe('Deli.');
  });
});
