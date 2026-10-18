import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { FormScreen } from '@/components/FormScreen';
import { useTranslation } from '@/i18n';
import { locale } from '@/i18n/lang';
import { searchCities } from '@/lib/cities';
import type { City } from '@/lib/cities';
import { useOnboarding } from '@/lib/onboarding';
import { colors, fonts } from '@/theme';

/**
 * Doğum tarihi, saati ve yeri adımları. Hem ilk kayıtta (onboarding) hem de Ayarlar'dan
 * doğum bilgilerini düzenlerken aynen kullanılır.
 */

type StepProps = {
  /** Başlığın üstündeki küçük etiket, örn. "Adım 3 / 6". */
  eyebrow: string;
  onNext: () => void;
  onBack: () => void;
  /** Geri düğmesinin yazısı; varsayılan "Geri". */
  backLabel?: string;
};

const digits = (t: string, n: number) => t.replace(/\D/g, '').slice(0, n);
const two = (n: number | string) => String(n).padStart(2, '0');

/** Gün/ay/yıl gerçek bir geçmiş tarih mi? Geçerliyse "YYYY-MM-DD" döner. */
function toIso(g: string, a: string, y: string): string | null {
  if (!g || !a || y.length !== 4) return null;
  const day = Number(g);
  const month = Number(a);
  const year = Number(y);
  const d = new Date(year, month - 1, day);
  const real = d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
  if (!real || year < 1900 || d > new Date()) return null;
  return `${y}-${two(month)}-${two(day)}`;
}

export function BirthDateStep({ eyebrow, onNext, onBack, backLabel }: StepProps) {
  const { t } = useTranslation();
  const { draft, update } = useOnboarding();
  const [year0 = '', month0 = '', day0 = ''] = draft.birthDate.split('-');
  const [day, setDay] = useState(day0);
  const [month, setMonth] = useState(month0);
  const [year, setYear] = useState(year0);

  const iso = toIso(day, month, year);
  const complete = day.length > 0 && month.length > 0 && year.length === 4;

  function next() {
    if (!iso) return;
    update({ birthDate: iso });
    onNext();
  }

  return (
    <FormScreen
      eyebrow={eyebrow}
      title={t('onboarding.dateTitle')}
      subtitle={t('onboarding.dateSubtitle')}
      footer={
        <>
          <Button onPress={next} disabled={!iso}>
            {t('common.continue')}
          </Button>
          <Button variant="ghost" onPress={onBack}>
            {backLabel ?? t('common.back')}
          </Button>
        </>
      }
    >
      <View style={styles.row}>
        <View style={styles.small}>
          <Field
            label={t('onboarding.day')}
            value={day}
            onChangeText={(v) => setDay(digits(v, 2))}
            keyboardType="number-pad"
            placeholder={t('onboarding.dayPh')}
            autoFocus
            maxLength={2}
          />
        </View>
        <View style={styles.small}>
          <Field
            label={t('onboarding.month')}
            value={month}
            onChangeText={(v) => setMonth(digits(v, 2))}
            keyboardType="number-pad"
            placeholder={t('onboarding.monthPh')}
            maxLength={2}
          />
        </View>
        <View style={styles.wide}>
          <Field
            label={t('onboarding.year')}
            value={year}
            onChangeText={(v) => setYear(digits(v, 4))}
            keyboardType="number-pad"
            placeholder={t('onboarding.yearPh')}
            maxLength={4}
            note={complete && !iso ? t('onboarding.dateInvalid') : undefined}
          />
        </View>
      </View>
    </FormScreen>
  );
}

