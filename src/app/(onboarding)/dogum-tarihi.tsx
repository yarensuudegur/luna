import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { FormScreen } from '@/components/FormScreen';
import { useOnboarding } from '@/lib/onboarding';

const rakam = (t: string, n: number) => t.replace(/\D/g, '').slice(0, n);
const iki = (n: number) => String(n).padStart(2, '0');

/** Gün/ay/yıl gerçek bir geçmiş tarih mi? Geçerliyse "YYYY-MM-DD" döner. */
function toIso(g: string, a: string, y: string): string | null {
  if (!g || !a || y.length !== 4) return null;
  const day = Number(g);
  const month = Number(a);
  const year = Number(y);
  const d = new Date(year, month - 1, day);
  const gercek = d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
  if (!gercek || year < 1900 || d > new Date()) return null;
  return `${y}-${iki(month)}-${iki(day)}`;
}

export default function DogumTarihiScreen() {
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const [yil0 = '', ay0 = '', gun0 = ''] = draft.birthDate.split('-');
  const [gun, setGun] = useState(gun0);
  const [ay, setAy] = useState(ay0);
  const [yil, setYil] = useState(yil0);

  const iso = toIso(gun, ay, yil);
  const eksiksiz = gun.length > 0 && ay.length > 0 && yil.length === 4;

  function next() {
    if (!iso) return;
    update({ birthDate: iso });
    router.push('/dogum-saati');
  }

  return (
    <FormScreen
      eyebrow="Adım 3 / 6"
      title="Hangi gün doğdun?"
      subtitle="Güneş burcun ve haritanın temeli bu tarih."
      footer={
        <>
          <Button onPress={next} disabled={!iso}>
            Devam
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            Geri
          </Button>
        </>
      }
    >
      <View style={styles.row}>
        <View style={styles.small}>
          <Field
            label="Gün"
            value={gun}
            onChangeText={(t) => setGun(rakam(t, 2))}
            keyboardType="number-pad"
            placeholder="GG"
            autoFocus
            maxLength={2}
          />
        </View>
        <View style={styles.small}>
          <Field
            label="Ay"
            value={ay}
            onChangeText={(t) => setAy(rakam(t, 2))}
            keyboardType="number-pad"
            placeholder="AA"
            maxLength={2}
          />
        </View>
        <View style={styles.wide}>
          <Field
            label="Yıl"
            value={yil}
            onChangeText={(t) => setYil(rakam(t, 4))}
            keyboardType="number-pad"
            placeholder="YYYY"
            maxLength={4}
            note={eksiksiz && !iso ? 'Geçerli bir tarih yaz.' : undefined}
          />
        </View>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 20 },
  small: { flex: 1 },
  wide: { flex: 1.6 },
});
