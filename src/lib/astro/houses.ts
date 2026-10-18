import { deg, norm, rad } from './zodiac';

export const HOUSE_SYSTEMS = ['Placidus', 'Whole Sign', 'Koch', 'Equal', 'Porphyry'] as const;
export type HouseSystem = (typeof HOUSE_SYSTEMS)[number];

/** Ortalama ekliptik eğikliği (derece), T = J2000'den beri Jülyen yüzyıl. */
export function obliquity(T: number): number {
  return 23.439291 - 0.0130042 * T;
}

/** MC: meridyenin ekliptiği kestiği nokta. ramc = yerel yıldız zamanı (derece). */
export function midheaven(ramc: number, eps: number): number {
  return norm(deg(Math.atan2(Math.sin(rad(ramc)), Math.cos(rad(ramc)) * Math.cos(rad(eps)))));
}

/** Yükselen: doğu ufkunu kesen ekliptik noktası. */
export function ascendant(ramc: number, lat: number, eps: number): number {
  const t = rad(ramc);
  const e = rad(eps);
  const y = Math.cos(t);
  const x = -(Math.sin(t) * Math.cos(e) + Math.tan(rad(lat)) * Math.sin(e));
  return norm(deg(Math.atan2(y, x)));
}

/** Ekliptik üzerindeki bir boylamın deklinasyonu. */
export function lonToDec(lon: number, eps: number): number {
  return deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lon))));
}

/** Ekliptik üzerindeki bir boylamın sağ açıklığı. */
export function lonToRa(lon: number, eps: number): number {
  return norm(deg(Math.atan2(Math.sin(rad(lon)) * Math.cos(rad(eps)), Math.cos(rad(lon)))));
}

/** Sağ açıklığı verilen ekliptik noktasının boylamı. */
function raToLon(ra: number, eps: number): number {
  return norm(deg(Math.atan2(Math.sin(rad(ra)), Math.cos(rad(ra)) * Math.cos(rad(eps)))));
}

/** Gündüz yarı yayı. Kutup bölgelerinde tanımsızsa null. */
function diurnalSemiArc(dec: number, lat: number): number | null {
  const x = -Math.tan(rad(lat)) * Math.tan(rad(dec));
  return Math.abs(x) >= 1 ? null : deg(Math.acos(x));
}

/**
 * Placidus ara tepe noktası. fraction: yarı yayın kaçta kaçı; upper: MC tarafı
 * (11, 12) mi yoksa IC tarafı (2, 3) mı. Yinelemeli çözülür.
 */
function placidusCusp(
  ramc: number,
  lat: number,
  eps: number,
  fraction: number,
  upper: boolean,
): number | null {
  let lon = raToLon(upper ? ramc + 30 : ramc + 150, eps);
  for (let i = 0; i < 50; i++) {
    const dsa = diurnalSemiArc(lonToDec(lon, eps), lat);
    if (dsa === null) return null;
    const ra = upper ? ramc + dsa * fraction : ramc + 180 - (180 - dsa) * fraction;
    const next = raToLon(ra, eps);
    const diff = Math.abs(norm(next - lon + 180) - 180);
    lon = next;
    if (diff < 1e-9) break;
  }
  return lon;
}

/** Koch ara tepe noktaları [11, 12, 2, 3]. MC derecesinin doğum yeri yayı üçe bölünür. */
function kochCusps(ramc: number, lat: number, eps: number, mc: number): number[] | null {
  const x = Math.tan(rad(lat)) * Math.tan(rad(lonToDec(mc, eps)));
  if (Math.abs(x) >= 1) return null;
  const ad3 = deg(Math.asin(x)) / 3;
  const at = (offset: number) => ascendant(ramc + offset, lat, eps);
  return [at(-60 - 2 * ad3), at(-30 - ad3), at(30 + ad3), at(60 + 2 * ad3)];
}

/** Dört köşe ve dört ara tepe noktasından 12 evi kurar; karşıt evler 180° ötededir. */
function fromHalf(asc: number, mc: number, c11: number, c12: number, c2: number, c3: number): number[] {
  const cusps = [asc, c2, c3, norm(mc + 180), 0, 0, 0, 0, 0, mc, c11, c12];
  for (let i = 4; i <= 8; i++) cusps[i] = norm(cusps[(i + 6) % 12] + 180);
  return cusps;
}

/**
 * 12 evin başlangıç boylamları (index 0 = 1. ev). Placidus ve Koch kutup
 * bölgelerinde tanımsızdır; o durumda Porphyry kullanılır.
 */
export function houseCusps(system: HouseSystem, ramc: number, lat: number, eps: number): number[] {
  const asc = ascendant(ramc, lat, eps);
  const mc = midheaven(ramc, eps);

  switch (system) {
    case 'Equal':
      return Array.from({ length: 12 }, (_, i) => norm(asc + 30 * i));
    case 'Whole Sign': {
      const start = Math.floor(asc / 30) * 30;
      return Array.from({ length: 12 }, (_, i) => norm(start + 30 * i));
    }
    case 'Placidus': {
      const c11 = placidusCusp(ramc, lat, eps, 1 / 3, true);
      const c12 = placidusCusp(ramc, lat, eps, 2 / 3, true);
      const c2 = placidusCusp(ramc, lat, eps, 2 / 3, false);
      const c3 = placidusCusp(ramc, lat, eps, 1 / 3, false);
      if (c11 === null || c12 === null || c2 === null || c3 === null) {
        return houseCusps('Porphyry', ramc, lat, eps);
      }
      return fromHalf(asc, mc, c11, c12, c2, c3);
    }
    case 'Koch': {
      const k = kochCusps(ramc, lat, eps, mc);
      if (!k) return houseCusps('Porphyry', ramc, lat, eps);
      return fromHalf(asc, mc, k[0], k[1], k[2], k[3]);
    }
    case 'Porphyry': {
      const upper = norm(asc - mc) / 3;
      const lower = norm(norm(mc + 180) - asc) / 3;
      return fromHalf(
        asc,
        mc,
        norm(mc + upper),
        norm(mc + 2 * upper),
        norm(asc + lower),
        norm(asc + 2 * lower),
      );
    }
  }
}

/** Boylamın hangi evde (1–12) olduğunu verir. */
export function houseOf(lon: number, cusps: readonly number[]): number {
  const p = norm(lon);
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const span = norm(cusps[(i + 1) % 12] - start);
    if (norm(p - start) < span) return i + 1;
  }
  return 1;
}
