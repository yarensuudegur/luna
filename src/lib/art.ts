import type { ImageSourcePropType } from 'react-native';

/**
 * Kartların arasına girilen grunge görseller, prototipteki genişlikleri (ART_W) ve
 * yükseklik/genişlik oranları. Oran sabit yazılı: Image.resolveAssetSource webde yok.
 */
export const ART: ReadonlyArray<{ source: ImageSourcePropType; width: number; ratio: number }> = [
  { source: require('../../assets/art/art-01.webp'), width: 145, ratio: 1.0135 },
  { source: require('../../assets/art/art-02.webp'), width: 130, ratio: 0.8733 },
  { source: require('../../assets/art/art-03.webp'), width: 140, ratio: 0.7900 },
  { source: require('../../assets/art/art-04.webp'), width: 85, ratio: 1.9868 },
  { source: require('../../assets/art/art-05.webp'), width: 110, ratio: 1.3216 },
  { source: require('../../assets/art/art-06.webp'), width: 115, ratio: 1.4151 },
  { source: require('../../assets/art/art-07.webp'), width: 125, ratio: 1.1407 },
  { source: require('../../assets/art/art-08.webp'), width: 62, ratio: 2.7273 },
  { source: require('../../assets/art/art-09.webp'), width: 135, ratio: 0.9100 },
  { source: require('../../assets/art/art-10.webp'), width: 140, ratio: 0.9467 },
  { source: require('../../assets/art/art-11.webp'), width: 115, ratio: 1.2295 },
  { source: require('../../assets/art/art-12.webp'), width: 145, ratio: 1.0101 },
  { source: require('../../assets/art/art-13.webp'), width: 125, ratio: 0.8200 },
];
