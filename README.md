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

## Void (Edge Function) kurulumu

Void, Gemini'yi doğrudan uygulamadan değil `supabase/functions/void` Edge Function'ı üzerinden çağırır. Günlük 5 soru sınırı sunucuda sayılır ve Gemini anahtarı uygulama paketine girmez.

1. SQL Editor'da `supabase/migrations/0007_void.sql` dosyasını çalıştır.
2. [Google AI Studio](https://aistudio.google.com/apikey)'dan ücretsiz bir Gemini API anahtarı al.
3. Supabase CLI ile bağlan, anahtarı gizli olarak kaydet ve fonksiyonu yayınla:

```
npx supabase login
npx supabase link --project-ref <proje-ref>
npx supabase secrets set GEMINI_API_KEY=<gemini-anahtarı>
npx supabase functions deploy void
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` ve `SUPABASE_SERVICE_ROLE_KEY` Supabase tarafından fonksiyona kendiliğinden verilir. Fonksiyon JWT doğrulaması açık yayınlanır (`--no-verify-jwt` kullanma). Kullanılan model `gemini-flash-latest`'tir; değiştirmek için `index.ts` içindeki `MODEL` sabitini düzenle. Logları görmek için: `npx supabase functions logs void`.

## Çalışma düzeni

- main dalına doğrudan push yok; her özellik ayrı bir branch ve pull request.
- Tasarım referansı: docs/luna-prototip.html
