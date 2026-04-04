import { useMessContext } from '../context/MessContext';

/**
 * Convenience hook that re-exports MessContext values.
 * Provides a clean `useMess()` API instead of importing context directly.
 */
export default function useMess() {
  const ctx = useMessContext();
  return ctx;
}
