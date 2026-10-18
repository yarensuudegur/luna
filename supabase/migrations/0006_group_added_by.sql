-- Luna: "Ayşe seni Ev arkadaşları grubuna ekledi" bildirimi için ekleyeni tut.
-- auth.uid() security definer fonksiyonlarda da oturumdaki kullanıcıyı verir.
alter table public.group_members
  add column added_by uuid references auth.users (id) on delete set null default auth.uid();
