import type { PlanetKey } from './chart';
import { BURCLAR } from './zodiac';

/** Burcun gezegenlere kattığı ton; cümlede "… bir biçimde" diye kullanılır. */
const BURC_TON = [
  'atılgan ve doğrudan', 'sakin ve kararlı', 'meraklı ve hareketli', 'duyarlı ve koruyucu',
  'sıcak ve gururlu', 'titiz ve düzenli', 'dengeli ve uyumlu', 'derin ve yoğun',
  'özgür ve iyimser', 'disiplinli ve sabırlı', 'bağımsız ve özgün', 'sezgisel ve hayalci',
] as const;

/** Gezegenin ne anlattığı ve burçla birleşen adı ("Başak Güneşi"). */
const GEZEGEN: Record<PlanetKey, { rol: string; ad: string }> = {
  Güneş: { rol: 'Kimliğin ve yaşam enerjin.', ad: 'Güneşi' },
  Ay: { rol: 'Duyguların ve güvenlik ihtiyacın.', ad: 'Ayı' },
  Merkür: { rol: 'Düşünme ve konuşma biçimin.', ad: 'Merkürü' },
  Venüs: { rol: 'Sevme ve değer verme biçimin.', ad: 'Venüsü' },
  Mars: { rol: 'İstek ve harekete geçme gücün.', ad: 'Marsı' },
  Jüpiter: { rol: 'Büyüme ve şans alanın.', ad: 'Jüpiteri' },
  Satürn: { rol: 'Sınırların ve sorumlulukların.', ad: 'Satürnü' },
  Uranüs: { rol: 'Değişim ve özgürlük alanın. Kuşak gezegenidir.', ad: 'Uranüsü' },
  Neptün: { rol: 'Hayal gücün ve sezgin. Kuşak gezegenidir.', ad: 'Neptünü' },
  Plüton: { rol: 'Dönüşüm ve derinlik alanın. Kuşak gezegenidir.', ad: 'Plütonu' },
};

export function planetText(key: PlanetKey, sign: number): string {
  const g = GEZEGEN[key];
  return `${g.rol} ${BURCLAR[sign]} ${g.ad} bu alanı ${BURC_TON[sign]} bir biçimde yaşatır.`;
}

export function ascText(sign: number): string {
  return (
    'Yükselen burcun, insanlara ilk anda gösterdiğin yüz. Tarzında ve yeni biriyle tanıştığında ' +
    'nasıl göründüğünde ortaya çıkar. İki saatte bir değiştiği için anlamsız geliyorsa doğum saatini ' +
    `bir kez daha kontrol et. ${BURCLAR[sign]} Yükseleni seni ${BURC_TON[sign]} gösterir.`
  );
}
