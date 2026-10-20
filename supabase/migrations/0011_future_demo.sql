-- Luna: gelecekteki kendine mesaj — demo gönderimi (derste göstermek için)
-- Supabase panelinde SQL Editor'a yapıştırıp çalıştır (0010'dan sonra).
--
-- Demo mesajı 28 gün beklemez, 10 saniye sonra teslim edilir. Gerçek mesajlarla aynı
-- tabloda durur, arşivde görünür ve silinebilir; yalnızca "demo" işaretlidir.

alter table public.future_messages add column demo boolean not null default false;

-- "En az 28 gün sonra" kuralı demo mesajlar için geçerli değil.
do $$
declare
  c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.future_messages'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%28 days%'
  loop
    execute format('alter table public.future_messages drop constraint %I', c);
  end loop;
end;
$$;

alter table public.future_messages
  add constraint future_messages_deliver_check
  check (demo or deliver_at >= created_at + interval '28 days');

-- Demo mesajı bırakır: 10 saniye sonra teslim. Bekleyen demo mesajı en çok 5.
create function public.send_future_message_demo(p_body text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  clean text := btrim(coalesce(p_body, ''));
  deliver timestamptz := now() + interval '10 seconds';
begin
  if me is null then
    raise exception 'oturum_yok' using errcode = '28000';
  end if;
  if char_length(clean) not between 1 and 1000 then
    raise exception 'mesaj_gecersiz' using errcode = '22023';
  end if;
  if (select count(*) from public.future_messages m
      where m.user_id = me and m.demo and m.deliver_at > now()) >= 5 then
    raise exception 'cok_fazla_bekleyen' using errcode = '54000';
  end if;

  insert into public.future_messages (user_id, body, deliver_at, demo)
  values (me, clean, deliver, true);
  return deliver;
end;
$$;

revoke all on function public.send_future_message_demo(text) from public, anon;
grant execute on function public.send_future_message_demo(text) to authenticated;
