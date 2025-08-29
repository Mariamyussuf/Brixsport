"use client";
import React from "react";
import { useSettings } from "./SettingsContext";

export default function NotificationsGate() {
  const { notifications } = useSettings();

  React.useEffect(() => {
    if (!notifications) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    // If permission not granted, ask once when enabled
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    // Here you could register push, subscribe, etc.
  }, [notifications]);

  return null;
}
