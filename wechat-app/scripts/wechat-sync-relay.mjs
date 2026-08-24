#!/usr/bin/env node
/**
 * WeiChat zero-cost sync relay — SSE broadcast + JSON persistence.
 * Free to run locally or on any Node host (Render/Railway/Fly free tiers).
 *
 *   node scripts/wechat-sync-relay.mjs
 *   WECHAT_RELAY_PORT=8765 WECHAT_RELAY_DATA=./data/relay.json
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const PORT = Number(process.env.WECHAT_RELAY_PORT || 8765);
const HOST = process.env.WECHAT_RELAY_HOST || '0.0.0.0';
const DATA_FILE = process.env.WECHAT_RELAY_DATA
  || path.join(process.cwd(), 'data', 'relay-store.json');
const MAX_MESSAGES = Number(process.env.WECHAT_RELAY_MAX_MESSAGES || 2000);

const clients = new Set();

function loadStore() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
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

function saveStore(store) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 0));
}

let store = loadStore();

function sendSse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function broadcast(event, data) {
  for (const res of clients) {
    try { sendSse(res, event, data); } catch { clients.delete(res); }
  }
}

function upsertProfile(payload) {
  if (!payload?.wechat_id) return;
  const id = payload.wechat_id.toLowerCase();
  const idx = store.profiles.findIndex((p) => p.wechat_id?.toLowerCase() === id);
  if (idx >= 0) store.profiles[idx] = { ...store.profiles[idx], ...payload };
  else store.profiles.push(payload);
}

function appendMessage(payload) {
  if (!payload?.id) return;
  if (store.messages.some((m) => m.id === payload.id)) return;
  store.messages.push(payload);
  if (store.messages.length > MAX_MESSAGES) {
    store.messages = store.messages.slice(-MAX_MESSAGES);
  }
}

function upsertMoment(payload) {
  if (!payload?.id) return;
  const idx = store.moments.findIndex((m) => m.id === payload.id);
  if (idx >= 0) {
    store.moments[idx] = { ...store.moments[idx], ...payload };
  } else {
    store.moments.unshift(payload);
  }
  store.moments = store.moments.slice(0, 200);
}

function syncPayloadForUser(wechatId) {
  const me = wechatId?.toLowerCase();
  if (!me) return { messages: [], profiles: store.profiles, moments: store.moments };

  const messages = store.messages.filter(
    (m) =>
      m.sender_wechat_id?.toLowerCase() === me
      || m.chat_id?.toLowerCase().includes(me),
  );
  return { messages, profiles: store.profiles, moments: store.moments };
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      clients: clients.size,
      messages: store.messages.length,
      profiles: store.profiles.length,
      mode: 'zero-cost-relay',
    }));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/sync') {
    const wechatId = url.searchParams.get('wechatId') || '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(syncPayloadForUser(wechatId)));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/profile') {
    const wechatId = url.searchParams.get('wechatId') || '';
    const me = wechatId?.toLowerCase();
    const profile = store.profiles.find((p) => p.wechat_id?.toLowerCase() === me) || null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: Boolean(profile), profile }));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/broadcast') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      try {
        const { type, payload, from } = JSON.parse(body);
        const event = type || 'message';

        if (event === 'message' && payload) appendMessage(payload);
        if (event === 'profile' && payload) upsertProfile(payload);
        if (event === 'moment' && payload) upsertMoment(payload);

        saveStore(store);
        broadcast(event, { payload, from });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, clients: clients.size, stored: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: String(e.message) }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, HOST, () => {
  console.log(`WeiChat relay (zero-cost) http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}`);
  console.log(`Data: ${DATA_FILE}`);
});
