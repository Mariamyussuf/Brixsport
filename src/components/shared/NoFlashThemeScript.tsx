import React from "react";

// Injects an inline script early to apply the saved/system theme before React hydration to avoid flicker
export default function NoFlashThemeScript() {
  const code = `(() => {
    try {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const resolved = saved === 'dark' || (!saved || saved === 'system') && prefersDark ? 'dark' : 'light';
      const root = document.documentElement;
      if (resolved === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
      var m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute('content', resolved === 'dark' ? '#000000' : '#ffffff');
    } catch {}
  })();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
