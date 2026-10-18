import { nextNewMoon } from '@/lib/astro';

/** Teslim için gönderimden en az bu kadar gün geçmeli (veritabanı 28 gün ister; 30 pay bırakır). */
export const FUTURE_MIN_DAYS = 30;
export const MAX_FUTURE_MESSAGE = 1000;

const DAY_MS = 86_400_000;

/** "Yıldızlar hizalandığında": gönderimden en az 30 gün sonraki ilk yeni ay. */
export function futureDeliveryDate(sentAt: Date): Date {
  const earliest = new Date(sentAt.getTime() + FUTURE_MIN_DAYS * DAY_MS);
  // Arama 40 gün bakar; yeni ay en çok ~29,5 günde bir olduğundan her zaman bulunur.
  return nextNewMoon(earliest) ?? new Date(earliest.getTime() + 30 * DAY_MS);
}

/** Boş ya da sınırı aşan metin gönderilemez. */
export const canSendFuture = (text: string): boolean => {
  const n = text.trim().length;
  return n > 0 && n <= MAX_FUTURE_MESSAGE;
};
