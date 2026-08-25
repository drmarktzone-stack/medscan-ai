import React, { useMemo } from "react";
import { motifFor } from "../lib/artwork.js";
import { renderMotif } from "../lib/motifs.js";

const SIZES = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

/**
 * Inline vector icon drawn from the same motif set as the illustrations.
 *
 * Card grids used to label themselves with emoji, which rendered differently on
 * every device and made the product look unfinished. This keeps one consistent
 * icon language across Hub and Kids.
 *
 * @param {object} props
 * @param {string} props.topic     Text the motif is matched against.
 * @param {string} [props.motif]   Force a specific motif id, skipping matching.
 * @param {string} [props.accent]  Motif fill colour.
 * @param {'sm'|'md'|'lg'|'xl'} [props.size]
 */
export default function MotifIcon({
  topic = "",
  motif,
  accent = "#fbbf24",
  size = "md",
  className = "",
}) {
  const id = motif || motifFor(topic).id;
  const markup = useMemo(() => renderMotif(id, accent), [id, accent]);

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${SIZES[size] || SIZES.md} shrink-0 ${className}`}
      role="presentation"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
