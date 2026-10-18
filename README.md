# LU — NA

Luna, Co–Star'dan ilham alan sosyal bir astroloji mobil uygulamasıdır. Ders ödevi kapsamında, ayda 50 bin doların üzerinde kazanan bir uygulamayı Claude Code ile yeniden geliştirip sorunlarını iyileştiriyoruz.

## Özellikler

- Günlük yorum, Yap / Yapma, Derine in ve şans bölümleri
- Günde bir tarot kartı (00:00'da yenilenir)
- Akşam 21:00 duygu kaydı ve haftalık duygu şişesi
- Void: günde 5 soruluk yapay zekâ astrolog
- Arkadaşlar: QR ile ekleme, değiştirilebilir ilişki türü, gruplar ve sohbet
- Doğum haritası, evler tablosu ve gezegen kartları

## Teknolojiler

- Expo (React Native + TypeScript)
- Supabase (giriş, veritabanı, gerçek zamanlı sohbet)
- astronomy-engine (gezegen konumları)
- Google Gemini API (Void)

## Çalışma düzeni

- main dalına doğrudan push yok; her özellik ayrı bir branch ve pull request.
- Tasarım referansı: docs/luna-prototip.html
