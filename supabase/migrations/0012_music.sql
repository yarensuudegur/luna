-- Luna: günün şarkısı, "şu an dinliyorum" notu ve şarkıya gelen cevaplar.
-- Supabase panelinde SQL Editor'a yapıştırıp çalıştır (0011'den sonra).
--
-- Şarkı her yerde aynı biçimde jsonb olarak durur:
-- {"id":"123","title":"Şımarık","artist":"Tarkan","art":"https://...jpg","url":"https://music.apple.com/..."}

-- ---------------------------------------------------------------------------
-- 1) Günün şarkısı: duygu kaydına isteğe bağlı şarkı
-- ---------------------------------------------------------------------------

alter table public.moods add column if not exists song jsonb;

alter table public.moods drop constraint if exists moods_song_shape;
alter table public.moods add constraint moods_song_shape check (
  song is null
  or (
    jsonb_typeof(song) = 'object'
    and song ? 'title' and song ? 'artist'
    and char_length(song::text) <= 1500
  )
);

-- ---------------------------------------------------------------------------
-- 2) Şu an dinliyorum: profildeki not (Instagram notu gibi 24 saat görünür)
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists now_playing jsonb;
alter table public.profiles add column if not exists now_playing_at timestamptz;

alter table public.profiles drop constraint if exists profiles_now_playing_shape;
alter table public.profiles add constraint profiles_now_playing_shape check (
  now_playing is null
  or (
    jsonb_typeof(now_playing) = 'object'
    and now_playing ? 'title' and now_playing ? 'artist'
    and char_length(now_playing::text) <= 1500
  )
);

-- Arkadaşların son 24 saatteki şarkıları. profiles'a yeni select politikası
-- açmak öteki sütunları da açardı; bu yüzden yalnızca şarkı döner.
create or replace function public.friend_songs()
returns table (id uuid, song jsonb, set_at timestamptz)
language sql
security definer
set search_path = ''
stable
as $$
  select p.id, p.now_playing, p.now_playing_at
  from public.friendships f
  join public.profiles p on p.id = f.user_b
  where f.user_a = auth.uid()
    and p.now_playing is not null
    and p.now_playing_at > now() - interval '24 hours';
$$;

revoke execute on function public.friend_songs() from public, anon;
grant execute on function public.friend_songs() to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Şarkıya cevap: arkadaşın notuna kısa mesaj
-- ---------------------------------------------------------------------------

create table if not exists public.song_replies (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references auth.users (id) on delete cascade,
  recipient uuid not null references auth.users (id) on delete cascade,
  -- Cevap yazıldığı andaki şarkı (sonradan not değişse de cevap anlamını korur).
  song jsonb not null,
  body text not null check (char_length(body) between 1 and 200),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists song_replies_recipient_idx on public.song_replies (recipient, created_at desc);

alter table public.song_replies enable row level security;

-- Gönderen de alan da görür; yazma yalnızca aşağıdaki fonksiyonla.
drop policy if exists "song_replies_select_own" on public.song_replies;
create policy "song_replies_select_own" on public.song_replies
  for select to authenticated
  using (auth.uid() = sender or auth.uid() = recipient);

-- Arkadaşın şu anki şarkısına cevap yazar; şarkı sunucuda kopyalanır.
create or replace function public.reply_to_song(p_friend uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  s jsonb;
begin
  if me is null then
    raise exception 'oturum_yok' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.friendships f where f.user_a = me and f.user_b = p_friend
  ) then
    raise exception 'arkadas_degil' using errcode = '42501';
  end if;

  select p.now_playing into s
  from public.profiles p
  where p.id = p_friend
    and p.now_playing is not null
    and p.now_playing_at > now() - interval '24 hours';
  if s is null then
    raise exception 'sarki_yok' using errcode = 'P0002';
  end if;

  insert into public.song_replies (sender, recipient, song, body)
  values (me, p_friend, s, left(btrim(p_body), 200));
end;
$$;

revoke execute on function public.reply_to_song(uuid, text) from public, anon;
grant execute on function public.reply_to_song(uuid, text) to authenticated;

-- Bana gelen cevaplar, gönderenin adıyla (son 30 gün).
create or replace function public.my_song_replies()
returns table (id uuid, sender_name text, sender_avatar text, song jsonb, body text, read boolean, created_at timestamptz)
language sql
security definer
set search_path = ''
stable
as $$
  select r.id, p.name, p.avatar, r.song, r.body, r.read, r.created_at
  from public.song_replies r
  left join public.profiles p on p.id = r.sender
  where r.recipient = auth.uid()
    and r.created_at > now() - interval '30 days'
  order by r.created_at desc
  limit 50;
$$;

revoke execute on function public.my_song_replies() from public, anon;
grant execute on function public.my_song_replies() to authenticated;

-- Cevapları okundu yapar.
create or replace function public.read_song_replies()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.song_replies set read = true
  where recipient = auth.uid() and not read;
$$;

revoke execute on function public.read_song_replies() from public, anon;
grant execute on function public.read_song_replies() to authenticated;
