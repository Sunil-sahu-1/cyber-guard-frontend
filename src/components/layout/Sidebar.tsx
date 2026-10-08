"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle, BookOpen, Link2, LayoutDashboard, FileWarning, LogOut, Mail,
  Mic, ScanFace, Shield, UserRoundSearch, Cookie, BrainCircuit, Activity, Boxes, Radar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const groups = [
  {
    title: "Command Center",
    items: [
      ["/dashboard","Overview",LayoutDashboard],
      ["/threats","Threat Galaxy",BrainCircuit],
      ["/incidents","Incidents",AlertTriangle],
    ],
  },
  {
    title: "Detection & Analysis",
    items: [
      ["/phishing/url","URL Analysis",Link2],
      ["/phishing/email","Email Analysis",Mail],
      ["/impersonation","Media Guard",ScanFace],
      ["/voice-verification","Voice Verification",Mic],
      ["/malware","Malware Guard",FileWarning],
    ],
  },
  {
    title: "Intelligence",
    items: [
      ["/anomaly","Anomaly Center",Activity],
      ["/intelligence","Security Intelligence",BrainCircuit],
      ["/operations","Security Operations",Boxes],
      ["/audit-logs","Audit Logs",BookOpen],
    ],
  },
  {
    title: "Protection",
    items: [
      ["/self-protection","Self Protection",UserRoundSearch],
      ["/browser-privacy","Browser Privacy",Cookie],
    ],
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className="hidden w-[276px] shrink-0 border-r border-[var(--border)] bg-[var(--sidebar)] lg:flex lg:flex-col">
      <div className="border-b border-[var(--border)] p-5">
        <div className="flex items-center gap-3">
          <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 ring-1 ring-cyan-400/25 shadow-[0_0_28px_rgba(6,182,212,.12)]">
            <Shield className="h-6 w-6 text-[var(--accent)]" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[var(--sidebar)]" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black tracking-[.14em] text-[var(--text)]">CYBER GUARD</div>
            <div className="mt-0.5 truncate text-[9px] font-medium uppercase tracking-[.16em] text-[var(--muted-2)]">Security Command Platform</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
          <Radar className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-[10px] font-semibold text-emerald-600">Protection systems active</span>
          <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.title} className="mb-5">
            <div className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[.2em] text-[var(--muted-2)]">{group.title}</div>
            <div className="space-y-1">
              {group.items.map(([href, label, Icon]) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={"group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 " +
                      (active
                        ? "bg-cyan-500/10 text-[var(--accent)] shadow-[inset_3px_0_0_var(--accent),0_8px_22px_rgba(6,182,212,.06)]"
                        : "text-[var(--muted)] hover:bg-[var(--panel-soft)] hover:text-[var(--text)]")}
                  >
                    <span className={"grid h-7 w-7 place-items-center rounded-lg transition " +
                      (active ? "bg-cyan-500/10" : "bg-transparent group-hover:bg-cyan-500/5")}>
                      <Icon className={"h-4 w-4 " + (active ? "text-[var(--accent)]" : "text-[var(--muted)] group-hover:text-[var(--accent)]")} />
                    </span>
                    <span className="truncate">{label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_currentColor]" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-soft)] p-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500"><Shield className="h-4 w-4" /></div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">System status</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />All services operational</div>
            </div>
          </div>
          <button onClick={() => signOut().then(() => { location.href = "/login"; })} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-500">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
