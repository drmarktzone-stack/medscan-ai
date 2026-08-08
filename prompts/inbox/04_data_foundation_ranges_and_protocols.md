# פרומפט בנייה — יסוד הנתונים: טווחי-ייחוס + פרוטוקולים (הכי דחוף)

> Claude בלבד · אפס הזיות · **כל טווח/מינון verbatim ממקור, לא מ-LLM** · הכל `draft_needs_verification` עד אימות רופא. בנייה מצטברת + checkpoint.

## למה זה קריטי (אודיט)
שני מנועים מצוינים חסומים כי הטבלה שלהם ריקה:
- **`ReferenceRange` = 0 רשומות** → `labInterpreter` לא יכול לנרמל **אף ערך** (הוא מסרב נכון — אבל הכלי לא-שמיש בפועל).
- **`Protocol` = רק רשומת-זבל אחת מסומנת `flagged`** → `protocolRunner` (שמריץ **רק** פרוטוקול `verified`) אין לו מה להריץ.

## חלק A — טווחי-ייחוס פדיאטריים (`ReferenceRange`)
אכלס טווחי-ייחוס **תלויי-גיל** verbatim ממקור מוסמך (נספח מעבדה/נלסון/מעבדת המוסד), מובנים לפי אנליט: `{analyte, age_min_days, age_max_days, sex, low, high, unit, source_anchor, verification_status:"draft_needs_verification"}`. התחל מהפאנלים היומיומיים: ספירת-דם (Hb/Hct/WBC/Plt/diff לפי גיל), כימיה (Na/K/Cl/HCO3/urea/creatinine/glucose/Ca/Mg/PO4), כבד (ALT/AST/bili), דלקת (CRP/ESR), בלוטת-התריס. **כלול את מקדם ה-k ל-Schwartz eGFR** + מקורו (המחשבון מסרב בלעדיו). **אל תמציא ערכים** — מה שאין במקור נשאר חסר.

## חלק B — פרוטוקולים מאומתים (`Protocol`)
1. מחק את רשומת-הזבל (`protocol_key:"p"`, flagged).
2. בנה פרוטוקולים מובנים (ישות `Protocol`: `steps` עם `step_id`, `actions_he`, `branches[{condition_he,next_step_id}]`, `red_flags_he`, `deterministic_refs`, `source_anchor`, `local_protocol_ref` placeholder) למסלולים הפדיאטריים בעלי-הערך הגבוה: **חום ללא מקור (FWS)**, **חום/ספסיס ניאונטלי**, **אנפילקסיס**, **DKA**, **סטטוס אפילפטיקוס**, **מנינגיטיס**, **התקף אסתמה**. שלבים verbatim מהמקור; **מינונים לא ב-LLM — רק כ-`deterministic_refs`/מחשבון**.
3. כולם נכנסים `verification_status:"draft_needs_verification"` — ורק אחרי אימות רופא הופכים `verified` ורצים.

## אסור
אין טווח/מינון/סף שמקורו LLM · אין פרוטוקול לא-מאומת בפרודקשן · בספק — חסר/`needs_verification`, לא ניחוש.
