import { t } from '@/i18n/core';
import { pickN, rng } from '@/lib/daily/rng';

export const REL_TYPES = ['Arkadaş', 'Aile', 'Flört', 'Partner', 'İş arkadaşı', 'Eski sevgili'] as const;
export type RelType = (typeof REL_TYPES)[number];

export const ROMANTIC: readonly RelType[] = ['Flört', 'Partner'];

export type RelChange = { from: RelType; to: RelType; date: string };

/** Arkadaştan flörte ya da sevgiliye geçiş: siyah tam ekran kart açılır. */
export function isRomanticTransition(from: RelType, to: RelType): boolean {
  return !ROMANTIC.includes(from) && ROMANTIC.includes(to);
}

const QR_PREFIX = 'https://luna.app/f/';

/** QR'ın içeriği: kısa ömürlü arkadaş kodu. */
export function qrValueFor(code: string): string {
  return QR_PREFIX + code;
}

/** QR içeriğinden (bağlantı ya da düz kod) arkadaş kodunu çıkarır; tanınmazsa null. */
export function codeFromQr(data: string): string | null {
  const text = data.trim();
  const code = (text.startsWith(QR_PREFIX) ? text.slice(QR_PREFIX.length) : text).toLowerCase();
  return /^[a-f0-9]{32}$/.test(code) ? code : null;
}

// ----- Profil ekranındaki "BUGÜN" bölümü (prototipteki friendDay) -----

const list = (key: string): string[] => t(key, { returnObjects: true }) as unknown as string[];

export type FriendDay = { blurb: string; tags: string[] };

/** Günün cümlesi ve etiketleri: kişi + gün + ilişki türünden tohumlanır. Seçim dilden bağımsızdır. */
export function friendDay(friend: { id: string; rel: RelType }, key: string): FriendDay {
  const r = rng('f' + friend.id + key + friend.rel);
  const score = Math.min(10, Math.round(3 + r() * 6));
  const tier = score >= 7 ? 0 : score >= 4 ? 1 : 2;
  const all = list('rel.tagsAll');
  const romantic = list('rel.tagsRomantic');
  const pool = ROMANTIC.includes(friend.rel) ? all.concat(romantic) : all;
  const picked = pickN(r, pool.map((_, i) => i), 2).map((i) => pool[i]);
  return { blurb: list(`rel.blurb.${friend.rel}`)[tier], tags: picked };
}

/** Geçiş kartının başlığı: "Arkadaştan flörte." / "From friend to flirt." */
export function transitionTitle(from: RelType, to: RelType): string {
  return t('friends.transition.format', { from: t(`rel.from.${from}`), to: t(`rel.to.${to}`) });
}
