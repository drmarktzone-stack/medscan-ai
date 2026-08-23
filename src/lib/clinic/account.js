/**
 * Dual-platform account: parent portal vs licensed clinician clinic.
 * Physician details are self-declared and stored on this device.
 * This is not a live check against the Ministry of Health registry.
 */

export const ACCOUNT_KEY = "doctorped_account_v1";

export const ACCOUNT_ROLES = Object.freeze(["parent", "clinician"]);

export const CLINICIAN_SPECIALTIES = Object.freeze([
  "pediatrics",
  "neonatology",
  "pediatric_neurology",
  "family",
  "general",
  "other",
]);

export function emptyAccount() {
  return {
    role: "",
    fullName: "",
    email: "",
    phone: "",
    nationalId: "",
    licenseNumber: "",
    specialty: "",
    clinicName: "",
    workplaceCity: "",
    completedAt: null,
  };
}

function clip(value, max = 80) {
  return String(value || "").trim().slice(0, max);
}

function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

/** Israeli Teudat Zehut checksum (9 digits). */
export function isValidNationalId(value) {
  const s = digits(value).padStart(9, "0");
  if (!/^\d{9}$/.test(s) || s === "000000000") return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(s[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}

/** Israeli medical license number — digits only, length typical of MoH licenses. */
export function isValidLicenseNumber(value) {
  return /^\d{4,9}$/.test(digits(value));
}

export function isValidPhone(value) {
  const d = digits(value);
  return /^0\d{8,9}$/.test(d);
}

export function normalizeAccount(raw = {}) {
  const role = ACCOUNT_ROLES.includes(raw.role) ? raw.role : "";
  return {
    ...emptyAccount(),
    role,
    fullName: clip(raw.fullName || raw.physicianName),
    email: clip(raw.email, 120).toLowerCase(),
    phone: digits(raw.phone).slice(0, 10),
    nationalId: digits(raw.nationalId).slice(0, 9),
    licenseNumber: digits(raw.licenseNumber).slice(0, 9),
    specialty: CLINICIAN_SPECIALTIES.includes(raw.specialty) ? raw.specialty : clip(raw.specialty, 40),
    clinicName: clip(raw.clinicName),
    workplaceCity: clip(raw.workplaceCity),
    completedAt: raw.completedAt || null,
  };
}

/** Extra profile fields — collected on the form, never used to lock the clinic. */
export function clinicianMissingFields(account) {
  const a = normalizeAccount(account);
  const missing = [];
  if (!a.fullName) missing.push("fullName");
  if (a.nationalId && !isValidNationalId(a.nationalId)) missing.push("nationalId");
  if (!isValidLicenseNumber(a.licenseNumber)) missing.push("licenseNumber");
  if (!a.specialty) missing.push("specialty");
  if (a.phone && !isValidPhone(a.phone)) missing.push("phone");
  return missing;
}

/**
 * Clinic tools stay open after name + license + specialty.
 * Israeli ID / phone / clinic name are optional so a checksum typo cannot freeze the app.
 */
export function clinicianBlockingFields(account) {
  const a = normalizeAccount(account);
  const missing = [];
  if (!a.fullName) missing.push("fullName");
  if (!isValidLicenseNumber(a.licenseNumber)) missing.push("licenseNumber");
  if (!a.specialty) missing.push("specialty");
  return missing;
}

export function isClinicianComplete(account) {
  return normalizeAccount(account).role === "clinician" && clinicianBlockingFields(account).length === 0;
}

export function isParentComplete(account) {
  const a = normalizeAccount(account);
  return a.role === "parent" && Boolean(a.fullName);
}

export function isAccountReady(account) {
  const a = normalizeAccount(account);
  if (a.role === "parent") return isParentComplete(a);
  if (a.role === "clinician") return isClinicianComplete(a);
  return false;
}

export function hasChosenRole(account) {
  return ACCOUNT_ROLES.includes(normalizeAccount(account).role);
}

/** Anyone without a chosen role must pick parent vs clinician — including local clinic. */
export function needsRoleSelection(account) {
  return !hasChosenRole(account);
}

/** Physician clinic stays closed until license number and specialty are filled. */
export function mustCompleteClinicianProfile(account) {
  const a = normalizeAccount(account);
  return a.role === "clinician" && !isClinicianComplete(a);
}

export function postAuthPath(account) {
  const a = normalizeAccount(account);
  if (a.role === "parent") return isParentComplete(a) ? "/parent" : "/register";
  if (a.role === "clinician") return isClinicianComplete(a) ? "/" : "/register";
  return "/register";
}

/** Parent accounts stay off professional tools. Switching to clinician is a license form, not a silent bounce. */
export const CLINICIAN_SWITCH_PATH = "/register?role=clinician";

export function isClinicianSwitchRequest(account, searchRole) {
  return normalizeAccount(account).role === "parent" && searchRole === "clinician";
}

export function isParentAllowedPath(pathname) {
  if (pathname === "/history") return true;
  if (pathname === "/parent") return true;
  if (pathname.startsWith("/parent/")) return true;
  return false;
}

/** Both desks of one product. Parents never land on `/` (RoleGate). */
export function visibleHomeDoors(_role) {
  return ["/doctorped", "/parent"];
}

export function loadAccount(storage) {
  const store = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  if (!store) return emptyAccount();
  try {
    const raw = store.getItem(ACCOUNT_KEY);
    if (raw) return normalizeAccount(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return emptyAccount();
}

export function saveAccount(account, storage) {
  const next = normalizeAccount(account);
  if (isAccountReady(next) && !next.completedAt) {
    next.completedAt = new Date().toISOString();
  }
  const store = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  if (store) store.setItem(ACCOUNT_KEY, JSON.stringify(next));
  return next;
}

export function clearAccount(storage) {
  const store = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  if (store) store.removeItem(ACCOUNT_KEY);
  return emptyAccount();
}
