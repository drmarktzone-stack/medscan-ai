/**
 * Appointment planning — combines profile, service, urgency and user date prefs.
 * Does NOT invent slot availability; guides the user to official booking channels.
 */

import { loadCareProfile } from "./careProfile.js";
import {
  SERVICE_META,
  URGENCY_LEVELS,
  serviceFromFollowUpType,
  serviceMeta,
  urgencyFromSeverity,
} from "./appointmentCatalog.js";
import { buildBookingDestinations } from "./appointmentLinks.js";

export function parseAppointmentSearchParams(searchParams) {
  const sp = searchParams instanceof URLSearchParams
    ? searchParams
    : new URLSearchParams(String(searchParams || ""));
  return {
    service: sp.get("service") || "",
    urgency: URGENCY_LEVELS.includes(sp.get("urgency")) ? sp.get("urgency") : "",
    context: sp.get("context") || "",
    followUpType: sp.get("followUpType") || "",
  };
}

export function buildAppointmentPlan({
  profile,
  serviceId,
  urgency = "routine",
  preferredDates = [],
  preferredSlots = [],
  city = "",
  notes = "",
} = {}) {
  const p = profile || loadCareProfile();
  const svc = serviceMeta(serviceId);
  const u = URGENCY_LEVELS.includes(urgency) ? urgency : svc.defaultUrgency || "routine";
  const destinations = buildBookingDestinations({
    hmo: p.hmo,
    serviceId: svc.id,
    urgency: u,
  });

  return {
    serviceId: svc.id,
    urgency: u,
    profile: p,
    city: city || p.city,
    preferredDates: (preferredDates || []).filter(Boolean).slice(0, 14),
    preferredSlots: (preferredSlots || []).slice(0, 3),
    notes: String(notes || "").trim().slice(0, 300),
    destinations,
    prepKeys: svc.prepKeys || [],
    disclaimerKey: "appt.plan_disclaimer",
    needsProfile: !p.hmo || p.hmo === "unknown",
  };
}

export function planFromFollowUp(item, profile) {
  const serviceId = serviceFromFollowUpType(item?.type);
  const urgency = item?.status === "stuck" ? "urgent" : "routine";
  return buildAppointmentPlan({
    profile,
    serviceId,
    urgency,
    preferredDates: item?.dueDate ? [item.dueDate] : [],
    notes: item?.title || "",
  });
}

export function planFromClinicalResult({ severity, serviceId = "pediatrician", summary = "" } = {}) {
  return buildAppointmentPlan({
    serviceId,
    urgency: urgencyFromSeverity(severity),
    notes: summary,
  });
}

/** Suggested date range labels for the wizard (next N days). */
export function suggestDateOptions(fromDate = new Date(), count = 14) {
  const out = [];
  const start = new Date(fromDate);
  start.setHours(12, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function formatPreferredSummary(plan, t) {
  const parts = [];
  if (plan.preferredDates?.length) {
    parts.push(t("appt.summary_dates", { n: plan.preferredDates.length }));
  }
  if (plan.preferredSlots?.length) {
    parts.push(t("appt.summary_slots", { n: plan.preferredSlots.length }));
  }
  return parts.join(" · ") || t("appt.summary_anytime");
}
