# MedScan — מפת קוד (אודיט)

תאריך סריקה: 2026-08-20  
היקף: כל קבצי המקור ב-`src/`, ישויות `base44/entities/`, נתוני `knowledge/` ו-`scripts/extractions/`, ו-`tests/antihallucination.spec.js`.  
אין המלצות ואין קוד חדש בדוח זה — מיפוי מצב בלבד.

---

## 1. מודולים קליניים קיימים (מנועים וקבצים)

### מעבדה (Lab) — קיים

| תפקיד | נתיב |
|---|---|
| מנוע פענוח | `src/lib/medscan/engines/labInterpreter.js` |
| סריקת גיליון (Vision) | `src/lib/labScanEngine.js` |
| נרמול ערכים | `src/lib/medscan/deterministic/labNormalize.js` |
| רישום טווחי ייחוס | `src/lib/medscan/deterministic/refRanges.js` |
| קטלוג אנליטים | `src/lib/medscan/deterministic/analyteCatalog.js` |
| מחשבונים | `src/lib/medscan/deterministic/calculators.js` |
| זרע טווחים (טיוטה) | `src/lib/medscan/deterministic/referenceRangeSeed.js` |
| עמוד | `src/pages/LabInterpreter.jsx` |
| בחירת אנליט | `src/components/AnalytePicker.jsx` |
| תצוגת פלט מעוגן | `src/components/GroundedInterpretation.jsx` |
| סכמת ישות דפוס | `base44/entities/LabPattern.jsonc` |
| סכמת ישות טווח | `base44/entities/ReferenceRange.jsonc` |

נתיב באפליקציה: `/labs`.

### דרמטולוגיה (Skin) — קיים

| תפקיד | נתיב |
|---|---|
| מנוע ראשי | `src/lib/skinEngine.js` |
| מורפומטריה | `src/lib/skinMorphometry.js` |
| דרמוסקופיה | `src/lib/dermoscopyScore.js` |
| אלרגיה/מגע | `src/lib/allergyModule.js` |
| מעקב נגע | `src/lib/skinCompare.js` |
| ייבוא אטלס | `src/lib/skinAtlasImport.js` |
| ולידציה | `src/lib/skinValidation.js` |
| צינור מהיר | `src/lib/medscan/engines/skinFastPipeline.js` |
| בונה תוצאה | `src/lib/medscan/engines/skinResultBuilder.js` |
| עמוד פענוח | `src/pages/SkinAnalysis.jsx` |
| עמוד ולידציה | `src/pages/SkinValidation.jsx` |
| כרטיס | `src/components/SkinInterpretationCard.jsx` |
| מדידת נגע | `src/components/LesionMorphometry.jsx` |
| סכמת מקרים | `base44/entities/SkinCase.jsonc` |

נתיבים: `/skin`, `/skin-validate`.

### רדיולוגיה / Vision — קיים חלקית

| תפקיד | נתיב |
|---|---|
| מנוע ראשי | `src/lib/radiologyEngine.js` |
| קטלוג can't-miss (12 פריטים בקוד) | `src/lib/radiologyCritical.js` |
| מדידות | `src/lib/radiologyMeasurements.js` |
| צינור מהיר | `src/lib/medscan/engines/radiologyFastPipeline.js` |
| בונה תוצאה | `src/lib/medscan/engines/radiologyResultBuilder.js` |
| תצפיות Vision משותפות | `src/lib/medscan/engines/visionObservations.js` |
| שמירת נרטיב Vision | `src/lib/medscan/engines/visionNarrativeGuard.js` |
| עיגון Vision | `src/lib/medscan/engines/visionGrounded.js` |
| צינור אבחון משותף | `src/lib/analysisPipeline.js` |
| עמוד פענוח | `src/pages/RadiologyAnalysis.jsx` |
| כרטיס | `src/components/RadiologyInterpretationCard.jsx` |
| צופה תמונה | `src/components/RadiologyViewer.jsx` |
| סכמת מקרים | `base44/entities/RadiologyCase.jsonc` |

