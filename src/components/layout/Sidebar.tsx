"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  FileSearch,
  Link2,
  LayoutDashboard,
  LogOut,
  Mail,
  Mic,
  ScanFace,
  Shield,
  TriangleAlert,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const items = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/threats", "Threats", TriangleAlert],
  ["/phishing/url", "URL Analysis", Link2],
  ["/phishing/email", "Email Analysis", Mail],
  ["/impersonation", "Media Guard", ScanFace],
  ["/voice-verification", "Voice Verification", Mic],
  ["/anomalies", "Anomaly Center", Activity],
  ["/incidents", "Incidents", AlertTriangle],
  ["/audit-logs", "Audit Logs", BookOpen],
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#060b16]/80 p-4 lg:flex lg:flex-col">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-300/20">
          <Shield className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <div className="font-semibold">Cyber Guard</div>
          <div className="text-xs text-slate-500">Security Operations</div>
        </div>
      </div>

      <nav className="space-y-1">
        {items.map(([href, label, Icon]) => (
          <Link
            key={href}
            href={href}
            className={
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm " +
              (pathname === href || pathname.startsWith(href + "/")
                ? "bg-cyan-400/10 text-cyan-200"
                : "text-slate-400 hover:bg-white/5 hover:text-white")
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[.03] p-4">
        <div className="text-xs uppercase tracking-[.18em] text-slate-600">System</div>
        <div className="mt-2 flex items-center gap-2 text-sm text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          API ready
        </div>
        <button
          onClick={() => signOut().then(() => (location.href = "/login"))}
          className="mt-4 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
