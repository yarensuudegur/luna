-- Luna: profiller
-- Supabase panelinde SQL Editor'a yapıştırıp çalıştır.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  handle text unique,
  birth_date date,
  birth_time time,
  birth_time_known boolean not null default false,
  birth_place text,
  lat double precision,
  lon double precision,
  timezone text,
  avatar text,
  created_at timestamptz not null default now(),
  constraint profiles_handle_format check (handle is null or handle ~ '^[a-z0-9_.]{3,20}$')
);

-- Row Level Security: herkes yalnızca kendi satırını okuyup yazabilir.
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Yeni kullanıcı kaydolunca boş profil satırı aç.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Kullanıcı adı müsait mi? RLS başkalarının satırını göstermediği için
-- kontrol, yalnızca true/false döndüren bu fonksiyonla yapılır.
create function public.handle_available(p_handle text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select not exists (
    select 1 from public.profiles
    where handle = lower(p_handle) and id <> auth.uid()
  );
$$;

revoke execute on function public.handle_available(text) from public, anon;
grant execute on function public.handle_available(text) to authenticated;
