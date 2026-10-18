import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { FormScreen } from '@/components/FormScreen';
import { useOnboarding } from '@/lib/onboarding';

const rakam = (t: string) => t.replace(/\D/g, '').slice(0, 2);
const iki = (t: string) => t.padStart(2, '0');

export default function DogumSaatiScreen() {
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const [saat0 = '', dakika0 = ''] = (draft.birthTime ?? '').split(':');
  const [saat, setSaat] = useState(saat0);
  const [dakika, setDakika] = useState(dakika0);

  const gecerli =
    saat.length > 0 && dakika.length > 0 && Number(saat) <= 23 && Number(dakika) <= 59;
  const dolu = saat.length > 0 && dakika.length > 0;

  function next() {
    if (!gecerli) return;
    update({ birthTime: `${iki(saat)}:${iki(dakika)}` });
    router.push('/dogum-yeri');
  }

  function bilmiyorum() {
    update({ birthTime: null });
    router.push('/dogum-yeri');
  }

  return (
    <FormScreen
      eyebrow="Adım 4 / 6"
      title="Kaçta doğdun?"
      subtitle="Yükselen burcun ve evlerin saate bağlı. Bilmiyorsan sorun değil."
      footer={
        <>
          <Button onPress={next} disabled={!gecerli}>
            Devam
          </Button>
          <Button variant="ghost" onPress={bilmiyorum}>
            Bilmiyorum
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            Geri
          </Button>
        </>
      }
    >
      <View style={styles.row}>
        <View style={styles.cell}>
          <Field
            label="Saat"
            value={saat}
            onChangeText={(t) => setSaat(rakam(t))}
            keyboardType="number-pad"
            placeholder="SS"
            autoFocus
            maxLength={2}
          />
        </View>
        <View style={styles.cell}>
          <Field
            label="Dakika"
            value={dakika}
            onChangeText={(t) => setDakika(rakam(t))}
            keyboardType="number-pad"
            placeholder="DD"
            maxLength={2}
            note={dolu && !gecerli ? '24 saat biçiminde yaz, örn. 14 : 30.' : undefined}
          />
        </View>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 20 },
  cell: { flex: 1 },
});
