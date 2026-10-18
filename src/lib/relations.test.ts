import { describe, expect, it } from 'vitest';
import { REL_TYPES, friendDay, codeFromQr, isRomanticTransition, qrValueFor, transitionTitle } from './relations';

describe('QR', () => {
  const code = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

  it('kendi QR içeriğini geri çözer', () => {
    expect(codeFromQr(qrValueFor(code))).toBe(code);
  });

  it('düz kodu ve büyük harfi kabul eder', () => {
    expect(codeFromQr(`  ${code.toUpperCase()} `)).toBe(code);
  });

  it('geçersiz içeriği reddeder', () => {
    expect(codeFromQr('https://example.com/x')).toBeNull();
    expect(codeFromQr('@deniz')).toBeNull();
    expect(codeFromQr('abc')).toBeNull();
  });
});

describe('ilişki geçişi', () => {
  it('yalnızca romantik olmayandan romantiğe', () => {
    expect(isRomanticTransition('Arkadaş', 'Flört')).toBe(true);
    expect(isRomanticTransition('Aile', 'Partner')).toBe(true);
    expect(isRomanticTransition('Flört', 'Partner')).toBe(false);
    expect(isRomanticTransition('Partner', 'Arkadaş')).toBe(false);
    expect(isRomanticTransition('Arkadaş', 'İş arkadaşı')).toBe(false);
  });
});

describe('friendDay', () => {
  it('aynı gün aynı sonucu verir, iki etiket döner', () => {
    const a = friendDay({ id: 'x', rel: 'Flört' }, '2026-10-18');
    expect(a).toEqual(friendDay({ id: 'x', rel: 'Flört' }, '2026-10-18'));
    expect(a.tags).toHaveLength(2);
  });

  it('her ilişki türünün cümlesi var', () => {
    for (const rel of REL_TYPES) {
      expect(friendDay({ id: 'x', rel }, '2026-10-18').blurb.length).toBeGreaterThan(0);
    }
  });
});

describe('transitionTitle', () => {
  it('çıkış hâliyle yazar', () => {
    expect(transitionTitle('Arkadaş', 'Flört')).toBe('Arkadaştan flörte.');
    expect(transitionTitle('Aile', 'Partner')).toBe('Aileden sevgiliye.');
    expect(transitionTitle('İş arkadaşı', 'Flört')).toBe('İş arkadaşından flörte.');
  });
});
