import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';
import { Button } from '@/components/Button';
import { StoryCard } from '@/components/gunluk/StoryCard';
import { SongArt } from '@/components/music/SongArt';
import { SongLinks } from '@/components/music/SongLinks';
import { Label, LinkText, Section } from '@/components/Section';
import { useTranslation } from '@/i18n';
import { moodName } from '@/i18n/names';
import { MOODS, low, moodLabel, up, weekdayName } from '@/lib/bottle';
import { fromDateKey } from '@/lib/date';
import { weekSong } from '@/lib/song-utils';
import type { SongDay } from '@/lib/song-utils';
import type { MoodMap, WeekData } from '@/lib/bottle';
import { colors, fonts } from '@/theme';

const SPARK_H = 28;

function Spark({ field, label, days, moods, avg }: {
  field: (typeof MOODS)[number][0];
  label: string;
  days: readonly string[];
  moods: MoodMap;
  avg: string;
}) {
  const [w, setW] = useState(0);
  let d = '';
  let pen = false;
  days.forEach((k, i) => {
    const m = moods[k];
    if (!m) {
      pen = false;
      return;
    }
    const x = days.length > 1 ? (i / (days.length - 1)) * w : w / 2;
    const y = SPARK_H - (m.values[field] / 10) * SPARK_H;
    d += `${pen ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)} `;
    pen = true;
  });

  return (
    <View style={styles.spark}>
      <View style={styles.dot} />
      <Text style={styles.sparkLabel}>{label}</Text>
      <View style={styles.sparkChart} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w > 0 && (
          <Svg width={w} height={SPARK_H} accessibilityLabel={label}>
            <Line x1={0} y1={SPARK_H / 2} x2={w} y2={SPARK_H / 2} stroke={colors.line} strokeWidth={1} />
            <Path d={d} fill="none" stroke={colors.black} strokeWidth={1.3} />
          </Svg>
        )}
      </View>
      <Text style={styles.sparkVal}>{avg}</Text>
    </View>
  );
}

type Props = {
  data: WeekData;
  name: string;
  /** Pazartesiden Pazar'a, bugüne kadarki günlerin anahtarları. */
  days: readonly string[];
  moods: MoodMap;
  insights: readonly string[];
  /** Haftanın kısa analizi (hazır kalıplar). */
  analysis: readonly string[];
  /** Haftanın pazartesisi; haftanın şarkısını seçmek için tohum. */
  weekStart: string;
  /** Bu hafta eklenen şarkılar. */
  songs: readonly SongDay[];
  saved: boolean;
  onShare: () => void;
  onSave: () => void;
  onReplay: () => void;
  /** Bu haftanın özetini kapatıp boş yeni şişeye geçer. */
  onNewBottle: () => void;
};

