# LOVABLE BUILD PROMPT — paste this entire file

You are building a **live, production-ready pediatric clinic app** from an existing GitHub repo.  
Connect the repo. **Import the clinical engines. Do not rewrite them. Do not invent doses, lab cutoffs, vaccine calendars, WHO LMS tables, or diagnoses.**

Product name: **DoctorPedAI — הרופא החכם**  
Engine inside it: **MedScan** (already implemented in `src/lib/medscan/`).  
Your job: **UI + routing + Supabase persistence + auth roles + wiring every engine to a working screen**, so a clinician and a parent can use the whole system end-to-end today.

Default language: **Hebrew RTL**. Also **English LTR** and **Arabic RTL**.  
This is **decision support, not a diagnosis**. Persistent disclaimer on every clinical screen.

---

## A. Non-negotiable safety (abort the screen rather than violate)

If unsure → show `UNKNOWN` / `needs_verification`. Never invent.

1. Never write “האבחנה היא…”, “מאובחן עם…”, “ללא ספק”, “אין צורך בבירור”, “ניתן לשחרר הביתה”.
2. Never invent antibiotic / drug / antidote / NAC / honey / sucralfate doses.  
   mg/kg **only** via `computeDose` / `weightBasedDose` when `doseRecord.verification_status === 'verified'`. Else: “לפי פרוטוקול מקומי מאומת.”
3. Parent persona **never** sees milligrams, dose tables, or professional DDx lists.
4. Engine output is `draft_needs_verification` until a physician verifies. Only `verified` items may enter a clinical FactBlock.
5. Differential: **must-not-miss first**. Rank is ordinal among anchored directions, **not** a calibrated probability. Never show fake “94%”.
6. Triage: unclassified → **HMO visit**, never home-care default. Age **< 90 days + fever → Emergency**.
7. Do not invent WHO LMS numbers, Israeli MOH vaccine calendars, PECARN cutoffs beyond the coded rule, toxic mg/kg thresholds, or IgA/tTG numeric cutoffs.
8. Do **not** call `Core.InvokeLLM` / `base44.integrations.Core.InvokeLLM` from new UI pages. Consults use **sync** `runDoctorPedAI` (no LLM). Existing ECG/skin/radiology/labs pages already wrap their engines — keep that pattern.
9. Claude only if any LLM is used behind `src/lib/medscan/`. **No Gemini.**
10. Disclaimer always visible: MedScan/DoctorPedAI is decision support only. Not a diagnosis. A licensed physician must verify every decision.

---

## B. What already exists — DO NOT rebuild the brains

The repo is a Vite + React app. Clinical logic lives in JavaScript modules. **You wire them.**

### Main consult API
```js
import {
  runDoctorPedAI,
  listToolboxModules,
  computeDose,
  buildEncounterRecord,
  classifyUrgency,
  buildAnamnesisQuestions,
  evaluateAsdAdhdReferral,
  evaluateCeliacReferral,
  evaluateShortStatureReferral,
  specialistAllowed,
  diagnosticTree,
} from '@/lib/medscan/doctorped/index.js'
```

Call:
```js
runDoctorPedAI({
  persona: 'clinician' | 'parent',
  integrationMode: 'unified' | 'standalone',
  moduleId,                 // REQUIRED in standalone
  patient: { age_days | age_months | age_years, sex, weight_kg, height_cm, ga_weeks },
  findings: string[],
  presentation: string,
  features: object,         // booleans / structured flags
  vitals: { gcs, pupils, rr_flag, hr_flag },
  labs: [{ analyte, value, unit, canonical_key, flag }],
  answers: object,          // anamnesis answers keyed by need-id
  questionnaires: { mchat_total, vanderbilt, conners },
  proceed: boolean,         // skip clarifying questions (NEVER skip red flags)
  doseRecords: [],          // verified DoseRecord only
  father_cm, mother_cm, lmsTable, can_do, feeds_per_day,
  gcs, burn_regions,
  locale: 'he' | 'en' | 'ar',
  mode: 'development' | 'clinical',
})
```

