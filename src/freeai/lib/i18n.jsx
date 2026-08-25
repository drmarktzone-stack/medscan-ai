import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";

/**
 * Lightweight i18n for the standalone FreeAI app.
 *
 * FreeAI ships its own copy inline via `pickL({ he, en, ar })`, so it only needs
 * language + direction here — not MedScan's full translation table.
 */

const I18nContext = createContext(null);

const STORAGE_KEY = "medscan_lang";
export const SUPPORTED_LANGS = ["he", "en", "ar"];

function readStoredLang() {
  if (typeof window === "undefined") return "he";
  const stored = localStorage.getItem(STORAGE_KEY);
  return SUPPORTED_LANGS.includes(stored) ? stored : "he";
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);
  const dir = lang === "en" ? "ltr" : "rtl";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang, dir]);

  const setLang = useCallback((next) => {
    if (SUPPORTED_LANGS.includes(next)) setLangState(next);
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, dir, t: (key) => key }),
    [lang, setLang, dir],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return (
    useContext(I18nContext) || { lang: "he", setLang: () => {}, dir: "rtl", t: (k) => k }
  );
}
