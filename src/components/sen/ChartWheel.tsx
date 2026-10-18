import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { BURCLAR, norm } from '@/lib/astro';
import { colors, fonts } from '@/theme';

export type WheelPlanet = { key: string; glyph: string; lon: number };

const SIZE = 330;
const C = SIZE / 2;
const R1 = 150;
const R2 = 124;
const R3 = 96;

const rad = (d: number) => (d * Math.PI) / 180;

/** Doğum haritası çarkı: Yükselen solda, burç halkası, gezegenler ve açı çizgileri. */
export function ChartWheel({
  planets,
  asc,
  width,
}: {
  planets: WheelPlanet[];
  asc: number;
  width: number;
}) {
  const point = (r: number, lon: number): [number, number] => {
    const a = rad(180 - (lon - asc));
    return [C + r * Math.cos(a), C - r * Math.sin(a)];
  };

  const aspects: Array<{ a: number; b: number; solid: boolean }> = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const d = Math.abs(norm(planets[i].lon - planets[j].lon + 180) - 180);
      if ([60, 90, 120, 180].some((x) => Math.abs(d - x) < 6)) {
        aspects.push({ a: i, b: j, solid: Math.abs(d - 90) < 6 || Math.abs(d - 180) < 6 });
      }
    }
  }

  const a1 = point(R2, asc);
  const a2 = point(R2, asc + 180);
  const ascLabel = point(R1 + 10, asc);

  return (
    <Svg width={width} height={(width * SIZE) / (SIZE + 20)} viewBox={`-20 0 ${SIZE + 20} ${SIZE}`}>
      <Circle cx={C} cy={C} r={R1} fill="none" stroke={colors.fg} />
      <Circle cx={C} cy={C} r={R2} fill="none" stroke={colors.fg} />
      <Circle cx={C} cy={C} r={R3} fill="none" stroke={colors.line} />

      {BURCLAR.map((burc, i) => {
        const [x1, y1] = point(R1, i * 30);
        const [x2, y2] = point(R2, i * 30);
        return <Line key={burc} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.fg} />;
      })}
      {BURCLAR.map((burc, i) => {
        const [tx, ty] = point((R1 + R2) / 2, i * 30 + 15);
        return (
          <SvgText
            key={`t-${burc}`}
            x={tx}
            y={ty}
            fontFamily={fonts.mono}
            fontSize={7.5}
            letterSpacing={1}
            textAnchor="middle"
            alignmentBaseline="central"
            fill={colors.fg}
          >
            {burc.toLocaleUpperCase('tr')}
          </SvgText>
        );
      })}

      <Line x1={a1[0]} y1={a1[1]} x2={a2[0]} y2={a2[1]} stroke={colors.fg} />

      {aspects.map(({ a, b, solid }) => {
        const [x1, y1] = point(R3 - 4, planets[a].lon);
        const [x2, y2] = point(R3 - 4, planets[b].lon);
        return (
          <Line
            key={`${a}-${b}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={colors.fg}
            strokeWidth={0.6}
            strokeDasharray={solid ? undefined : '2 2'}
          />
        );
      })}

      {planets.map((p) => {
        const [gx, gy] = point((R2 + R3) / 2, p.lon);
        const [dx, dy] = point(R3, p.lon);
        return (
          <G key={p.key}>
            <SvgText
              x={gx}
              y={gy}
              fontSize={14}
              textAnchor="middle"
              alignmentBaseline="central"
              fill={colors.fg}
            >
              {`${p.glyph}︎`}
            </SvgText>
            <Circle cx={dx} cy={dy} r={1.6} fill={colors.fg} />
          </G>
        );
      })}

      <SvgText
        x={ascLabel[0] - 4}
        y={ascLabel[1]}
        fontFamily={fonts.mono}
        fontSize={8}
        textAnchor="end"
        alignmentBaseline="central"
        fill={colors.fg}
      >
        ASC
      </SvgText>
    </Svg>
  );
}
