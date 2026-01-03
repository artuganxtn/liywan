import { useState, useCallback, useRef } from 'react';
import { RateLimiter } from '../utils/security';

/**
 * Hook for rate limiting function calls
 */
export function useRateLimit<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 1000,
  maxCalls: number = 1
): [T, boolean, number] {
  const [isLimited, setIsLimited] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const limiterRef = useRef(new RateLimiter(delay, maxCalls));
  const lastCallRef = useRef(0);

  const rateLimitedFn = useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const key = 'default';

      if (limiterRef.current.isAllowed(key)) {
        lastCallRef.current = now;
        setIsLimited(false);
        setTimeUntilNext(0);
        return fn(...args);
      } else {
        const waitTime = limiterRef.current.getTimeUntilNext(key);
        setIsLimited(true);
        setTimeUntilNext(waitTime);
        
        // Auto-update time until next
        const interval = setInterval(() => {
          const remaining = limiterRef.current.getTimeUntilNext(key);
          setTimeUntilNext(remaining);
          if (remaining === 0) {
            setIsLimited(false);
            clearInterval(interval);
          }
        }, 100);
        
        setTimeout(() => clearInterval(interval), waitTime);
        
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
      }
    }) as T,
    [fn, delay, maxCalls]
  );

  return [rateLimitedFn, isLimited, timeUntilNext];
}

