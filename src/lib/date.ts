const GUNLER = ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CTS'] as const;
const AYLAR = ['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'] as const;

/** Örn. "PAZ 18 EKİ" */
export function formatTopDate(d: Date = new Date()): string {
  return `${GUNLER[d.getDay()]} ${d.getDate()} ${AYLAR[d.getMonth()]}`;
}
