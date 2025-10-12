"use client";
import React from "react";
import { Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import SettingsSheet from "./SettingsSheet";

export default function SettingsLauncher() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <>
      <button 
        className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
        aria-label="Settings"
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
      </button>

      <SettingsSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}