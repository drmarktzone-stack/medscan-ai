# WeiChat — מודל אפס עלות

מדריך להפעלת **WeiChat 微聊** בלי שירותים בתשלום. המודל עובד היום — localStorage + relay חינמי.

## ארכיטקטורה

```
┌─────────────┐     SSE /broadcast     ┌──────────────┐
│  WeiChat PWA │ ◄──────────────────► │ Relay (חינם) │
│ localStorage │     GET /sync        │ JSON / KV    │
└─────────────┘                       └──────────────┘
```

| שכבה | פתרון | עלות |
|------|--------|------|
| Frontend | GitHub Pages / Cloudflare Pages | $0 |
| Sync realtime | Node relay / CF Worker | $0 |
| אחסון מקומי | localStorage | $0 |
| אופציונלי | Supabase free tier | $0 עד מגבלות |

## שלב 1 — מקומי (2 דקות)

```bash
cd wechat-app
npm install
npm run relay    # טרמינל 1 → http://127.0.0.1:8765
npm run dev      # טרמינל 2 → http://localhost:5180
```

1. בחר **WeiChat ID** ייחודי (למשל `user_a`)
2. בטאב/מכשיר שני — ID אחר (`user_b`)
3. סרוק QR או הוסף חבר לפי ID
4. Badge: **Live · relay** = סנכרון עובד

## שלב 2 — PWA (מובייל)

1. פתח את האפליקציה ב-Chrome/Safari
2. "הוסף למסך הבית" / Install App
3. עובד offline — הודעות נשמרות ב-localStorage

## שלב 3 — Relay בענן (חינם)

### אופציה A: Node על Render/Railway/Fly (free tier)

```bash
# Start command:
node scripts/wechat-sync-relay.mjs
# Port: 8765
# Env: WECHAT_RELAY_DATA=/data/relay-store.json (volume)
```

ב-build של ה-frontend:

```bash
VITE_RELAY_URL=https://your-relay.onrender.com npm run build
```

### אופציה B: Cloudflare Worker

```bash
cd wechat-app/worker
npx wrangler kv namespace create WEICHAT_STORE
# העתק id ל-wrangler.toml
npx wrangler deploy
```

```bash
VITE_RELAY_URL=https://weichat-relay.YOUR.workers.dev npm run build
```

## שלב 4 — Frontend בענן (חינם)

### GitHub Pages (אוטומטי)

Workflow: `.github/workflows/weichat-pages.yml`

Secrets (אופציונלי):
- `VITE_RELAY_URL` — כתובת relay בענן

### Cloudflare Pages

- Build: `cd wechat-app && npm run build`
- Output: `wechat-app/dist`
- Env: `VITE_RELAY_URL`

## משתני סביבה

| משתנה | חובה | תיאור |
|--------|------|--------|
| `VITE_RELAY_URL` | מומלץ (production) | כתובת relay |
| `VITE_SUPABASE_URL` | לא | Supabase (אופציונלי) |
| `VITE_SUPABASE_ANON_KEY` | לא | Supabase anon key |

בפיתוח (`npm run dev`) — relay מוגדר אוטומטית ל-`http://127.0.0.1:8765`.

## API Relay

| Endpoint | Method | תיאור |
|----------|--------|--------|
| `/health` | GET | סטטוס |
| `/sync?wechatId=` | GET | היסטוריה |
| `/profile?wechatId=` | GET | פרופיל |
| `/events` | GET | SSE realtime |
| `/broadcast` | POST | `{ type, payload, from }` |

## בדיקות

```bash
cd wechat-app
npm test
npm run build
```

E2E ידני:
1. `npm run relay` + שני טאבים עם IDs שונים
2. שלח הודעה — מופיעה בטאב השני תוך שניות
3. רענון — היסטוריה חוזרת מ-`/sync`

## מגבלות MVP (ידוע)

- אין E2E encryption (roadmap)
- Relay JSON/KV — לא scale ל-millions (מספיק ל-MVP / קהילה קטנה)
- BroadcastChannel לא עובד Incognito ↔ רגיל — relay פותר
- Worker SSE דורש Durable Object binding (ראה `worker/wrangler.toml`)

## שדרוג אופציונלי

כשצריך scale: Supabase free tier + `VITE_SUPABASE_*` — הקוד כבר תומך, בלי שינוי UI.
