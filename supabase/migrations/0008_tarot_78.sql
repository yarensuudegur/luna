-- Luna: tarot destesi 22'den 78 karta çıkar (22 büyük + 56 küçük arkana).
-- Supabase panelinde SQL Editor'a yapıştırıp çalıştır (0007'den sonra).
--
-- Kart sırası src/i18n/tr.json içindeki "tarot" ile aynı:
--   0..21   büyük arkana (Deli'den Dünya'ya)
--   22..35  Asalar, 36..49 Kupalar, 50..63 Kılıçlar, 64..77 Tılsımlar (As'tan Papaz'a)

-- 0002'deki satır içi kontrol (card between 0 and 21) otomatik adla durur; adı ne olursa olsun bul ve kaldır.
do $$
declare
  c text;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.daily_tarot'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%card%'
  loop
    execute format('alter table public.daily_tarot drop constraint %I', c);
  end loop;
end $$;

alter table public.daily_tarot
  add constraint daily_tarot_card_check check (card between 0 and 77);

comment on column public.daily_tarot.card is '0..77: src/i18n/tr.json içindeki tarot sırası.';
