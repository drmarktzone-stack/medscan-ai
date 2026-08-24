# WeiChat 微聊

**יישום messaging עצמאי** — מודל **אפס עלות** עובד.  
מטרה: super-app ברמת WeChat, עם יעד לעבור את WhatsApp ו-Telegram.

## הפעלה מהירה (חינם)

```bash
cd wechat-app
npm install

# טרמינל 1 — relay (סנכרון בין מכשירים/טאבים)
npm run relay

# טרמינל 2
npm run dev
```

פתח: **http://localhost:5180** → בחר WeiChat ID → Badge **Live · relay**

📖 מדריך מלא: [`docs/ZERO_COST.md`](docs/ZERO_COST.md)

## מודל אפס עלות

| רכיב | פתרון | עלות |
|------|--------|------|
| Frontend | GitHub Pages / CF Pages + PWA | $0 |
| Sync | Node relay / Cloudflare Worker | $0 |
| Storage | localStorage + relay JSON/KV | $0 |
| אופציונלי | Supabase free tier | $0 |

## פיצ'רים

| מודול | תיאור |
|--------|--------|
| Onboarding | בחירת WeiChat ID או דמו |
| צ'אטים | הודעות 1:1, sync realtime |
| אנשי קשר | QR, סריקה, הוספת חברים |
| Moments | פיד, לייקים, תגובות |
| Mini Programs | מחשבון, פתקיות, כלים |
| Pay (דמו) | ארנק + חבילה אדומה |
| PWA | התקנה על מובייל, offline |

## Relay

### מקומי
```bash
npm run relay   # http://127.0.0.1:8765
```

### ענן (חינם)
```bash
# Node על Render/Railway — node scripts/wechat-sync-relay.mjs
# או Cloudflare Worker:
cd worker && npx wrangler deploy
```

Build עם relay:
```bash
VITE_RELAY_URL=https://your-relay.example.com npm run build
```

### Supabase (אופציונלי)
```bash
# .env.local
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## בדיקות

```bash
npm test
npm run build
```

## מבנה

```
wechat-app/
├── src/           UI + store + sync
├── public/        PWA manifest + icon
├── scripts/       Node relay (persistence)
├── worker/        Cloudflare Worker relay
├── docs/          ZERO_COST.md
└── supabase_schema.sql
```

## Roadmap

- [ ] E2E encryption
- [ ] Voice/video calls
- [ ] Channels
- [ ] Bots & API
- [ ] Native mobile
