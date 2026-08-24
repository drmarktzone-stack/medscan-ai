/**
 * Zero-cost relay integration test (Node, no browser).
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 9876 + Math.floor(Math.random() * 100);
const RELAY = `http://127.0.0.1:${PORT}`;
const DATA = path.join(__dirname, '../data/test-relay-store.json');

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  return { ok: res.ok, status: res.status, json: await res.json().catch(() => null), text: await res.text().catch(() => '') };
}

const relay = spawn('node', ['scripts/wechat-sync-relay.mjs'], {
  cwd: path.join(__dirname, '..'),
  env: { ...process.env, WECHAT_RELAY_DATA: DATA, WECHAT_RELAY_PORT: String(PORT) },
  stdio: 'pipe',
});

try {
  let health = { ok: false };
  for (let i = 0; i < 20; i += 1) {
    await wait(200);
    health = await fetchJson(`${RELAY}/health`);
    if (health.ok) break;
  }
  assert.ok(health.ok, `relay health (${health.text || health.status})`);

  const msg = {
    id: 'test-msg-1',
    chat_id: 'direct:dr_samar:user_b',
    sender_wechat_id: 'dr_samar',
    content: 'zero-cost ping',
    msg_type: 'text',
    created_at: new Date().toISOString(),
  };

  const post = await fetchJson(`${RELAY}/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'message', payload: msg, from: 'dr_samar' }),
  });
  assert.ok(post.ok, 'broadcast ok');

  const sync = await fetchJson(`${RELAY}/sync?wechatId=user_b`);
  assert.ok(sync.ok, `sync ok (${sync.text})`);
  assert.ok(sync.json.messages.some((m) => m.id === 'test-msg-1'), 'message persisted');

  const profile = {
    wechat_id: 'user_b',
    display_name: 'User B',
    avatar: '🧪',
    updated_at: new Date().toISOString(),
  };
  await fetchJson(`${RELAY}/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'profile', payload: profile, from: 'user_b' }),
  });

  const prof = await fetchJson(`${RELAY}/profile?wechatId=user_b`);
  assert.equal(prof.json.profile.display_name, 'User B');

  console.log('relay.test.mjs: ok');
} finally {
  relay.kill('SIGTERM');
}
