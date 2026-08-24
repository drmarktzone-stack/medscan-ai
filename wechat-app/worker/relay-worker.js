/**
 * WeiChat zero-cost relay — Cloudflare Worker (SSE + KV persistence).
 *
 * Deploy (free tier):
 *   cd wechat-app/worker && npx wrangler deploy
 *
 * Bind KV namespace "WEICHAT_STORE" in wrangler.toml, then set:
 *   VITE_RELAY_URL=https://your-worker.workers.dev
 */

const MAX_MESSAGES = 2000;
const MAX_MOMENTS = 200;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

async function loadStore(env) {
  if (!env.WEICHAT_STORE) {
    return { messages: [], profiles: [], moments: [] };
  }
  const raw = await env.WEICHAT_STORE.get('store');
  if (!raw) return { messages: [], profiles: [], moments: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
      moments: Array.isArray(parsed.moments) ? parsed.moments : [],
    };
  } catch {
    return { messages: [], profiles: [], moments: [] };
  }
}

async function saveStore(env, store) {
  if (!env.WEICHAT_STORE) return;
  await env.WEICHAT_STORE.put('store', JSON.stringify(store));
}

function upsertProfile(store, payload) {
  if (!payload?.wechat_id) return;
  const id = payload.wechat_id.toLowerCase();
  const idx = store.profiles.findIndex((p) => p.wechat_id?.toLowerCase() === id);
  if (idx >= 0) store.profiles[idx] = { ...store.profiles[idx], ...payload };
  else store.profiles.push(payload);
}

function appendMessage(store, payload) {
  if (!payload?.id) return;
  if (store.messages.some((m) => m.id === payload.id)) return;
  store.messages.push(payload);
  if (store.messages.length > MAX_MESSAGES) {
    store.messages = store.messages.slice(-MAX_MESSAGES);
  }
}

function upsertMoment(store, payload) {
  if (!payload?.id) return;
  const idx = store.moments.findIndex((m) => m.id === payload.id);
  if (idx >= 0) store.moments[idx] = { ...store.moments[idx], ...payload };
  else store.moments.unshift(payload);
  store.moments = store.moments.slice(0, MAX_MOMENTS);
}

function syncPayloadForUser(store, wechatId) {
  const me = wechatId?.toLowerCase();
  if (!me) return { messages: [], profiles: store.profiles, moments: store.moments };
  const messages = store.messages.filter(
    (m) =>
      m.sender_wechat_id?.toLowerCase() === me
      || m.chat_id?.toLowerCase().includes(me),
  );
  return { messages, profiles: store.profiles, moments: store.moments };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      const store = await loadStore(env);
      return json({
        ok: true,
        mode: 'zero-cost-worker',
        messages: store.messages.length,
        profiles: store.profiles.length,
        kv: Boolean(env.WEICHAT_STORE),
      });
    }

    if (request.method === 'GET' && url.pathname === '/sync') {
      const store = await loadStore(env);
      const wechatId = url.searchParams.get('wechatId') || '';
      return json(syncPayloadForUser(store, wechatId));
    }

    if (request.method === 'GET' && url.pathname === '/profile') {
      const store = await loadStore(env);
      const wechatId = url.searchParams.get('wechatId') || '';
      const me = wechatId?.toLowerCase();
      const profile = store.profiles.find((p) => p.wechat_id?.toLowerCase() === me) || null;
      return json({ ok: Boolean(profile), profile });
    }

    if (request.method === 'GET' && url.pathname === '/events') {
      if (!env.WEICHAT_HUB) {
        return json({ ok: false, error: 'Durable Object not configured' }, 501);
      }
      const id = env.WEICHAT_HUB.idFromName('global');
      const stub = env.WEICHAT_HUB.get(id);
      return stub.fetch(request);
    }

    if (request.method === 'POST' && url.pathname === '/broadcast') {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: 'invalid json' }, 400);
      }

      const { type, payload, from } = body;
      const event = type || 'message';
      const store = await loadStore(env);

      if (event === 'message' && payload) appendMessage(store, payload);
      if (event === 'profile' && payload) upsertProfile(store, payload);
      if (event === 'moment' && payload) upsertMoment(store, payload);

      await saveStore(env, store);

      if (env.WEICHAT_HUB) {
        const id = env.WEICHAT_HUB.idFromName('global');
        const stub = env.WEICHAT_HUB.get(id);
        await stub.fetch(new Request('https://hub/broadcast', {
          method: 'POST',
          body: JSON.stringify({ event, payload, from }),
        }));
      }

      return json({ ok: true, stored: true });
    }

    return new Response('not found', { status: 404, headers: corsHeaders() });
  },
};

export class RelayHub {
  constructor(state) {
    this.state = state;
    this.clients = [];
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/broadcast') {
      const { event, payload, from } = await request.json();
      const data = JSON.stringify({ payload, from });
      for (const writer of this.clients) {
        try {
          await writer.write(`event: ${event}\ndata: ${data}\n\n`);
        } catch {
          /* drop */
        }
      }
      return new Response(JSON.stringify({ ok: true }));
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    this.clients.push(writer);

    const encoder = new TextEncoder();
    await writer.write(encoder.encode(': connected\n\n'));

    request.signal?.addEventListener('abort', () => {
      this.clients = this.clients.filter((w) => w !== writer);
      writer.close().catch(() => {});
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        ...corsHeaders(),
      },
    });
  }
}
