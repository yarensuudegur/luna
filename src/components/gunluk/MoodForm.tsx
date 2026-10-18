import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { MoodSlider } from '@/components/gunluk/MoodSlider';
import { Label, Section } from '@/components/Section';
import { MOODS } from '@/lib/bottle';
import type { MoodEntry, MoodValues } from '@/lib/bottle';
import { colors, fonts } from '@/theme';

const initial = Object.fromEntries(MOODS.map(([f]) => [f, 5])) as MoodValues;

type Props = {
  /** Örn. "PAZ 18 EKİ". */
  dateLabel: string;
  onSave: (entry: MoodEntry) => Promise<boolean>;
};

/** Akşam duygu kaydı: 6 duygu için 0–10 puan ve kısa not. */
export function MoodForm({ dateLabel, onSave }: Props) {
  const [values, setValues] = useState<MoodValues>(initial);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

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

  return (
    <Section>
      <Label>{`Bugün · ${dateLabel}`}</Label>
      <Text style={styles.h1}>Bugün nasıl hissettin?</Text>
      <View style={styles.rows}>
        {MOODS.map(([f, label]) => (
          <View key={f} style={styles.row}>
            <View style={styles.dot} />
            <Text style={styles.label}>{label}</Text>
            <View style={styles.slider}>
              <MoodSlider label={label} value={values[f]} onChange={(v) => setValues((s) => ({ ...s, [f]: v }))} />
            </View>
            <Text style={styles.value}>{values[f]}</Text>
          </View>
        ))}
      </View>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Bugün ne oldu?"
        placeholderTextColor={colors.faint}
        selectionColor={colors.fg}
        maxLength={280}
        multiline
        style={styles.note}
      />
      {failed && <Text style={styles.error}>Kaydedilemedi. Bağlantını kontrol edip tekrar dene.</Text>}
      <View style={styles.save}>
        <Button onPress={submit} loading={saving}>
          Şişeye koy
        </Button>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 44, letterSpacing: -0.34, color: colors.fg, marginBottom: 12 },
  rows: { marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  dot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.fg, marginHorizontal: 6.5 },
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
    borderBottomColor: colors.fg,
  },
  error: { fontSize: 13, color: colors.fg, marginTop: 14 },
  save: { marginTop: 18, alignSelf: 'flex-start' },
});
