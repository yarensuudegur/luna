export const BURCLAR = [
  'Koç', 'Boğa', 'İkizler', 'Yengeç', 'Aslan', 'Başak',
  'Terazi', 'Akrep', 'Yay', 'Oğlak', 'Kova', 'Balık',
] as const;

/** "Başak'ta" gibi bulunma halleri. */
export const BURC_DA = [
  'Koç’ta', 'Boğa’da', 'İkizler’de', 'Yengeç’te', 'Aslan’da', 'Başak’ta',
  'Terazi’de', 'Akrep’te', 'Yay’da', 'Oğlak’ta', 'Kova’da', 'Balık’ta',
] as const;

/** Derece değerini [0, 360) aralığına getirir. */
export function norm(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export const rad = (d: number): number => (d * Math.PI) / 180;
export const deg = (r: number): number => (r * 180) / Math.PI;

/** Ekliptik boylamın burç dizini (0 = Koç). */
export function signIndex(lon: number): number {
  return Math.floor(norm(lon) / 30);
}

/** Burç içindeki tam derece (0–29). */
export function degreeInSign(lon: number): number {
  return Math.floor(norm(lon) % 30);
}
