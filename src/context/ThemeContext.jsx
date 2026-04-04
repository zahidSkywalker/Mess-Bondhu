import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import db from '../db';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('light');
  const [initialized, setInitialized] = useState(false);

  // ---- Apply theme class to <html> element ----
  const applyTheme = useCallback((newTheme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }

    // Update meta theme-color for mobile browsers
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', newTheme === 'dark' ? '#0f172a' : '#22577a');
    }
  }, []);

  // ---- Persist theme to settings table ----
  const persistTheme = useCallback(async (newTheme) => {
    try {
      const existing = await db.settings.where('key').equals('theme').first();
      if (existing) {
        await db.settings.update(existing.id, { value: newTheme });
      } else {
        await db.settings.add({ key: 'theme', value: newTheme });
      }
    } catch (err) {
      console.error('Failed to persist theme:', err);
    }
  }, []);

  // ---- Load theme from DB on mount ----
  useEffect(() => {
    async function loadTheme() {
      try {
        const setting = await db.settings.where('key').equals('theme').first();
        const saved = setting?.value || 'light';
        setThemeState(saved);
        applyTheme(saved);
      } catch (err) {
        console.error('Failed to load theme:', err);
        setThemeState('light');
        applyTheme('light');
      } finally {
        setInitialized(true);
      }
    }
    loadTheme();
  }, [applyTheme]);

  // ---- Set theme (called by user) ----
  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    persistTheme(newTheme);
  }, [applyTheme, persistTheme]);

  // ---- Toggle between light and dark ----
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // ---- Listen for system preference changes (optional enhancement) ----
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      // For now we don't track "manual vs auto" — this is a future enhancement
      // We skip this to avoid overriding user choice
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    initialized,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return ctx;
}

export default ThemeContext;