Returns include: `ok`, `locale`, `dir`, `persona`, `rls_role`, `voice`, `triage`, `anamnesis`, `awaiting_anamnesis`, `emergency`, `red_flags`, `differential`, `triggered_modules`, `engines_run`, `toolbox`, `referrals`, `referral_gate`, `diagnostic_trees`, `recommended_tests`, `community_pathway`, `dosing`, `factBlock`, `encounter`, `hides_mg` (parent), `parent_plan_he`, `parent_note_he`, `disclaimer_he`.

Every payload/screen/DB row MUST carry:
```ts
locale: 'he' | 'en' | 'ar'
dir: 'rtl' | 'ltr'   // en=ltr ; he and ar = rtl
rls_role: 'clinician' | 'parent'
```
Types: `src/types/medscan.ts`, `src/types/doctorped.ts`.

### Engine import table (call these; do not reimplement)

| Module | Import | Notes |
|---|---|---|
| Orchestrator | `runDoctorPedAI` `@/lib/medscan/doctorped` | Unified consult + standalone wrap |
| Labs | `runLabInterpreter` `@/lib/medscan/engines/labInterpreter.js` | async; existing page `/labs` |
| Lab scan OCR | `runLabScan` `@/lib/labScanEngine` | existing `/labs` camera/upload |
| Differential | `runDifferentialBuilder` | async; `/differential` |
| Patient context | `runPatientContext` | async; `/patient-context` |
| Protocols | `runProtocolStep` + `listProtocols` | `/protocols` |
| Skin | `runSkinFastAnalysis` / `assembleSkinResult(..., { locale })` | `/skin` |
| Radiology | `runRadiologyFastAnalysis` / `assembleRadiologyResult(..., { locale })` | `/radiology` |
| ECG | `runEcgFastAnalysis` / `assembleEcgResult(..., { locale })` | `/ecg` |
| Audio | `preprocessAudio` `@/lib/medscan/audio/audioPreprocess.js` | relative band energy only |
| Toxicology | `runToxicologyEngine` `@/lib/medscan/engines/expertModules.js` | |
| Trauma/PECARN/burns | `runTraumaEngine` | |
| Growth/vaccines | `runGrowthImmunizationEngine` | |
| Formula/milestones | `runInfantNutritionAndDevelopment` | 150 mL/kg/day heuristic |
| ASD/ADHD screen | `runNeurodevelopmentalEngine` | not a diagnosis |
| Rome IV / ICHD-3 | `runChronicSymptomsEngine` | |
| Triads | `runSyndromeMatcher` | |
| Metabolic/NBS | `runMetabolicInterpreter` | |
| Genetics | `runGeneticsInterpreter` | |
| CSF | `runCsfInterpreter` | no empiric Abx dose |
| Pediatric US | `runPediatricUltrasound` | Graf + cranial |
| EEG | `runEegInterpreter` | |
| Community pathways | `matchPediatricPathway` | routing only |
| Calculators | `weightBasedDose`, `midParentalHeight`, `growthPercentile`, `maintenanceFluids`, `anionGap`, … from `calculators.js` | numbers only from these |
| i18n UI | `useI18n()` `@/lib/i18n` + `LanguageSwitcher` | |
| Engine i18n | `finalizeLocale`, `t` `@/lib/medscan/i18n/localize.js` | extend `clinicalDictionary.js` |

After you add dedicated routes, **update** `src/lib/medscan/doctorped/registry.js` `route:` fields that currently point at `/doctorped` (audio, genetics, csf, metabolic, toxicology, milestones, eeg, trauma, triads, pain, neurodev, growth) to the new routes in §E.

---

## C. Product: two synchronized interfaces + dual MedScan modes

### Dual interface
1. **Clinician Workbench** (`/doctorped`) — experienced outpatient / Kupat Holim pediatrician.
2. **Parent Portal** (`/parent`) — waiting-room tablet and at-home pre-visit. Same engines, different voice.

### Dual MedScan modes
1. **Standalone Toolbox** — open one module, fill its form, run that engine, see that result.
2. **Unified Instrument Mode** — workbench auto-triggers modules via `selectInstruments()` regex already in `registry.js`. Cross-reference results on one consult canvas. Each triggered chip **deep-links** to the standalone tool with the **same patient context**.

Shared patient strip (React context, persisted per encounter):
`age_*`, `sex`, `weight_kg`, `height_cm`, `ga_weeks`, `locale`, `findings[]`, `presentation`, `features`, `vitals`, `labs`, `patient_id`.  
When a toolbox link is opened, prefill from this strip.

