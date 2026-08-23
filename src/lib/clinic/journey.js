/**
 * MedScan Family Journey — information architecture.
 * Four phases for families; grouped tool shelves for clinicians.
 */

import {
  Heart, FlaskConical, ClipboardCheck, Stethoscope,
  Activity, ScanLine, UserCog, GitBranch, ListChecks, Database,
  Biohazard, Flame, Baby, Brain, Bone, Dna, Droplets, Waves, Mic, Pill,
} from "lucide-react";

/** Family journey phases — shown on ParentHub and referenced in marketing copy. */
export const FAMILY_JOURNEY_PHASES = Object.freeze([
  {
    id: "before",
    titleKey: "journey.phase_before_title",
    descKey: "journey.phase_before_desc",
    stepKey: "journey.step_before",
    path: "/parent/visit",
    icon: Heart,
    tone: "rose",
  },
  {
    id: "during",
    titleKey: "journey.phase_during_title",
    descKey: "journey.phase_during_desc",
    stepKey: "journey.step_during",
    path: "/parent/results",
    icon: FlaskConical,
    tone: "sky",
  },
  {
    id: "after",
    titleKey: "journey.phase_after_title",
    descKey: "journey.phase_after_desc",
    stepKey: "journey.step_after",
    path: "/parent/follow-up",
    icon: ClipboardCheck,
    tone: "amber",
  },
]);

const TONES = Object.freeze(["rose", "sky", "amber", "slate"]);

/** Tone utility class defined once in index.css. */
export function journeyPhaseToneClass(tone) {
  return TONES.includes(tone) ? `tone-${tone}` : "tone-sky";
}

/** 1-based position of a phase, used for the numbered step markers. */
export function journeyPhaseNumber(phaseId) {
  const index = FAMILY_JOURNEY_PHASES.findIndex((p) => p.id === phaseId);
  return index === -1 ? null : index + 1;
}

/** Clinician home — grouped shelves instead of one flat grid. */
export const CLINICIAN_SHELVES = Object.freeze([
  {
    id: "workbench",
    titleKey: "journey.shelf_workbench",
    descKey: "journey.shelf_workbench_desc",
    items: [
      {
        titleKey: "home.doctorped_title",
        descKey: "home.doctorped_desc",
        icon: Stethoscope,
        path: "/doctorped",
        featured: true,
      },
      {
        titleKey: "home.parent_title",
        descKey: "home.parent_desc",
        icon: Heart,
        path: "/parent",
        featured: true,
      },
    ],
  },
  {
    id: "media",
    titleKey: "journey.shelf_media",
    descKey: "journey.shelf_media_desc",
    items: [
      { titleKey: "home.ecg_title", descKey: "home.ecg_desc", icon: Activity, path: "/ecg" },
      { titleKey: "home.skin_title", descKey: "home.skin_desc", icon: Stethoscope, path: "/skin" },
      { titleKey: "home.radiology_title", descKey: "home.radiology_desc", icon: ScanLine, path: "/radiology" },
      { titleKey: "home.labs_title", descKey: "home.labs_desc", icon: FlaskConical, path: "/labs" },
    ],
  },
  {
    id: "reasoning",
    titleKey: "journey.shelf_reasoning",
    descKey: "journey.shelf_reasoning_desc",
    items: [
      { titleKey: "home.context_title", descKey: "home.context_desc", icon: UserCog, path: "/patient-context" },
      { titleKey: "home.protocols_title", descKey: "home.protocols_desc", icon: GitBranch, path: "/protocols" },
      { titleKey: "home.differential_title", descKey: "home.differential_desc", icon: ListChecks, path: "/differential" },
    ],
  },
  {
    id: "community",
    titleKey: "journey.shelf_community",
    descKey: "journey.shelf_community_desc",
    items: [
      { titleKey: "home.tox_title", descKey: "home.tox_desc", icon: Biohazard, path: "/tox" },
      { titleKey: "home.trauma_title", descKey: "home.trauma_desc", icon: Flame, path: "/trauma" },
      { titleKey: "home.growth_title", descKey: "home.growth_desc", icon: Activity, path: "/growth" },
      { titleKey: "home.nutrition_title", descKey: "home.nutrition_desc", icon: Baby, path: "/nutrition" },
      { titleKey: "home.neurodev_title", descKey: "home.neurodev_desc", icon: Brain, path: "/neurodev" },
      { titleKey: "home.chronic_title", descKey: "home.chronic_desc", icon: Pill, path: "/chronic" },
      { titleKey: "home.syndromes_title", descKey: "home.syndromes_desc", icon: GitBranch, path: "/syndromes" },
      { titleKey: "home.metabolic_title", descKey: "home.metabolic_desc", icon: Droplets, path: "/metabolic" },
      { titleKey: "home.genetics_title", descKey: "home.genetics_desc", icon: Dna, path: "/genetics" },
      { titleKey: "home.csf_title", descKey: "home.csf_desc", icon: Droplets, path: "/csf" },
      { titleKey: "home.us_title", descKey: "home.us_desc", icon: Waves, path: "/us" },
      { titleKey: "home.eeg_title", descKey: "home.eeg_desc", icon: Brain, path: "/eeg" },
      { titleKey: "home.audio_title", descKey: "home.audio_desc", icon: Mic, path: "/audio" },
      { titleKey: "home.referrals_title", descKey: "home.referrals_desc", icon: Bone, path: "/referrals" },
    ],
  },
  {
    id: "knowledge",
    titleKey: "journey.shelf_knowledge",
    descKey: "journey.shelf_knowledge_desc",
    items: [
      { titleKey: "home.kbadmin_title", descKey: "home.kbadmin_desc", icon: Database, path: "/knowledge-admin" },
    ],
  },
]);

/** Parent routes that RoleGate allows without clinician switch. */
export const PARENT_JOURNEY_PATHS = Object.freeze([
  "/parent",
  "/parent/visit",
  "/parent/results",
  "/parent/follow-up",
  "/history",
]);

export function isParentJourneyPath(pathname) {
  return PARENT_JOURNEY_PATHS.some(
    (p) => pathname === p || (p !== "/parent" && pathname.startsWith(`${p}/`)),
  );
}
