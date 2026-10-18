import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/lib/auth';
import { colors, fonts, layout } from '@/theme';

export default function BugunScreen() {
  const { profile } = useAuth();
  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text style={styles.title}>BUGÜN</Text>
        <Avatar avatar={profile?.avatar} size={112} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: layout.screenPadding, paddingTop: 28 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontFamily: fonts.serif, fontSize: 34, color: colors.fg },
});
