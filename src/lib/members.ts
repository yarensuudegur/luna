import { supabase } from '@/lib/supabase';

export type MemberInfo = { id: string; name: string; handle: string; avatar: string | null };

type MemberRow = { id: string; name: string | null; handle: string | null; avatar: string | null };

/** Bir grubun üyeleri (yalnızca ad, kullanıcı adı, avatar); üye değilsen boş döner. */
export async function fetchMembers(groupId: string): Promise<MemberInfo[]> {
  const { data } = await supabase.rpc('group_member_info', { p_group: groupId });
  return ((data ?? []) as MemberRow[]).map((m) => ({
    id: m.id,
    name: m.name ?? 'Adsız',
    handle: m.handle ?? '',
    avatar: m.avatar,
  }));
}
