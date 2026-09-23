"use client";

import { Menu, Moon, Search, Sun, Command } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme/ThemeProvider";

export function Header({ onMenu }: { onMenu?: () => void }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const name = user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : "Operator";
  const initials = (user?.first_name?.[0] ?? "C") + (user?.last_name?.[0] ?? "");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--panel)]/90 px-4 backdrop-blur-xl lg:px-6">
      <button
        onClick={onMenu}
        className="rounded-xl p-2 text-[var(--muted)] hover:bg-[var(--panel-soft)] lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden min-w-0 flex-1 max-w-2xl md:block">
        <div className="flex h-10 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel-soft)] px-3 text-[var(--muted)]">
          <Search className="h-4 w-4 shrink-0" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted-2)]"
            placeholder="Search threats, users, domains, IPs..."
            aria-label="Global search"
          />
          <div className="hidden items-center gap-1 text-[10px] text-[var(--muted-2)] sm:flex">
            <Command className="h-3 w-3" /> K
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 lg:gap-4">
        <div className="hidden items-center gap-2 text-xs text-emerald-700 xl:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />
          System Online
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-xl border border-[var(--border)] bg-[var(--panel-soft)] p-2 text-[var(--muted)] hover:text-[var(--text)]"
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>


        <div className="hidden text-right lg:block">
          <div className="text-sm font-medium text-[var(--text)]">{name || "Operator"}</div>
          <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
            {user?.role ?? "Security Analyst"}
          </div>
        </div>

        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-400/10 text-xs font-semibold text-[var(--accent)] ring-1 ring-cyan-300/20">
          {initials.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
