import { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { DeleteAccount } from '@/components/sen/DeleteAccount';
import { HOUSE_INFO, HOUSE_SYSTEMS } from '@/lib/astro';
import { useAuth } from '@/lib/auth';
import { AVATARS } from '@/lib/avatars';
import { EVENING_OPTIONS } from '@/lib/bottle';
import { TONES } from '@/lib/daily';
import { sendTestReminders } from '@/lib/reminder-native';
import { useReminders } from '@/lib/reminders';
import { LIFE_OPTIONS, RELATIONSHIP_OPTIONS, useSettings } from '@/lib/settings';
import { supabase } from '@/lib/supabase';
import { colors, fonts, layout } from '@/theme';

const PERMISSION_LABEL = {
  granted: 'AÇIK',
  denied: 'KAPALI',
  undetermined: 'SORULMADI',
  unavailable: 'BU CİHAZDA YOK',
} as const;

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

/** Sheet içinde tek seçimlik liste. */
function OptionList<T extends string>({
  options,
  value,
  onPick,
}: {
  options: readonly T[];
  value: T;
  onPick: (v: T) => void;
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
          <Text style={[styles.rowLabel, o === value && styles.underline]}>{o.toLocaleUpperCase('tr')}</Text>
          {o === value && <Text style={styles.mono}>✓</Text>}
        </Pressable>
      ))}
    </View>
  );
}

function formatBirth(date: string | null, time: string | null, known: boolean, place: string | null) {
  if (!date) return '—';
  const [y, m, d] = date.split('-');
  const parts = [`${d}.${m}.${y}`, known && time ? time.slice(0, 5) : 'SAAT YOK', place?.split(',')[0]];
  return parts.filter(Boolean).join(' · ').toLocaleUpperCase('tr');
}

type Picker = 'house' | 'evening' | 'relationship' | 'life' | null;

