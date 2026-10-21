import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { appleUrl, spotifyUrl } from '@/lib/songs';
import type { Song } from '@/lib/songs';
import { colors, fonts } from '@/theme';

type Props = { song: Song; light?: boolean; style?: StyleProp<ViewStyle> };

/** Şarkıyı Spotify ya da Apple Music'te açan iki küçük bağlantı. */
export function SongLinks({ song, light, style }: Props) {
  const open = (url: string) => void Linking.openURL(url).catch(() => {});
  return (
    <View style={[styles.row, style]}>
      <Pressable onPress={() => open(spotifyUrl(song))} accessibilityRole="link" hitSlop={8}>
        <Text style={[styles.link, light && styles.light]}>SPOTIFY ↗</Text>
      </Pressable>
      <Pressable onPress={() => open(appleUrl(song))} accessibilityRole="link" hitSlop={8}>
        <Text style={[styles.link, light && styles.light]}>APPLE MUSIC ↗</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 18 },
  link: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.2, color: colors.fg, textDecorationLine: 'underline' },
  light: { color: colors.white },
});
