import React, { useMemo } from "react";

/**
 * Renders the small amount of Markdown that model replies actually contain.
 *
 * Lesson and chat copy is written with `**bold**`, and rendering it as plain
 * text showed the asterisks to the reader. This handles bold and paragraph
 * breaks only — enough for generated copy, with no HTML ever injected.
 */
const BOLD = /\*\*([^*]+)\*\*/g;

function renderLine(line, key) {
  const parts = [];
  let lastIndex = 0;
  let match;

  BOLD.lastIndex = 0;
  while ((match = BOLD.exec(line)) !== null) {
    if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index));
    parts.push(<strong key={`${key}-b${match.index}`}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) parts.push(line.slice(lastIndex));

  return parts.length ? parts : [line];
}

export default function RichText({ text = "", className = "" }) {
  const lines = useMemo(() => String(text).split("\n"), [text]);

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {renderLine(line, i)}
          {i < lines.length - 1 && "\n"}
        </React.Fragment>
      ))}
    </div>
  );
}
