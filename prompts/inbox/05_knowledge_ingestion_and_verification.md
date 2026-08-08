# פרומפט בנייה — צנרת ידע: המשך ייבוא נלסון + זרימת אימות

> Claude בלבד · verbatim מהמקור · הכל `draft` עד אימות רופא · רק `verified` בפלט קליני. בנייה מצטברת + checkpoint.

## מצב קיים (אודיט)
ייבוא נלסון **אמיתי ואיכותי** — verbatim, מעוגן-מקור (`source_anchor: nelson22.c536...`), מובנה על פני 6 ישויות (`KnowledgeTopic/ClinicalRule/Association/LabPattern/RedFlag/Protocol`) עם ציטוט-מקור ב-`review_note_he`. **אבל:** הכיסוי הוא רק כמה פרקים (היפוספלניזם, אנמיה ניאונטלית, IBD…), **הכל `draft_needs_verification`**, ולא נראה שקיים ולו פריט `verified` אחד — כלומר, לפי כללי-הבטיחות, כמעט כלום לא אמור להגיע לפלט קליני. צוואר-הבקבוק הוא **קצב האימות**, לא הייבוא.

## לבנות
1. **המשך ייבוא פרק-אחר-פרק** לפי `docs/04_NELSON_INGESTION_GUIDE.md`, בעדיפות ערך-יומי: זיהומי/חום, המטולוגיה, נפרולוגיה, אנדוקרינולוגיה (DKA/תריס), דרמטו-עורי, קרדיולוגיה. verbatim, עם `source_anchor` ו-`draft_needs_verification`; פערים → `UNKNOWN`.
2. **חיזוק עמוד האימות** (`VerifyKnowledge.jsx`): סקירה באצוות, הצגת ציטוט-המקור ליד הפריט, סינון `draft`↔`verified`, אישור בלחיצה עם `verified_by`+`verified_at`, ותצוגת התקדמות כיסוי (פריטים verified מתוך סה"כ).
3. **אכיפת "רק verified בפלט"** בכל המנועים (Lab/Context/Differential/Protocol): `draft` מוצג רק במצב אדמין ומסומן בבירור. ודא שזה נאכף בקוד ב-`loadKnowledgeBase`/`groundedInvoke`.
4. **עקביות טקסונומיה ועוגנים**: פורמט `nelson.<domain>.<topic>` אחיד; אחד את הווריאציות (`nelson22.c536` מול `nelson.גסטרו...`).
5. **שכבת ראיות PubMed** (`evidence/`): ודא ש-`citationGuard` חוסם PMID/DOI שהומצאו ע"י המודל — רק ציטוטים שנשלפו בפועל.

## אסור
אין ידע לא-מעוגן בפרודקשן · אין `draft` בפלט קליני · אין PMID/DOI ממקור-LLM · verbatim, לא פרפרזה מהזיכרון.
