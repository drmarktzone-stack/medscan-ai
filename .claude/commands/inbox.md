---
description: סרוק את prompts/inbox ובצע כל פרומפט חדש לפי כללי-הברזל
allowed-tools: Read, Grep, Bash, Edit, Write
---
בצע את פרוטוקול תיבת-הפרומפטים של MedScan:

1. אתר קבצים חדשים: !`ls -1 prompts/inbox/*.md 2>/dev/null | grep -vi readme || echo "(אין פרומפטים חדשים)"`
2. לכל קובץ שנמצא, **לפי סדר שמות**: קרא אותו ובצע לפי עשרת כללי-הברזל ב-`AGENTS.md`/`CLAUDE.md` — בנייה מצטברת, `npm run build`, ו-`create_checkpoint` אחרי כל שלב.
3. עבוד על פרומפט **אחד בכל פעם**. קובץ שיושב ב-`prompts/hold/` — דלג.
4. אחרי סיום מוצלח — העבר את הקובץ ל-`prompts/done/`.
5. דווח סיכום קצר בסוף (מה בוצע, תוצאות build, checkpoints). בספק — `needs_verification`, לא ניחוש.
