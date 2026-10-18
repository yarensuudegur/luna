-- Luna: gelecekteki kendine mesaj
-- Supabase panelinde SQL Editor'a yapıştırıp çalıştır (0001'den sonra).

create table public.future_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  deliver_at timestamptz not null,
  opened_at timestamptz,
  -- Teslim, gönderimden en az 28 gün sonra.
  check (deliver_at >= created_at + interval '28 days')
);

create index future_messages_user_deliver_idx
  on public.future_messages (user_id, deliver_at);

-- Row Level Security: yalnızca kendi mesajını ve yalnızca vakti gelmişse okuyabilirsin.
-- Vakti gelmeden kendi mesajını bile göremezsin. Ekleme ve güncelleme doğrudan yapılamaz;
-- yalnızca aşağıdaki iki fonksiyonla.
alter table public.future_messages enable row level security;

create policy "future_messages_select_due_own" on public.future_messages
  for select to authenticated
  using (auth.uid() = user_id and deliver_at <= now());

revoke all on public.future_messages from anon, authenticated;
grant select on public.future_messages to authenticated;

-- Mesajı bırakır. Teslim zamanı istemciden gelir (ay evresi hesabı cihazda yapılır),
-- ama veritabanı en az 28 gün sonra ve en çok 1 yıl sonra olduğunu doğrular.
-- Bekleyen mesaj sayısı 20 ile sınırlıdır. Teslim zamanını döndürür.
create function public.send_future_message(p_body text, p_deliver_at timestamptz)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  clean text := btrim(coalesce(p_body, ''));
begin
  if me is null then
    raise exception 'oturum_yok' using errcode = '28000';
  end if;
  if char_length(clean) not between 1 and 1000 then
    raise exception 'mesaj_gecersiz' using errcode = '22023';
  end if;
  if p_deliver_at is null
     or p_deliver_at < now() + interval '28 days'
     or p_deliver_at > now() + interval '1 year' then
    raise exception 'tarih_gecersiz' using errcode = '22023';
  end if;
  if (select count(*) from public.future_messages m
      where m.user_id = me and m.deliver_at > now()) >= 20 then
    raise exception 'cok_fazla_bekleyen' using errcode = '54000';
  end if;

  insert into public.future_messages (user_id, body, deliver_at)
  values (me, clean, p_deliver_at);
  return p_deliver_at;
end;
$$;

-- Vakti gelmiş kendi mesajını açıldı olarak işaretler.
create function public.open_future_message(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.future_messages
  set opened_at = coalesce(opened_at, now())
  where id = p_id and user_id = auth.uid() and deliver_at <= now();
$$;

revoke all on function public.send_future_message(text, timestamptz) from public, anon;
revoke all on function public.open_future_message(uuid) from public, anon;
grant execute on function public.send_future_message(text, timestamptz) to authenticated;
grant execute on function public.open_future_message(uuid) to authenticated;
