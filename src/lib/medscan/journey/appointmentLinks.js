/**
 * Curated deep links and phone numbers for Israeli healthcare booking.
 * needs_verification — URLs and call centers change; verify periodically.
 * No scraping, no fake availability — honest navigation only.
 */

export const HMO_BOOKING = Object.freeze({
  clalit: {
    id: "clalit",
    labelKey: "appt.hmo_clalit",
    portalUrl: "https://my.clalit.co.il/",
    phone: "*2700",
    appHintKey: "appt.hmo_clalit_app",
  },
  maccabi: {
    id: "maccabi",
    labelKey: "appt.hmo_maccabi",
    portalUrl: "https://www.maccabi4u.co.il/",
    phone: "*3555",
    appHintKey: "appt.hmo_maccabi_app",
  },
  meuhedet: {
    id: "meuhedet",
    labelKey: "appt.hmo_meuhedet",
    portalUrl: "https://online.meuhedet.co.il/",
    phone: "*3833",
    appHintKey: "appt.hmo_meuhedet_app",
  },
  leumit: {
    id: "leumit",
    labelKey: "appt.hmo_leumit",
    portalUrl: "https://online.leumit.co.il/",
    phone: "*507",
    appHintKey: "appt.hmo_leumit_app",
  },
});

/** National / cross-fund services. */
export const NATIONAL_SERVICES = Object.freeze({
  terem: {
    id: "terem",
    labelKey: "appt.link_terem",
    descKey: "appt.link_terem_desc",
    url: "https://www.terem.co.il/",
    phone: "1-700-50-50-50",
    sectors: ["urgent_care", "emergency"],
    urgency: ["urgent", "emergency"],
  },
  mda: {
    id: "mda",
    labelKey: "appt.link_mda",
    descKey: "appt.link_mda_desc",
    url: "https://www.mdais.org/",
    phone: "101",
    sectors: ["emergency"],
    urgency: ["emergency"],
  },
  er: {
    id: "er",
    labelKey: "appt.link_er",
    descKey: "appt.link_er_desc",
    url: "https://www.health.gov.il/",
    phone: "100",
    sectors: ["emergency"],
    urgency: ["emergency"],
  },
});

/** Private / supplementary booking when HMO wait is long. */
export const PRIVATE_SERVICES = Object.freeze({
  doctoralia: {
    id: "doctoralia",
    labelKey: "appt.link_doctoralia",
    descKey: "appt.link_doctoralia_desc",
    url: "https://www.doctoralia.co.il/",
    sectors: ["specialist", "mental_health", "physio", "dental", "other"],
    urgency: ["routine", "urgent"],
  },
  assuta: {
    id: "assuta",
    labelKey: "appt.link_assuta",
    descKey: "appt.link_assuta_desc",
    url: "https://www.assuta.co.il/",
    sectors: ["imaging", "specialist"],
    urgency: ["routine", "urgent"],
  },
});

/** Per-HMO path hints appended as user guidance (not always deep-linkable). */
export const HMO_SERVICE_HINTS = Object.freeze({
  pediatrician: "appt.hint_pediatrician",
  specialist: "appt.hint_specialist",
  imaging: "appt.hint_imaging",
  hearing: "appt.hint_hearing",
  lab: "appt.hint_lab",
  urgent_care: "appt.hint_urgent",
  emergency: "appt.hint_emergency",
  mental_health: "appt.hint_mental",
  physio: "appt.hint_physio",
  dental: "appt.hint_dental",
  other: "appt.hint_other",
});

/**
 * Build ordered booking destinations for a service.
 * @returns {Array<{id:string, kind:'hmo'|'national'|'private', labelKey:string, descKey?:string, url?:string, phone?:string, hintKey?:string, priority:number}>}
 */
export function buildBookingDestinations({ hmo, serviceId, urgency = "routine" }) {
  const out = [];
  const isEmergency = urgency === "emergency";
  const isUrgent = urgency === "urgent" || isEmergency;

  if (isEmergency) {
    for (const svc of Object.values(NATIONAL_SERVICES)) {
      if (svc.urgency.includes("emergency")) {
        out.push({
          id: svc.id,
          kind: "national",
          labelKey: svc.labelKey,
          descKey: svc.descKey,
          url: svc.url,
          phone: svc.phone,
          priority: svc.id === "mda" ? 0 : svc.id === "er" ? 1 : 2,
        });
      }
    }
    return out.sort((a, b) => a.priority - b.priority);
  }

  if (isUrgent) {
    const terem = NATIONAL_SERVICES.terem;
    out.push({
      id: terem.id,
      kind: "national",
      labelKey: terem.labelKey,
      descKey: terem.descKey,
      url: terem.url,
      phone: terem.phone,
      priority: 0,
    });
  }

  const hmoEntry = HMO_BOOKING[hmo];
  if (hmoEntry) {
    out.push({
      id: `hmo-${hmoEntry.id}`,
      kind: "hmo",
      labelKey: hmoEntry.labelKey,
      descKey: hmoEntry.appHintKey,
      url: hmoEntry.portalUrl,
      phone: hmoEntry.phone,
      hintKey: HMO_SERVICE_HINTS[serviceId] || HMO_SERVICE_HINTS.other,
      priority: isUrgent ? 1 : 0,
    });
  } else if (hmo === "private_only") {
    /* skip HMO row */
  } else {
    out.push({
      id: "hmo-pick",
      kind: "hmo",
      labelKey: "appt.hmo_unknown",
      descKey: "appt.hmo_unknown_desc",
      hintKey: HMO_SERVICE_HINTS[serviceId] || HMO_SERVICE_HINTS.other,
      priority: 2,
    });
  }

  for (const svc of Object.values(PRIVATE_SERVICES)) {
    if (svc.sectors.includes(serviceId) && svc.urgency.includes(urgency)) {
      out.push({
        id: svc.id,
        kind: "private",
        labelKey: svc.labelKey,
        descKey: svc.descKey,
        url: svc.url,
        priority: 10,
      });
    }
  }

  return out.sort((a, b) => a.priority - b.priority);
}

export function telHref(phone) {
  const digits = String(phone || "").replace(/[^\d*#+]/g, "");
  return digits ? `tel:${digits}` : null;
}