/** Şişe patladıktan sonra gelen haftalık özet (prototipteki weekSummary). */
export function WeekSummary({
  data,
  name,
  days,
  moods,
  insights,
  analysis,
  weekStart,
  songs,
  saved,
  onShare,
  onSave,
  onReplay,
  onNewBottle,
}: Props) {
  const { t } = useTranslation();
  const pick = weekSong(weekStart, songs);
  const dows = t('date.dowShort', { returnObjects: true }) as unknown as string[];
  return (
    <>
      <Animated.View entering={FadeIn.duration(500)}>
        <Section style={styles.center}>
          <Label>{t('gunluk.week.opened')}</Label>
          <Text style={[styles.h1, styles.centerText]}>{t('gunluk.week.best', { mood: low(moodLabel(data.best)) })}</Text>
          <View style={styles.cardWrap}>
            <StoryCard data={data} name={name} width={230} />
          </View>
          <View style={styles.actions}>
            <Button onPress={onShare}>{t('gunluk.week.shareStory')}</Button>
            <Button variant="ghost" onPress={onSave} disabled={saved}>
              {saved ? t('common.saved') : t('common.save')}
            </Button>
          </View>
          <Text style={styles.next}>{t('gunluk.week.mondayNew')}</Text>
          <View style={styles.links}>
            <LinkText onPress={onReplay} accessibilityRole="button" style={styles.replay}>
              {t('gunluk.week.replay')}
            </LinkText>
            <LinkText onPress={onNewBottle} accessibilityRole="button" style={styles.newBottle}>
              {t('gunluk.week.newBottle')}
            </LinkText>
          </View>
        </Section>
      </Animated.View>

      {analysis.length > 0 && (
        <Animated.View entering={FadeIn.duration(500)}>
          <Section>
            <Label>{t('analysis.title')}</Label>
            <Text style={styles.lead}>{analysis[0]}</Text>
            {analysis.slice(1).map((line) => (
              <Text key={line} style={styles.para}>
                {line}
              </Text>
            ))}
          </Section>
        </Animated.View>
      )}

      <Animated.View entering={FadeIn.duration(500)}>
        <Section>
          {MOODS.map(([f]) => (
            <Spark key={f} field={f} label={moodName(f)} days={days} moods={moods} avg={data.avg[f]} />
          ))}
        </Section>
      </Animated.View>

      {pick && (
        <Animated.View entering={FadeIn.duration(500)}>
          <Section>
            <View style={styles.weekSong}>
              <Text style={[styles.mono, styles.onDark]}>{t('music.weekSong')}</Text>
              <View style={styles.weekSongBody}>
                <SongArt song={pick.song} size={92} />
                <View style={styles.grow}>
                  <Text style={styles.weekSongTitle} numberOfLines={2}>
                    {pick.song.title}
                  </Text>
                  <Text style={[styles.mono, styles.onDarkMute]} numberOfLines={1}>
                    {up(pick.song.artist)}
                  </Text>
                  <Text style={[styles.mono, styles.onDarkMute, styles.picked]}>
                    {t('music.pickedFrom', { day: low(weekdayName(pick.date)) })}
                  </Text>
                </View>
              </View>
              <SongLinks song={pick.song} light style={styles.weekLinks} />
            </View>

            <Label style={styles.listLabel}>{t('music.weekSongs')}</Label>
            {songs.map((d) => (
              <View key={d.date} style={styles.songRow}>
                <Text style={[styles.mono, styles.mute, styles.songDay]}>{up(dows[fromDateKey(d.date).getDay()] ?? '')}</Text>
                <SongArt song={d.song} size={38} />
                <View style={styles.grow}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {d.song.title}
                  </Text>
                  <Text style={[styles.mono, styles.mute]} numberOfLines={1}>
                    {up(d.song.artist)}
                  </Text>
                </View>
              </View>
            ))}
          </Section>
        </Animated.View>
      )}

      {insights.length > 0 && (
        <Animated.View entering={FadeIn.duration(500)}>
          <Section>
            <Label>{t('gunluk.week.sky')}</Label>
            <View style={styles.stack}>
              {insights.map((t) => (
                <Text key={t} style={styles.insight}>
                  {t}
                </Text>
              ))}
            </View>
          </Section>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  centerText: { textAlign: 'center' },
  h1: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 44, letterSpacing: -0.34, color: colors.fg },
  cardWrap: { marginTop: 22 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 20 },
  next: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.mute, marginTop: 16 },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 22, rowGap: 10, marginTop: 14 },
  replay: { color: colors.mute },
  newBottle: { color: colors.fg },
  spark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  dot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.black, marginHorizontal: 4.5 },
  sparkLabel: { width: 86, fontFamily: fonts.serif, fontSize: 15, lineHeight: 20, color: colors.fg },
  sparkChart: { flex: 1, height: SPARK_H },
  sparkVal: { width: 32, fontFamily: fonts.mono, fontSize: 11, textAlign: 'right', color: colors.fg },
  stack: { gap: 14 },
  lead: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 32, color: colors.fg },
  para: { fontSize: 14.5, lineHeight: 23, color: colors.body, marginTop: 10 },
  grow: { flex: 1 },
  mono: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.fg },
  mute: { color: colors.mute },
  onDark: { color: colors.white },
  onDarkMute: { color: colors.spaceMute, marginTop: 6 },
  weekSong: { backgroundColor: colors.black, padding: 22 },
  weekSongBody: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 },
  weekSongTitle: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 31, color: colors.white },
  picked: { marginTop: 10 },
  weekLinks: { marginTop: 18 },
  listLabel: { marginTop: 26 },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  songDay: { width: 34 },
  songTitle: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 21, color: colors.fg },
  insight: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 26, color: colors.fg },
});
