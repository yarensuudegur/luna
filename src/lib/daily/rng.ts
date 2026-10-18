/** Metinden 32 bit sayı üretir (prototipteki hash ile aynı). */
export function hash(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export type Rng = () => number;

/** Tohumlu rastgele sayı üreteci (mulberry32): aynı tohum, aynı dizi. [0, 1) döner. */
export function rng(seed: string): Rng {
  let a = hash(seed);
  return () => {
    a = ((a | 0) + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Diziden tekrarsız n eleman seçer. */
export function pickN<T>(r: Rng, arr: readonly T[], n: number): T[] {
  const pool = arr.slice();
  const out: T[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return out;
}

/** Ağırlıklı seçim; ağırlıklar >= 0 olmalı. */
export function pickWeighted<T>(r: Rng, items: readonly T[], weight: (item: T) => number): T {
  const weights = items.map(weight);
  const total = weights.reduce((a, b) => a + b, 0);
  let x = r() * total;
  for (let i = 0; i < items.length; i++) {
    x -= weights[i];
    if (x < 0) return items[i];
  }
  return items[items.length - 1];
}
