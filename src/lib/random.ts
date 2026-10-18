/** [0, n) arasında eşit olasılıklı tam sayı; mümkünse sistemin güvenli rastgele kaynağından, sapmasız örneklemeyle. */
export function randomInt(n: number): number {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n pozitif bir tam sayı olmalı');
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    const limit = Math.floor(0x100000000 / n) * n;
    const buf = new Uint32Array(1);
    do c.getRandomValues(buf);
    while (buf[0] >= limit);
    return buf[0] % n;
  }
  return Math.floor(Math.random() * n);
}
