/**
 * On-device morphology → reference atlas hints.
 * These are comparison patterns only — never the tool's diagnosis output.
 */

import { matchScore } from "../../atlasRetrieval.js";
import { SKIN_ATLAS, RADIOLOGY_ATLAS } from "./referenceAtlas.js";

function rankAtlas(query, entries, topK = 3) {
  return (entries || [])
    .map((entry) => {
      const { score, reasons } = matchScore(query, entry);
      return { entry, score, reasons };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function referenceRow(entry, score, reasons) {
  return {
    title: entry.title,
    diagnosis: entry.diagnosis,
    confidence: Math.min(50, Math.max(15, Math.round(score * 12))),
    reasoning: `דפוס ייחוס להשוואה (${(reasons || []).join(" · ") || "מורפולוגיה יחסית"}) — לא אבחנה`,
    kb_reference: entry.title,
    reference_features: entry.key_features || entry.diagnostic_criteria || "",
    atlas_seed: true,
    reference_only: true,
  };
}

/** Skin: map pixel morphology to atlas descriptors (ABCDE-ish signals). */
export function skinMorphologyAtlasHints(morphology) {
  if (!morphology?.ok) return [];

  const tags = [];
  if (morphology.borders?.irregular) tags.push("irregular_border");
  if (morphology.color?.variegated) tags.push("multicolour");
  if ((morphology.asymmetry_index ?? 0) > 0.22) tags.push("asymmetry");
  if ((morphology.satellite_lesions?.count ?? 0) > 0) tags.push("satellite");
  if ((morphology.color?.cluster_count ?? 0) >= 4) tags.push("multicolour");
  if (!morphology.borders?.irregular && !morphology.color?.variegated) {
    tags.push("symmetric", "regular_border", "pigmented");
  }
  if ((morphology.distribution?.occupied_quadrants ?? 0) >= 3) {
    tags.push("eczema", "flexural");
  }

  const query = { category: "skin", tags, text: tags.join(" ") };
  return rankAtlas(query, SKIN_ATLAS).map((r) => referenceRow(r.entry, r.score, r.reasons));
}

/** Radiology: map density/texture/bone signals to atlas descriptors. */
export function radiologyMorphologyAtlasHints(morphology) {
  if (!morphology?.ok) return [];

  const tags = [];
  const dens = morphology.densities || {};
  if (morphology.pulmonary_infiltrate_texture?.elevated) {
    tags.push("chest", "consolidation", "infiltrate");
  }
  if ((dens.lucent_like ?? 0) > 0.35 && (morphology.bone_structure?.connected_components ?? 0) <= 2) {
    tags.push("chest", "pleural_line", "emergency");
  }
  if ((dens.dense_like ?? 0) > 0.08 && (morphology.bone_structure?.connected_components ?? 0) >= 2) {
    tags.push("bone", "fracture", "fat_pad", "pediatric");
  }
  if ((dens.lucent_like ?? 0) > 0.25 && !morphology.pulmonary_infiltrate_texture?.elevated) {
    tags.push("chest", "blunted_angle", "effusion");
  }
  if ((dens.intermediate_like ?? 0) > 0.5 && (dens.lucent_like ?? 0) > 0.15) {
    tags.push("abdomen", "air_fluid_levels", "dilated_loops");
  }
  if ((dens.lucent_like ?? 0) > 0.05 && (dens.dense_like ?? 0) > 0.02) {
    tags.push("chest");
  }

  const query = { category: "radiology", tags, text: tags.join(" ") };
  return rankAtlas(query, RADIOLOGY_ATLAS).map((r) => referenceRow(r.entry, r.score, r.reasons));
}
