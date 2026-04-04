import { useMessContext } from '../context/MessContext';

export function useMess() {
  const ctx = useMessContext();
  return ctx;
}

export default useMess;
