import React, { useState, useEffect, useMemo } from "react";
import { ChevronUp, ChevronDown, Keyboard } from "lucide-react";
import { useLocation } from "react-router-dom";
import { pickL } from "../lib/locale.js";
import { keyboardsForPath, getKeyboard, KEYBOARDS } from "../data/keyboardCatalog.js";
import { useSymbolInput } from "../hooks/useSymbolInput.js";
import KidsWordFlash from "./KidsWordFlash.jsx";

const STORAGE_KEY = "freeai_kids_kb_open_v1";

/**
 * Context-aware symbol keyboard — sits above mobile nav.
 * @param {{ lang?: string; value?: string; onChange?: (v: string) => void; onSymbol?: (p: object) => void; onSubmit?: (text: string) => void; autoSubmitSymbols?: boolean }} props
 */
export default function KidsSymbolKeyboard({
  lang = "he",
  value = "",
  onChange,
  onSymbol,
  onSubmit,
  autoSubmitSymbols = false,
}) {
  const location = useLocation();
  const config = useMemo(() => keyboardsForPath(location.pathname, lang), [location.pathname, lang]);

  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(STORAGE_KEY) !== "0";
  });
  const [activeId, setActiveId] = useState(config?.defaultId || "animals");

  useEffect(() => {
    if (config?.defaultId) setActiveId(config.defaultId);
  }, [config?.defaultId, location.pathname]);

  const applyText = (text) => {
    if (text === "__BACKSPACE__") {
      onChange?.(value.slice(0, -1));
      return;
    }
    const next = (value + text).trimStart();
    onChange?.(next);
  };

  const { flash, handleKey } = useSymbolInput({
    lang,
    onText: applyText,
    onSymbol: (payload) => {
      onSymbol?.(payload);
      if (autoSubmitSymbols && payload.action && payload.action !== "space" && payload.action !== "backspace") {
        setTimeout(() => onSubmit?.(payload.prompt || payload.word), 400);
      }
    },
  });

  if (!config) return null;

  const keyboard = getKeyboard(activeId);
  const isLetterKb = activeId === "letters" || activeId === "lettersEn";

  const toggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  };

  return (
    <>
      <KidsWordFlash flash={flash} />
      <div className="fixed inset-x-0 bottom-[4.5rem] md:bottom-3 z-40 px-2 max-w-4xl mx-auto">
        <div className="rounded-2xl bg-white/20 backdrop-blur-xl border-2 border-white/35 shadow-2xl overflow-hidden">
          <button
            type="button"
            onClick={toggle}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-black bg-white/15 hover:bg-white/25"
          >
            <Keyboard className="w-3.5 h-3.5" />
            {pickL({ he: "מקלדת חכמה", en: "Smart keyboard", ar: "لوحة ذكية" }, lang)}
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {open && (
            <>
              <div className="flex gap-1 p-1.5 overflow-x-auto kids-chat-scroll border-b border-white/20">
                {config.tabs.map((tabId) => {
                  const tab = KEYBOARDS[tabId];
                  if (!tab) return null;
                  return (
                    <button
                      key={tabId}
                      type="button"
                      onClick={() => setActiveId(tabId)}
                      className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                        activeId === tabId ? "bg-white text-purple-700" : "bg-white/15 hover:bg-white/25"
                      }`}
                    >
                      {tab.icon} {pickL(tab.label, lang)}
                    </button>
                  );
                })}
              </div>

              <div
                className={`p-2 grid gap-1.5 max-h-[140px] overflow-y-auto kids-chat-scroll ${
                  isLetterKb ? "grid-cols-8 sm:grid-cols-10" : "grid-cols-4 sm:grid-cols-6"
                }`}
              >
                {keyboard.keys.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => handleKey(k)}
                    className={`flex flex-col items-center justify-center rounded-xl font-black transition-all active:scale-90 hover:bg-white/30 ${
                      isLetterKb
                        ? "py-2 text-sm bg-white/20"
                        : "py-2.5 bg-white/15 border border-white/20"
                    }`}
                    title={pickL(k.label, lang)}
                  >
                    <span className={isLetterKb ? "" : "text-xl leading-none"}>{k.emoji}</span>
                    {!isLetterKb && (
                      <span className="text-[9px] mt-0.5 opacity-90 truncate max-w-full px-0.5">
                        {pickL(k.label, lang)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
