/**
 * Tracks step-by-step build progress shown beside Kids chat.
 */

const KEY = "freeai_kids_build_session_v1";

/** @typedef {'pending'|'active'|'done'|'error'} StepStatus */
/** @typedef {{ id: string; label: Trilingual; status: StepStatus; preview?: string; detail?: string }} BuildStep */

function read() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

function write(session) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function startBuildSession(type, prompt) {
  const session = {
    id: `build-${Date.now()}`,
    type,
    prompt,
    steps: [],
    result: null,
    startedAt: new Date().toISOString(),
  };
  write(session);
  return session;
}

export function loadBuildSession() {
  return read();
}

export function updateBuildSteps(steps, result = null) {
  const session = read() || startBuildSession("unknown", "");
  session.steps = steps;
  if (result != null) session.result = result;
  write(session);
  return session;
}

export function clearBuildSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

export function defaultStepsForType(type, lang = "he") {
  const L = {
    understand: { he: "1. הבנתי מה את/ה רוצה", en: "1. Got your idea", ar: "1. فهمت فكرتك" },
    think: { he: "2. AI חושב...", en: "2. AI thinking...", ar: "2. AI يفكر..." },
    create: { he: "3. יוצר...", en: "3. Creating...", ar: "3. ينشئ..." },
    polish: { he: "4. מלטש ומוסיף קסם ✨", en: "4. Adding magic ✨", ar: "4. يلمع ✨" },
    ready: { he: "5. מוכן! 🎉", en: "5. Ready! 🎉", ar: "5. جاهز! 🎉" },
  };
  const pick = (k) => L[k][lang] || L[k].he;
  const createLabel = {
    game: { he: "3. בונה משחק", en: "3. Building game", ar: "3. يبني لعبة" },
    logo: { he: "3. מעצב לוגו", en: "3. Designing logo", ar: "3. يصمم شعار" },
    puzzle: { he: "3. מרכיב פאזל", en: "3. Assembling puzzle", ar: "3. يجمع أحجية" },
    story: { he: "3. כותב סיפור", en: "3. Writing story", ar: "3. يكتب قصة" },
    character: { he: "3. מצייר דמות", en: "3. Drawing character", ar: "3. يرسم شخصية" },
    drawing: { he: "3. מצייר", en: "3. Drawing", ar: "3. يرسم" },
  };
  const create = createLabel[type] ? (createLabel[type][lang] || createLabel[type].he) : pick("create");

  return [
    { id: "understand", label: pick("understand"), status: "done" },
    { id: "think", label: pick("think"), status: "active" },
    { id: "create", label: create, status: "pending" },
    { id: "polish", label: pick("polish"), status: "pending" },
    { id: "ready", label: pick("ready"), status: "pending" },
  ];
}

export function setStepStatus(steps, stepId, status) {
  return steps.map((s) => (s.id === stepId ? { ...s, status } : s));
}

export function advanceSteps(steps, activeId) {
  const ids = steps.map((s) => s.id);
  const idx = ids.indexOf(activeId);
  return steps.map((s, i) => {
    if (i < idx) return { ...s, status: "done" };
    if (i === idx) return { ...s, status: "active" };
    return { ...s, status: "pending" };
  });
}
