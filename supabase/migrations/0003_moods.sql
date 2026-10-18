-- Luna: duygu kaydı ve haftalık şişe arşivi
-- Supabase panelinde SQL Editor'a yapıştırıp çalıştır (0002'den sonra).

create table public.moods (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  -- 6 duygu, 0..10 puan: {"mutluluk":7,"enerji":5,"huzur":6,"kaygi":3,"sevgi":8,"motivasyon":4}
  "values" jsonb not null,
  -- "Bugün ne oldu?" notu, en çok 280 karakter.
  note text check (char_length(note) <= 280),
  created_at timestamptz not null default now(),
  -- Günde bir kayıt.
  unique (user_id, date),
  check (
    jsonb_typeof("values") = 'object'
    and "values" ?& array['mutluluk', 'enerji', 'huzur', 'kaygi', 'sevgi', 'motivasyon']
  )
);

-- Row Level Security: herkes yalnızca kendi satırını okur ve yazar.
alter table public.moods enable row level security;

create policy "moods_select_own" on public.moods
  for select to authenticated
  using (auth.uid() = user_id);

-- Tarih istemcinin yerel gününden gelir; saat dilimi farkı için sunucu gününün
-- bir gün önce/sonrasına izin verilir.
create policy "moods_insert_own" on public.moods
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and date between ((now() at time zone 'utc')::date - 1) and ((now() at time zone 'utc')::date + 1)
  );

create policy "moods_update_own" on public.moods
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.bottle_archive (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Haftanın pazartesisi.
  week_start date not null,
  -- {"label":"12–18 Ekim","best":"Huzur","keys":["2026-10-12",...],"avg":{"mutluluk":"6,5",...}}
  summary jsonb not null,
  created_at timestamptz not null default now(),
  -- Haftada bir şişe.
  unique (user_id, week_start)
);

alter table public.bottle_archive enable row level security;

create policy "bottle_archive_select_own" on public.bottle_archive
  for select to authenticated
  using (auth.uid() = user_id);

create policy "bottle_archive_insert_own" on public.bottle_archive
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "bottle_archive_update_own" on public.bottle_archive
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
