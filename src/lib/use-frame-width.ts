import { useWindowDimensions } from 'react-native';

/** Masaüstü webde uygulama çerçevesinin en geniş hâli (src/app/_layout.tsx frame.maxWidth). */
export const FRAME_MAX_WIDTH = 430;

/**
 * Ekran genişliği yerine bunu kullan: telefonda ekran genişliğini, masaüstü webde
 * telefon genişliğindeki çerçevenin genişliğini verir. Yatay kaydırılan sayfalar ve
 * ekran genişliğine göre çizilen her şey taşmasın.
 */
export function useFrameWidth(): number {
  const { width } = useWindowDimensions();
  return Math.min(width, FRAME_MAX_WIDTH);
}
