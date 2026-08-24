import { useState, useCallback } from "react";
import { pickL } from "../lib/locale.js";
import { speakText } from "../lib/tts.js";

/** Play a short pop sound via Web Audio */
function playPop() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 520;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    /* silent */
  }
}

/**
 * @param {{ lang?: string; onText?: (text: string) => void; onSymbol?: (payload: object) => void; speak?: boolean }} opts
 */
export function useSymbolInput({ lang = "he", onText, onSymbol, speak = true } = {}) {
  const [flash, setFlash] = useState(null);

  const handleKey = useCallback(
    (keyDef) => {
      if (!keyDef) return;

      if (keyDef.action === "backspace") {
        onText?.("__BACKSPACE__");
        return;
      }
      if (keyDef.action === "space") {
        onText?.(" ");
        return;
      }

      const word = pickL(keyDef.label, lang);
      const isLetter = !keyDef.action || keyDef.action === undefined && keyDef.label.he.length === 1;

      if (isLetter && keyDef.label.he.length === 1) {
        onText?.(word);
        return;
      }

      playPop();
      setFlash({ word, emoji: keyDef.emoji, id: keyDef.id });

      if (speak && word) {
        speakText(word, { lang, rate: 0.9 });
      }

      const promptFragment = keyDef.prompt ? pickL(keyDef.prompt, lang) : word;

      onSymbol?.({
        id: keyDef.id,
        emoji: keyDef.emoji,
        word,
        prompt: promptFragment,
        action: keyDef.action,
      });

      onText?.(promptFragment);

      setTimeout(() => setFlash(null), 1800);
    },
    [lang, onText, onSymbol, speak],
  );

  return { flash, handleKey, clearFlash: () => setFlash(null) };
}
