-- Luna: arkadaş ve grup değişiklikleri karşı tarafa anında düşsün.
-- RLS abonelere de uygulanır: herkes yalnızca görebildiği satırların olaylarını alır.
alter publication supabase_realtime add table public.friendships;
alter publication supabase_realtime add table public.group_members;
alter publication supabase_realtime add table public.groups;

-- Silme olaylarında eski satırın tamamı gelsin (hangi grup/arkadaş gitti bilinsin).
alter table public.friendships replica identity full;
alter table public.group_members replica identity full;
