# See AGENTS.md

Follow the instructions in `AGENTS.md`.

## פרוטוקול תיבת-פרומפטים (MedScan inbox)
ד"ר סמר מוסיף משימות ע"י הפלת קובצי פרומפט (`.md`) לתיקייה `prompts/inbox/`.
בתחילת כל סשן (וגם ע"י הפקודה `/inbox`):

1. אם יש קבצים ב-`prompts/inbox/*.md` (פרט ל-`README`) — אלה **משימות חדשות לביצוע**.
2. בצע אותן **אחת-אחת, לפי סדר שמות הקבצים**, תחת עשרת כללי-הברזל (`AGENTS.md`): בנייה מצטברת → `npm run build` → `create_checkpoint` אחרי כל שלב.
3. קובץ שנמצא ב-`prompts/hold/` — **אל תבצע** (ממתין לאישור/שחרור ידני).
4. אחרי סיום מוצלח של פרומפט — העבר אותו ל-`prompts/done/`.
5. אל תבקש אישור לכל קובץ; דווח סיכום מרוכז בסוף (מה בוצע, תוצאות build, checkpoints).
6. בספק או סתירה קלינית — סמן `needs_verification`, אל תנחש. Claude בלבד כמנוע; אין Gemini.
