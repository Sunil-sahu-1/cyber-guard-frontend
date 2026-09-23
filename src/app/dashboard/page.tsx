"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Camera,
  CircleAlert,
  Globe2,
  Link2,
  Mail,
  MapPin,
  Monitor,
  Radio,
  ScanFace,
  ShieldCheck,
  UserRound,
  LockKeyhole,
  Sparkles,
  Zap,
} from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { EmptyState, Panel, RiskBadge } from "@/components/ui";
import { listThreats } from "@/services/api/threatApi";
import { listIncidents } from "@/services/api/incidentApi";
import { listPhishingHistory } from "@/services/api/phishingApi";
import type { Threat, Incident, PhishingScan } from "@/types/api";
import { RiskChart } from "@/components/charts/RiskChart";

const galaxyNodes = [
  { label: "Phishing", icon: Mail, key: "PHISHING", tone: "pink", pos: "left-[22%] top-[14%]" },
  { label: "Malicious Domain", icon: Globe2, key: "URL", tone: "red", pos: "left-[48%] top-[4%]" },
  { label: "Media / Deepfake", icon: Camera, key: "DEEPFAKE", tone: "amber", pos: "right-[19%] top-[17%]" },
  { label: "Users", icon: UserRound, key: "USER", tone: "orange", pos: "right-[9%] top-[42%]" },
  { label: "Authentication", icon: LockKeyhole, key: "AUTH", tone: "cyan", pos: "right-[15%] bottom-[25%]" },
  { label: "Device", icon: Monitor, key: "DEVICE", tone: "violet", pos: "right-[29%] bottom-[7%]" },
  { label: "Incident", icon: CircleAlert, key: "INCIDENT", tone: "red", pos: "left-[48%] bottom-[1%]" },
  { label: "IP / Network", icon: MapPin, key: "NETWORK", tone: "blue", pos: "left-[28%] bottom-[9%]" },
  { label: "Impersonation", icon: ScanFace, key: "IMPERSONATION", tone: "violet", pos: "left-[9%] bottom-[27%]" },
  { label: "URL", icon: Link2, key: "URL", tone: "orange", pos: "left-[8%] top-[42%]" },
];

const toneMap: Record<string, string> = {
  pink: "border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-300 shadow-[0_0_30px_rgba(232,121,249,.18)]",
  red: "border-red-400/60 bg-red-400/10 text-red-300 shadow-[0_0_30px_rgba(248,113,113,.18)]",
  amber: "border-amber-300/60 bg-amber-300/10 text-amber-200 shadow-[0_0_30px_rgba(251,191,36,.18)]",
  orange: "border-orange-400/60 bg-orange-400/10 text-orange-300 shadow-[0_0_30px_rgba(251,146,60,.18)]",
  cyan: "border-cyan-300/60 bg-cyan-300/10 text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,.18)]",
  violet: "border-violet-400/60 bg-violet-400/10 text-violet-300 shadow-[0_0_30px_rgba(167,139,250,.18)]",
  blue: "border-blue-400/60 bg-blue-400/10 text-blue-300 shadow-[0_0_30px_rgba(96,165,250,.18)]",
};

