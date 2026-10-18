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

export const REL_BLURB: Record<RelType, readonly [string, string, string]> = {
  Arkadaş: ['Birlikte bir şey yapmak için güzel bir gün.', 'Kısa bir mesaj yeter.', 'Bugün birbirinize alan tanıyın.'],
  Aile: ['Bir telefon ikinizi de mutlu eder.', 'Sohbet hafif kalsın.', 'Hassas konuları başka bir güne bırakın.'],
  Flört: ['Aranızda kıvılcım var, bir plan yap.', 'Akışta kalın, zorlamayın.', 'Mesajları fazla yorumlama.'],
  Partner: [
    'Birlikte geçireceğiniz bir akşam iyi gelir.',
    'Gündelik işleri paylaşın.',
    'Yorgunluk sabrı azaltabilir, nazik olun.',
  ],
  'İş arkadaşı': ['Ortak bir işte hızlı ilerlersiniz.', 'Rolleri netleştirin.', 'E-postaları iki kez okuyun.'],
  'Eski sevgili': [
    'Sınırlarını koru, bugün kendine odaklan.',
    'Sınırlarını koru, bugün kendine odaklan.',
    'Eski konuları açmak için uygun bir gün sayılmaz.',
  ],
};

const TAGS_ALL = [
  'Derin sohbet günü',
  'Birlikte üretken',
  'Şakalaşma günü',
  'Sessizce anlaşma',
  'Boş tartışma riski',
  'Plan değişikliği',
  'Sabır gerek',
  'Ortak merak',
];
const TAGS_ROM = ['Karşılıklı çekim', 'Romantik plan', 'Kıskançlığa dikkat'];

export type FriendDay = { blurb: string; tags: string[] };

/** Günün cümlesi ve etiketleri: kişi + gün + ilişki türünden tohumlanır. */
export function friendDay(friend: { id: string; rel: RelType }, key: string): FriendDay {
  const r = rng('f' + friend.id + key + friend.rel);
  const score = Math.min(10, Math.round(3 + r() * 6));
  const tier = score >= 7 ? 0 : score >= 4 ? 1 : 2;
  const pool = ROMANTIC.includes(friend.rel) ? TAGS_ALL.concat(TAGS_ROM) : TAGS_ALL;
  return { blurb: REL_BLURB[friend.rel][tier], tags: pickN(r, pool, 2) };
}

const FROM_ABLATIVE: Record<RelType, string> = {
  Arkadaş: 'Arkadaştan',
  Aile: 'Aileden',
  Flört: 'Flörtten',
  Partner: 'Sevgiliden',
  'İş arkadaşı': 'İş arkadaşından',
  'Eski sevgili': 'Eski sevgiliden',
};

/** Geçiş kartının başlığı: "Arkadaştan flörte." */
export function transitionTitle(from: RelType, to: RelType): string {
  return `${FROM_ABLATIVE[from]} ${to === 'Flört' ? 'flörte' : 'sevgiliye'}.`;
}
