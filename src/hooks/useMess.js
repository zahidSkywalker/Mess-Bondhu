import { useMessContext } from '../context/MessContext';

const useMess = () => {
  const ctx = useMessContext();
  return ctx;
}

export { useMess };
export default useMess;
