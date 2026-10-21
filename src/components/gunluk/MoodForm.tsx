import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { MoodSlider } from '@/components/gunluk/MoodSlider';
import { SongArt } from '@/components/music/SongArt';
import { SongPicker } from '@/components/music/SongPicker';
import { Label, Section } from '@/components/Section';
import { useTranslation } from '@/i18n';
import { moodName } from '@/i18n/names';
import { MOODS } from '@/lib/bottle';
import type { MoodEntry, MoodValues } from '@/lib/bottle';
import { locale } from '@/i18n/lang';
import type { Song } from '@/lib/song-utils';
import { colors, fonts } from '@/theme';

const initial = Object.fromEntries(MOODS.map(([f]) => [f, 5])) as MoodValues;

type Props = {
  /** Örn. "PAZ 18 EKİ". */
  dateLabel: string;
  onSave: (entry: MoodEntry) => Promise<boolean>;
};

/** Akşam duygu kaydı: 6 duygu için 0–10 puan, kısa not ve isteğe bağlı günün şarkısı. */
export function MoodForm({ dateLabel, onSave }: Props) {
  const { t } = useTranslation();
  const [values, setValues] = useState<MoodValues>(initial);
  const [note, setNote] = useState('');
  const [song, setSong] = useState<Song | null>(null);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function submit() {
    setSaving(true);
    setFailed(false);
    const ok = await onSave({ values, note: note.slice(0, 280), song });
    // Başarılıysa form kalkar; yalnızca başarısızlıkta düğmeyi geri aç.
    if (!ok) {
      setFailed(true);
      setSaving(false);
    }
  }

  return (
    <Section>
      <Label>{t('gunluk.mood.label', { date: dateLabel })}</Label>
      <Text style={styles.h1}>{t('gunluk.mood.title')}</Text>
      <View style={styles.rows}>
        {MOODS.map(([f]) => (
          <View key={f} style={styles.row}>
            <View style={styles.dot} />
            <Text style={styles.label}>{moodName(f)}</Text>
            <View style={styles.slider}>
              <MoodSlider label={moodName(f)} value={values[f]} onChange={(v) => setValues((s) => ({ ...s, [f]: v }))} />
            </View>
            <Text style={styles.value}>{values[f]}</Text>
          </View>
        ))}
      </View>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={t('gunluk.mood.placeholder')}
        placeholderTextColor={colors.faint}
        selectionColor={colors.black}
        maxLength={280}
        multiline
        style={styles.note}
      />
      <View style={styles.songBox}>
        <Text style={styles.songLbl}>{t('music.ofDay').toLocaleUpperCase(locale())}</Text>
        {song ? (
          <View style={styles.songRow}>
            <SongArt song={song} size={44} />
            <View style={styles.grow}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {song.title}
              </Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {song.artist.toLocaleUpperCase(locale())}
              </Text>
            </View>
            <Pressable onPress={() => setPicking(true)} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.songAction}>{t('music.change')}</Text>
            </Pressable>
            <Pressable onPress={() => setSong(null)} accessibilityRole="button" accessibilityLabel={t('music.remove')} hitSlop={8}>
              <Text style={styles.songAction}>✕</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setPicking(true)} accessibilityRole="button" style={styles.songAdd}>
            <Text style={styles.songAddText}>{t('music.add')}</Text>
            <Text style={styles.optional}>{t('music.optional')}</Text>
          </Pressable>
        )}
      </View>
      {failed && <Text style={styles.error}>{t('gunluk.mood.error')}</Text>}
      <View style={styles.save}>
        <Button onPress={submit} loading={saving}>
          {t('gunluk.mood.put')}
        </Button>
      </View>
      <SongPicker
        visible={picking}
        title={t('music.ofDay')}
        onPick={(s) => {
          setSong(s);
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 44, letterSpacing: -0.34, color: colors.fg, marginBottom: 12 },
  rows: { marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  dot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.black, marginHorizontal: 6.5 },
  label: { width: 92, fontFamily: fonts.serif, fontSize: 16, lineHeight: 24, color: colors.fg },
  slider: { flex: 1 },
  value: { width: 24, fontFamily: fonts.mono, fontSize: 12, textAlign: 'right', color: colors.fg },
  note: {
    marginTop: 10,
    minHeight: 40,
    paddingVertical: 10,
    paddingHorizontal: 0,
    fontSize: 14,
    color: colors.fg,
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
  },
  songBox: { marginTop: 22 },
  songLbl: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.mute, marginBottom: 10 },
  songRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1 },
  songTitle: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 23, color: colors.fg },
  songArtist: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1, color: colors.mute, marginTop: 2 },
  songAction: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.2, color: colors.fg, textDecorationLine: 'underline' },
  songAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  songAddText: { fontFamily: fonts.serif, fontSize: 16, color: colors.fg },
  optional: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.1, color: colors.faint },
  error: { fontSize: 13, color: colors.fg, marginTop: 14 },
  save: { marginTop: 18, alignSelf: 'flex-start' },
});
