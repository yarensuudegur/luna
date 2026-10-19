import type { ModalProps } from 'react-native';
import { Modal, Platform, StyleSheet, View } from 'react-native';
import { FRAME_MAX_WIDTH } from '@/lib/use-frame-width';
import { colors } from '@/theme';

/**
 * React Native Modal'ı. Telefonda aynısıdır. Masaüstü webde modal tüm pencereyi
 * kaplamasın diye içerik uygulamanın telefon genişliğindeki çerçevesine sığdırılır;
 * tam ekran modallerde çerçevenin dışı karartılır.
 */
export function AppModal({ children, transparent, ...rest }: ModalProps) {
  if (Platform.OS !== 'web') {
    return (
      <Modal transparent={transparent} {...rest}>
        {children}
      </Modal>
    );
  }
  return (
    <Modal transparent {...rest}>
      <View style={[styles.outer, !transparent && styles.dim]}>
        <View style={[styles.frame, !transparent && styles.opaque]}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center' },
  dim: { backgroundColor: colors.backdropStrong },
  frame: { flex: 1, width: '100%', maxWidth: FRAME_MAX_WIDTH, overflow: 'hidden' },
  opaque: { backgroundColor: colors.bg },
});
