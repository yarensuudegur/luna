import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { MoodSlider } from '@/components/gunluk/MoodSlider';
import { Label, Section } from '@/components/Section';
import { useTranslation } from '@/i18n';
import { moodName } from '@/i18n/names';
import { MOODS } from '@/lib/bottle';
import type { MoodEntry, MoodValues } from '@/lib/bottle';
import { colors, fonts } from '@/theme';

const initial = Object.fromEntries(MOODS.map(([f]) => [f, 5])) as MoodValues;

type Props = {
  /** Örn. "PAZ 18 EKİ". */
  dateLabel: string;
  onSave: (entry: MoodEntry) => Promise<boolean>;
  /** Demo: kaydırıcılar bu değerlere kendiliğinden gider, not yazılır ve form gönderilir. */
  autoplay?: MoodEntry;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Akşam duygu kaydı: 6 duygu için 0–10 puan ve kısa not. */
export function MoodForm({ dateLabel, onSave, autoplay }: Props) {
  const { t } = useTranslation();
  const [values, setValues] = useState<MoodValues>(initial);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const submitRef = useRef<() => void>(() => {});

  // Demo: duygular tek tek ayarlanır, not harf harf yazılır, sonra "Şişeye koy" basılır.
  useEffect(() => {
    if (!autoplay) return;
    let alive = true;
    void (async () => {
      await sleep(800);
      for (const [f] of MOODS) {
        const target = autoplay.values[f];
        let v = initial[f];
        while (alive && v !== target) {
          v += target > v ? 1 : -1;
          const next = v;
          setValues((s) => ({ ...s, [f]: next }));
          await sleep(70);
        }
        await sleep(160);
      }
      for (let i = 1; alive && i <= autoplay.note.length; i++) {
        setNote(autoplay.note.slice(0, i));
        await sleep(35);
      }
      await sleep(700);
      if (alive) submitRef.current();
    })();
    return () => {
      alive = false;
    };
  }, [autoplay]);

  async function submit() {
    setSaving(true);
    setFailed(false);
    const ok = await onSave({ values, note: note.slice(0, 280) });
    // Başarılıysa form kalkar; yalnızca başarısızlıkta düğmeyi geri aç.
    if (!ok) {
      setFailed(true);
      setSaving(false);
    }
  }

  submitRef.current = () => void submit();

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
      {failed && <Text style={styles.error}>{t('gunluk.mood.error')}</Text>}
      <View style={styles.save}>
        <Button onPress={submit} loading={saving}>
          {t('gunluk.mood.put')}
        </Button>
      </View>
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
  error: { fontSize: 13, color: colors.fg, marginTop: 14 },
  save: { marginTop: 18, alignSelf: 'flex-start' },
});
