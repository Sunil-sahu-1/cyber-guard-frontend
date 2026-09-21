"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getMe, login, logout, register } from "@/services/api/authApi";
import { getSavedUser, saveUser } from "@/services/api/client";
import type { User } from "@/types/api";
type AuthCtx = {
  user: User | null;
  ready: boolean;
  signIn: (id: string, pw: string) => Promise<void>;
  signUp: (p: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
};
const C = createContext<AuthCtx | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      const saved = getSavedUser<User>();
      if (saved) setUser(saved);
      try {
        const me = await getMe();
        setUser(me);
        saveUser(me);
      } catch {
      } finally {
        setReady(true);
      }
    })();
  }, []);
  const value = useMemo<AuthCtx>(
    () => ({
      user,
      ready,
      signIn: async (id, pw) => {
        const r = await login(id, pw);
        setUser(r.user);
      },
      signUp: async (p) => {
        await register(p);
      },
      signOut: async () => {
        await logout();
        setUser(null);
      },
    }),
    [user, ready],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}
export function useAuth() {
  const v = useContext(C);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