נתיב: `/radiology` בלבד.  
לא נמצאו: `radiologyValidation.js`, עמוד `/radiology-validate`, `radiologyCompare.js`.

### אקוסטיקה (Audio) — לא קיים

אין קובץ, מנוע, עמוד, רכיב, ישות או נתיב שמכילים `audio` / `Audio` תחת `src/`. לא מופיע ב-`src/App.jsx` ולא ב-`src/pages/Home.jsx`.

### ECG — קיים

| תפקיד | נתיב |
|---|---|
| מנוע ראשי + 19 דפוסי critical rule-out בקוד | `src/lib/ecgEngine.js` |
| חוקי פענוח (פרומפט שיטתי) | `src/lib/ecgRules.js` |
| שער איכות | `src/lib/ecgQualityGate.js` |
| נורמות גיל | `src/lib/ecgNormals.js` |
| דיגיטציה | `src/lib/ecgDigitize.js` |
| השוואה בזמן | `src/lib/ecgCompare.js` |
| ולידציה | `src/lib/ecgValidation.js` |
| ייצוא PDF | `src/lib/ecgReportPdf.js` |
| צינור מהיר | `src/lib/medscan/engines/ecgFastPipeline.js` |
| בונה תוצאה | `src/lib/medscan/engines/ecgResultBuilder.js` |
| תפיסה | `src/lib/medscan/engines/ecgPerception.js` |
| פתולוגיות | `src/lib/medscan/engines/ecgPathologies.js` |
| מיקרו-מדידה | `src/lib/medscan/engines/ecgMicroMeasure.js` |
| יסודות | `src/lib/medscan/engines/ecgFundamentals.js` |
| עמוד פענוח | `src/pages/ECGAnalysis.jsx` |
| השוואה | `src/pages/ECGComparison.jsx` |
| ולידציה | `src/pages/ECGValidation.jsx` |
| כרטיס | `src/components/ECGInterpretationCard.jsx` |
| סכמת מקרים | `base44/entities/ECGCase.jsonc` |

נתיבים: `/ecg`, `/ecg-compare`, `/ecg-validate`.

### ספר נלסון (Nelson Textbook) — קיים כצינור; אין PDF במאגר

| תפקיד | נתיב |
|---|---|
| לוגיקת ספר (בלי I/O) | `src/lib/medscan/knowledge/bookCore.js` |
| טעינה/שמירה לישות | `src/lib/medscan/knowledge/bookStore.js` |
| אשכולות ידע | `src/lib/medscan/knowledge/clusters.js` |
| פענוח ספר | `src/lib/medscan/ingestion/bookParser.js` |
| חילוץ מפרקים | `src/lib/medscan/ingestion/extractionCore.js` |
| סכמת חילוץ | `src/lib/medscan/ingestion/extractionSchema.js` |
| מיפוי לרשומות KB | `src/lib/medscan/ingestion/kbRecords.js` |
| הרצת ייבוא | `src/lib/medscan/ingestion/runIngestion.js` |
| ייבוא ידע | `src/lib/medscan/ingestion/knowledgeIngestion.js` |
| שחזור פריסה | `src/lib/medscan/ingestion/layoutReconstruction.js` |
| עמוד דפדוף | `src/pages/NelsonBook.jsx` |
| עמוד ייבוא | `src/pages/KnowledgeImport.jsx` |
| סכמת פרק | `base44/entities/NelsonChapter.jsonc` |

נתיבים: `/book`, `/knowledge-import`.  
אין קובץ `.pdf` בריפו.

### מודולים קליניים נוספים שנמצאו (מחוץ לששת הדומיינים שנתבקשו)