---

## D. UX layouts (upgrade the stub pages)

Existing `/doctorped` and `/parent` are **thin stubs**. Replace their layout; **keep** `runDoctorPedAI`.

### D1. Clinician Workbench — high-density desktop + tablet (RTL)

Not a toy chatbot.

- **Patient strip:** age (days/months/years), sex, weight, height, GA weeks, locale/dir, patient_id.
- **Center:** chief complaint, findings chips, vitals (GCS, pupils, RR/HR flags), labs quick-add, parent heights, LMS upload (optional JSON), proceed checkbox.
- **Triage column:** Emergency (red, cannot dismiss without ack) / HMO / Home. Show `triage.flags`.
- **Anamnesis column:** render `anamnesis.questions[].question_he` as a form. Map answers into `answers` / `features` and re-run.  
  If `awaiting_anamnesis === true` and not emergency → **hide DDx / conclusion**. Emergency red flags still show immediately.
- **Results:** triggered instrument chips, ranked DDx (`must_not_miss` first, `probability_note_he` visible), recommended tests, referral gates, 3-tier trees, FactBlock with verified vs draft badges.
- **Toolbox rail:** every module in `listToolboxModules()`.
- **Dosing panel:** only verified `DoseRecord`. Show `formula_source`. Refuse otherwise.
- Density: clinic-grade. Heebo already imported — put `@import` **first** in the CSS file to fix the Vite warning.

Anamnesis clusters already coded (`anamnesis.js`) — implement forms for all of them:

| Cluster | Trigger | Questions / `need` keys to collect |
|---|---|---|
| fever | fever / חום | age, duration, alertness, rash/petechiae |
| abdomen | abdominal / כאב בטן / vomit | blood_stool, duration, projectile |
| neurodev | adhd/asd/קשב/אוטיזם | two_settings, questionnaire, vision_hearing |
| ingest | battery/magnet/paracetamol/הרעל | substance, time, amount |
| headache | headache / כאב ראש | morning_vomiting, wakes_from_sleep, focal |

### D2. Parent Portal — mobile-first, calm, large tap targets

Symptom chips (keep existing + add): fever, cough, rash, vomiting, ear pain, lethargy, button battery, **breathing difficulty, seizure, diarrhea, head injury, non-blanching rash, abdominal pain**.  
Age in months. Optional M-CHAT total. Later: Vanderbilt/Conners JSON (store, **do not diagnose**).

Result bands:
- **Emergency** — full-screen red, “פנו למיון עכשיו”, never soothe. Button battery: do not induce vomiting.
- **HMO visit** — see the pediatrician.
- **Home care** — only when the engine returns `home_care` (isolated mild URI, age ≥90d, no extra flags). Still: if a red flag appears → ED.

No mg. No NAC. No professional syndrome names unless needed for emergency (button battery, anaphylaxis).  
Waiting-room tablet: same UI, `rls_role=parent`.

---

## E. Complete screen inventory — build ALL of these

Keep existing routes. Add missing standalone tools so nothing is trapped only in the orchestrator.

### Auth & shell (keep, then add roles)
Existing: `/login` `/register` `/forgot-password` `/reset-password`  
App layout + **BottomNav**: Tools `/`, History `/history`, Knowledge `/knowledge-base`, Evaluation `/evaluation`.  
LanguageSwitcher HE/EN/AR on every top bar. DisclaimerBanner everywhere.  
**Add** role entry: Clinician vs Parent → JWT/`app_role` + `rls_role`. Parent routes must not render clinician DDx even if they guess the URL.

### Hub `/`
Brand **DoctorPedAI — הרופא החכם**. Cards in this order:
1. Workbench `/doctorped`
2. Parent `/parent`
3. Then **every** toolbox card: ECG, Skin, Radiology, Labs, Context, Protocols, Differential, Knowledge admin, **plus all NEW routes below**.

### DoctorPedAI
- `/doctorped` — full §D1 layout
- `/parent` — full §D2 layout

