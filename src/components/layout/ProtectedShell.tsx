"use client";
import type { ReactNode } from "react";
import { AppShell } from "./AppShell";
import { useRequireAuth } from "@/hooks/useRequireAuth";
export function ProtectedShell({ children }: { children: ReactNode }) {
  const { user, ready } = useRequireAuth();
  if (!ready || !user)
    return (
      <div className="space-bg grid min-h-screen place-items-center text-sm text-slate-500">
        Establishing secure session…
      </div>
    );
  return <AppShell>{children}</AppShell>;
}