- הקשר מטופל: `src/lib/medscan/engines/patientContext.js`, `src/pages/PatientContext.jsx` (`/patient-context`)
- אבחנה מבדלת: `src/lib/medscan/engines/differentialBuilder.js`, `src/lib/medscan/engines/mustNotMiss.js`, `src/pages/Differential.jsx` (`/differential`)
- פרוטוקולים: `src/lib/medscan/engines/protocolRunner.js`, `src/lib/medscan/engines/protocolTree.js`, `src/pages/ProtocolRunner.jsx` (`/protocols`)
- מסלולי קהילה: `src/lib/medscan/engines/pediatricPathways.js`
- שער LLM קליני: `src/lib/medscan/gate/groundedInvoke.js`  
  סכמות ב-`SCHEMAS_BY_ENGINE`: `lab_interpreter`, `patient_context`, `protocol_runner`, `differential` בלבד — אין סכמת groundedInvoke ל-ECG/Skin/Radiology.

---

## 2. מצב בסיסי הידע וה-FactBlock

### FactBlock

- בניית הבלוק: `src/lib/medscan/antihallucination/factBlock.js`  
  (`buildFactBlock`, `filterByVerification`, `VERIFICATION_POLICY`, `DRAFT_SUSPICION_CEILING`)
- שער הקריאה: `src/lib/medscan/gate/groundedInvoke.js`
- טעינת KB מובנה: `src/lib/medscan/llmAdapter.js` → `loadKnowledgeBase()` (ישויות Base44: `ClinicalRule`, `Association`, `LabPattern`, `RedFlag`, `Protocol`, `KnowledgeTopic`)
- `src/lib/knowledgeBase.js` אינו נלסון — בונה טקסט למקרי Vision (`ECGCase` / `SkinCase` / `RadiologyCase`) עבור `analysisPipeline.js`

### קבצי נתונים ל-Nelson Textbook

**קיימים (חילוצים JSON, לא הספר השלם):**

`scripts/extractions/nelson22/`
- `c85-shock.json`
- `c79-resuscitation.json`
- `c536-hyposplenism.json`
- `c534-535-spleen.json`
- `c511-sickle-cell.json`
- `c222-fuo.json`
- `c220-fever-no-focus.json`

`scripts/extractions/` (אצוות `ch*.json`, בין השאר):  
`ch01-*.json` (זיהומים/חיסונים/עור), `ch02-*.json` (לב), `ch03-*.json` (CF), `ch04-food-allergy.json`, `ch06-thalassemia.json`, `ch07-cns-tumors.json`, `ch09-*.json` (גסטרו), `ch10-appendicitis-biliary.json`, `ch11-*.json` (נוירו), `ch12-*.json` (אנדו), `ch13-*.json` (נפרולוגיה), `ch15-drug-induced-lupus.json`, `ch16-*.json` (יילוד), `ch17-*.json`, `ch19-eyes.json`, `ch20-skin.json`, `ch23-genetics.json`

מטמון: `scripts/.nelson-cache.json`

**קיים אך אינו נלסון:**  
`knowledge/criteria/batch1_criteria_seed.json` + `knowledge/criteria/README.md` (קריטריונים דרמטולוגיה/ראומטולוגיה/אלרגיה, כולם `draft_needs_verification`)

**לא קיים במאגר:** קובץ PDF של Nelson; רשומות `NelsonChapter` חיות בישות Base44 בזמן ריצה, לא כקבצי נתונים ב-git.

### חוקים ודגלים אדומים ב-`rulesEngine`

קובץ: `src/lib/medscan/rules/rulesEngine.js`

**אין קטלוג Red Flag קשיח בקובץ.**  
`computeRedFlags({ redFlagKb = [] })` רץ על מערך שמוזרק מבחוץ. אם `kb.redFlags` ריק — לא נורה אף דגל.

המבנה שכל פריט ב-`redFlagKb` חייב למלא (מהקוד + `base44/entities/RedFlag.jsonc`):

- `flag_key`, `label_he`, `action_he`, `source_anchor`
- `trigger.findings[]`, `trigger.logic` (`all` | `any`)
- `age_min_days` / `age_max_days`
- `severity` (`red` | `critical`)
- `verification_status` (ברירת מחדל בקוד: `draft_needs_verification`)

