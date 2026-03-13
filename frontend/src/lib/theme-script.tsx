// Inline script to prevent FOUC on theme initialization.
// Runs before React hydration to set the correct data-theme attribute.

export function ThemeScript() {
  const script = `
    (function() {
      try {
        var stored = localStorage.getItem('ga-theme');
        if (stored === 'dark' || stored === 'light') {
          document.documentElement.setAttribute('data-theme', stored);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
        }
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