### Existing MedScan tools — keep, polish, pass `locale` from `useI18n().lang`
- `/ecg` `/ecg-compare` `/ecg-validate`
- `/skin` `/skin-validate`
- `/radiology`
- `/labs` (manual rows + camera/PDF scan + prior comparison — already built)
- `/patient-context`
- `/protocols`
- `/differential`
- `/history` — extend to show DoctorPed **encounters** (consult + previsit) in addition to Analysis
- `/knowledge-base` `/knowledge-admin` `/knowledge-import` `/knowledge-coverage` `/book` `/verify` `/evaluation`

Reuse components already in the repo: `BackButton`, `DisclaimerBanner`, `LanguageSwitcher`, `GroundedInterpretation`, `EmergencyTriageBanner`, `AnalysisResult`, `NumericIntegrityNotice`, `UncertaintyWarning`, `ImageUploader`, `AnalytePicker`, `PrintableReport`, ECG/Skin/Radiology interpretation cards, `PediatricToggle`, `PilotModeBanner`.

### NEW standalone clinician tools (create pages)

Same visual language as Labs/Differential: sticky header, BackButton, DisclaimerBanner, LanguageSwitcher, cards for red flags / DDx / tests / FactBlock.

| Route | Page | Engine | Inputs | Must show / must NOT show |
|---|---|---|---|---|
| `/tox` | Toxicology | `runToxicologyEngine` | vitals: gcs, pupils (`miosis`/`mydriasis`), rr_flag, hr_flag; findings; ingested_mg; weight | toxidromes opioid/anticholinergic/cholinergic/sympathomimetic/sedative; button battery; multi-magnets; paracetamol/ibuprofen **arithmetic mg/kg only**. **No NAC, no toxic cutoff, no antidote dose** |
| `/trauma` | Trauma | `runTraumaEngine` | age_days, gcs, head-trauma features (LOC, vomit, seizure), mechanism; burn region fractions 0–1 | `pecarn_action`: `ct` \| `observe_vs_ct` \| `no_ct` (not an auto-CT order). Lund-Browder TBSA %. Regions: `head,neck,anterior_trunk,posterior_trunk,upper_arm,forearm,hand,buttocks,genitalia,thigh,leg,foot` |
| `/growth` | Growth & vaccines | `runGrowthImmunizationEngine` | weight, height, optional LMS `{L,M,S}`, father_cm, mother_cm, falling_percentiles, immunization flags | Z **only if LMS supplied**; else “Z not calculated”. FTT screen if z≤−2. MPH Tanner. Catch-up = “follow current Israeli MOH / Tipat Halav circular” — **do not print a month-by-month schedule**. Live vaccine + severe immunodeficiency / anaphylaxis to component → do not vaccinate from engine |
| `/nutrition` | Formula & milestones | `runInfantNutritionAndDevelopment` | weight, feeds_per_day (1–12), findings, ga_weeks, can_do[] | 150 mL/kg/day ÷ feeds, labeled **heuristic not a prescription**. Formula: standard / comfort / soy / AR / eHF (CMPA) / AAF (anaphylaxis/FPIES/eHF fail). Projectile vomiting → **do not switch formula** (pyloric pathway). Milestones 4 axes; corrected age `age_days − (40−GA)×7` until ~24 corrected months. Missing skills → delay + PT/OT/SLP/CDU |
| `/neurodev` | ASD/ADHD screen | `runNeurodevelopmentalEngine` | DSM ticks, mchat_total, Vanderbilt counts, settings[] | Screen only. Never “the child has autism/ADHD”. Link to `/referrals` |
| `/chronic` | Pain | `runChronicSymptomsEngine` | findings, duration_months, attacks, duration_hours, domain abdominal\|headache | Rome IV FAP/IBS vs organic flags. ICHD-3 migraine vs secondary (morning vomiting, wakes from sleep, focal). Red flag **blocks** reassuring primary diagnosis |
| `/syndromes` | Triads | `runSyndromeMatcher` | findings, vitals, labs, skin, radiology feature ticks | Catalog: Cushing ICP, Samter AERD, Charcot cholangitis, Reynolds pentad, HUS, HSP, Kawasaki criteria, congenital toxoplasmosis. Emergency triads → ED |
| `/metabolic` | Metabolic / NBS | `runMetabolicInterpreter` | NBS flags, amino acids, organic acids, labs, hypoglycemia | PKU/MSUD/MCAD/UCD **directions**; PICU flags; **no doses** |
| `/genetics` | Genetics | `runGeneticsInterpreter` | dysmorph feature ticks, sex | Down, Turner, Noonan, Williams, 22q11. Routing: karyotype vs CMA vs WES. Phenotype is **not** a diagnosis |
| `/csf` | CSF | `runCsfInterpreter` | csf: wbc, rbc, protein, glucose, gram_stain, pmn; blood glucose/WBC/RBC | bacterial vs viral vs traumatic tap; corrected WBC if blood counts given. **No empiric antibiotic dose** |
| `/us` | Pediatric US | `runPediatricUltrasound` | hips: alpha_deg, beta_deg, side, dislocated, inverted_labrum; cranial: IVH/PVL flags | Graf type (IIa max age 84 days in code). Neuro flags |
| `/eeg` | EEG | `runEegInterpreter` | annotations / findings / optional `{samples, sampleRate}` + state | hypsarrhythmia, ~3 Hz SW, spikes, status ≥5 min, burst-suppression. No AED doses |
| `/audio` | Lung/airway audio | `preprocessAudio` | Mic → PCM `{samples, sampleRate}` | Relative energy in stridor/wheeze/crackle/croup bands. **Not** a diagnosis of stridor/wheeze |
| `/referrals` | Referral gates | checklist fns | ticks + labs + parent heights | Block specialist CTA until `specialistAllowed().allowed`. Show `DIAGNOSTIC_TIERS` 1/2/3 |