פונקציות נוספות באותו קובץ (גם הן על KB מוזרק, לא על רשימה מקודדת):

- `matchLabPatterns` ← `kb.labPatterns`
- `evaluateRules` ← `kb.rules` (`ClinicalRule`)
- `matchAssociations` ← `kb.associations`
- `runRulesEngine` — סדר: Red Flags → LabPatterns → ClinicalRules → Associations → Pediatric Pathways

הדגל היחיד שמופיע כקבוע בבדיקות (לא בפרודקשן): `rf.neonate_fever` ב-`tests/antihallucination.spec.js`.

קטלוגי can't-miss **אחרים** (לא ב-`rulesEngine`):

- ECG: 19 פריטים ב-`src/lib/ecgEngine.js` → `CRITICAL_RULE_OUT`
- רדיולוגיה: 12 פריטים ב-`src/lib/radiologyCritical.js` → `RADIOLOGY_CRITICAL`

---

## 3. כיסוי בדיקות — `tests/antihallucination.spec.js`

הקובץ מריץ 60 בדיקות ב-11 מקטעים. הוא בודק את שכבת האנטי-הזיה ואת מנוע המעבדה/החוקים — לא את מנועי ה-Vision.

### מה רץ בקובץ (לפי מקטע)

| מקטע | מה נבדק |
|---|---|
| מנגנון 1 — Grounding | FactBlock: F#/P#/D#, סינון טיוטה במצב clinical, סימון במצב development, חסימת `flagged`, הפניה מתה, טענת FACT בלי עוגן |
| numericGuard | מינון מומצא נחסם; מספר מטופל/D# מותר; סף מומצא; מזהים טכניים |
| מנגנון 3 — שרשרת חשיבה | אורך מינימלי, שלב links, עיגון שלבים |
| מנגנון 4 — Contradiction | סתירה למדידה; דפוס שלא הותאם; דגל אדום מול חשד לא-אדום |
| מנגנון 2 — Calibration | תקרת ביטחון; הסבר בעברית; הסלמת Red Flag |
| גבול המנדט | 5 ניסוחי אבחנה/שחרור אסורים; כיוון בלי `refutes_he`; `red_on_unverified_knowledge` |
| מנגנון 6 — Refusal (צינור `groundedInvoke`) | FactBlock ריק; טיוטה בלבד; דגל עובר בסירוב; מינון מומצא; מסלול תקין; מאמת-נגדי; כשל מאמת; דגל שהמודל המציא |
| מחשבונים | Holliday-Segar, BSA, eGFR (סירוב בלי k), מינון (סירוב בלי DoseRecord) |
| נרמול מעבדה | `unknown_range` ≠ `normal`; טווח ידני; טווח מאומת לפי גיל; חוסר גיל חוסם |
| מנוע Rules | דפוס לפי `min_components`; `unknown_range` לא תומך בדפוס; דפוס טיוטה לא ב-clinical; דגל לפי חלון גיל; דגל בלי גיל מדווח; כלל כמעט-התקיים |
| Pediatric Pathways | טיוטה לא ב-kbItems ב-clinical; חסימת FactBlock; מסלול verified נכנס; development מסומן; AnchorGuard על עוגן מומצא; דפוס טיוטה נשאר חסום |

ייבואים בקובץ: `factBlock`, `numericGuard`, `validators`, `contradiction`, `calibration`, `groundedInvoke` (מנוע `lab_interpreter` בלבד), `calculators`, `labNormalize`, `refRanges`, `rulesEngine`, `anchorGuard`, `pediatricPathways`.

### מודולים שמוגנים על ידי הקובץ הזה

מעבדה (נרמול + מחשבונים + rules + groundedInvoke למעבדה), FactBlock, AnchorGuard (דרך מסלולים), Pediatric Pathways.

### מודולים שלא נבדקים כלל ב-`antihallucination.spec.js`

