# פרומפט בנייה — שדרוג כלי פענוח ה-ECG (4 פיצ'רים)

> **מנוע:** Claude בלבד (אין Gemini) · **שפה:** עברית (RTL) · **מהות:** תמיכה בהחלטות, לעולם לא אבחנה סופית. **מטרת-על:** אפס הזיות. כל מספר קריטי בקוד דטרמיניסטי, לא ב-LLM.

קרא קודם `AGENTS.md`/`CLAUDE.md`. בנה **מצטבר**: פיצ'ר → `npm run build` → אימות → `create_checkpoint`. אל תשבור את הקיים.

## עוגני-קוד קיימים
- **מודלים:** `src/lib/aiConfig.js` → `DIAGNOSIS_MODEL="claude_opus_4_8"`, `FAST_MODEL="claude_sonnet_4_6"`.
- **מנוע:** `src/lib/ecgEngine.js` → `runEcgEngine(...)` (~שורה 684), כולל שער-abstain טכני שמחזיר `{abstain, is_ecg, interpretable, abstain_reason, technical_check, structured}`, `applyGridMeasurements`, `applyCriticalRuleOut`, `flagEcgNormals` (pre/post). **השתמש באותה צורת-abstain** לשער האיכות.
- **כרטיס:** `src/components/ECGInterpretationCard.jsx` (`{structured, warnings, confidence, uncertaintyLevel}`).
- **צנרת:** `src/lib/analysisPipeline.js` (מוסיף `structured_json`, `patient_ref`).
- **תלויות קיימות:** `jspdf`, `html2canvas` (לפיצ'ר PDF — אל תוסיף תלות). אין OpenCV — דיגיטציה = JS טהור מעל Canvas.

## כללי-על
כל קריאת-LLM עם `response_json_schema`; כל מדידה/ניקוד בקוד; דיסקליימר בכל פלט; עברית RTL; תוספתי + checkpoint אחרי כל פיצ'ר; בספק — `UNKNOWN`/abstain.

## סדר בנייה: 1→2→3→4

### פיצ'ר 1 — שער איכות/ארטיפקט (Quality Gate)
קובץ חדש `src/lib/ecgQualityGate.js`. שתי שכבות: (א) קריאת-איכות LLM ב-`FAST_MODEL` עם סכמה ל**איכות בלבד** (is_ecg, is_interpretable, quality_score 0-100, calibration_visible, issues[baseline_wander/emg_noise/ac_interference/clipping/lead_missing/tracing_cut_off/low_contrast/skew/calibration_unknown/possible_lead_reversal], recommended_action_he). (ב) בדיקות דטרמיניסטיות: חשד להיפוך יד ימין/שמאל (P+QRS שליליים ב-I עם חיוביים ב-aVR). `decideGate()` → אם is_ecg=false / לא-קריא / quality_score<QUALITY_MIN(45) / lead_reversal → **abstain** באותה צורת-abstain קיימת. השקה בתחילת `runEcgEngine` לפני Pass 1 (`qualityGate=true`). אחרי Pass 1 — `deterministicLeadReversalCheck(structured)` → אזהרה+הורדת confidence. Checkpoint: `ecg: quality & artifact gate`.

### פיצ'ר 2 — ייצוא דו״ח PDF
קובץ `src/lib/ecgReportPdf.js`: `html2canvas` על אלמנט הדו״ח → `jsPDF` (A4). תוכן: patient_ref, זמן, thumbnail, טבלת מדדים (HR/PR/QRS/QT/QTc Bazett+Fridericia/ציר, סימון חריגות-גיל), 7 שלבים, critical_rule_out, דחיפות+confidence, warnings, **דיסקליימר בכל עמוד** + חותמת מודל. כפתור "ייצוא PDF" ב-`ECGInterpretationCard.jsx`. אין LLM. Checkpoint: `ecg: structured PDF export`.

### פיצ'ר 3 — E: מנגנון ולידציה
`src/lib/ecgValidation.js` + עמוד dev `/ecg-validate`. ground-truth: {case_id, image_url, age, sex, true_intervals, true_rhythm, true_critical_patterns[], true_normal, source}. מטריקות **דטרמיניסטיות**: רגישות/סגוליות/PPV/NPV לכל דפוס קריטי; **שיעור-הזיות** (ממצא שהומצא בביטחון שאינו ב-ground-truth); MAE של HR/PR/QRS/QTc; שיעור abstain. ספק 2-3 מקרי-עשן סינתטיים מסומנים; אל תמציא "אמת". Checkpoint: `ecg: validation harness`.

### פיצ'ר 4 — A2: דיגיטציה של הגל (JS טהור)
`src/lib/ecgDigitize.js`. A2a: זיהוי גריד+כיול (px/mm), הפרדת trace מגריד, חילוץ אות לכל הובלה, Pan-Tompkins → HR. A2b: דלינאציה (P/QRS/T) → PR/QRS/QT → QTc בקוד. השקה: הזן מדדים למנגנון-הדריסה של `applyGridMeasurements`; סמן `measurement_source: cv_digitized|grid_boxes|llm`; אם כיול לא בטוח → אל תדרוס (fallback). Checkpoint אחרי A2a ואחרי A2b.

## אסור
אין Gemini · אין LLM בלי schema · אין חישוב מרווח/ציר/מטריקה ב-LLM · אין להסיר את שער-ה-abstain · בספק — `UNKNOWN`.
