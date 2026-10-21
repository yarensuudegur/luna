import { Image, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Song } from '@/lib/songs';
import { colors } from '@/theme';

type Props = {
  song: Song;
  size: number;
  /** Yuvarlak (plak gibi) ya da kare kapak. */
  round?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Albüm kapağı. Luna'da renk olmadığı için kapak gri tonlara çevrilir (üstündeki gri katman
 * "saturation" karışımıyla rengi siler). Kapağı olmayan şarkı siyah bir plak olarak çizilir.
 */
export function SongArt({ song, size, round, style }: Props) {
  const radius = round ? size / 2 : 0;
  if (!song.art) return <Vinyl size={size} style={style} />;
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }, style]}>
      <Image source={{ uri: song.art }} style={styles.fill} accessibilityIgnoresInvertColors />
      <View style={[styles.fill, styles.gray]} pointerEvents="none" />
    </View>
  );
}

/** Kapaksız şarkılar için plak: siyah daire, ince oluklar, ortada beyaz etiket. */
export function Vinyl({ size, style }: { size: number; style?: StyleProp<ViewStyle> }) {
  const ring = (f: number) => ({
    width: size * f,
    height: size * f,
    borderRadius: (size * f) / 2,
  });
  return (
    <View style={[styles.vinyl, ring(1), style]}>
      <View style={[styles.groove, ring(0.82)]} />
      <View style={[styles.groove, ring(0.64)]} />
      <View style={[styles.label, ring(0.34)]}>
        <View style={[styles.hole, ring(0.06)]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.tint },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gray: { backgroundColor: colors.mute, mixBlendMode: 'saturation' },
  vinyl: { backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  groove: { position: 'absolute', borderWidth: 1, borderColor: colors.spaceButton },
  label: { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  hole: { backgroundColor: colors.black },
});
