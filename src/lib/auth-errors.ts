const MESAJLAR: ReadonlyArray<readonly [RegExp, string]> = [
  [/invalid login credentials/i, 'E-posta veya şifre hatalı.'],
  [/already registered|already been registered/i, 'Bu e-posta ile zaten bir hesap var.'],
  [/email not confirmed/i, 'Önce e-postandaki doğrulama bağlantısına dokunmalısın.'],
  [/password should be at least/i, 'Şifre en az 6 karakter olmalı.'],
  [/invalid.*email|unable to validate email/i, 'Geçerli bir e-posta yaz.'],
  [/rate limit|too many/i, 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.'],
  [/network|fetch/i, 'Bağlantı kurulamadı. İnternetini kontrol et.'],
];

/** Supabase hata metnini Türkçe, kullanıcıya gösterilebilir bir cümleye çevirir. */
export function trAuthError(message: string): string {
  for (const [re, tr] of MESAJLAR) if (re.test(message)) return tr;
  return 'Bir şeyler ters gitti. Tekrar dene.';
}
