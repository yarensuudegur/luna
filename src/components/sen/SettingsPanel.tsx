import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { HOUSE_INFO, HOUSE_SYSTEMS } from '@/lib/astro';
import { useAuth } from '@/lib/auth';
import { AVATARS } from '@/lib/avatars';
import { useSettings } from '@/lib/settings';
import { supabase } from '@/lib/supabase';
import { colors, fonts, layout } from '@/theme';

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
      <Text style={styles.rowLabel}>{label.toLocaleUpperCase('tr')}</Text>
      {children}
    </View>
  );
}

function formatBirth(date: string | null, time: string | null, known: boolean, place: string | null) {
  if (!date) return '—';
  const [y, m, d] = date.split('-');
  const parts = [`${d}.${m}.${y}`, known && time ? time.slice(0, 5) : 'SAAT YOK', place?.split(',')[0]];
  return parts.filter(Boolean).join(' · ').toLocaleUpperCase('tr');
}

export function SettingsPanel() {
  const { session, profile, refreshProfile, signOut } = useAuth();
  const { houseSystem, classicOnly, update } = useSettings();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [houseOpen, setHouseOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentAvatar = AVATARS.find((a) => a.key === profile?.avatar) ?? AVATARS[0];

  async function pickAvatar(key: string) {
    if (!session) return;
    setError(null);
    const { error: err } = await supabase.from('profiles').update({ avatar: key }).eq('id', session.user.id);
    if (err) {
      setError('Profil fotoğrafı kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
      return;
    }
    await refreshProfile();
    setAvatarOpen(false);
  }

  return (
    <View>
      <View style={styles.section}>
        <Text style={styles.lbl}>PROFİL</Text>
        <Pressable style={styles.row} onPress={() => setAvatarOpen(true)} accessibilityRole="button">
          <Text style={styles.rowLabel}>PROFİL FOTOĞRAFI</Text>
          <View style={styles.avSet}>
            <Avatar avatar={profile?.avatar} size={40} blend={false} />
            <Text style={styles.mono}>DEĞİŞTİR ›</Text>
          </View>
        </Pressable>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.lbl}>HARİTA</Text>
        <Pressable style={styles.row} onPress={() => setHouseOpen(true)} accessibilityRole="button">
          <Text style={styles.rowLabel}>EV SİSTEMİ</Text>
          <Text style={styles.value}>{houseSystem} ›</Text>
        </Pressable>
        <Text style={styles.note}>{HOUSE_INFO[houseSystem]}</Text>
        <Row label="Sadece klasik gezegenler">
          <Toggle on={classicOnly} onChange={(v) => update({ classicOnly: v })} label="Sadece klasik gezegenler" />
        </Row>
        <Row label="Doğum">
          <Text style={styles.value}>
            {formatBirth(profile?.birth_date ?? null, profile?.birth_time ?? null, !!profile?.birth_time_known, profile?.birth_place ?? null)}
          </Text>
        </Row>
      </View>

      <View style={[styles.section, styles.last]}>
        <Button variant="ghost" onPress={signOut}>
          Çıkış yap
        </Button>
      </View>

      <Sheet visible={avatarOpen} title="Profil fotoğrafı" onClose={() => setAvatarOpen(false)}>
        <Text style={styles.sheetNote}>Bir büst seç. Arkadaşların seni bununla görür.</Text>
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
                <Text style={[styles.mono, selected && styles.underline]}>{a.name.toLocaleUpperCase('tr')}</Text>
              </Pressable>
            );
          })}
        </View>
      </Sheet>

      <Sheet visible={houseOpen} title="Ev sistemi" onClose={() => setHouseOpen(false)}>
        <View style={styles.houseList}>
          {HOUSE_SYSTEMS.map((s) => (
            <Pressable
              key={s}
              style={styles.houseOpt}
              accessibilityRole="radio"
              accessibilityState={{ selected: s === houseSystem }}
              onPress={() => {
                update({ houseSystem: s });
                setHouseOpen(false);
              }}
            >
              <Text style={[styles.rowLabel, s === houseSystem && styles.underline]}>{s.toLocaleUpperCase('tr')}</Text>
              {s === houseSystem && <Text style={styles.mono}>✓</Text>}
            </Pressable>
          ))}
        </View>
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
  note: { fontSize: 12.5, color: colors.mute, paddingTop: 8, paddingBottom: 4, lineHeight: 18 },
  error: { fontSize: 12.5, color: colors.fg, paddingTop: 10 },
  avSet: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tog: {
    width: 40,
    height: 22,
    borderWidth: 1,
    borderColor: colors.fg,
    borderRadius: 11,
    justifyContent: 'center',
  },
  togOn: { backgroundColor: colors.fg },
  knob: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.fg, marginLeft: 3 },
  knobOn: { backgroundColor: colors.bg, marginLeft: 21 },
  sheetNote: { fontSize: 14, color: colors.mute, marginTop: 8, marginBottom: 18 },
  avGrid: { flexDirection: 'row', gap: 12, paddingBottom: 8 },
  avOpt: { flex: 1, alignItems: 'center', gap: 8 },
  avCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
  avCircleOn: { borderWidth: 2, borderColor: colors.fg },
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
