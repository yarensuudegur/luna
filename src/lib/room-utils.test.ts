import { describe, expect, it } from 'vitest';
import { cleanMessage, diffMembers, eventRoomId, isEventRoomOpen } from './room-utils';

describe('olay odası', () => {
  const event = new Date('2026-10-26T14:00:00Z');

  it('kimlik olay gününün UTC tarihi', () => {
    expect(eventRoomId(event)).toBe('olay-2026-10-26');
  });

  it('36 saatten uzakken kilitli, yakınken ve olay geçince açık', () => {
    expect(isEventRoomOpen(event, new Date('2026-10-20T12:00:00Z'))).toBe(false);
    expect(isEventRoomOpen(event, new Date('2026-10-25T12:00:00Z'))).toBe(true);
    expect(isEventRoomOpen(event, new Date('2026-10-26T20:00:00Z'))).toBe(true);
  });
});

describe('diffMembers', () => {
  it('eklenen ve çıkarılanı ayırır', () => {
    expect(diffMembers(['a', 'b'], ['b', 'c'])).toEqual({ added: ['c'], removed: ['a'] });
  });
});

describe('cleanMessage', () => {
  it('boşları reddeder, uzunu 500e kırpar', () => {
    expect(cleanMessage('   ')).toBeNull();
    expect(cleanMessage(' selam ')).toBe('selam');
    expect(cleanMessage('x'.repeat(600))).toHaveLength(500);
  });
});
