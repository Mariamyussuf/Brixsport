import React from "react";

// Injects an inline script early to apply the saved/system theme before React hydration to avoid flicker
export default function NoFlashThemeScript() {
  const code = `(() => {
    try {
      let saved = localStorage.getItem('theme');
      if (!saved) {
        // Explicitly default to system
        saved = 'system';
        localStorage.setItem('theme', 'system');
      }
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const resolved = saved === 'dark' ? 'dark' : saved === 'light' ? 'light' : (prefersDark ? 'dark' : 'light');
      const root = document.documentElement;
      root.classList.toggle('dark', resolved === 'dark');
      var m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute('content', resolved === 'dark' ? '#000000' : '#ffffff');
    } catch {}
  })();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
