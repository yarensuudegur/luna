import { describe, expect, it } from 'vitest';
import { groupByMonth } from './future-calendar';
import type { ArchivedMessage } from './future-archive';

const msg = (id: string, deliver: Date): ArchivedMessage => ({
  id,
  body: id,
  createdAt: new Date(2026, 0, 1),
  deliverAt: deliver,
});

describe('groupByMonth', () => {
  it('yalnızca mesajı olan ayları, en yenisi üstte verir', () => {
    const months = groupByMonth([
      msg('a', new Date(2026, 8, 12, 10)),
      msg('b', new Date(2026, 9, 3, 23, 30)),
      msg('c', new Date(2026, 9, 3, 8)),
      msg('d', new Date(2027, 0, 20)),
    ]);
    expect(months.map((m) => [m.year, m.month])).toEqual([[2027, 0], [2026, 9], [2026, 8]]);
    const oct = months[1];
    expect([...oct.byDay.keys()]).toEqual([3]);
    // Aynı gün birden çok mesaj: eskiden yeniye.
    expect(oct.byDay.get(3)!.map((m) => m.id)).toEqual(['c', 'b']);
  });

  it('hafta Pazartesi başlar: boş hücre ve gün sayısı doğru', () => {
    // 1 Ekim 2026 Perşembe → 3 boş hücre; Ekim 31 gün.
    const [oct] = groupByMonth([msg('a', new Date(2026, 9, 5))]);
    expect(oct.lead).toBe(3);
    expect(oct.daysInMonth).toBe(31);
    // 1 Haziran 2026 Pazartesi → 0 boş hücre.
    expect(groupByMonth([msg('b', new Date(2026, 5, 9))])[0].lead).toBe(0);
    // 1 Mart 2026 Pazar → 6 boş hücre.
    expect(groupByMonth([msg('c', new Date(2026, 2, 9))])[0].lead).toBe(6);
  });

  it('mesaj yoksa boş döner', () => {
    expect(groupByMonth([])).toEqual([]);
  });
});
