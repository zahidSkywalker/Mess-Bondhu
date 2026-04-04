import { useThemeContext } from '../context/ThemeContext';

/**
 * Convenience hook that re-exports ThemeContext values.
 * Components can use this instead of importing the context directly,
 * keeping imports consistent across the codebase.
 */
export default function useTheme() {
  const ctx = useThemeContext();
  return ctx;
}
