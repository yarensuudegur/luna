// Luna: hesabı sil (Supabase Edge Function, Deno).
// Kullanıcıyı JWT'den doğrular, service role ile auth.admin.deleteUser çağırır.
// Tablolar auth.users'a on delete cascade bağlı olduğundan veriler birlikte silinir.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return json(500, { error: 'not_configured' });

  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'unauthorized' });

  const user = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
  const { data, error } = await user.auth.getUser(token);
  if (error || !data.user) return json(401, { error: 'unauthorized' });

  const admin = createClient(url, serviceKey);
  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) {
    console.error('delete_user', deleteError.message);
    return json(500, { error: 'delete_failed' });
  }

  return json(200, { ok: true });
});
