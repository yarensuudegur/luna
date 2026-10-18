import { describe, expect, it } from 'vitest';
import { moonPhaseName } from '@/lib/astro';
import { FUTURE_MIN_DAYS, canSendFuture, futureDeliveryDate } from './future-plan';

const DAY = 86_400_000;

describe('futureDeliveryDate', () => {
  it('gönderimden en az 30 gün sonra, ilk yeni ayda teslim edilir', () => {
    for (let i = 0; i < 40; i++) {
      const sent = new Date(Date.UTC(2026, 9, 18, 12) + i * 9 * DAY);
      const at = futureDeliveryDate(sent);
      const gap = (at.getTime() - sent.getTime()) / DAY;
      expect(gap).toBeGreaterThanOrEqual(FUTURE_MIN_DAYS);
      // Veritabanı 28 günden azını reddeder; hesap hep 30–60 gün arasında kalır.
      expect(gap).toBeLessThan(FUTURE_MIN_DAYS + 30);
      expect(moonPhaseName(at)).toBe('Yeni Ay');
    }
  });
});

describe('canSendFuture', () => {
  it('boş ya da yalnızca boşluktan oluşan metin gönderilemez, 1000 karakter sınırdır', () => {
    expect(canSendFuture('')).toBe(false);
    expect(canSendFuture('   \n ')).toBe(false);
    expect(canSendFuture('merhaba')).toBe(true);
    expect(canSendFuture('a'.repeat(1000))).toBe(true);
    expect(canSendFuture('a'.repeat(1001))).toBe(false);
  });
});
