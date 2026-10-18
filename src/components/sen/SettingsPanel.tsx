import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { DeleteAccount } from '@/components/sen/DeleteAccount';
import { FutureArchive } from '@/components/sen/FutureArchive';
import { setLanguage, useLang, useTranslation } from '@/i18n';
import { LANGS, locale } from '@/i18n/lang';
import type { Lang } from '@/i18n/lang';
import { HOUSE_SYSTEMS } from '@/lib/astro';
import { useAuth } from '@/lib/auth';
import { AVATARS } from '@/lib/avatars';
import { EVENING_OPTIONS } from '@/lib/bottle';
import { useFutureArchive } from '@/lib/future-archive';
import { sendTestReminders } from '@/lib/reminder-native';
import { useReminders } from '@/lib/reminders';
import { LIFE_OPTIONS, RELATIONSHIP_OPTIONS, useSettings } from '@/lib/settings';
import { supabase } from '@/lib/supabase';
import { colors, fonts, layout } from '@/theme';

/** Dil adları kendi dillerinde yazılır; hangi dilde olursan ol okunabilsin. */
const LANGUAGE_NAMES: Record<Lang, string> = { tr: 'Türkçe', en: 'English' };

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      onPress={() => onChange(!on)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: on }}
      style={[styles.tog, on && styles.togOn]}
    >
      <View style={[styles.knob, on && styles.knobOn]} />
    </Pressable>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label.toLocaleUpperCase(locale())}</Text>
      {children}
    </View>
  );
}

/** Sheet içinde tek seçimlik liste. */
function OptionList<T extends string>({
  options,
  value,
  onPick,
  labelOf,
}: {
  options: readonly T[];
  value: T;
  onPick: (v: T) => void;
  labelOf?: (v: T) => string;
}) {
  return (
    <View style={styles.houseList}>
      {options.map((o) => (
        <Pressable
          key={o}
          style={styles.houseOpt}
          accessibilityRole="radio"
          accessibilityState={{ selected: o === value }}
          onPress={() => onPick(o)}
        >
          <Text style={[styles.rowLabel, o === value && styles.underline]}>
            {(labelOf ? labelOf(o) : o).toLocaleUpperCase(locale())}
          </Text>
          {o === value && <Text style={styles.mono}>✓</Text>}
        </Pressable>
      ))}
    </View>
  );
}

type Picker = 'house' | 'evening' | 'relationship' | 'life' | 'language' | null;

