/* ============================================
   THEME CONTROLLER — Nandita Arts
   Dark (Moody Gallery at Night) & Light (Daytime Gallery)
   ============================================ */
(function () {
  'use strict';

  const STORAGE_KEY = 'na_theme';

  // Determine initial theme: saved in localStorage or system preference
  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  // Apply theme to <html> tag
  function applyTheme(theme, persist = false) {
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) {
      localStorage.setItem(STORAGE_KEY, theme);
    }
    updateToggleButtons(theme);
  }

  // Synchronize state and ARIA of all toggle buttons on page
  function updateToggleButtons(theme) {
    const isLight = theme === 'light';
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.setAttribute('aria-label', isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode');
      btn.setAttribute('title', isLight ? 'Switch to Dark Gallery' : 'Switch to Light Gallery');
      btn.classList.toggle('is-light', isLight);
    });
  }

  // Toggle current theme
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next, true);

    if (window.NanditaArts && typeof window.NanditaArts.showToast === 'function') {
      window.NanditaArts.showToast(next === 'light' ? 'Light Gallery mode enabled' : 'Dark Gallery mode enabled', 'success', 2200);
    }
  }

  // Apply theme as early as possible
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme, false);

  // Bind buttons once DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    updateToggleButtons(document.documentElement.getAttribute('data-theme') || initialTheme);

    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
      });
    });

    // Listen for OS system theme changes if user hasn't explicitly set a preference
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }
  });

  window.NanditaArts = window.NanditaArts || {};
  window.NanditaArts.toggleTheme = toggleTheme;
  window.NanditaArts.applyTheme = applyTheme;
})();
