-- Luna: gelecek mesajları arşivi. Kullanıcı yalnızca kendisine teslim edilmiş
-- (vakti gelmiş) mesajlarını silebilir; bekleyen mesajlar silinemez ve görünmez.
create policy "future_messages_delete_due_own" on public.future_messages
  for delete to authenticated
  using (auth.uid() = user_id and deliver_at <= now());

grant delete on public.future_messages to authenticated;
