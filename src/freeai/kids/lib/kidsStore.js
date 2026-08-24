/**
 * FreeAI Kids — local persistence (gallery, profile, achievements).
 */

const PROFILE_KEY = "freeai_kids_profile_v1";
const GALLERY_KEY = "freeai_kids_gallery_v1";
const ACHIEVEMENTS_KEY = "freeai_kids_achievements_v1";

function read(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, val) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
}

export function loadKidsProfile() {
  return read(PROFILE_KEY, { name: "", grade: "5", ageGroup: "mid" });
}

export function saveKidsProfile(profile) {
  write(PROFILE_KEY, { ...loadKidsProfile(), ...profile });
  return loadKidsProfile();
}

/** @typedef {{ id: string; type: string; title: string; preview?: string; data?: object; createdAt: string }} KidsCreation */

export function loadGallery() {
  return read(GALLERY_KEY, []);
}

export function saveCreation(item) {
  const gallery = loadGallery();
  gallery.unshift({
    id: item.id || `kid-${Date.now()}`,
    type: item.type,
    title: item.title,
    preview: item.preview,
    data: item.data,
    createdAt: new Date().toISOString(),
  });
  write(GALLERY_KEY, gallery.slice(0, 50));
  unlockAchievement(item.type);
  return gallery;
}

export function loadAchievements() {
  return read(ACHIEVEMENTS_KEY, []);
}

const BADGE_MAP = {
  story: { id: "first_story", icon: "📚", name: { he: "סיפור ראשון", en: "First story", ar: "قصة أولى" } },
  character: { id: "first_character", icon: "🦸", name: { he: "דמות ראשונה", en: "First character", ar: "شخصية أولى" } },
  drawing: { id: "first_drawing", icon: "🎨", name: { he: "ציור ראשון", en: "First drawing", ar: "رسمة أولى" } },
  game: { id: "first_game", icon: "🎮", name: { he: "משחק ראשון", en: "First game", ar: "لعبة أولى" } },
  study: { id: "first_study", icon: "📖", name: { he: "לימוד ראשון", en: "First study", ar: "دراسة أولى" } },
  body: { id: "first_body", icon: "❤️", name: { he: "גוף האדם", en: "Human body", ar: "جسم الإنسان" } },
  quiz: { id: "first_quiz", icon: "✅", name: { he: "מבחן סיכום", en: "Summary quiz", ar: "اختبار مراجعة" } },
};

function unlockAchievement(type) {
  const badge = BADGE_MAP[type];
  if (!badge) return;
  const list = loadAchievements();
  if (list.some((a) => a.id === badge.id)) return;
  list.push({ ...badge, unlockedAt: new Date().toISOString() });
  write(ACHIEVEMENTS_KEY, list);
}

export function unlockQuizAchievement() {
  unlockAchievement("quiz");
}

export { BADGE_MAP };