export function BirthTimeStep({ eyebrow, onNext, onBack, backLabel }: StepProps) {
  const { t } = useTranslation();
  const { draft, update } = useOnboarding();
  const [hour0 = '', minute0 = ''] = (draft.birthTime ?? '').split(':');
  const [hour, setHour] = useState(hour0);
  const [minute, setMinute] = useState(minute0);

  const filled = hour.length > 0 && minute.length > 0;
  const valid = filled && Number(hour) <= 23 && Number(minute) <= 59;

  function next() {
    if (!valid) return;
    update({ birthTime: `${two(hour)}:${two(minute)}` });
    onNext();
  }

  function dontKnow() {
    update({ birthTime: null });
    onNext();
  }

  return (
    <FormScreen
      eyebrow={eyebrow}
      title={t('onboarding.timeTitle')}
      subtitle={t('onboarding.timeSubtitle')}
      footer={
        <>
          <Button onPress={next} disabled={!valid}>
            {t('common.continue')}
          </Button>
          <Button variant="ghost" onPress={dontKnow}>
            {t('onboarding.dontKnow')}
          </Button>
          <Button variant="ghost" onPress={onBack}>
            {backLabel ?? t('common.back')}
          </Button>
        </>
      }
    >
      <View style={styles.row}>
        <View style={styles.cell}>
          <Field
            label={t('onboarding.hour')}
            value={hour}
            onChangeText={(v) => setHour(digits(v, 2))}
            keyboardType="number-pad"
            placeholder={t('onboarding.hourPh')}
            autoFocus
            maxLength={2}
          />
        </View>
        <View style={styles.cell}>
          <Field
            label={t('onboarding.minute')}
            value={minute}
            onChangeText={(v) => setMinute(digits(v, 2))}
            keyboardType="number-pad"
            placeholder={t('onboarding.minutePh')}
            maxLength={2}
            note={filled && !valid ? t('onboarding.timeInvalid') : undefined}
          />
        </View>
      </View>
    </FormScreen>
  );
}

type PlaceProps = Omit<StepProps, 'onNext'> & {
  /** Seçilen şehirle çağrılır. */
  onNext: (place: City) => void;
  /** Devam düğmesinin yazısı; varsayılan "Devam". */
  nextLabel?: string;
  loading?: boolean;
  /** Düğmenin üstünde gösterilen hata. */
  error?: string | null;
};

export function BirthPlaceStep({ eyebrow, onNext, onBack, backLabel, nextLabel, loading, error }: PlaceProps) {
  const { t } = useTranslation();
  const { draft, update } = useOnboarding();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<City | null>(draft.place);

  const results = useMemo(() => searchCities(query), [query]);

  function next() {
    if (!selected) return;
    update({ place: selected });
    onNext(selected);
  }

  return (
    <FormScreen
      scroll={false}
      eyebrow={eyebrow}
      title={t('onboarding.placeTitle')}
      subtitle={t('onboarding.placeSubtitle')}
      footer={
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button onPress={next} disabled={!selected} loading={loading}>
            {nextLabel ?? t('common.continue')}
          </Button>
          <Button variant="ghost" onPress={onBack} disabled={loading}>
            {backLabel ?? t('common.back')}
          </Button>
        </>
      }
    >
      <Field
        label={t('onboarding.citySearch')}
        value={query}
        onChangeText={setQuery}
        placeholder={t('onboarding.cityPlaceholder')}
        autoCorrect={false}
      />
      <FlatList
        style={styles.list}
        data={results}
        keyExtractor={(c) => `${c.name}-${c.country}`}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>{t('onboarding.noCity')}</Text>}
        renderItem={({ item }) => {
          const on = selected?.name === item.name && selected.country === item.country;
          return (
            <Pressable
              onPress={() => setSelected(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.place, on && styles.placeOn]}
            >
              <Text style={[styles.city, on && styles.textOn]}>{item.name}</Text>
              <Text style={[styles.country, on && styles.textOn]}>{item.country.toLocaleUpperCase(locale())}</Text>
            </Pressable>
          );
        }}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 20 },
  cell: { flex: 1 },
  small: { flex: 1 },
  wide: { flex: 1.6 },
  list: { flex: 1, marginTop: 8 },
  place: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  placeOn: { backgroundColor: colors.black },
  city: { fontFamily: fonts.serif, fontSize: 20, color: colors.fg },
  country: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.2, color: colors.mute },
  textOn: { color: colors.white },
  empty: { paddingVertical: 24, textAlign: 'center', color: colors.body },
  error: { fontSize: 13, lineHeight: 18, color: colors.fg, paddingBottom: 4 },
});