- ECG (`ecgEngine` וכל תת-המודולים)
- Skin (`skinEngine`, מורפומטריה, דרמוסקופיה, אלרגיה, אטלס)
- Radiology (`radiologyEngine`, `radiologyCritical`, מדידות)
- Audio (אין מודול)
- Nelson (`bookCore`, `bookParser`, ingestion)
- `protocolRunner` / `protocolTree`
- `differentialBuilder` / `mustNotMiss`
- `patientContext`
- צינורות Vision (`analysisPipeline`, `visionGrounded`, `visionNarrativeGuard`)
- `evaluation.js`
- `labInterpreter.js` עצמו (נבדק ב-`labInterpreter.test.mjs` שאינו חלק מ-`npm test`, מלבד פונקציות הנרמול/חוקים שכן כאן)
- `citationGuard` / PubMed (נמצאים ב-`tests/hardening.spec.js` וב-`src/lib/medscan/evidence/*.test.mjs`, לא כאן)

הערה עובדתית: `package.json` → `npm test` מריץ גם `architecture.spec.js`, `ingestion.spec.js`, `hardening.spec.js`, `pediatricPathways.test.mjs`. כ-29 קבצי `*.test.mjs` תחת `src/lib/medscan/` **אינם** כלולים ב-`npm test`.

---

## 4. פערים קליניים וטכניים (Gaps)

מודולים שמוגדרים בקוד אך ריקים מתוכן, או שחסרה בהם לוגיקה/נתונים שהמבנה מצפה להם:

| פריט | מצב שנמצא בקוד |
|---|---|
| Audio | לא מוגדר כלל — אפס קבצים |
| `refRanges.js` | לוגיקה מלאה; הרישום הפנימי **ריק במכוון** (`registry` ריק עד `loadReferenceRanges`). בלי רשומות `ReferenceRange` מאומתות אין סימון high/low |
| `RedFlag` / `ClinicalRule` / `LabPattern` / `Association` / `Protocol` | מנוע קיים; **אין קטלוג פריטים ב-git**. התוכן אמור להגיע מישויות Base44 בזמן ריצה |
| Nelson PDF | צינור ייבוא קיים; **אין קובץ ספר במאגר**. `NelsonBook.jsx` מציג מצב "הספר עדיין לא באפליקציה" כש-`NelsonChapter` ריק |
| חילוץ נלסון | כיסוי חלקי: 7 קבצי `nelson22/` + אצוות `ch*`. לא ספר שלם |
| `knowledge/criteria/batch1_criteria_seed.json` | תוכן קיים; כל הפריטים `draft_needs_verification` |
| `referenceRangeSeed.js` / `pediatricPathways.js` | תוכן זרע קיים; כולו `draft_needs_verification` — לא נכנס ל-FACT BLOCK במצב clinical |
| רדיולוגיה — ולידציה | אין `radiologyValidation.js`, אין עמוד `/radiology-validate` (קיימים מקבילים ל-ECG ולעור) |
| רדיולוגיה — השוואה בזמן | אין `radiologyCompare` / `/radiology-compare` (קיים מקביל ECG) |
| Vision → groundedInvoke | `analysisPipeline.js` קורא ל-LLM לאבחון בלי `groundedInvoke`; `SCHEMAS_BY_ENGINE` לא כולל ecg/skin/radiology |
| `evaluation.js` | מכסה רק `ECGCase` / `SkinCase` / `RadiologyCase` — לא מעבדה, לא פרוטוקול, לא נלסון |
| `patientContext` | שדה `immunization_status` מועבר כ-P# אם הוזן; **אין מנוע לוח חיסונים דטרמיניסטי** |
| אטלס תמונות | `skinAtlasImport.js` קיים; ישויות המקרים מחזיקות `image_url` — אין קבצי אטלס במאגר |
| אינטראקציות תרופה | `interactions.js` דטרמיניסטי מול ישות `DrugInteraction`; בלי רשומות מאומתות המנוע מצהיר שלא בוצעה בדיקה |

---

סוף הדוח.
