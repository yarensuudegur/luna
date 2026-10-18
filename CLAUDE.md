# Luna (LU — NA)

## Proje amacı

Luna, Co–Star'dan ilham alan sosyal bir astroloji mobil uygulaması. Günlük yorum, günün tarot kartı, duygu kaydı, yapay zekâ astrolog (Void), arkadaşlar/gruplar ve doğum haritası sunar. Tasarım ve işlev referansı: `docs/luna-prototip.html` — yeni bir ekran yazmadan önce prototipte karşılığına bak.

## Teknoloji seçimi

- **Expo** (React Native + TypeScript) ve **expo-router** (dosya tabanlı yönlendirme)
- **Supabase**: giriş, veritabanı, gerçek zamanlı sohbet
- **astronomy-engine**: gezegen konumları ve doğum haritası hesapları (cihazda)
- **Google Gemini API**: Void (günde 5 soruluk yapay zekâ astrolog)
- Yazı tipleri `@expo-google-fonts` ile: Bodoni Moda (başlık), Space Mono (etiket), sistem sans (metin)

## Klasör yapısı

```
app.json, package.json, tsconfig.json
assets/            görseller, ikonlar
docs/              tasarım referansı (luna-prototip.html)
src/
  app/             expo-router ekranları
    _layout.tsx      kök düzen (font yükleme, splash)
    (tabs)/          5 sekme: index (BUGÜN), arkadaslar, void, gunluk, sen
  components/      paylaşılan UI bileşenleri (TopBar, TabBar, ...)
  theme/           renkler, fontlar, ölçüler — stil değerleri sadece buradan
  i18n/            tr.json ve en.json (tüm arayüz, yorum ve tarot metinleri), i18next kurulumu
  lib/             yardımcılar (tarih, supabase istemcisi, astroloji hesapları)
```

Yeni özellik kodu `src/` altında, ilgili ekranın yanında veya `components/` / `lib/` içinde olur. `@/` takma adı `src/` klasörünü gösterir.

## Kod kuralları

- TypeScript **strict**; `any` kullanma.
- Arayüz **Türkçe ve İngilizce**: metinler bileşende sabit yazılmaz, `src/i18n/tr.json` ve `en.json` içine konur (iki dosyada aynı anahtarlar olmalı; `npm test` bunu denetler) ve `useTranslation()` / `t()` ile okunur. Büyük/küçük harfe çevirirken `toLocaleUpperCase(locale())` kullan (`@/i18n/lang`): Türkçede İ, Ş, Ğ, Ü, Ö, Ç korunur, İngilizcede `i` → `I` olur. Tarih biçimleri ve ondalık ayracı da dile göre değişir (`@/lib/date`, `decimal`).
- **Renkli UI yok**: yalnızca siyah `#0b0b0b`, beyaz ve gri tonlar (`src/theme/colors.ts`). Renk, font ve boşluk değerlerini bileşenlerde sabit yazma; `@/theme` kullan.
- Başlıklar Bodoni Moda, etiketler Space Mono, gövde metni sistem sans.
- **Bodoni Moda satır yüksekliği**: serif metinlerde `lineHeight` en az `fontSize × 1.3` olmalı (ör. 19 → 26, 34 → 44). Daha sıkı verilirse iOS harflerin üstünü/altını keser. Çok satırlı Bodoni paragraflarına ayrıca `paddingBottom: 8-10` ver; iOS son satırın yüksekliğini eksik ölçüp kesebiliyor.
- **Gizli bilgiler** (Supabase anahtarı, Gemini anahtarı) `.env` dosyasında tutulur; `.env*` asla commitlenmez (`.env.example` hariç). İstemciye açılacak değerler `EXPO_PUBLIC_` önekiyle başlar; gerçekten gizli anahtarlar uygulama paketine konmaz.
- Yeni bağımlılıkları `npx expo install <paket>` ile ekle (SDK uyumlu sürüm için).
- Commit öncesi `npm run typecheck` temiz olmalı.

## Çalışma düzeni

- `main` dalına doğrudan push yok. **Her özellik ayrı bir branch + pull request** ile gelir (örn. `feat/bugun-yorum`, `fix/tarih-formati`).
- Bir PR tek bir özelliği kapsar; küçük ve incelenebilir tut.
- Commit mesajları Türkçe ve kısa olabilir; ne değiştiğini açıkla.

## Komutlar

- `npm start` — geliştirme sunucusu (Expo Go ile telefonda aç)
- `npm run web` — tarayıcıda hızlı önizleme
- `npm run typecheck` — tip kontrolü