export default function Dashboard() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [phishingScans, setPhishingScans] = useState<PhishingScan[]>([]);

  useEffect(() => {
    Promise.all([listThreats(), listIncidents(), listPhishingHistory()])
      .then(([t, i, p]) => {
        setThreats(t);
        setIncidents(i);
        setPhishingScans(p);
      })
      .catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const count = (matcher: (t: Threat) => boolean) => threats.filter(matcher).length;
    return {
      phishing: count((t) => /PHISH/i.test(t.threat_type) || /EMAIL/i.test(t.source_type)),
      url: count((t) => /URL|DOMAIN/i.test(t.threat_type) || /URL/i.test(t.source_type)),
      media: count((t) => /DEEPFAKE|MEDIA|IMPERSON/i.test(t.threat_type)),
      malware: count((t) => /MALWARE/i.test(t.threat_type)),
      network: count((t) => /NETWORK|IP/i.test(t.threat_type)),
      critical: count((t) => t.severity === "CRITICAL"),
      high: count((t) => t.severity === "HIGH"),
      medium: count((t) => t.severity === "MEDIUM"),
      safe: count((t) => t.severity === "SAFE" || t.severity === "LOW"),
      open: incidents.filter((i) => !["RESOLVED", "CLOSED"].includes(i.status)).length,
    };
  }, [threats, incidents]);

  const chart = useMemo(
    () =>
      threats
        .slice(0, 10)
        .reverse()
        .map((t) => ({ label: "#" + t.id, value: t.risk_score })),
    [threats],
  );

  const emailCount = phishingScans.filter((s) => s.scan_type === "EMAIL").length;
  const blocked = threats.filter((t) => t.status === "BLOCKED" || t.severity === "CRITICAL").length;
  const avgRisk = threats.length
    ? Math.round(threats.reduce((sum, t) => sum + Number(t.risk_score || 0), 0) / threats.length)
    : 0;

  return (
    <ProtectedShell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">Good Evening, {getFirstName(threats)} 👋</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Security Command Center</h1>
          <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s happening in your threat universe today.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]" />
          Real-time correlation active
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,.85fr)]">
        <Panel className="overflow-hidden p-4 md:p-5">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-cyan-300" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Threat Galaxy</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">AI correlates multiple signals to detect advanced threats.</p>
            </div>
            <button className="text-xs text-cyan-300 hover:text-cyan-200">Explore <ArrowRight className="ml-1 inline h-3 w-3" /></button>
          </div>
          <ThreatGalaxy stats={stats} />
        </Panel>

        <div className="grid gap-5">
          <SecurityPosture stats={stats} />
          <LiveAttackStream threats={threats} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,.8fr)]">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <h2 className="font-semibold">AI Insight</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">Correlated signals from your stored detection results.</p>
            </div>
            <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-300">LIVE</span>
          </div>
          <div className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-300/[.035] p-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div>
                <div className="text-sm font-medium text-slate-200">
                  {stats.critical + stats.high
                    ? "Elevated risk signals are present in the current threat set."
                    : "No high-severity cluster is currently visible in stored results."}
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {stats.critical} critical, {stats.high} high, {stats.medium} medium and {stats.safe} low/safe records are currently available to the dashboard.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Email scans" value={emailCount} />
            <MiniMetric label="Blocked / critical" value={blocked} />
            <MiniMetric label="Average risk" value={avgRisk} suffix="/100" />
          </div>
        </Panel>

        <RecentIncidents incidents={incidents} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr_1fr]">
        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Threat Trend</h2>
              <p className="text-xs text-slate-500">Recent risk score history.</p>
            </div>
            <Activity className="h-4 w-4 text-cyan-300" />
          </div>
          {chart.length ? <RiskChart data={chart} /> : <EmptyState text="Run a scan to populate threat history." />}
        </Panel>

        <ThreatCategories threats={threats} />

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Blocked Attacks</h2>
              <p className="text-xs text-slate-500">Current detection activity</p>
            </div>
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
          </div>
          <div className="mt-5 text-3xl font-bold">{blocked}</div>
          <div className="mt-1 text-xs text-emerald-300">Live protection signals</div>
          <div className="mt-5 flex h-20 items-end gap-1">
            {[22, 34, 28, 44, 31, 56, 43, 64, 52, 72, 60, 78].map((v, i) => (
              <div key={i} className="flex-1 rounded-t bg-cyan-400/60" style={{ height: v + "%" }} />
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Mean Time to Detect" value="Live" note="Continuous analysis" icon={Zap} />
        <Kpi label="Open Incidents" value={stats.open} note="Response queue" icon={Radio} />
        <Kpi label="Total Threats" value={threats.length} note="Stored detections" icon={ShieldCheck} />
        <Kpi label="System Status" value="ONLINE" note="API + AI engines" icon={BrainCircuit} />
      </div>
    </ProtectedShell>
  );
}

function ThreatGalaxy({ stats }: { stats: Record<string, number> }) {
  return (
    <div className="relative mt-2 min-h-[470px] overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#020714] cyber-grid">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(18,160,255,.16),transparent_26%)]" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10" />
      <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/10" />
      <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-2xl" />

      {galaxyNodes.map(({ label, icon: Icon, key, tone, pos }, index) => {
        const value = key === "PHISHING" ? stats.phishing : key === "URL" ? stats.url : key === "DEEPFAKE" ? stats.media : key === "INCIDENT" ? stats.open : key === "IMPERSONATION" ? stats.media : key === "NETWORK" ? stats.network : key === "AUTH" ? stats.high : key === "DEVICE" ? stats.malware : key === "USER" ? stats.open : 0;
        return (
          <div key={label + index} className={"absolute " + pos + " z-10 -translate-x-1/2"}>
            <div className="flex flex-col items-center gap-1">
              <div className={"grid h-14 w-14 place-items-center rounded-full border bg-slate-950/80 " + toneMap[tone]}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="whitespace-nowrap text-[11px] font-medium text-slate-300">{label}</div>
              <div className="text-sm font-bold text-white">{value}</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-600">{value ? "Active" : "No events"}</div>
            </div>
          </div>
        );
      })}

      <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 800 470" preserveAspectRatio="none">
        {galaxyNodes.map((_, i) => {
          const angles = [-145, -110, -72, -35, 8, 45, 78, 118, 155, 188];
          const angle = (angles[i] * Math.PI) / 180;
          const x = 400 + Math.cos(angle) * 300;
          const y = 235 + Math.sin(angle) * 170;
          return <line key={i} x1="400" y1="235" x2={x} y2={y} stroke="rgba(47,183,255,.24)" strokeWidth="1" />;
        })}
      </svg>

      <div className="absolute left-1/2 top-1/2 z-20 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan-300/50 bg-[#04101f] text-center shadow-[0_0_55px_rgba(0,191,255,.25)]">
        <div>
          <BrainCircuit className="mx-auto h-7 w-7 text-cyan-300" />
          <div className="mt-1 text-xs font-bold text-cyan-100">AI CORE</div>
          <div className="mt-1 text-[9px] text-slate-600">CORRELATION</div>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 rounded-full border border-emerald-300/15 bg-emerald-400/5 px-3 py-1.5 text-[10px] text-emerald-300">
        ● Real-time correlation active
      </div>
    </div>
  );
}