Wire Home cards + workbench rail to **all** of these.

---

## F. Unified consult flow (must work click-to-click)

1. Enter complaint + findings + age (+ optional vitals/labs).
2. `runDoctorPedAI({ persona, integrationMode:'unified', locale, ... })`.
3. If `awaiting_anamnesis` → questions only (unless emergency).
4. On emergency: ED action immediately **and** still run instruments (button battery → toxicology).
5. Show `triggered_modules` chips → deep-link standalone tools with shared patient strip.
6. `referral_gate`: if `allowed===false`, **block** specialist CTA; list `missing` as a tickable checklist; re-run when ticked.
7. Persist with `buildEncounterRecord`: clinician row **and** sanitized parent copy (no dosing).
8. History lists encounters filtered by RLS role, plus existing ECG/skin/radiology Analysis records.

Instrument auto-triggers (do not invent new regex; UI hints only):

| id | Tokens include |
|---|---|
| labs | lab, cbc, crp, מעבדה |
| audio | wheeze, stridor, crackle, שיעול, צפצוף, סטרידור |
| skin | rash, lesion, פריחה, נגע, עור |
| radiology | x-ray, ct, mri, צילום, רנטגן |
| ultrasound | graf, ddh, ivh, ultrasound, אולטרסאונד, ירכיים |
| genetics | dysmorph, down, turner, noonan, גנטי, דיסמורפ |
| csf | csf, lumbar, lp, נוזל שדרה, ניקור |
| metabolic | pku, newborn screen, hypoglycemia, סקר ילודים, מטבול |
| toxicology | ingest, battery, magnet, paracetamol, ibuprofen, poison, הרעל, סוללת, מגנט, אקמול |
| milestones | milestone, formula, ftt, תמ"ל, אבני דרך, התפתחות |
| ecg | ecg, ekg, אקג, סינקופה, palpitation |
| eeg | eeg, seizure, spasms, פרכוס, התכווצות |
| trauma | head trauma, gcs, burn, חבלת ראש, כוויה, נפילה |
| triads | kawasaki, hus, cushing, samter, קוואסאקי |
| pain | abdominal pain, headache, migraine, כאב בטן, כאב ראש, מיגרנה |
| neurodev | adhd, asd, autism, m-chat, vanderbilt, conners, קשב, אוטיזם |
| growth | short stature, percentile, immuniz, קומה, חיסון, גדילה |

Labs array non-empty also selects `labs`.

---

## G. Referral pipelines (UI enforcement; logic already in code)

### Child development / ASD / ADHD
Before specialist: vision tested + hearing tested + standardized questionnaire (M-CHAT and/or Vanderbilt and/or Conners).  
Missing → `referral_gate.asd_adhd.allowed === false`. No referral letter.  
Tiers: (1) community vision/hearing/questionnaires (2) audiology if failed / developmental screen (3) Child Development Unit.

