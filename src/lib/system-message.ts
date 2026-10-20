import { t } from '@/i18n/core';

/**
 * Grup sistem mesajları veritabanına Türkçe yazılır ("Mert gruba eklendi").
 * Ekranda seçili dile çevrilir; tanınmayan metin olduğu gibi kalır.
 */
export function systemText(body: string): string {
  const added = body.match(/^(.*) gruba eklendi$/);
  const removed = body.match(/^(.*) gruptan çıkarıldı$/);
  const m = added ?? removed;
  if (!m) return body;
  const raw = m[1].trim();
  const name = raw === '' || raw === 'Biri' ? t('common.someone') : raw;
  return t(added ? 'friends.room.sysAdded' : 'friends.room.sysRemoved', { name });
}
