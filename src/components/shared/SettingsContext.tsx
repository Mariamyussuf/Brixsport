"use client";
import React from "react";

export type AppLanguage = "en" | "fr" | "es";

export interface SettingsState {
  notifications: boolean;
  dataSaver: boolean;
  language: AppLanguage;
  setNotifications: (v: boolean) => void;
  setDataSaver: (v: boolean) => void;
  setLanguage: (v: AppLanguage) => void;
}

const SettingsContext = React.createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<boolean>(true);
  const [dataSaver, setDataSaver] = React.useState<boolean>(false);
  const [language, setLanguage] = React.useState<AppLanguage>("en");

  // Load once
  React.useEffect(() => {
    try {
      const n = localStorage.getItem("settings:notifications");
      const d = localStorage.getItem("settings:dataSaver");
      const l = localStorage.getItem("settings:language");
      if (n !== null) setNotifications(n === "1");
      if (d !== null) setDataSaver(d === "1");
      if (l === "en" || l === "fr" || l === "es") setLanguage(l);
    } catch {}
  }, []);

  // Persist on change
  React.useEffect(() => { try { localStorage.setItem("settings:notifications", notifications ? "1" : "0"); } catch {} }, [notifications]);
  React.useEffect(() => { try { localStorage.setItem("settings:dataSaver", dataSaver ? "1" : "0"); } catch {} }, [dataSaver]);
  React.useEffect(() => { try { localStorage.setItem("settings:language", language); } catch {} }, [language]);

  const value: SettingsState = React.useMemo(() => ({
    notifications,
    dataSaver,
    language,
    setNotifications,
    setDataSaver,
    setLanguage,
  }), [notifications, dataSaver, language]);

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
