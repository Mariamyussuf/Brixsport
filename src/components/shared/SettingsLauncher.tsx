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
      <div className={`fixed ${hasPageHeaderControls ? 'top-16' : 'top-4'} right-32 z-40 pointer-events-none`}>
        <button
          aria-label="Open settings"
          onClick={() => setOpen(true)}
          className="pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <SettingsSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}