import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@/theme';

type Props = {
  /** Ay'ın Güneş'e göre boylam farkı, derece (0 yeni ay, 180 dolunay). */
  elongation: number;
  size: number;
  /** Siyah zeminde beyaz çizilir. */
  inverse?: boolean;
};

/** Evre simgesi; prototipteki moonSVG ile aynı geometri. */
export function MoonIcon({ elongation, size, inverse }: Props) {
  const k = Math.cos((elongation * Math.PI) / 180);
  const r = size / 2;
  const waxing = elongation < 180;
  const rx = Math.abs(k) * r;
  const dark = inverse ? colors.white : colors.black;
  const lit = inverse ? colors.black : colors.bg;
  const outer = r - 0.5;
  const d =
    `M ${r} 0.5 A ${outer} ${outer} 0 0 ${waxing ? 1 : 0} ${r} ${size - 0.5} ` +
    `A ${Math.max(rx - 0.5, 0.01)} ${outer} 0 0 ${k > 0 === waxing ? 0 : 1} ${r} 0.5 Z`;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={r} cy={r} r={outer} fill={dark} />
      <Path d={d} fill={lit} />
      <Circle cx={r} cy={r} r={outer} fill="none" stroke={dark} />
    </Svg>
  );
}
