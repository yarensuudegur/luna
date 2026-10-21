// Luna: şarkı arama (Supabase Edge Function, Deno).
// Apple'ın ücretsiz ve anahtarsız iTunes Search API'sini çağırır. Tarayıcı
// iTunes'a doğrudan istek atamadığı (CORS) için arama buradan geçer.
// İstek: POST {"q": "tarkan şımarık"} → {"songs": [{id,title,artist,art,url}]}

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

type ItunesTrack = {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  artworkUrl100?: string;
  trackViewUrl?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'method' });

  let q = '';
  try {
    const body = (await req.json()) as { q?: unknown };
    q = typeof body.q === 'string' ? body.q.trim().slice(0, 80) : '';
  } catch {
    return json(400, { error: 'body' });
  }
  if (q.length < 2) return json(200, { songs: [] });

  const url = new URL('https://itunes.apple.com/search');
  url.searchParams.set('term', q);
  url.searchParams.set('media', 'music');
  url.searchParams.set('entity', 'song');
  url.searchParams.set('limit', '12');
  url.searchParams.set('country', 'TR');

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return json(502, { error: 'itunes' });
    const data = (await res.json()) as { results?: ItunesTrack[] };
    const songs = (data.results ?? [])
      .filter((t) => t.trackId && t.trackName && t.artistName)
      .map((t) => ({
        id: String(t.trackId),
        title: t.trackName!.slice(0, 200),
        artist: t.artistName!.slice(0, 200),
        // 100x100 yerine daha net bir kapak.
        art: t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb', '400x400bb') : null,
        url: t.trackViewUrl ?? null,
      }));
    return json(200, { songs });
  } catch {
    return json(502, { error: 'itunes' });
  }
});