export function SettingsPanel() {
  const { session, profile, refreshProfile, signOut } = useAuth();
  const { houseSystem, classicOnly, eveningTime, tone, noAI, relationship, lifeStage, cardReminder, update } =
    useSettings();
  const { permission, requestPermission } = useReminders();
  const [testNote, setTestNote] = useState('');
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [picker, setPicker] = useState<Picker>(null);
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
        <Text style={styles.lbl}>YORUMLAR</Text>
        <Row label="Ton">
          <View style={styles.seg} accessibilityRole="radiogroup">
            {TONES.map((t) => (
              <Pressable
                key={t}
                onPress={() => update({ tone: t })}
                accessibilityRole="radio"
                accessibilityState={{ selected: t === tone }}
                style={[styles.segBtn, t === tone && styles.segOn]}
              >
                <Text style={[styles.segText, t === tone && styles.segTextOn]}>{t.toLocaleUpperCase('tr')}</Text>
              </Pressable>
            ))}
          </View>
        </Row>
        <Row label="AI’sız mod">
          <Toggle on={noAI} onChange={(v) => update({ noAI: v })} label="AI’sız mod" />
        </Row>
        <Text style={styles.note}>Açıkken Void kapanır ve yalnızca insan yazarların metinleri gösterilir.</Text>
        <Pressable style={styles.row} onPress={() => setPicker('relationship')} accessibilityRole="button">
          <Text style={styles.rowLabel}>İLİŞKİ DURUMU</Text>
          <Text style={styles.value}>{relationship.toLocaleUpperCase('tr')} ›</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={() => setPicker('life')} accessibilityRole="button">
          <Text style={styles.rowLabel}>YAŞAM EVRESİ</Text>
          <Text style={styles.value}>{lifeStage.toLocaleUpperCase('tr')} ›</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.lbl}>HARİTA</Text>
        <Pressable style={styles.row} onPress={() => setPicker('house')} accessibilityRole="button">
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

      <View style={styles.section}>
        <Text style={styles.lbl}>BİLDİRİMLER</Text>
        <Row label="Kart hatırlatması">
          <Toggle on={cardReminder} onChange={toggleCard} label="Kart hatırlatması" />
        </Row>
        <Text style={styles.note}>Açıkken her gece 00:00’da “Yeni kartın hazır.” bildirimi gelir.</Text>
        <Pressable style={styles.row} onPress={() => setPicker('evening')} accessibilityRole="button">
          <Text style={styles.rowLabel}>AKŞAM DUYGULARI</Text>
          <Text style={styles.value}>{eveningTime} ›</Text>
        </Pressable>
        <Text style={styles.note}>Duygu kaydı her akşam bu saatten sonra açılır ve o saatte hatırlatma gelir.</Text>
        <Row label="Bildirim izni">
          <Text style={styles.value}>{PERMISSION_LABEL[permission]}</Text>
        </Row>
        {(permission === 'undetermined' || permission === 'denied') && (
          <Pressable onPress={enableNotifications} accessibilityRole="button" hitSlop={8}>
            <Text style={[styles.mono, styles.underline, styles.permLink]}>
              {permission === 'denied' ? 'TELEFON AYARLARINI AÇ' : 'İZİN VER'}
            </Text>
          </Pressable>
        )}
        {permission === 'denied' && (
          <Text style={styles.note}>
            İzin kapalı olduğu için hatırlatma gelmiyor. Uygulamanın geri kalanı normal çalışır.
          </Text>
        )}
        {__DEV__ && permission === 'granted' && (
          <Pressable
            onPress={async () => {
              const ok = await sendTestReminders();
              setTestNote(ok ? 'Uygulamayı arka plana al: 10 ve 20 saniye sonra iki bildirim gelecek.' : 'Bu cihazda bildirim kullanılamıyor.');
            }}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={[styles.mono, styles.underline, styles.permLink]}>TEST BİLDİRİMİ GÖNDER</Text>
          </Pressable>
        )}
        {__DEV__ && testNote ? <Text style={styles.note}>{testNote}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.lbl}>GİZLİLİK</Text>
        <Text style={styles.noteTop}>
          Doğum bilgilerin, duygu kayıtların ve Void sohbetlerin hesabına bağlı olarak saklanır; yalnızca sen görebilirsin. Void’e yazdıkların cevap üretmek için Google Gemini’ye gönderilir. Bunu istemiyorsan AI’sız modu aç. Hesabını sildiğinde tüm verilerin kalıcı olarak silinir.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.lbl}>DESTEK</Text>
        <Pressable style={styles.row} onPress={() => Linking.openURL('tel:112')} accessibilityRole="button">
          <Text style={styles.rowLabel}>ACİL DURUM</Text>
          <Text style={styles.value}>112 ›</Text>
        </Pressable>
        <Text style={styles.note}>
          Kendine zarar vermeyi düşünüyorsan ya da kriz yaşıyorsan 112’yi ara ve güvendiğin birine ulaş. Astroloji bilimsel bir yöntem sayılmaz; önemli kararlarda uzmana danış.
        </Text>
      </View>

      <View style={[styles.section, styles.last]}>
        <Button variant="ghost" onPress={signOut}>
          Çıkış yap
        </Button>
        <View style={styles.deleteGap}>
          <DeleteAccount />
        </View>
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

      <Sheet visible={picker === 'house'} title="Ev sistemi" onClose={() => setPicker(null)}>
        <OptionList
          options={HOUSE_SYSTEMS}
          value={houseSystem}
          onPick={(s) => {
            update({ houseSystem: s });
            setPicker(null);
          }}
        />
      </Sheet>
      <Sheet visible={picker === 'evening'} title="Akşam saati" onClose={() => setPicker(null)}>
        <OptionList
          options={EVENING_OPTIONS}
          value={eveningTime as (typeof EVENING_OPTIONS)[number]}
          onPick={(t) => {
            update({ eveningTime: t });
            setPicker(null);
          }}
        />
      </Sheet>
      <Sheet visible={picker === 'relationship'} title="İlişki durumu" onClose={() => setPicker(null)}>
        <OptionList
          options={RELATIONSHIP_OPTIONS}
          value={relationship}
          onPick={(v) => {
            update({ relationship: v });
            setPicker(null);
          }}
        />
      </Sheet>
      <Sheet visible={picker === 'life'} title="Yaşam evresi" onClose={() => setPicker(null)}>
        <OptionList
          options={LIFE_OPTIONS}
          value={lifeStage}
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
  note: { fontSize: 12.5, color: colors.mute, paddingTop: 8, paddingBottom: 4, lineHeight: 18 },
  noteTop: { fontSize: 13, color: colors.mute, lineHeight: 20 },
  permLink: { paddingTop: 12 },
  error: { fontSize: 12.5, color: colors.fg, paddingTop: 10 },
  avSet: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  seg: { flexDirection: 'row', borderWidth: 1, borderColor: colors.fg },
  segBtn: { paddingVertical: 7, paddingHorizontal: 8 },
  segOn: { backgroundColor: colors.fg },
  segText: { fontFamily: fonts.mono, fontSize: 8.5, letterSpacing: 0.8, color: colors.fg },
  segTextOn: { color: colors.bg },
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
