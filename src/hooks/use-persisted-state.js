"use client";
import { useCallback, useState } from "react";

export default function usePersistedState(key, fallback, validate) {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      const value = raw === null ? null : JSON.parse(raw);
      return {
        value: value !== null && validate(value) ? value : fallback(),
        available: true,
      };
    } catch {
      return { value: fallback(), available: false };
    }
  });
  const [value, setValue] = useState(initial.value);
  const [available, setAvailable] = useState(initial.available);
  const save = useCallback(
    (next) => {
      setValue(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
        setAvailable(true);
        return true;
      } catch {
        setAvailable(false);
        return false;
      }
    },
    [key],
  );
  return [value, save, available];
}
