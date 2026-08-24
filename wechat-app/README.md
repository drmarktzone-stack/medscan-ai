# WeiChat 微聊

**יישום messaging עצמאי** — לא חלק מ-MedScan.  
מטרה: super-app ברמת WeChat, עם יעד לעבור את WhatsApp ו-Telegram בפיצ'רים וחוויית משתמש.

## הפעלה

```bash
cd wechat-app
npm install

# טרמינל 1 — relay לסנכרון בין טאבים (אופציונלי, מומלץ לפיתוח)
npm run relay

# טרמינל 2
npm run dev
```

פתח: **http://localhost:5180**

## פיצ'רים

| מודול | תיאור |
|--------|--------|
| צ'אטים | הודעות 1:1 וקבוצתיות, sync |
| אנשי קשר | חיפוש, QR, הוספת חברים |
| Moments | פיד חברתי, לייקים, תגובות |
| Mini Programs | מחשבון, פתקיות, כלים |
| Pay (דמו) | ארנק + חבילה אדומה |
| Sync | Supabase Realtime **או** relay מקומי |

## סנכרון

### Relay מקומי (פיתוח)
```bash
npm run relay   # http://127.0.0.1:8765
```
Badge: **Live · relay** — עובד גם בין Incognito לרגיל.

### Supabase (production)
1. הרץ `supabase_schema.sql` ב-SQL Editor
2. צור `.env.local`:
```bash
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
├── src/
│   ├── components/   UI
│   ├── pages/        מסכים
│   ├── lib/          store, sync, merge
│   └── miniapps/     Mini Programs
├── scripts/          sync relay
└── supabase_schema.sql
```

## Roadmap (WhatsApp / Telegram+)

- [ ] E2E encryption
- [ ] Voice/video calls
- [ ] Channels (视频号)
- [ ] Bots & API
- [ ] Desktop + native mobile
- [ ] Groups 500+ members
- [ ] File transfer & cloud drive
