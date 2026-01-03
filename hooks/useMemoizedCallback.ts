import { useCallback, useRef } from 'react';

/**
 * Memoized callback that only changes if dependencies change
 * More efficient than useCallback for expensive operations
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef(callback);
  const depsRef = useRef(deps);

  // Update callback ref if dependencies changed
  const hasChanged = deps.some((dep, i) => dep !== depsRef.current[i]);
  if (hasChanged) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }

  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }) as T,
    []
  );
}
