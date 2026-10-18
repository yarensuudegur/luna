-- Luna: Void sohbet geçmişi
-- Supabase panelinde SQL Editor'a yapıştırıp çalıştır (0001'den sonra).

create table public.void_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index void_messages_user_created_idx
  on public.void_messages (user_id, created_at desc);

-- Row Level Security: herkes yalnızca kendi geçmişini okur.
-- Yazma, güncelleme ve silme politikası yok; istemci hiçbir şey yazamaz.
-- Satırları yalnızca Edge Function (service role, RLS'i atlar) ekler.
alter table public.void_messages enable row level security;

create policy "void_messages_select_own" on public.void_messages
  for select to authenticated
  using (auth.uid() = user_id);

revoke all on public.void_messages from anon, authenticated;
grant select on public.void_messages to authenticated;

-- Günde 5 soru sınırı: asıl sayım Edge Function'da yapılır, bu tetikleyici
-- aynı anda gelen isteklerin sınırı aşmasını veritabanı düzeyinde engeller.
-- Gün, Europe/Istanbul saatine göre sayılır.
create function public.void_messages_daily_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role = 'user' and (
    select count(*) from public.void_messages m
    where m.user_id = new.user_id
      and m.role = 'user'
      and (m.created_at at time zone 'Europe/Istanbul')::date
        = (new.created_at at time zone 'Europe/Istanbul')::date
  ) >= 5 then
    raise exception 'void_daily_limit' using errcode = 'P0429';
  end if;
  return new;
end;
$$;

create trigger void_messages_daily_limit
  before insert on public.void_messages
  for each row execute function public.void_messages_daily_limit();
