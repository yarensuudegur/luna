import { locale } from '@/i18n/lang';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppModal } from '@/components/AppModal';
import { Button } from '@/components/Button';
import { Initial } from '@/components/arkadaslar/Initial';
import { useTranslation } from '@/i18n';
import { MAX_GROUP_NAME } from '@/lib/room-utils';
import { colors, fonts, layout } from '@/theme';

export type Person = { id: string; name: string };

type Props = {
  visible: boolean;
  /** null: yeni grup. */
  group: { id: string; name: string; memberIds: string[]; canDelete: boolean } | null;
  /** Seçilebilecek kişiler: arkadaşların ve gruptaki öteki üyeler. Sen listede yoksun. */
  people: Person[];
  onClose: () => void;
  /** Kayıt başarısızsa false dönülür; editör açık kalır. */
  onSave: (name: string, memberIds: string[]) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
};

/** Yeni grup ya da DÜZENLE: ad, üye ekleme/çıkarma ve grubu silme. */
export function GroupEditor({ visible, group, people, onClose, onSave, onDelete }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Yalnızca açılırken ve grup değişince sıfırlanır; üst bileşen yeniden çizilince yazılan metin silinmesin.
  useEffect(() => {
    if (!visible) return;
    setName(group?.name ?? '');
    setSelected(new Set(group?.memberIds ?? []));
    setError(null);
    setBusy(false);
    setConfirmDelete(false);
  }, [visible, group?.id]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    const n = name.trim();
    if (!n) return setError(t('friends.group.needName'));
    const ids = people.filter((p) => selected.has(p.id)).map((p) => p.id);
    if (ids.length === 0) return setError(t('friends.group.needPerson'));
    setBusy(true);
    const ok = await onSave(n, ids);
    setBusy(false);
    if (!ok) setError(t('friends.group.saveFailed'));
  }

  async function remove() {
    if (!confirmDelete) return setConfirmDelete(true);
    setBusy(true);
    const ok = await onDelete();
    setBusy(false);
    if (!ok) setError(t('friends.group.deleteFailed'));
  }

  return (
    <AppModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.close')} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.panel, { paddingBottom: insets.bottom + 26 }]}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.row}>
              <Text style={styles.title}>{group ? t('friends.group.editTitle') : t('friends.group.newTitle')}</Text>
              <Pressable onPress={onClose} accessibilityRole="button" hitSlop={10}>
                <Text style={styles.close}>{t('common.close').toLocaleUpperCase(locale())}</Text>
              </Pressable>
            </View>

            <Text style={[styles.lbl, styles.first]}>{t('friends.group.nameLabel')}</Text>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError(null);
              }}
              maxLength={MAX_GROUP_NAME}
              placeholder={t('friends.group.namePlaceholder')}
              placeholderTextColor={colors.faint}
              selectionColor={colors.black}
              accessibilityLabel={t('friends.group.nameA11y')}
              style={styles.input}
            />

            <Text style={[styles.lbl, styles.second]}>{t('friends.group.people')}</Text>
            {people.length === 0 ? (
              <Text style={styles.empty}>{t('friends.group.needFriends')}</Text>
            ) : (
              people.map((p) => {
                const on = selected.has(p.id);
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => toggle(p.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    style={styles.li}
                  >
                    <Initial name={p.name} />
                    <Text style={styles.liName}>{p.name}</Text>
                    <View style={styles.chk}>{on && <View style={styles.chkFill} />}</View>
                  </Pressable>
                );
              })
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.buttons}>
              <View style={styles.cell}>
                <Button onPress={save} loading={busy}>
                  {t('common.save')}
                </Button>
              </View>
              {group?.canDelete && (
                <View style={styles.cell}>
                  <Button variant="ghost" onPress={remove} disabled={busy}>
                    {confirmDelete ? t('friends.group.confirmDelete') : t('friends.group.delete')}
                  </Button>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.backdropStrong },
  panel: {
    maxHeight: '92%',
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.black,
    paddingTop: 22,
    paddingHorizontal: layout.screenPadding,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 32, color: colors.fg },
  close: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.fg },
  lbl: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.mute },
  first: { marginTop: 20 },
  second: { marginTop: 22, marginBottom: 6 },
  input: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 29,
    color: colors.fg,
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
  },
  empty: { fontSize: 14, color: colors.body, paddingVertical: 8 },
  li: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  liName: { flex: 1, fontFamily: fonts.serif, fontSize: 16, lineHeight: 21, color: colors.fg },
  chk: { width: 18, height: 18, borderWidth: 1, borderColor: colors.black, padding: 2 },
  chkFill: { flex: 1, backgroundColor: colors.black },
  error: { fontSize: 13, color: colors.fg, marginTop: 16 },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 22 },
  cell: { minWidth: 120 },
});