export function SettingsPanel() {
  const router = useRouter();
  const { t } = useTranslation();
  const lang = useLang();
  const { session, profile, refreshProfile, signOut } = useAuth();
  const { houseSystem, classicOnly, eveningTime, relationship, lifeStage, cardReminder, update } = useSettings();
  const { permission, requestPermission } = useReminders();
  const archive = useFutureArchive(session?.user.id);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [testNote, setTestNote] = useState('');
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [picker, setPicker] = useState<Picker>(null);
  const [error, setError] = useState<string | null>(null);

  const currentAvatar = AVATARS.find((a) => a.key === profile?.avatar) ?? AVATARS[0];

  function birthSummary(): string {
    if (!profile?.birth_date) return '—';
    const [y, m, d] = profile.birth_date.split('-');
    const time = profile.birth_time_known && profile.birth_time ? profile.birth_time.slice(0, 5) : t('settings.noTimeShort');
    return [`${d}.${m}.${y}`, time, profile.birth_place?.split(',')[0]]
      .filter(Boolean)
      .join(' · ')
      .toLocaleUpperCase(locale());
  }

  async function pickAvatar(key: string) {
    if (!session) return;
    setError(null);
    const { error: err } = await supabase.from('profiles').update({ avatar: key }).eq('id', session.user.id);
    if (err) {
      setError(t('settings.avatarError'));
      return;
    }
    await refreshProfile();
    setAvatarOpen(false);
  }

  async function enableNotifications() {
    if (permission === 'denied') await Linking.openSettings();
    else await requestPermission();
  }

  async function toggleCard(on: boolean) {
    update({ cardReminder: on });
    if (on && permission === 'undetermined') await requestPermission();
  }

  return (
    <View>
      <View style={styles.section}>
        <Text style={styles.lbl}>{t('settings.profile')}</Text>
        <Pressable style={styles.row} onPress={() => setAvatarOpen(true)} accessibilityRole="button">
          <Text style={styles.rowLabel}>{t('settings.avatarRow')}</Text>
          <View style={styles.avSet}>
            <Avatar avatar={profile?.avatar} size={40} blend={false} />
            <Text style={styles.mono}>{t('settings.change')}</Text>
          </View>
        </Pressable>
        <Pressable style={styles.row} onPress={() => setPicker('language')} accessibilityRole="button">
          <Text style={styles.rowLabel}>{t('settings.language')}</Text>
          <Text style={styles.value}>{LANGUAGE_NAMES[lang].toLocaleUpperCase(locale())} ›</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => setArchiveOpen(true)} accessibilityRole="button">
          <Text style={styles.rowLabel}>{t('settings.archive').toLocaleUpperCase(locale())}</Text>
          <Text style={styles.value}>{archive.messages.length} ›</Text>
        </Pressable>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.lbl}>{t('settings.readings')}</Text>
        <Pressable style={styles.row} onPress={() => setPicker('relationship')} accessibilityRole="button">
          <Text style={styles.rowLabel}>{t('settings.relationship')}</Text>
          <Text style={styles.value}>{t(`settings.relationshipOptions.${relationship}`).toLocaleUpperCase(locale())} ›</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => setPicker('life')} accessibilityRole="button">
          <Text style={styles.rowLabel}>{t('settings.lifeStage')}</Text>
          <Text style={styles.value}>{t(`settings.lifeOptions.${lifeStage}`).toLocaleUpperCase(locale())} ›</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.lbl}>{t('settings.chartSection')}</Text>
        <Pressable style={styles.row} onPress={() => setPicker('house')} accessibilityRole="button">
          <Text style={styles.rowLabel}>{t('settings.houseSystem')}</Text>
          <Text style={styles.value}>{houseSystem} ›</Text>
        </Pressable>
        <Text style={styles.note}>{t(`houseInfo.${houseSystem}`)}</Text>
        <Row label={t('settings.classicOnly')}>
          <Toggle on={classicOnly} onChange={(v) => update({ classicOnly: v })} label={t('settings.classicOnly')} />
        </Row>
        <Pressable style={styles.row} onPress={() => router.push('/dogum-duzenle/tarih')} accessibilityRole="button">
          <Text style={styles.rowLabel}>{t('settings.birthInfo')}</Text>
          <Text style={styles.value}>{birthSummary()} ›</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.lbl}>{t('settings.notifications')}</Text>
        <Row label={t('settings.cardReminder')}>
          <Toggle on={cardReminder} onChange={toggleCard} label={t('settings.cardReminder')} />
        </Row>
        <Text style={styles.note}>{t('settings.cardReminderNote')}</Text>
        <Pressable style={styles.row} onPress={() => setPicker('evening')} accessibilityRole="button">
          <Text style={styles.rowLabel}>{t('settings.evening')}</Text>
          <Text style={styles.value}>{eveningTime} ›</Text>
        </Pressable>
        <Text style={styles.note}>{t('settings.eveningNote')}</Text>
        <Row label={t('settings.permission')}>
          <Text style={styles.value}>{t(`settings.permissionState.${permission}`)}</Text>
        </Row>
        {(permission === 'undetermined' || permission === 'denied') && (
          <Pressable onPress={enableNotifications} accessibilityRole="button" hitSlop={8}>
            <Text style={[styles.mono, styles.underline, styles.permLink]}>
              {permission === 'denied' ? t('settings.openPhoneSettings') : t('settings.allow')}
            </Text>
          </Pressable>
        )}
        {permission === 'denied' && <Text style={styles.note}>{t('settings.deniedNote')}</Text>}
        {__DEV__ && permission === 'granted' && (
          <Pressable
            onPress={async () => {
              const ok = await sendTestReminders();
              setTestNote(ok ? t('settings.testSent') : t('settings.testUnavailable'));
            }}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={[styles.mono, styles.underline, styles.permLink]}>{t('settings.testBtn')}</Text>
          </Pressable>
        )}
        {__DEV__ && testNote ? <Text style={styles.note}>{testNote}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.lbl}>{t('settings.privacy')}</Text>
        <Text style={styles.noteTop}>{t('settings.privacyText')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.lbl}>{t('settings.support')}</Text>
        <Pressable style={styles.row} onPress={() => Linking.openURL('tel:112')} accessibilityRole="button">
          <Text style={styles.rowLabel}>{t('settings.emergency')}</Text>
          <Text style={styles.value}>112 ›</Text>
        </Pressable>
        <Text style={styles.note}>{t('settings.emergencyNote')}</Text>
      </View>

      <View style={[styles.section, styles.last]}>
        <Button variant="ghost" onPress={signOut}>
          {t('settings.signOut')}
        </Button>
        <View style={styles.deleteGap}>
          <DeleteAccount />
        </View>
      </View>

      <Sheet visible={avatarOpen} title={t('settings.avatarTitle')} onClose={() => setAvatarOpen(false)}>
        <View style={styles.avGrid}>
          {AVATARS.map((a) => {
            const selected = a.key === currentAvatar.key;
            return (
              <Pressable
                key={a.key}
                onPress={() => pickAvatar(a.key)}
                accessibilityRole="button"
                accessibilityLabel={a.name}
                accessibilityState={{ selected }}
                style={styles.avOpt}
              >
                <View style={[styles.avCircle, selected && styles.avCircleOn]}>
                  <Image source={a.source} style={styles.avImg} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </Sheet>

      <FutureArchive visible={archiveOpen} onClose={() => setArchiveOpen(false)} archive={archive} />

      <Sheet visible={picker === 'language'} title={t('settings.languageTitle')} onClose={() => setPicker(null)}>
        <OptionList
          options={LANGS}
          value={lang}
          labelOf={(l) => LANGUAGE_NAMES[l]}
          onPick={(l) => {
            void setLanguage(l);
            setPicker(null);
          }}
        />
      </Sheet>
      <Sheet visible={picker === 'house'} title={t('settings.houseSystemTitle')} onClose={() => setPicker(null)}>
        <OptionList
          options={HOUSE_SYSTEMS}
          value={houseSystem}
          onPick={(s) => {
            update({ houseSystem: s });
            setPicker(null);
          }}
        />
      </Sheet>
      <Sheet visible={picker === 'evening'} title={t('settings.eveningTitle')} onClose={() => setPicker(null)}>
        <OptionList
          options={EVENING_OPTIONS}
          value={eveningTime as (typeof EVENING_OPTIONS)[number]}
          onPick={(v) => {
            update({ eveningTime: v });
            setPicker(null);
          }}
        />
      </Sheet>
      <Sheet visible={picker === 'relationship'} title={t('settings.relationshipTitle')} onClose={() => setPicker(null)}>
        <OptionList
          options={RELATIONSHIP_OPTIONS}
          value={relationship}
          labelOf={(v) => t(`settings.relationshipOptions.${v}`)}
          onPick={(v) => {
            update({ relationship: v });
            setPicker(null);
          }}
        />
      </Sheet>
      <Sheet visible={picker === 'life'} title={t('settings.lifeStageTitle')} onClose={() => setPicker(null)}>
        <OptionList
          options={LIFE_OPTIONS}
          value={lifeStage}
          labelOf={(v) => t(`settings.lifeOptions.${v}`)}
          onPick={(v) => {
            update({ lifeStage: v });
            setPicker(null);
          }}
        />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 28,
    paddingHorizontal: layout.screenPadding,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  last: { borderBottomWidth: 0 },
  deleteGap: { marginTop: 8 },
  lbl: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: colors.mute, marginBottom: 14 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
    minHeight: 50,
    paddingVertical: 13,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
  rowLabel: { fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 0.8, color: colors.fg, flexShrink: 1 },
  value: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.7, color: colors.fg, flexShrink: 1, textAlign: 'right' },
  mono: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 1.3, color: colors.fg },
  underline: { textDecorationLine: 'underline' },
  note: { fontSize: 12.5, color: colors.body, paddingTop: 8, paddingBottom: 4, lineHeight: 18 },
  noteTop: { fontSize: 13, color: colors.body, lineHeight: 20 },
  permLink: { paddingTop: 12 },
  error: { fontSize: 12.5, color: colors.fg, paddingTop: 10 },
  avSet: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tog: {
    width: 40,
    height: 22,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: 11,
    justifyContent: 'center',
  },
  togOn: { backgroundColor: colors.black },
  knob: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.black, marginLeft: 3 },
  knobOn: { backgroundColor: colors.bg, marginLeft: 21 },
  avGrid: { flexDirection: 'row', gap: 12, paddingBottom: 8 },
  avOpt: { flex: 1, alignItems: 'center' },
  avCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
  avCircleOn: { borderWidth: 2, borderColor: colors.black },
  avImg: { width: '100%', height: '100%' },
  houseList: { marginTop: 12 },
  houseOpt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.line,
  },
});
