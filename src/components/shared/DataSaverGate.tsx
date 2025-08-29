"use client";
import React from "react";
import { useSettings } from "./SettingsContext";

export default function DataSaverGate() {
  const { dataSaver } = useSettings();

  React.useEffect(() => {
    const root = document.documentElement;
    if (dataSaver) {
      root.classList.add("data-saver");
    } else {
      root.classList.remove("data-saver");
    }
  }, [dataSaver]);

  return null;
}
