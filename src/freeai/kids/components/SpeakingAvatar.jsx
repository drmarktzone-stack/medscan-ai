import React, { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSpeaking, stopSpeaking, speakText, ttsSupported } from "../lib/tts.js";

const MOODS = ["🤖", "😊", "🤔", "🎉", "📚"];

export default function SpeakingAvatar({ text, lang, speaking: externalSpeaking, size = "lg" }) {
  const [mood, setMood] = useState(1);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const speaking = externalSpeaking ?? localSpeaking;
  const dim = size === "sm" ? "w-14 h-14 text-2xl" : "w-24 h-24 text-4xl";

  useEffect(() => {
    if (!speaking) return;
    const t = setInterval(() => setMood((m) => (m + 1) % MOODS.length), 400);
    return () => clearInterval(t);
  }, [speaking]);

  const toggleSpeak = () => {
    if (!text || !ttsSupported()) return;
    if (isSpeaking()) {
      stopSpeaking();
      setLocalSpeaking(false);
      return;
    }
    setLocalSpeaking(true);
    speakText(text, {
      lang,
      onEnd: () => setLocalSpeaking(false),
    });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${dim} rounded-full bg-white/30 border-4 border-white/50 shadow-xl flex items-center justify-center transition-transform ${
          speaking ? "kids-avatar-talk scale-105" : "scale-100"
        }`}
      >
        {MOODS[mood]}
      </div>
      {text && ttsSupported() && (
        <button
          type="button"
          onClick={toggleSpeak}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/25 text-xs font-bold hover:bg-white/40"
        >
          {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          {speaking ? "עצור" : "הקרא"}
        </button>
      )}
    </div>
  );
}
