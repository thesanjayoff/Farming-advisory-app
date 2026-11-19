"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { LanguageCode } from "@/lib/types";
import { translate, type DictKey } from "@/lib/i18n/dictionary";

interface I18nContextValue {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: DictKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const LANG_STORAGE_KEY = "vayal.lang";

function readStoredLang(): LanguageCode {
  if (typeof window === "undefined") return "ta";
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "ta" || stored === "en" || stored === "hi" || stored === "te") {
      return stored;
    }
  } catch {
    // localStorage unavailable (private mode) — fall back silently.
  }
  return "ta";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(() => readStoredLang());

  const setLang = useCallback((next: LanguageCode) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback((key: DictKey) => translate(lang, key), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
