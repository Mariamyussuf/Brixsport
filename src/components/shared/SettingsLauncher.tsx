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
  
  // Determine if we're on a page with its own header controls like notifications
  const hasPageHeaderControls = [
    "/search"
    // Add other paths that have header controls here
  ].some(path => pathname?.startsWith(path));

  return (
    <>
      {/* Fixed launcher button - positioned between search and notifications */}
      <div className={`fixed ${hasPageHeaderControls ? 'top-14 sm:top-16' : 'top-3 sm:top-4'} right-4 sm:right-6 md:right-24 lg:right-32 z-40 pointer-events-none`}>
        <button
          aria-label="Open settings"
          onClick={() => setOpen(true)}
          className="pointer-events-auto w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-black/5 dark:text-white dark:hover:bg-white/10 transition-colors border border-black/10 dark:border-white/10"
        >
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <SettingsSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}