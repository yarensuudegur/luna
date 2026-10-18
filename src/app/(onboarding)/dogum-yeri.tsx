import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { FormScreen } from '@/components/FormScreen';
import { useAuth } from '@/lib/auth';
import { cityLabel, searchCities } from '@/lib/cities';
import type { City } from '@/lib/cities';
import { useOnboarding } from '@/lib/onboarding';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

const UNIQUE_VIOLATION = '23505';

export default function DogumYeriScreen() {
  const router = useRouter();
  const { session, refreshProfile } = useAuth();
  const { draft, update } = useOnboarding();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<City | null>(draft.place);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = useMemo(() => searchCities(query), [query]);

  async function finish() {
    if (!selected || !session) return;
    setBusy(true);
    setError(null);
    update({ place: selected });
    const { error: err } = await supabase.from('profiles').upsert({
      id: session.user.id,
      name: draft.name,
      handle: draft.handle,
      birth_date: draft.birthDate,
      birth_time: draft.birthTime,
      birth_time_known: draft.birthTime !== null,
      birth_place: cityLabel(selected),
      lat: selected.lat,
      lon: selected.lon,
      timezone: selected.tz,
    });
    if (err) {
      setError(
        err.code === UNIQUE_VIOLATION
          ? 'Bu kullanıcı adı az önce başkası tarafından alındı. Geri dönüp yenisini seç.'
          : 'Kaydedilemedi. Bağlantını kontrol edip tekrar dene.',
      );
      setBusy(false);
      return;
    }
    // Profil tamamlanınca kök düzen seni otomatik olarak sekmelere taşır.
    await refreshProfile();
    setBusy(false);
  }

  return (
    <FormScreen
      scroll={false}
      eyebrow="Adım 5 / 5"
      title="Nerede doğdun?"
      subtitle="Gökyüzünü doğduğun şehre göre hesaplarız."
      footer={
        <>
          <Button onPress={finish} disabled={!selected} loading={busy}>
            Bitir
          </Button>
          <Button variant="ghost" onPress={() => router.back()} disabled={busy}>
            Geri
          </Button>
        </>
      }
    >
      <Field
        label="Şehir ara"
        value={query}
        onChangeText={setQuery}
        placeholder="İstanbul, Londra…"
        autoCorrect={false}
        note={error ?? undefined}
      />
      <FlatList
        style={styles.list}
        data={results}
        keyExtractor={(c) => `${c.name}-${c.country}`}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>Bu aramayla şehir bulunamadı.</Text>}
        renderItem={({ item }) => {
          const on = selected?.name === item.name && selected.country === item.country;
          return (
            <Pressable
              onPress={() => setSelected(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.row, on && styles.rowOn]}
            >
              <Text style={[styles.city, on && styles.textOn]}>{item.name}</Text>
              <Text style={[styles.country, on && styles.textOn]}>
                {item.country.toLocaleUpperCase('tr')}
              </Text>
            </Pressable>
          );
        }}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, marginTop: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowOn: { backgroundColor: colors.fg },
  city: { fontFamily: fonts.serif, fontSize: 20, color: colors.fg },
  country: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.2, color: colors.mute },
  textOn: { color: colors.white },
  empty: { paddingVertical: 24, textAlign: 'center', color: colors.mute },
});