### Pediatric GI — Celiac
Required: tTG-IgA done + total IgA done + child **on gluten-containing diet**.  
Gluten-free → block panel. **No numeric cutoffs.**  
Tiers: community serology → advanced serology per local protocol → pediatric GI.

### Growth / short stature
MPH from `father_cm + mother_cm + sex` (Tanner already in `midParentalHeight`; test vector: 180/160 male → 176.5).  
Growth plot / LMS if supplied (never invent WHO tables).  
Request bone-age X-ray + endocrine screening as **next steps**, not invented lab values.  
Tiers: community labs/plot/MPH → bone age + endocrine labs per local protocol → pediatric endocrinology.

---

## H. Keep these MedScan products alive (they are part of the app)

Do not orphan them behind a new shell.

1. **ECG** — image upload, pediatric toggle, comparison, validation gold set.
2. **Skin** — lesion image, morphometry, validation.
3. **Radiology** — X-ray/CT/MRI/US image + viewer + interpretation card.
4. **Labs** — catalog analytes, PDF/image scan, prior comparison, pattern interpreter.
5. **Patient context** — chronic_conditions[], medications[], allergies[], recentEvents. Uncovered background ≠ “safe”. Interactions: “not checked” ≠ “no interactions”.
6. **Protocol runner** — only **verified** protocols as clinical steps; unverified listed but locked. Do not invent tree nodes.
7. **Differential builder** — must-not-miss first.
8. **Knowledge admin / import / coverage / verify / Nelson book** — only verified KB enters FactBlock.
9. **Evaluation harness** — gold cases + test runs + feedback flywheel.

Persistence today uses Base44 entities (`Analysis`, `ECGCase`, `SkinCase`, `RadiologyCase`, `Protocol`, `DoseRecord`, `ReferenceRange`, `GoldStandardCase`, …).  
**Keep those working** if Base44 is still connected. **Additionally** implement Supabase for DoctorPed patients/encounters/questionnaires (and optionally mirror Analysis). Do not break existing History/Evaluation.

---

## I. Trilingual copy

- UI: `src/lib/translations.js` — add keys for every new screen in **he, en, and ar**.
- Clinical phrases: `src/lib/medscan/i18n/clinicalDictionary.js` + `finalizeLocale`. Do not machine-translate ad hoc in JSX.
- `I18nProvider` already sets `document.documentElement.dir` (`en` → ltr; he/ar → rtl).
- Clinician = professional terms. Parent = short sentences; never hide red flags.

---

## J. Supabase (make the app actually live)

Start from `supabase/doctorped_schema.sql`. Then make RLS real (the file currently has policies **commented**).

### Tables
**patients** — id, birth_date, sex, weight_kg, height_cm, locale, dir, parent_user_id, clinician_org_id  
**encounters** — patient_id, locale, dir, rls_role, encounter_type (`clinician`|`previsit`), triage_urgency, engines_run jsonb, output_summary jsonb, verification_status default `draft_needs_verification`, created_by  
**questionnaire_responses** — instrument `mchat`|`vanderbilt`|`conners`|`symptom_checker`, payload jsonb, locale, dir, rls_role, encounter_id  
**dose_records** — drug_key, drug_name_he, mg_per_kg_per_dose, max_mg_per_dose, max_mg_per_day, doses_per_day, min_age_days, verification_status, source. Only `verified` may go to `computeDose`.  
**analysis_history** (or keep Base44 Analysis) — type `ecg|skin|radiology|labs|consult|previsit`, summary, severity, structured_json, patient_id

Auth JWT claim `app_role` = `clinician` | `parent`.

### RLS
- Clinician: full encounter including professional DDx.
- Parent: SELECT only `rls_role='parent'`. Never store mg on parent copies. Strip dosing in a trigger/view.

On every successful `runDoctorPedAI`:
- clinician consult → `encounters` `rls_role=clinician`
- **and** sanitized parent copy `rls_role=parent` with `parent_plan_he` only (use `shapeForPersona` / strip dosing)

Use `buildEncounterRecord` as the JSON shape.

---

