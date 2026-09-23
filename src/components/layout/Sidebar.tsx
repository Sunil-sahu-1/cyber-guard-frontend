"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  Link2,
  LayoutDashboard,
  FileWarning,
  LogOut,
  Mail,
  Mic,
  ScanFace,
  Shield,
  UserRoundSearch,
  Cookie,
  TriangleAlert,
  Settings,
  Users,
  Monitor,
  BrainCircuit,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const items = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/threats", "Threat Galaxy", BrainCircuit],
  ["/incidents", "Incidents", AlertTriangle],
  ["/phishing/url", "URL Analysis", Link2],
  ["/phishing/email", "Email Analysis", Mail],
  ["/impersonation", "Media Guard", ScanFace],
  ["/voice-verification", "Voice Verification", Mic],
  ["/malware", "Malware Guard", FileWarning],
  ["/audit-logs", "Audit Logs", BookOpen],
  ["/self-protection", "Self Protection", UserRoundSearch],
  ["/browser-privacy", "Browser Privacy", Cookie],
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--panel)]/92 p-4 lg:flex lg:flex-col">
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-300/25">
          <Shield className="h-6 w-6 text-[var(--accent)]" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,.9)]" />
        </div>
        <div>
          <div className="font-bold tracking-wide">CYBER GUARD</div>
          <div className="text-[10px] uppercase tracking-[.16em] text-[var(--muted-2)]">
            Autonomous Threat Detection
          </div>
        </div>
      </div>

      <div className="mb-3 px-2 text-[10px] uppercase tracking-[.2em] text-[var(--muted-2)]">
        Command Center
      </div>

      <nav className="space-y-1">
        {items.map(([href, label, Icon]) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition " +
                (active
                  ? "bg-cyan-400/10 text-cyan-200 shadow-[inset_3px_0_0_#16c7ff]"
                  : "text-[var(--muted)] hover:bg-[var(--panel-soft)] hover:text-[var(--text)]")
              }
            >
              <Icon className={"h-4 w-4 " + (active ? "text-[var(--accent)]" : "text-slate-500 group-hover:text-[var(--accent)]")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 grid grid-cols-3 gap-2 px-1">
        {[
          [Users, "Users"],
          [Monitor, "Assets"],
          [Settings, "Settings"],
        ].map(([Icon, label]) => (
          <button
            key={label}
            type="button"
            className="rounded-xl border border-[var(--border)] bg-[var(--panel-soft)] p-2 text-slate-500 hover:text-[var(--accent)]"
            title={label}
          >
            <Icon className="mx-auto h-4 w-4" />
          </button>
        ))}
      </div>

      <div className="mt-auto rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] p-4">
        <div className="text-[10px] uppercase tracking-[.18em] text-[var(--muted-2)]">System status</div>
        <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]" />
          All services operational
        </div>
        <button
          onClick={() => signOut().then(() => (location.href = "/login"))}
          className="mt-4 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-[var(--muted)] hover:bg-[var(--panel-soft)] hover:text-[var(--text)]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
