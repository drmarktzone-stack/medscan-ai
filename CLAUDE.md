# See AGENTS.md

Follow `AGENTS.md`. This file is the session brief for **Claude Code** on this repo.

## Product truth (do not invent another app)

- Name: MedScan. DoctorPedAI is the clinician workbench **inside** MedScan, not a replacement.
- Decision support, not a diagnosis. Draft until a physician verifies.
- **Claude only** for vision/LLM. No Gemini. No Lovable AI. Do not swap `InvokeLLM`.
- Clinical numbers (doses, scores, urgency) come from deterministic code, not the model.
- Two doors: clinician (`/doctorped` after license + specialty) and parent (`/parent`). Parents never see professional DDx or milligrams.
- Source of truth: this GitHub repo (`drmarktzone-stack/medscan-ai`). **Lovable does not sync.** Do not paste prompts into Lovable. Do not spend Lovable tokens.
- Live site (after merge to `main`):
  https://drmarktzone-stack.github.io/medscan-ai/

## What is already on `main`

- Original MedScan tools + clinician visit chart (`src/pages/DoctorPedWorkbench.jsx`).
- Parent portal with tabs: visit, skin, trauma, development (`src/pages/ParentPortal.jsx`). Helper language only.
- Parent → clinician switch: `/register?role=clinician` (license required). `CLINICIAN_SWITCH_PATH` in `src/lib/clinic/account.js`.
- GitHub Pages basename: full-page jumps use `absoluteAppPath` in `src/lib/clinic/standalone.js`.
- Clinic chrome: solid white panels (`src/index.css`), not frosted candy glass.

## What you must not do

- Do not invent diagnoses, vaccine intervals, Z-scores without LMS, or milligrams for parents.
- Do not estimate weight from age.
- Do not merge without the doctor asking.
- Do not run `prompts/inbox/` unless the doctor says so in chat or types `/inbox`.
- Files in `prompts/hold/` stay frozen until moved to inbox **and** the doctor asks.
- Do not start a Google Play upload from this machine. Play Console + signing keys belong to the doctor. Only wrap the existing site if he asks.

## Checks

```bash
npm test
npm run build
npm run build:standalone
```

Standalone is what GitHub Pages deploys.

## פרוטוקול תיבת-פרומפטים

ד"ר סמר מוסיף משימות כקובצי `.md` ב-`prompts/inbox/`.

**בתחילת סשן:** ה-hook רק **מדווח** אם יש קבצים. **אל תבצע** אותם אוטומטית.

**בצע רק אם** הוא כתב «בדוק את ה-inbox» / «הרץ את הפרומפטים» **או** הקליד `/inbox`:

1. `prompts/inbox/*.md` (לא README) — אחת-אחת לפי שם הקובץ.
2. שינוי ממוקד → `npm test` ו-`npm run build` → אחר כך העבר ל-`prompts/done/`.
3. `prompts/hold/` — לא לגעת.
4. בספק קליני: `needs_verification`, לא ניחוש.

## Claude Code — איך לעבוד כאן

1. Clone / pull `main` from GitHub (not Lovable).
2. `npm install`.
3. Read this file and `AGENTS.md` before editing.
4. One focused change. Tests. Commit. Push a branch. Let the doctor merge on GitHub.
5. Hebrew UI, RTL. Speak to the doctor in simple complete Hebrew; file paths and URLs on their own lines.
