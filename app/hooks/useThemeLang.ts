import { useState, useCallback, useEffect, useRef } from "react";
import { LANG_STORAGE_KEY, THEME_STORAGE_KEY, STORAGE_STORAGE_KEY } from "~/lib/types";
import type { Lang } from "~/lib/i18n";
import type { StorageType } from "~/lib/types";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(THEME_STORAGE_KEY, next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  return { theme, toggleTheme } as const;
}

export function useLang() {
  const [lang, setLang] = useState<Lang>("zh");

  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_STORAGE_KEY) as Lang | null;
    if (savedLang === "en" || savedLang === "zh") setLang(savedLang);
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === "en" ? "zh" : "en";
      localStorage.setItem(LANG_STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { lang, toggleLang } as const;
}

export function useStorage() {
  const [storage, setStorageState] = useState<StorageType>("kv");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_STORAGE_KEY) as StorageType | null;
    if (saved === "kv" || saved === "blob") setStorageState(saved);
  }, []);

  const setStorage = useCallback((next: StorageType) => {
    setStorageState(next);
    localStorage.setItem(STORAGE_STORAGE_KEY, next);
  }, []);

  return { storage, setStorage } as const;
}
