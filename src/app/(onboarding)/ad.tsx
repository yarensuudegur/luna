import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { FormScreen } from '@/components/FormScreen';
import { useOnboarding } from '@/lib/onboarding';

export default function AdScreen() {
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const [name, setName] = useState(draft.name);
  const clean = name.trim();

  function next() {
    update({ name: clean });
    router.push('/kullanici-adi');
  }

  return (
    <FormScreen
      eyebrow="Adım 1 / 6"
      title="Sana nasıl seslenelim?"
      subtitle="Arkadaşların seni bu adla görecek."
      footer={
        <Button onPress={next} disabled={clean.length < 2}>
          Devam
        </Button>
      }
    >
      <Field
        label="Adın"
        value={name}
        onChangeText={setName}
        autoFocus
        autoCapitalize="words"
        autoComplete="given-name"
        maxLength={40}
        onSubmitEditing={clean.length >= 2 ? next : undefined}
      />
    </FormScreen>
  );
}
