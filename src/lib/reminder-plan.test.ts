import { describe, expect, it } from 'vitest';
import { eveningDates } from './reminder-plan';

describe('eveningDates', () => {
  const now = new Date(2026, 9, 18, 15, 0);

  it('bugünden başlar ve 14 gün üretir', () => {
    const list = eveningDates(now, 21, false);
    expect(list).toHaveLength(14);
    expect(list[0].getDate()).toBe(18);
    expect(list[0].getHours()).toBe(21);
  });

  it('bugünün duygusu kayıtlıysa bugünü atlar', () => {
    const list = eveningDates(now, 21, true);
    expect(list).toHaveLength(13);
    expect(list[0].getDate()).toBe(19);
  });

  it('saati geçmiş bugünü atlar', () => {
    const late = new Date(2026, 9, 18, 22, 0);
    expect(eveningDates(late, 21, false)[0].getDate()).toBe(19);
  });
});
