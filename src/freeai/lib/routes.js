/** FreeAI standalone routes — not under /freeai prefix, not part of MedScan. */

export const R = {
  hub: "/hub",
  create: "/create",
  studio: "/studio",
  pricing: "/pricing",
  checkout: "/checkout",
  marketing: "/marketing",
  passport: "/passport",
  planner: "/planner",
  providers: "/providers",
  kids: "/kids",
  kidsChat: "/kids/chat",
  kidsDaily: "/kids/daily",
  kidsParent: "/kids/parent",
  kidsStudy: "/kids/study",
  kidsBody: "/kids/body",
  kidsCreate: "/kids/create",
  kidsGame: "/kids/game",
  kidsGallery: "/kids/gallery",
};

export function freeaiPublicOrigin(env = import.meta.env) {
  const base = (env?.VITE_FREEAI_PUBLIC_URL || env?.BASE_URL || "").replace(/\/$/, "");
  if (base.startsWith("http")) return base;
  if (typeof window !== "undefined") return window.location.origin + (env?.BASE_URL || "").replace(/\/$/, "");
  return "";
}

export function kidsUrl(env) {
  return `${freeaiPublicOrigin(env)}${R.kids}`;
}

export function createUrl(env) {
  return `${freeaiPublicOrigin(env)}${R.create}`;
}
