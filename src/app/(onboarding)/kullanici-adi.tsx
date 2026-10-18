import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { FormScreen } from '@/components/FormScreen';
import { useOnboarding } from '@/lib/onboarding';
import { supabase } from '@/lib/supabase';

const HANDLE_RE = /^[a-z0-9_.]{3,20}$/;

/** Başındaki @ atılır, küçük harfe çevrilir; izin verilmeyen karakterler düşer. */
function cleanHandle(raw: string): string {
  return raw.replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9_.]/g, '');
}

type Durum = 'bos' | 'gecersiz' | 'kontrol' | 'musait' | 'dolu' | 'hata';

const NOTLAR: Record<Durum, string> = {
  bos: '3–20 karakter: harf, rakam, nokta, alt çizgi.',
  gecersiz: 'En az 3 karakter olmalı.',
  kontrol: 'Kontrol ediliyor…',
  musait: 'Müsait.',
  dolu: 'Bu kullanıcı adı alınmış.',
  hata: 'Kontrol edilemedi. Bağlantını kontrol et.',
};

export default function KullaniciAdiScreen() {
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const [handle, setHandle] = useState(draft.handle);
  const [durum, setDurum] = useState<Durum>(draft.handle ? 'kontrol' : 'bos');

  useEffect(() => {
    if (!handle) return setDurum('bos');
    if (!HANDLE_RE.test(handle)) return setDurum('gecersiz');
    setDurum('kontrol');
    let iptal = false;
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc('handle_available', { p_handle: handle });
      if (iptal) return;
      setDurum(error ? 'hata' : data ? 'musait' : 'dolu');
    }, 400);
    return () => {
      iptal = true;
      clearTimeout(t);
    };
  }, [handle]);

  function next() {
    update({ handle });
    router.push('/dogum-tarihi');
  }

  return (
    <FormScreen
      eyebrow="Adım 2 / 5"
      title="Bir kullanıcı adı seç."
      subtitle="Arkadaşların seni bununla bulur."
      footer={
        <>
          <Button onPress={next} disabled={durum !== 'musait'}>
            Devam
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            Geri
          </Button>
        </>
      }
    >
      <Field
        label="Kullanıcı adı"
        value={handle ? `@${handle}` : ''}
        onChangeText={(t) => setHandle(cleanHandle(t))}
        placeholder="@kullanici"
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={21}
        note={NOTLAR[durum]}
        onSubmitEditing={durum === 'musait' ? next : undefined}
      />
    </FormScreen>
  );
}
