-- Luna: arkadaşlıklar, gruplar ve sohbet
-- Supabase panelinde SQL Editor'a yapıştırıp çalıştır (0001'den sonra).

-- ---------------------------------------------------------------------------
-- Arkadaşlıklar
-- ---------------------------------------------------------------------------

-- Bir arkadaşlık iki satırdır: (a→b) ve (b→a). Her kullanıcı karşısındakini
-- kendi gözünden etiketler, bu yüzden ilişki türü ve geçmişi satır başınadır.
create table public.friendships (
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  rel_type text not null default 'Arkadaş'
    check (rel_type in ('Arkadaş', 'Aile', 'Flört', 'Partner', 'İş arkadaşı', 'Eski sevgili')),
  -- Tür değişiklikleri: [{"from":"Arkadaş","to":"Flört","date":"2026-09-02"}]
  -- Elle yazılmaz; rel_type değişince tetikleyici ekler.
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a <> user_b)
);

alter table public.friendships enable row level security;

-- Herkes yalnızca kendi gözünden yazılmış satırları görür.
create policy "friendships_select_own" on public.friendships
  for select to authenticated
  using (auth.uid() = user_a);

-- Satır açmak yalnızca add_friend_by_code ile olur (insert politikası yok).
-- Güncellemede yalnızca rel_type değişebilir; history'yi tetikleyici yazar.
create policy "friendships_update_own" on public.friendships
  for update to authenticated
  using (auth.uid() = user_a)
  with check (auth.uid() = user_a);

revoke update on public.friendships from authenticated;
grant update (rel_type) on public.friendships to authenticated;

create function public.friendships_log_rel_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.rel_type is distinct from old.rel_type then
    new.history := old.history || jsonb_build_array(jsonb_build_object(
      'from', old.rel_type,
      'to', new.rel_type,
      'date', to_char(now() at time zone 'utc', 'YYYY-MM-DD')
    ));
  end if;
  return new;
end;
$$;

create trigger friendships_log_rel_change
  before update on public.friendships
  for each row execute function public.friendships_log_rel_change();

-- Arkadaş kodları: kullanıcı adı herkese açık olduğu için ekleme onun
-- bilinmesiyle değil, kişinin QR'da gösterdiği kısa ömürlü, tek kullanımlık
-- kodla olur. Tabloya istemci doğrudan erişemez; yalnızca aşağıdaki RPC'ler.
create table public.friend_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code text not null unique check (char_length(code) >= 10),
  expires_at timestamptz not null
);

alter table public.friend_codes enable row level security;
revoke all on public.friend_codes from anon, authenticated;

