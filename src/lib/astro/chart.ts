import {
  Body,
  GeoVector,
  MakeTime,
  RotateVector,
  Rotation_EQJ_ECT,
  SiderealTime,
  SphereFromVector,
} from 'astronomy-engine';
import { ascendant, houseCusps, houseOf, midheaven, obliquity } from './houses';
import type { HouseSystem } from './houses';
import { zonedTimeToUtc } from './time';
import { norm } from './zodiac';

export type PlanetKey =
  | 'Güneş' | 'Ay' | 'Merkür' | 'Venüs' | 'Mars'
  | 'Jüpiter' | 'Satürn' | 'Uranüs' | 'Neptün' | 'Plüton';

type PlanetMeta = { key: PlanetKey; glyph: string; body: Body; outer: boolean };

/** Sıra ve simgeler prototipteki PLANETS ile aynıdır. `outer`: "sadece klasik" açıkken gizlenir. */
export const PLANETS: readonly PlanetMeta[] = [
  { key: 'Güneş', glyph: '☉', body: Body.Sun, outer: false },
  { key: 'Ay', glyph: '☽', body: Body.Moon, outer: false },
  { key: 'Merkür', glyph: '☿', body: Body.Mercury, outer: false },
  { key: 'Venüs', glyph: '♀', body: Body.Venus, outer: false },
  { key: 'Mars', glyph: '♂', body: Body.Mars, outer: false },
  { key: 'Jüpiter', glyph: '♃', body: Body.Jupiter, outer: false },
  { key: 'Satürn', glyph: '♄', body: Body.Saturn, outer: false },
  { key: 'Uranüs', glyph: '♅', body: Body.Uranus, outer: true },
  { key: 'Neptün', glyph: '♆', body: Body.Neptune, outer: true },
  { key: 'Plüton', glyph: '♇', body: Body.Pluto, outer: true },
];

export type PlanetPosition = {
  key: PlanetKey;
  glyph: string;
  outer: boolean;
  /** Tropikal ekliptik boylam, derece [0, 360). */
  lon: number;
};

export type BirthInput = {
  /** "YYYY-MM-DD" */
  date: string;
  /** "HH:MM" veya "HH:MM:SS"; bilinmiyorsa null. */
  time: string | null;
  /** IANA saat dilimi. */
  timeZone: string;
  lat: number;
  /** Doğu pozitif. */
  lon: number;
};

export type Chart = {
  planets: PlanetPosition[];
  /** Doğum saati bilinmiyorsa null. */
  asc: number | null;
  mc: number | null;
  timeKnown: boolean;
  /** Evleri kurmak için gerekenler; saat bilinmiyorsa null. */
  frame: { ramc: number; lat: number; eps: number } | null;
};

/** Doğum saati bilinmediğinde gezegenler için kullanılan duvar saati. */
const UNKNOWN_TIME = '12:00';

const J2000_MS = Date.UTC(2000, 0, 1, 12);

export function computeChart(input: BirthInput): Chart {
  const timeKnown = input.time !== null;
  const when = zonedTimeToUtc(input.date, input.time ?? UNKNOWN_TIME, input.timeZone);
  const time = MakeTime(when);

  const toEcliptic = Rotation_EQJ_ECT(time);
  const planets = PLANETS.map<PlanetPosition>((p) => {
    const sph = SphereFromVector(RotateVector(toEcliptic, GeoVector(p.body, time, true)));
    return { key: p.key, glyph: p.glyph, outer: p.outer, lon: norm(sph.lon) };
  });

  if (!timeKnown) return { planets, asc: null, mc: null, timeKnown, frame: null };

  const T = (when.getTime() - J2000_MS) / (36525 * 86400000);
  const eps = obliquity(T);
  const ramc = norm(SiderealTime(time) * 15 + input.lon);
  return {
    planets,
    asc: ascendant(ramc, input.lat, eps),
    mc: midheaven(ramc, eps),
    timeKnown,
    frame: { ramc, lat: input.lat, eps },
  };
}

/** Seçili sistemin 12 ev başlangıcı; doğum saati bilinmiyorsa null. */
export function cuspsOf(chart: Chart, system: HouseSystem): number[] | null {
  return chart.frame ? houseCusps(system, chart.frame.ramc, chart.frame.lat, chart.frame.eps) : null;
}

export { houseOf };
