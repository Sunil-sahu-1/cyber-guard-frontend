"use client";

import { Bell, Menu, Moon, Search, Sun, Command, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme/ThemeProvider";

export function Header({ onMenu }: { onMenu?: () => void }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const name = user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : "Operator";
  const initials = (user?.first_name?.[0] ?? "C") + (user?.last_name?.[0] ?? "");

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-[var(--border)] bg-[var(--header)]/90 px-4 backdrop-blur-2xl lg:px-7">
      <button onClick={onMenu} className="rounded-xl border border-[var(--border)] bg-[var(--panel-soft)] p-2.5 text-[var(--muted)] hover:text-[var(--text)] lg:hidden" aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden min-w-0 max-w-2xl flex-1 md:block">
        <div className="group flex h-11 items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] px-3.5 transition focus-within:border-cyan-500/30 focus-within:ring-4 focus-within:ring-cyan-500/5">
          <Search className="h-4 w-4 shrink-0 text-[var(--muted)] group-focus-within:text-[var(--accent)]" />
          <input className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted-2)]" placeholder="Search threats, users, domains, IPs..." aria-label="Global search" />
          <div className="hidden items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-[10px] text-[var(--muted-2)] sm:flex"><Command className="h-3 w-3" /> K</div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 lg:gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 xl:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> System online
        </div>

        <button type="button" className="relative rounded-xl border border-[var(--border)] bg-[var(--panel-soft)] p-2.5 text-[var(--muted)] transition hover:text-[var(--text)]" title="Notifications" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-400" />
        </button>

        <button type="button" onClick={toggleTheme} className="rounded-xl border border-[var(--border)] bg-[var(--panel-soft)] p-2.5 text-[var(--muted)] transition hover:text-[var(--text)]" title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="hidden h-8 w-px bg-[var(--border)] sm:block" />

        <div className="hidden text-right lg:block">
          <div className="text-sm font-bold text-[var(--text)]">{name || "Operator"}</div>
          <div className="mt-0.5 flex items-center justify-end gap-1 text-[9px] font-semibold uppercase tracking-[.14em] text-[var(--muted)]"><ShieldCheck className="h-3 w-3 text-emerald-500" />{user?.role ?? "Security Analyst"}</div>
        </div>

        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-xs font-black text-[var(--accent)] ring-1 ring-cyan-300/20">{initials.toUpperCase()}</div>
      </div>
    </header>
  );
}
