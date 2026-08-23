# prompts/inbox — תיבת פרומפטים נכנסים

הפל כאן קובץ פרומפט (`.md`) חדש — וזהו.

**מה קורה אוטומטית:** בתחילת כל סשן של Claude Code, ה-SessionStart hook (`.claude/hooks/inbox-scan.sh`) סורק תיקייה זו ומזריק את שמות הקבצים החדשים להקשר. Claude Code מבצע אותם לפי הפרוטוקול ב-`CLAUDE.md` — אחד-אחד, `npm run build` + `create_checkpoint` אחרי כל שלב — ואז מעביר כל קובץ שהושלם ל-`../done/`.

**טריגר ידני באמצע סשן:** הקלד `/inbox`.

**AgentReceipt (v0):** אחרי כל פרומפט — הרץ אימות ושמור receipt לפני העברה ל-`done/`:

```bash
node scripts/agentreceipt.mjs inbox-done --prompt prompts/inbox/FILE.md --agent cursor-cloud
```

Exit code 0 = build עבר, בטוח להעביר. 1 = אל תעביר.

**להשהות פרומפט (לא לבצע עדיין):** שים אותו ב-`../hold/` במקום כאן. כשתרצה להריץ — העבר אותו לכאן.

> קובץ `README` זה מתעלמים ממנו בסריקה.
