/**
 * Web Speech API — voice input for kids (he / en / ar).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { resolveKidsLang } from "../lib/locale.js";

const SPEECH_LANG = { he: "he-IL", en: "en-US", ar: "ar-SA" };

export function speechSupported() {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function getRecognition() {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

/**
 * @param {{ lang?: string; onResult?: (text: string) => void; onError?: (msg: string) => void; continuous?: boolean }} opts
 */
export function useKidsVoice(opts = {}) {
  const { lang = "he", onResult, onError, continuous = false } = opts;
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef(null);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!speechSupported()) {
      onError?.("unsupported");
      return;
    }
    stop();
    const rec = getRecognition();
    if (!rec) return;
    recRef.current = rec;
    rec.lang = SPEECH_LANG[resolveKidsLang(lang)] || "he-IL";
    rec.interimResults = true;
    rec.continuous = continuous;
    rec.maxAlternatives = 1;

    rec.onresult = (ev) => {
      let text = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        text += ev.results[i][0].transcript;
      }
      setTranscript(text);
      if (ev.results[ev.results.length - 1]?.isFinal) {
        onResult?.(text.trim());
      }
    };
    rec.onerror = () => {
      setListening(false);
      onError?.("error");
    };
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  }, [lang, continuous, onResult, onError, stop]);

  useEffect(() => () => stop(), [stop]);

  return { listening, transcript, start, stop, supported: speechSupported() };
}
