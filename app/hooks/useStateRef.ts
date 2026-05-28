import { useState, useRef, useCallback } from "react";

export function useStateRef<T>(initialValue: T) {
  const [state, setState] = useState(initialValue);
  const ref = useRef(initialValue);

  const updateState = useCallback((value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
      ref.current = next;
      return next;
    });
  }, []);

  return [state, updateState, ref] as const;
}
