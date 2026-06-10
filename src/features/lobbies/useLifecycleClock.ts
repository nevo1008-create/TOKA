import { useEffect, useState } from 'react';

export function useLifecycleClock(intervalMs = 30000) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick((current) => current + 1);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [intervalMs]);
}
