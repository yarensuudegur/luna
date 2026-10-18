import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { useAuth } from '@/lib/auth';
import { cityLabel } from '@/lib/cities';
import { useOnboarding } from '@/lib/onboarding';
import { askPermission } from '@/lib/reminder-native';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme';

const UNIQUE_VIOLATION = '23505';

export default function BildirimScreen() {
  const router = useRouter();
  const { session, refreshProfile } = useAuth();
  const { draft } = useOnboarding();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish(askFirst: boolean) {
    const place = draft.place;
    if (!place || !session) return;
    setBusy(true);
    setError(null);
    // Reddedilirse uygulama bildirimsiz çalışır; Ayarlar'da durum görünür.
    if (askFirst) await askPermission();
    const { error: err } = await supabase.from('profiles').upsert({
      id: session.user.id,
      name: draft.name,
      handle: draft.handle,
      birth_date: draft.birthDate,
      birth_time: draft.birthTime,
      birth_time_known: draft.birthTime !== null,
      birth_place: cityLabel(place),
      lat: place.lat,
      lon: place.lon,
      timezone: place.tz,
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
      eyebrow="Adım 6 / 6"
      title="Sana nazikçe hatırlatalım mı?"
      subtitle="Akşamları duygularını şişene eklemeni, istersen yeni kartın hazır olduğunu haber verebiliriz. Başka bildirim göndermeyiz. İstediğin zaman Ayarlar'dan değiştirebilirsin."
      footer={
        <>
          <Button onPress={() => finish(true)} loading={busy}>
            İzin ver ve bitir
          </Button>
          <Button variant="ghost" onPress={() => finish(false)} disabled={busy}>
            Şimdi değil
          </Button>
          <Button variant="ghost" onPress={() => router.back()} disabled={busy}>
            Geri
          </Button>
        </>
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  error: { marginTop: 24, fontSize: 13, lineHeight: 18, color: colors.fg },
});
