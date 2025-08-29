"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggle: () => void; // cycles dark <-> light (keeps system separate)
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeToDocument(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  // Update theme-color meta for better PWA address bar color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "dark" ? "#000000" : "#ffffff");
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  // Load initial theme from localStorage
  useEffect(() => {
    try {
      const saved = (localStorage.getItem("theme") as Theme | null) ?? "system";
      const sys = getSystemTheme();
      setThemeState(saved);
      setResolved(saved === "system" ? sys : saved);
      applyThemeToDocument(saved === "system" ? sys : saved);
    } catch {}
  }, []);

  // React to system changes when theme is system
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const sys = getSystemTheme();
      setResolved(sys);
      applyThemeToDocument(sys);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  // Defensive sync: ensure the document class always matches resolved theme
  useEffect(() => {
    applyThemeToDocument(resolved);
  }, [resolved]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    const effective = t === "system" ? getSystemTheme() : t;
    setResolved(effective);
    applyThemeToDocument(effective);
  };

  const toggle = () => {
    // Only toggle between light/dark; preserve system if explicitly chosen by user via setTheme
    const next = resolved === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const value = useMemo(() => ({ theme, resolvedTheme: resolved, setTheme, toggle }), [theme, resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
