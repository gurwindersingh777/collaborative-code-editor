import { useCallback, useEffect, useState } from "react";
import { createLocalUser, type LocalUser } from "@/lib/presence";

const STORAGE_KEY = "editor-user";

function isLocalUser(value: unknown): value is LocalUser {
  if (!value || typeof value !== "object") return false;
  const { id, name, color } = value as Record<string, unknown>;
  return typeof id === "string" && typeof name === "string" && typeof color === "string";
}

export function useLocalUser() {
  const [user, setUser] = useState<LocalUser | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect --
   sessionStorage only exists in the browser, so the identity is read after the first render */
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
      if (isLocalUser(stored)) {
        setUser(stored);
        return;
      }
    } catch {
      // corrupted value
    }

    const created = createLocalUser();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(created));
    setUser(created);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const rename = useCallback((name: string) => {
    if (!user) return;
    const next = { ...user, name };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUser(next);
  }, [user]);

  return { user, rename };
}