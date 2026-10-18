-- Luna: günün tarot kartı
-- Supabase panelinde SQL Editor'a yapıştırıp çalıştır (0001'den sonra).

create table public.daily_tarot (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  -- 0..21: Deli'den Dünya'ya, src/lib/daily/content.ts içindeki TAROT sırası.
  card smallint not null check (card between 0 and 21),
  reversed boolean not null default false,
  created_at timestamptz not null default now(),
  -- Günde bir kart.
  unique (user_id, date)
);

-- Row Level Security: herkes yalnızca kendi kartını okuyabilir ve çekebilir.
-- Güncelleme ve silme politikası yok: çekilen kart değiştirilemez.
alter table public.daily_tarot enable row level security;

create policy "daily_tarot_select_own" on public.daily_tarot
  for select to authenticated
  using (auth.uid() = user_id);

-- Tarih istemcinin yerel gününden gelir; saat dilimi farkı için sunucu gününün
-- bir gün önce/sonrasına izin verilir, uzak tarihlere kart çekilemez.
create policy "daily_tarot_insert_own" on public.daily_tarot
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and date between ((now() at time zone 'utc')::date - 1) and ((now() at time zone 'utc')::date + 1)
  );
