import React from "react";

/** Floating sparkles + soft gradient orbs for kids UI */
export default function KidsMagicBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden>
      <div className="kids-orb kids-orb-1" />
      <div className="kids-orb kids-orb-2" />
      <div className="kids-orb kids-orb-3" />
      {[...Array(12)].map((_, i) => (
        <span
          key={i}
          className="kids-sparkle"
          style={{
            left: `${8 + (i * 7.5) % 88}%`,
            top: `${10 + (i * 11) % 75}%`,
            animationDelay: `${i * 0.4}s`,
            fontSize: `${12 + (i % 3) * 6}px`,
          }}
        >
          {["✨", "⭐", "🌟", "💫", "🎈", "🦋"][i % 6]}
        </span>
      ))}
    </div>
  );
}
