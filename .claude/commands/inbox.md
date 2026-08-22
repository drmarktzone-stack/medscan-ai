---
description: סרוק את prompts/inbox ובצע כל פרומפט חדש לפי כללי-הברזל
allowed-tools: Read, Grep, Bash, Edit, Write
---
בצע את פרוטוקול תיבת-הפרומפטים של MedScan:

1. אתר קבצים חדשים: !`ls -1 prompts/inbox/*.md 2>/dev/null | grep -vi readme || echo "(אין פרומפטים חדשים)"`
2. לכל קובץ שנמצא, **לפי סדר שמות**: קרא אותו ובצע לפי `AGENTS.md`/`CLAUDE.md` — שינוי ממוקד, `npm test` ו-`npm run build` אחרי כל שלב. אם אין קבצים — עצור. אל תמשוך מ-`prompts/hold/`.
3. עבוד על פרומפט **אחד בכל פעם**. קובץ שיושב ב-`prompts/hold/` — דלג.
4. אחרי סיום מוצלח — העבר את הקובץ ל-`prompts/done/`.
5. דווח סיכום קצר בסוף (מה בוצע, תוצאות build, checkpoints). בספק — `needs_verification`, לא ניחוש.
