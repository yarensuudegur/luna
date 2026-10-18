import { t } from '@/i18n/core';

/** Supabase hata metni → `auth.errors` anahtarı. */
const MESAJLAR: ReadonlyArray<readonly [RegExp, string]> = [
  [/invalid login credentials/i, 'invalid'],
  [/already registered|already been registered/i, 'exists'],
  [/email not confirmed/i, 'unconfirmed'],
  [/password should be at least/i, 'shortPassword'],
  [/invalid.*email|unable to validate email/i, 'badEmail'],
  [/rate limit|too many/i, 'rateLimit'],
  [/network|fetch/i, 'network'],
];

/** Supabase hata metnini seçili dilde, kullanıcıya gösterilebilir bir cümleye çevirir. */
export function authErrorText(message: string): string {
  for (const [re, key] of MESAJLAR) if (re.test(message)) return t(`auth.errors.${key}`);
  return t('auth.errors.other');
}

/** Giriş hatası, e-postanın doğrulanmamış olmasından mı? */
export const isUnconfirmed = (message: string): boolean => /email not confirmed/i.test(message);
