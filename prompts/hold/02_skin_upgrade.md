# פרומפט בנייה — שדרוג כלי אבחון מחלות עור (Dermatology + Allergy)

> **מנוע:** Claude בלבד (אין Gemini) · עברית RTL · תמיכה בהחלטות, לא אבחנה סופית. **מטרת-על:** אפס הזיות + הוגנות בין גווני-עור. כל מדד/ניקוד בקוד דטרמיניסטי.

קרא קודם `AGENTS.md`/`CLAUDE.md`. בנה מצטבר: פיצ'ר → `npm run build` → checkpoint.

## עוגני-קוד קיימים
- **מנוע:** `src/lib/skinEngine.js` → `runSkinEngine(...)`, `SKIN_SCHEMA`, `skinConsistency`, שער relevance/quality (abstain), verifier נגדי (`verify.js`).
- **מודלים:** `aiConfig.js` (`claude_opus_4_8` / `claude_sonnet_4_6`).
- **צנרת:** `analysisPipeline.js` — Stage measurement+criteria (`diagnosticProtocols.js`), התאמת-מקרים מול `SkinCase`, בונה `referenceImages` מ-`image_url`.
- **KB:** ישות `SkinCase` (200+ מקרים). **בעיה: `image_url=null` בכולם** — אין אטלס תמונות.
- **תצוגה:** `SkinInterpretationCard.jsx` (`{structured, warnings, confidence, uncertaintyLevel}`).
- אין OpenCV — מורפומטריה = JS טהור מעל Canvas `getImageData`. `jspdf`/`html2canvas` קיימים.

## כללי-על
כל LLM עם schema; **כל מדד/אינדקס/ניקוד/סיכון בקוד**; דיסקליימר בכל פלט; עברית RTL; עור כהה (Fitzpatrick IV–VI) חייב לעבוד ולהיבדק; checkpoint אחרי כל פיצ'ר.

## סדר בנייה: 1→7

1. **היסטוריה מובנית + מורפומטריה מכוילת** (`src/lib/skinMorphometry.js`): קלט מובנה (גיל, Fitzpatrick, משך, גרד/כאב, קצב-שינוי, חשיפה/אלרגן, רקע משפחתי מלנומה) → `clinicalContext`. עם סמן-קנה-מידה: זיהוי → px/mm → קוטר-מ"מ, אינדקס-אסימטריה, אי-סדירות-גבול, מספר-אשכולות-צבע (ABCDE בקוד). דורס הערכת-LLM; אם אין סמן → איכותני בלבד. Checkpoint.
2. **מצב דרמוסקופיה** (`src/lib/dermoscopyScore.js`): מתג clinical/dermoscopic; סכמת מבנים (LLM מתאר נוכחות). ניקוד בקוד: 7-point checklist, ABCD-TDS, chaos&clues. ניקוד גבוה → דחיפות+הפניה; נמוך אינו שולל מלנומה. Checkpoint.
3. **מודול אלרגיה/מגע** (`src/lib/allergyModule.js`): מיפוי אלרגן-לפי-פיזור (דטרמיניסטי, עם עוגן); דרמטיטיס-מגע אלרגי/גירויי; פוטו-אלרגי/טוקסי; אורטיקריה+אנגיואדמה+דגלי-אנפילקסיס; פענוח patch-test (ICDRG). Checkpoint.
4. **אטלס תמונות ל-KB**: אכלוס `SkinCase.image_url` ממאגרים **פתוחים/מורשים** (ISIC, PAD-UFES) עם `image_source`+`license`+`fitzpatrick` (כולל IV–VI). עוגן-מקור + `verification_status` לכל מקרה; רק `verified` בפלט. ניקוי טקסונומיה. Checkpoint.
5. **מעקב נגע** (השוואה כמו ECG-compare): דלתא דטרמיניסטית קוטר/אסימטריה/צבע/מבנה חדש, "ugly duckling", רישום לפי מטופל+מיקום. שינוי מהותי → דחיפות. Checkpoint.
6. **דירוג-סיכון ממאירות + מסלול הפניה**: `malignancy_risk` נגזר מ-ABCDE-כמותי+דרמוסקופיה+דגלים, בקוד. Checkpoint.
7. **ולידציה + הוגנות** (`src/lib/skinValidation.js`, `/skin-validate`): רגישות/סגוליות למלנומה, שיעור-הזיות, MAE של ABCDE, **טבלת-ביצועים לכל Fitzpatrick I–VI**. מקרי-עשן סינתטיים; אל תמציא "אמת". Checkpoint.

## אסור
אין Gemini · אין LLM בלי schema · אין ניקוד/סיכון/מדד ב-LLM · אין משיכת תמונות מוגנות-זכויות · אין להסיר abstain · אין "שפיר כברירת-מחדל" · בספק — `UNKNOWN`.
