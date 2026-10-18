import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { colors, fonts, layout } from '@/theme';

// Geçici ekran: profil bilgilerini gösterir ve çıkış yapmayı sağlar.
export default function SenScreen() {
  const { session, profile, signOut } = useAuth();

  const satirlar: ReadonlyArray<readonly [string, string]> = [
    ['Ad', profile?.name ?? '—'],
    ['Kullanıcı adı', profile?.handle ? `@${profile.handle}` : '—'],
    ['E-posta', session?.user.email ?? '—'],
    ['Doğum tarihi', profile?.birth_date ?? '—'],
    ['Doğum saati', profile?.birth_time_known ? (profile.birth_time ?? '—').slice(0, 5) : 'Bilinmiyor'],
    ['Doğum yeri', profile?.birth_place ?? '—'],
    ['Koordinat', profile?.lat != null && profile.lon != null ? `${profile.lat}, ${profile.lon}` : '—'],
    ['Saat dilimi', profile?.timezone ?? '—'],
  ];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>SEN</Text>
        {satirlar.map(([etiket, deger]) => (
          <View key={etiket} style={styles.row}>
            <Text style={styles.label}>{etiket.toLocaleUpperCase('tr')}</Text>
            <Text style={styles.value}>{deger}</Text>
          </View>
        ))}
        <View style={styles.action}>
          <Button variant="ghost" onPress={signOut}>
            Çıkış yap
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: layout.screenPadding, paddingTop: 28, paddingBottom: 32 },
  title: { fontFamily: fonts.serif, fontSize: 34, color: colors.fg, marginBottom: 12 },
  row: {
    paddingVertical: 14,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  label: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.4, color: colors.mute },
  value: { marginTop: 4, fontSize: 16, color: colors.fg },
  action: { marginTop: 28 },
});
