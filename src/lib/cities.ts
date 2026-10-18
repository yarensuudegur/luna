import data from '@/data/cities.json';

export type City = {
  name: string;
  country: string;
  lat: number;
  lon: number;
  /** IANA saat dilimi, örn. "Europe/Istanbul". */
  tz: string;
};

export const CITIES: readonly City[] = data;

const HARF: Record<string, string> = {
  ı: 'i', ş: 's', ğ: 'g', ü: 'u', ö: 'o', ç: 'c', â: 'a', î: 'i', û: 'u',
};

/** Arama için: küçük harf, Türkçe harfler ve düzeltme işaretleri sadeleştirilmiş. */
function normalize(s: string): string {
  return s.toLocaleLowerCase('tr').replace(/[ışğüöçâîû]/g, (c) => HARF[c] ?? c);
}

/** Boş sorguda tüm liste; doluysa önce adı sorguyla başlayanlar, sonra içerenler. */
export function searchCities(query: string): City[] {
  const q = normalize(query.trim());
  if (!q) return [...CITIES];
  const starts: City[] = [];
  const contains: City[] = [];
  for (const c of CITIES) {
    const name = normalize(c.name);
    if (name.startsWith(q)) starts.push(c);
    else if (name.includes(q) || normalize(c.country).startsWith(q)) contains.push(c);
  }
  return [...starts, ...contains];
}

export function cityLabel(c: City): string {
  return `${c.name}, ${c.country}`;
}