-- Oturumdaki kullanıcıya 10 dakikalık yeni kod üretir, eskisini siler.
create function public.my_friend_code()
returns table (code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'oturum_yok' using errcode = '28000';
  end if;

  delete from public.friend_codes fc
  where fc.user_id = me or fc.expires_at <= now();

  -- 32 onaltılık karakter = 122 bit rastgelelik.
  return query
  insert into public.friend_codes (user_id, code, expires_at)
  values (me, replace(gen_random_uuid()::text, '-', ''), now() + interval '10 minutes')
  returning friend_codes.code, friend_codes.expires_at;
end;
$$;

revoke execute on function public.my_friend_code() from public, anon;
grant execute on function public.my_friend_code() to authenticated;

-- Geçerli bir kodla iki yönlü arkadaşlık açar; kod tek kullanımlıktır.
-- Yanlış, süresi dolmuş ya da kullanılmış kod için hata aynıdır.
create function public.add_friend_by_code(p_code text)
returns table (id uuid, name text, handle text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  owner_id uuid;
begin
  if me is null then
    raise exception 'oturum_yok' using errcode = '28000';
  end if;

  -- Silme ve okuma tek adımda: iki istek aynı kodu kullanamaz.
  delete from public.friend_codes fc
  where fc.code = lower(btrim(p_code))
    and fc.expires_at > now()
    and fc.user_id <> me
  returning fc.user_id into owner_id;

  if owner_id is null then
    -- Kendi kodunu kullanma denemesi kodu tüketmez.
    if exists (
      select 1 from public.friend_codes fc
      where fc.code = lower(btrim(p_code)) and fc.expires_at > now() and fc.user_id = me
    ) then
      raise exception 'kendini_ekleyemezsin' using errcode = '22023';
    end if;
    raise exception 'kod_gecersiz' using errcode = 'P0002';
  end if;

  insert into public.friendships (user_a, user_b)
  values (me, owner_id), (owner_id, me)
  on conflict do nothing;

  return query
  select p.id, p.name, p.handle from public.profiles p where p.id = owner_id;
end;
$$;

revoke execute on function public.add_friend_by_code(text) from public, anon;
grant execute on function public.add_friend_by_code(text) to authenticated;

-- Arkadaşlığı iki yönlü siler. Ortak gruplara dokunmaz.
create function public.remove_friend(p_friend uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.friendships f
  where (f.user_a = auth.uid() and f.user_b = p_friend)
     or (f.user_a = p_friend and f.user_b = auth.uid());
$$;

revoke execute on function public.remove_friend(uuid) from public, anon;
grant execute on function public.remove_friend(uuid) to authenticated;

-- Arkadaşlar birbirinin profilinden yalnızca ad, kullanıcı adı, avatar ve
-- doğum haritası alanlarını okur. profiles'a yeni bir select politikası
-- eklemek doğum yeri gibi öteki sütunları da açardı; bu yüzden sütunlar bu
-- fonksiyonla sınırlanır. Doğum saati yalnızca kullanıcı biliyorsa döner.
create function public.friend_list()
returns table (
  id uuid,
  name text,
  handle text,
  avatar text,
  birth_date date,
  birth_time time,
  birth_time_known boolean,
  lat double precision,
  lon double precision,
  timezone text,
  rel_type text,
  history jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    p.id, p.name, p.handle, p.avatar,
    p.birth_date,
    case when p.birth_time_known then p.birth_time end,
    p.birth_time_known,
    p.lat, p.lon, p.timezone,
    f.rel_type, f.history, f.created_at
  from public.friendships f
  join public.profiles p on p.id = f.user_b
  where f.user_a = auth.uid()
  order by f.created_at;
$$;

revoke execute on function public.friend_list() from public, anon;
grant execute on function public.friend_list() to authenticated;

-- ---------------------------------------------------------------------------
-- Gruplar
-- ---------------------------------------------------------------------------

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  owner uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id);

-- Politikalar kendi tablosunu sorgulayıp sonsuz döngüye girmesin diye üyelik
-- kontrolü security definer fonksiyonla yapılır.
create function public.is_group_member(p_group uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group and user_id = auth.uid()
  );
$$;

revoke execute on function public.is_group_member(uuid) from public, anon;
grant execute on function public.is_group_member(uuid) to authenticated;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Grup açmak create_group ile olur (insert politikası yok).
create policy "groups_select_member" on public.groups
  for select to authenticated
  using (public.is_group_member(id));

-- Adı yalnızca üyeler değiştirir; sahibi değişmez.
create policy "groups_update_member" on public.groups
  for update to authenticated
  using (public.is_group_member(id))
  with check (public.is_group_member(id));

revoke update on public.groups from authenticated;
grant update (name) on public.groups to authenticated;

-- Grubu yalnızca sahibi siler.
create policy "groups_delete_owner" on public.groups
  for delete to authenticated
  using (auth.uid() = owner);

create policy "group_members_select_member" on public.group_members
  for select to authenticated
  using (public.is_group_member(group_id));

-- Üyeleri yalnızca üyeler ekler ve çıkarır. Eklenen kişi, ekleyenin
-- arkadaşı olmalı.
create policy "group_members_insert_member" on public.group_members
  for insert to authenticated
  with check (
    public.is_group_member(group_id)
    and exists (
      select 1 from public.friendships f
      where f.user_a = auth.uid() and f.user_b = user_id
    )
  );

create policy "group_members_delete_member" on public.group_members
  for delete to authenticated
  using (public.is_group_member(group_id));

-- Sahibi üye olarak ekleyip arkadaş olan kişileri gruba katar.
create function public.create_group(p_name text, p_members uuid[])
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  gid uuid;
begin
  if me is null then
    raise exception 'oturum_yok' using errcode = '28000';
  end if;

  insert into public.groups (name, owner) values (btrim(p_name), me)
  returning id into gid;

  insert into public.group_members (group_id, user_id) values (gid, me);

  insert into public.group_members (group_id, user_id)
  select gid, f.user_b
  from public.friendships f
  where f.user_a = me and f.user_b = any (coalesce(p_members, '{}'));

  return gid;
end;
$$;

revoke execute on function public.create_group(text, uuid[]) from public, anon;
grant execute on function public.create_group(text, uuid[]) to authenticated;

-- Grup üyelerinin görünen bilgisi. Bir üye ekleyenin arkadaşı olsa da öteki
-- üyelerle arkadaş olmayabilir; sohbette ad gösterebilmek için yalnızca ad,
-- kullanıcı adı ve avatar döner.
create function public.group_member_info(p_group uuid)
returns table (id uuid, name text, handle text, avatar text)
language sql
security definer
set search_path = ''
stable
as $$
  select p.id, p.name, p.handle, p.avatar
  from public.group_members m
  join public.profiles p on p.id = m.user_id
  where m.group_id = p_group
    and public.is_group_member(p_group)
  order by m.added_at;
$$;

revoke execute on function public.group_member_info(uuid) from public, anon;
grant execute on function public.group_member_info(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Mesajlar
-- ---------------------------------------------------------------------------

-- room_id: grup sohbetinde grubun uuid'si; herkese açık kozmik olay odasında
-- 'olay-YYYY-AA-GG' (olay günü). sender null ise sistem mesajıdır.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  sender uuid references auth.users (id) on delete set null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default clock_timestamp()
);

create index messages_room_idx on public.messages (room_id, created_at);

create function public.is_event_room(p_room text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_room ~ '^olay-[0-9]{4}-[0-9]{2}-[0-9]{2}$';
$$;

-- Okuma/yazma yetkisi: grup odasında üyelik, olay odasında oturum (olay günü
-- gelmeden yazılamaz; saat dilimi payı için bir gün erken).
create function public.can_read_room(p_room text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select case
    when public.is_event_room(p_room) then true
    when p_room ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_group_member(p_room::uuid)
    else false
  end;
$$;

create function public.can_write_room(p_room text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select case
    when public.is_event_room(p_room)
      then substr(p_room, 6)::date <= (now() at time zone 'utc')::date + 1
    else public.can_read_room(p_room)
  end;
$$;

revoke execute on function public.can_read_room(text) from public, anon;
revoke execute on function public.can_write_room(text) from public, anon;
grant execute on function public.can_read_room(text) to authenticated;
grant execute on function public.can_write_room(text) to authenticated;

alter table public.messages enable row level security;

create policy "messages_select_room" on public.messages
  for select to authenticated
  using (public.can_read_room(room_id));

create policy "messages_insert_room" on public.messages
  for insert to authenticated
  with check (sender = auth.uid() and public.can_write_room(room_id));

-- Mesajlar değiştirilmez ve silinmez (update/delete politikası yok).

-- Grup silinince sohbeti de gider.
create function public.groups_delete_messages()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.messages where room_id = old.id::text;
  return old;
end;
$$;

create trigger groups_delete_messages
  after delete on public.groups
  for each row execute function public.groups_delete_messages();

-- Sistem mesajları ("Mert gruba eklendi"): istemci yazamaz, tetikleyici yazar.
create function public.group_members_system_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  gid uuid := coalesce(new.group_id, old.group_id);
  uid uuid := coalesce(new.user_id, old.user_id);
  who text;
begin
  -- Grup silinirken üyeler zincirleme gider; mesaj yazma.
  if not exists (select 1 from public.groups where id = gid) then
    return null;
  end if;
  -- Grubu açan sahibi için mesaj yok.
  if tg_op = 'INSERT' and exists (select 1 from public.groups where id = gid and owner = uid) then
    return null;
  end if;

  select coalesce(nullif(btrim(p.name), ''), 'Biri') into who
  from public.profiles p where p.id = uid;

  insert into public.messages (room_id, sender, body)
  values (
    gid::text,
    null,
    left(coalesce(who, 'Biri') || case tg_op when 'INSERT' then ' gruba eklendi' else ' gruptan çıkarıldı' end, 500)
  );
  return null;
end;
$$;

create trigger group_members_system_message
  after insert or delete on public.group_members
  for each row execute function public.group_members_system_message();

-- Anlık sohbet için Realtime (RLS, abonelere de uygulanır).
alter publication supabase_realtime add table public.messages;