## K. Visual design

- Clinic-grade for clinicians; airy large tap targets for parents.
- RTL-first. Emergency = red-50, ack required. Referral blocked = amber checklist.
- Verified vs draft badges on FactBlock items.
- No “AI sparkle” implying a final diagnosis.
- Desktop workbench may use a wider max-width than the current `max-w-lg` mobile cards; parent stays mobile-width.

---

## L. Acceptance tests — the app is not done until all of these click through with no console errors

1. Hebrew default RTL; switch English (LTR) and Arabic (RTL); consult language follows.
2. Parent: age 40 days + fever → Emergency, no home-care, no mg.
3. Parent: button battery chip → Emergency, do not induce vomiting.
4. Parent: isolated mild cough/cold, age ≥90 days, no extra flags → home_care still with “if worse go to ED”.
5. Clinician: `adhd` without vision/hearing/questionnaire → anamnesis; with `proceed` → referral **blocked**.
6. Tick vision + hearing + M-CHAT → referral allowed (still not a diagnosis).
7. Celiac labs without gluten diet → GI referral blocked; gluten-free flag blocks.
8. Trauma `/trauma`: age 400 days, GCS 12 → PECARN `ct`; age 2000 days, GCS 15, no flags → `no_ct`.
9. Burns: neonate fractions `head:1` + `anterior_trunk:1` → TBSA **32** (Lund-Browder in code).
10. Nutrition: 5 kg × 6 feeds → 750 mL/day, 125 mL/feed; CMPA → eHF; anaphylaxis/FPIES → AAF; projectile vomiting does not switch formula.
11. Growth: no LMS → no invented Z; parents 180/160 male → MPH 176.5.
12. Toxicology opioid vitals (low GCS, miosis, low RR) → opioid toxidrome; JSON contains **no NAC**.
13. Dose panel without verified DoseRecord → refusal. Parent never sees mg even if a record exists.
14. Unified “button battery” triggers toxicology chip and saves clinician + parent encounter rows.
15. Standalone pages `/tox` `/trauma` `/growth` `/nutrition` `/neurodev` `/chronic` `/syndromes` `/metabolic` `/genetics` `/csf` `/us` `/eeg` `/audio` `/referrals` all load and run.
16. Existing `/ecg` `/skin` `/radiology` `/labs` `/patient-context` `/protocols` `/differential` still work.
17. Parent cannot open clinician DDx or dose numbers (RLS + UI hide + `/doctorped` redirects parents).
18. Fever anamnesis: unanswered questions → no DDx until answers or emergency.
19. History shows consults for clinician; parent sees only parent copies.
20. Language switcher on every new page; translations exist in he/en/ar.

Repo checks after code changes: `npm test` (architecture + ingestion + antihallucination + hardening + pediatricPathways + doctorped) and `npm run build`.

---

## M. What NOT to build

- Do not replace MedScan engines with a free-typing “act like a pediatrician” LLM.
- Do not scrape or hardcode Nelson / MOH / WHO tables into the UI.
- Do not add Gemini or non-Claude model switches.
- Do not auto-order labs or auto-refer without the checklist gate.
- Do not show calibrated probabilities.
- Do not execute `prompts/inbox/*` as new clinical features unless they already exist in code.
- Do not delete Base44 working pages while adding Supabase.

---

## N. Implementation order (do this sequence)

1. Connect GitHub repo. Confirm `@/lib/medscan/**` imports compile.
2. Shared patient-strip context. Role-aware auth (clinician/parent).
3. Supabase schema + **real** RLS policies + dual encounter insert.
4. Upgrade `/doctorped` and `/parent` to §D layouts; persist encounters.
5. Add **all** missing standalone routes in §E; update `registry.js` routes; add Home cards.
6. Referral page + checklists wired to ticks/labs/parent heights.
7. History + parent/clinician filtering.
8. Trilingual pass on every new string (`translations.js` + dictionary).
9. Click through §L; fix until all pass.
10. `npm test` && `npm run build`.

---

## O. One-sentence product truth

DoctorPedAI is the pediatrician’s workbench and the parent’s pre-visit guide; MedScan is the deterministic instrument panel already in this repo; Lovable is the living UI + Supabase shell — **never the source of clinical numbers.**
