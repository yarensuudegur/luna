/** Olay odası, olaydan bu kadar önce açılır (prototip: 36 saat). */
export const EVENT_OPEN_BEFORE_MS = 36 * 3600000;

export const MAX_MESSAGE = 500;
export const MAX_GROUP_NAME = 40;

/** Herkese açık oda kimliği: olay gününün UTC tarihi; sunucudaki `is_event_room` ile aynı biçim. */
export function eventRoomId(eventDate: Date): string {
  return 'olay-' + eventDate.toISOString().slice(0, 10);
}

/** Olaya kalan süre eşiğin altındaysa (olay geçmiş olsa da) oda açıktır. */
export function isEventRoomOpen(eventDate: Date, now: Date): boolean {
  return eventDate.getTime() - now.getTime() < EVENT_OPEN_BEFORE_MS;
}

/** Eski ve yeni üye listesi arasındaki fark. */
export function diffMembers(before: readonly string[], after: readonly string[]) {
  return {
    added: after.filter((id) => !before.includes(id)),
    removed: before.filter((id) => !after.includes(id)),
  };
}

/** Mesaj gönderilebilir mi: boş değil, 500 karakteri aşmıyor. Kırpılmış metni döner. */
export function cleanMessage(text: string): string | null {
  const body = text.trim().slice(0, MAX_MESSAGE);
  return body === '' ? null : body;
}
