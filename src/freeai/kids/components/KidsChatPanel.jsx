import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Sparkles, Trash2 } from "lucide-react";
import { kidsChatWithAI } from "../lib/kidsChatEngine.js";
import { pickL } from "../lib/locale.js";
import { useKidsVoice } from "../hooks/useKidsVoice.js";
import SpeakingAvatar from "./SpeakingAvatar.jsx";
import { speakText, stopSpeaking } from "../lib/tts.js";

const UI = {
  placeholder: {
    he: "שאל/י אותי הכל — מדעים, מתמatics, היסטוריה, רעיונות...",
    en: "Ask me anything — science, math, history, ideas...",
    ar: "اسألني أي شيء — علوم، رياضيات، تاريخ، أفكار...",
  },
  thinking: { he: "חושב...", en: "Thinking...", ar: "أفكر..." },
  clear: { he: "נקה שיחה", en: "Clear chat", ar: "مسح المحادثة" },
  voice: { he: "דבר/י", en: "Speak", ar: "تحدث" },
};

const CHAT_KEY = "freeai_kids_chat_v1";

function loadChat() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveChat(messages) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-40)));
}

export default function KidsChatPanel({ lang = "he", autoSpeak = true }) {
  const [messages, setMessages] = useState(() => loadChat());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastReply, setLastReply] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const endRef = useRef(null);

  const send = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", content: trimmed, id: `u-${Date.now()}` };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    stopSpeaking();

    const history = next.slice(-20).map((m) => ({ role: m.role, content: m.content }));
    const result = await kidsChatWithAI({ prompt: trimmed, history, lang });

    const assistantMsg = {
      role: "assistant",
      content: result.text || "",
      id: `a-${Date.now()}`,
      provider: result.provider,
    };
    const final = [...next, assistantMsg];
    setMessages(final);
    saveChat(final);
    setLastReply(assistantMsg.content);
    setLoading(false);

    if (autoSpeak && assistantMsg.content) {
      setSpeaking(true);
      speakText(assistantMsg.content, {
        lang,
        onEnd: () => setSpeaking(false),
      });
    }
  }, [input, loading, messages, lang, autoSpeak]);

  const { listening, start, stop, supported: voiceOk } = useKidsVoice({
    lang,
    onResult: (t) => {
      setInput(t);
      send(t);
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const clear = () => {
    setMessages([]);
    saveChat([]);
    stopSpeaking();
  };

  return (
    <div className="relative z-10 flex flex-col h-[min(70vh,640px)] rounded-3xl bg-white/15 backdrop-blur-xl border-2 border-white/30 shadow-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-white/20 bg-white/10">
        <SpeakingAvatar text={lastReply} lang={lang} speaking={speaking || loading} size="sm" />
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            FreeAI {lang === "he" ? "חכם" : "Smart"}
          </h2>
          <p className="text-xs opacity-80 truncate">
            {pickL({ he: "שואלים — מקבלים תשובה אמיתית", en: "Ask — get real answers", ar: "اسأل — احصل على إجابات حقيقية" }, lang)}
          </p>
        </div>
        <button type="button" onClick={clear} className="p-2 rounded-xl bg-white/20 hover:bg-white/30" title={pickL(UI.clear, lang)}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 kids-chat-scroll">
        {messages.length === 0 && (
          <div className="text-center py-8 opacity-90 space-y-2">
            <div className="text-4xl">🧠✨</div>
            <p className="font-bold">{pickL(UI.placeholder, lang)}</p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-white text-purple-800 rounded-br-md"
                  : "bg-purple-900/40 border border-white/20 rounded-bl-md"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm opacity-80">
            <Loader2 className="w-4 h-4 animate-spin" />
            {pickL(UI.thinking, lang)}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-white/20 bg-black/10">
        <div className="flex gap-2 items-end">
          {voiceOk && (
            <button
              type="button"
              onClick={listening ? stop : start}
              className={`shrink-0 px-3 py-3 rounded-2xl font-bold text-sm ${
                listening ? "bg-red-500 animate-pulse" : "bg-white/25 hover:bg-white/35"
              }`}
            >
              🎤
            </button>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={pickL(UI.placeholder, lang)}
            className="flex-1 min-h-[48px] max-h-24 px-4 py-3 rounded-2xl bg-white/90 text-purple-900 font-semibold resize-none focus:outline-none focus:ring-2 focus:ring-white"
            dir="auto"
          />
          <button
            type="button"
            disabled={loading || !input.trim()}
            onClick={() => send()}
            className="shrink-0 p-3 rounded-2xl bg-white text-purple-700 disabled:opacity-40 shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
