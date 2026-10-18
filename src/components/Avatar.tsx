import { Image, StyleSheet, View } from 'react-native';
import { avatarSource } from '@/lib/avatars';
import { colors } from '@/theme';

type Props = {
  avatar: string | null | undefined;
  size: number;
  /** Prototipteki gibi büst, zeminle çarpılıp çerçevesiz görünür. */
  blend?: boolean;
};

export function Avatar({ avatar, size, blend = true }: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.img, blend && styles.multiply]}>
        <Image
          source={avatarSource(avatar)}
          accessibilityLabel="Profil fotoğrafı"
          style={[styles.img, { transform: [{ scale: 1.14 }, { translateY: size * 0.04 }] }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.tint },
  img: { width: '100%', height: '100%' },
  multiply: { mixBlendMode: 'multiply' },
});