function SecurityPosture({ stats }: { stats: Record<string, number> }) {
  const cards = [
    ["Critical", stats.critical, "text-red-300", "bg-red-400/10 border-red-400/25"],
    ["High", stats.high, "text-orange-300", "bg-orange-400/10 border-orange-400/25"],
    ["Medium", stats.medium, "text-amber-200", "bg-amber-300/10 border-amber-300/25"],
    ["Safe", stats.safe, "text-emerald-300", "bg-emerald-400/10 border-emerald-400/25"],
  ];
  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-semibold">Security Posture</h2>
        </div>
        <span className="text-[10px] text-cyan-300">View Details →</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {cards.map(([label, value, text, bg]) => (
          <div key={label} className={"rounded-xl border p-3 " + bg}>
            <div className={"text-[10px] font-medium " + text}>{label}</div>
            <div className={"mt-1 text-2xl font-bold " + text}>{value}</div>
            <div className="mt-1 text-[9px] text-slate-600">stored signals</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function LiveAttackStream({ threats }: { threats: Threat[] }) {
  const rows = threats.slice(0, 5);
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-300" />
          <h2 className="text-sm font-semibold">Live Attack Stream</h2>
        </div>
        <span className="text-[10px] text-cyan-300">View All →</span>
      </div>
      <div className="mt-3 space-y-2">
        {rows.length ? rows.map((t, index) => (
          <div key={t.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[.02] px-3 py-2.5">
            <span className={"h-2.5 w-2.5 rounded-full " + (t.severity === "CRITICAL" ? "bg-red-400" : t.severity === "HIGH" ? "bg-orange-400" : "bg-amber-300")} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-slate-200">{t.threat_type.replaceAll("_", " ")}</div>
              <div className="truncate text-[10px] text-slate-600">{t.source_type} · Threat #{t.id}</div>
            </div>
            <RiskBadge value={t.severity} />
            <span className="text-xs font-semibold text-slate-300">{t.risk_score}</span>
          </div>
        )) : <EmptyState text="No attack activity recorded yet." />}
      </div>
    </Panel>
  );
}

function RecentIncidents({ incidents }: { incidents: Incident[] }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Recent Incidents</h2>
        <span className="text-[10px] text-cyan-300">View All →</span>
      </div>
      <div className="mt-3 space-y-2">
        {incidents.slice(0, 5).map((incident) => (
          <div key={incident.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[.02] p-3">
            <span className={"h-2.5 w-2.5 rounded-full " + (incident.severity === "CRITICAL" ? "bg-red-400" : incident.severity === "HIGH" ? "bg-orange-400" : "bg-amber-300")} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-slate-200">{incident.incident_type?.replaceAll("_", " ") || "Security Incident"}</div>
              <div className="mt-1 text-[10px] text-slate-600">#{incident.id} · {incident.status}</div>
            </div>
            <RiskBadge value={incident.severity} />
          </div>
        ))}
        {!incidents.length && <EmptyState text="No incidents recorded yet." />}
      </div>
    </Panel>
  );
}

function ThreatCategories({ threats }: { threats: Threat[] }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    threats.forEach((t) => {
      const key = t.threat_type.replaceAll("_", " ");
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [threats]);

  const total = counts.reduce((s, [, n]) => s + n, 0);
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Threat Categories</h2>
        <CircleAlert className="h-4 w-4 text-cyan-300" />
      </div>
      <div className="mt-5 space-y-3">
        {counts.map(([label, value], i) => (
          <div key={label}>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">{label}</span>
              <span className="text-slate-300">{value}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-cyan-400" style={{ width: total ? (value / total) * 100 + "%" : "0%" }} />
            </div>
          </div>
        ))}
        {!counts.length && <EmptyState text="No category data yet." />}
      </div>
    </Panel>
  );
}

function MiniMetric({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.02] p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-600">{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-200">{value}{suffix}</div>
    </div>
  );
}

function Kpi({ label, value, note, icon: Icon }: { label: string; value: string | number; note: string; icon: typeof ShieldCheck }) {
  return (
    <Panel className="p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-600">{label}</div>
          <div className="mt-1 text-lg font-bold text-slate-200">{value}</div>
          <div className="text-[10px] text-slate-600">{note}</div>
        </div>
      </div>
    </Panel>
  );
}

function getFirstName(threats: Threat[]) {
  void threats;
  return "Analyst";
}
