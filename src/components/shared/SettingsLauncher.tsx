"use client";
import React from "react";
import { Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import SettingsSheet from "./SettingsSheet";

export default function SettingsLauncher() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Hide the launcher on auth routes
  if (pathname?.startsWith("/auth")) return null;

  return (
    <>
      {/* Fixed launcher button - top-right, out of the way on mobile */}
      <div className="fixed top-4 right-4 z-[1000] pointer-events-none">
        <button
          aria-label="Open settings"
          onClick={() => setOpen(true)}
          className="pointer-events-auto p-2 rounded-full shadow-md bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-800 border border-gray-200 dark:border-white/10 backdrop-blur"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <SettingsSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
