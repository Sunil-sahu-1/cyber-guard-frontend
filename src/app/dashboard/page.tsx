"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Globe2,
  Link2,
  Mail,
  Radar,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { EmptyState, Panel, RiskBadge } from "@/components/ui";
import { listThreats } from "@/services/api/threatApi";
import { listIncidents } from "@/services/api/incidentApi";
import { listPhishingHistory } from "@/services/api/phishingApi";
import type { Threat, Incident, PhishingScan } from "@/types/api";
import { RiskChart } from "@/components/charts/RiskChart";

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
    () => threats.slice(0, 12).reverse().map((t) => ({ label: "#" + t.id, value: t.risk_score })),
    [threats],
  );

  const emailCount = phishingScans.filter((s) => s.scan_type === "EMAIL").length;
  const blocked = threats.filter((t) => t.status === "BLOCKED" || t.severity === "CRITICAL").length;
  const avgRisk = threats.length
    ? Math.round(threats.reduce((sum, t) => sum + Number(t.risk_score || 0), 0) / threats.length)
    : 0;
  const protection = Math.max(0, Math.min(100, 100 - avgRisk));

  return (
    <ProtectedShell>
      <div className="relative mx-auto max-w-[1800px]">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-20 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl" />

        <header className="relative mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,.7)]" />
              Cyber Guard / Security Operations
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--text)] md:text-4xl">
              Security Command Center
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
              Unified visibility across threats, incidents, phishing, network activity and AI-driven detection.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 shadow-sm">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--text)]">Protection active</div>
              <div className="text-[10px] text-[var(--muted)]">API + AI engines connected</div>
            </div>
          </div>
        </header>

        <section className="relative mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Threats detected" value={threats.length} delta={stats.critical + stats.high + " high-risk"} icon={Radar} tone="cyan" />
          <MetricCard label="Open incidents" value={stats.open} delta="Response queue" icon={CircleAlert} tone="orange" />
          <MetricCard label="Average risk" value={avgRisk + "/100"} delta={avgRisk > 60 ? "Elevated" : "Controlled"} icon={Target} tone="violet" />
          <MetricCard label="Protection score" value={protection + "%"} delta="Continuous monitoring" icon={ShieldCheck} tone="green" />
        </section>

        <section className="relative grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.75fr)]">
          <Panel className="relative overflow-hidden p-0">
            <div className="border-b border-[var(--border)] px-5 py-4 md:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-500/10 text-cyan-600">
                      <BrainCircuit className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-[var(--text)]">Threat Intelligence Matrix</h2>
                      <p className="text-[11px] text-[var(--muted)]">Live correlation of your stored security signals</p>
                    </div>
                  </div>
                </div>
                <span className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  LIVE CORRELATION
                </span>
              </div>
            </div>
            <ThreatMatrix stats={stats} />
          </Panel>

          <div className="grid gap-5">
            <Panel className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-600">Risk posture</div>
                  <h2 className="mt-1 text-lg font-bold text-[var(--text)]">Current exposure</h2>
                </div>
                <Shield className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="mt-5 flex items-center gap-5">
                <div className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#06b6d4 ${protection}%, rgba(148,163,184,.14) 0)` }}>
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-[var(--panel-solid)]">
                    <div className="text-center">
                      <div className="text-2xl font-black text-[var(--text)]">{protection}%</div>
                      <div className="text-[9px] uppercase tracking-widest text-[var(--muted)]">Protected</div>
                    </div>
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <PostureRow label="Critical" value={stats.critical} cls="bg-red-500" />
                  <PostureRow label="High" value={stats.high} cls="bg-orange-500" />
                  <PostureRow label="Medium" value={stats.medium} cls="bg-amber-500" />
                  <PostureRow label="Safe / Low" value={stats.safe} cls="bg-emerald-500" />
                </div>
              </div>
            </Panel>

            <Panel className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[.2em] text-violet-600">Detection pulse</div>
                  <h2 className="mt-1 font-bold text-[var(--text)]">Attack activity</h2>
                </div>
                <Zap className="h-5 w-5 text-violet-500" />
              </div>
              <div className="mt-4 flex h-20 items-end gap-1.5">
                {[24, 42, 31, 55, 40, 68, 48, 76, 57, 83, 64, 92].map((height, index) => (
                  <div key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-cyan-600/30 to-cyan-400/80 transition-all hover:from-cyan-600 hover:to-cyan-300" style={{ height: height + "%" }} />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-[10px] text-[var(--muted)]">
                <span>12 scans</span>
                <span>{blocked} blocked / critical</span>
              </div>
            </Panel>
          </div>
        </section>

        <section className="relative mt-5 grid gap-5 xl:grid-cols-[1.25fr_.9fr_.85fr]">
          <Panel className="p-5">
            <SectionHeading icon={Sparkles} title="AI Security Insight" eyebrow="Machine intelligence" />
            <div className="mt-4 rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-4">
              <div className="flex gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">
                    {stats.critical + stats.high ? "Elevated risk signals detected" : "Threat environment currently controlled"}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    {stats.critical} critical, {stats.high} high and {stats.medium} medium-severity records are present in the current dataset.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniMetric label="Email scans" value={emailCount} />
              <MiniMetric label="Blocked" value={blocked} />
              <MiniMetric label="Avg risk" value={avgRisk} />
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeading icon={Activity} title="Threat Trend" eyebrow="Risk history" />
            <div className="mt-4 h-44">
              {chart.length ? <RiskChart data={chart} /> : <EmptyState text="Run a scan to populate threat history." />}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeading icon={CircleAlert} title="Recent Incidents" eyebrow="Response queue" />
            <div className="mt-4 space-y-2">
              {incidents.slice(0, 5).map((incident) => (
                <div key={incident.id} className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--panel-soft)] p-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${incident.severity === "CRITICAL" ? "bg-red-500" : incident.severity === "HIGH" ? "bg-orange-500" : "bg-amber-500"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-[var(--text)]">{incident.incident_type?.replaceAll("_", " ") || "Security Incident"}</div>
                    <div className="text-[9px] text-[var(--muted)]">#{incident.id} · {incident.status}</div>
                  </div>
                  <RiskBadge value={incident.severity} />
                </div>
              ))}
              {!incidents.length && <EmptyState text="No incidents recorded yet." />}
            </div>
          </Panel>
        </section>

        <section className="relative mt-5 grid gap-5 xl:grid-cols-[1fr_1fr_1fr]">
          <Panel className="p-5">
            <SectionHeading icon={Globe2} title="Threat Sources" eyebrow="Detection surface" />
            <div className="mt-5 space-y-4">
              <SourceBar label="Phishing / Email" value={stats.phishing} total={Math.max(threats.length, 1)} icon={Mail} />
              <SourceBar label="URL / Domain" value={stats.url} total={Math.max(threats.length, 1)} icon={Link2} />
              <SourceBar label="Network / IP" value={stats.network} total={Math.max(threats.length, 1)} icon={Globe2} />
              <SourceBar label="Malware" value={stats.malware} total={Math.max(threats.length, 1)} icon={Shield} />
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeading icon={Zap} title="Live Attack Stream" eyebrow="Latest detections" />
            <div className="mt-4 space-y-2">
              {threats.slice(0, 5).map((threat) => (
                <div key={threat.id} className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel-soft)] px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-cyan-500/25">
                  <span className={`h-2 w-2 rounded-full ${threat.severity === "CRITICAL" ? "bg-red-500" : threat.severity === "HIGH" ? "bg-orange-500" : "bg-cyan-500"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-[var(--text)]">{threat.threat_type.replaceAll("_", " ")}</div>
                    <div className="truncate text-[9px] text-[var(--muted)]">{threat.source_type} · #{threat.id}</div>
                  </div>
                  <span className="text-xs font-bold text-[var(--text)]">{threat.risk_score}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[var(--muted)] transition group-hover:text-cyan-500" />
                </div>
              ))}
              {!threats.length && <EmptyState text="No attack activity recorded yet." />}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeading icon={ShieldCheck} title="System Health" eyebrow="Infrastructure" />
            <div className="mt-4 space-y-2.5">
              <HealthRow label="API Gateway" />
              <HealthRow label="Threat Intelligence" />
              <HealthRow label="AI Detection Engine" />
              <HealthRow label="Database" />
              <HealthRow label="Authentication" />
            </div>
            <div className="mt-5 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                All monitored services operational
              </div>
            </div>
          </Panel>
        </section>
      </div>
    </ProtectedShell>
  );
}

function MetricCard({ label, value, delta, icon: Icon, tone }: { label: string; value: string | number; delta: string; icon: typeof Radar; tone: "cyan" | "orange" | "violet" | "green" }) {
  const styles = {
    cyan: "bg-cyan-500/10 text-cyan-600 ring-cyan-500/15",
    orange: "bg-orange-500/10 text-orange-600 ring-orange-500/15",
    violet: "bg-violet-500/10 text-violet-600 ring-violet-500/15",
    green: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/15",
  };
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted)]">{label}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-[var(--text)]">{value}</div>
          <div className="mt-1 text-[10px] text-[var(--muted)]">{delta}</div>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${styles[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Panel>
  );
}

function ThreatMatrix({ stats }: { stats: Record<string, number> }) {
  const nodes = [
    ["PHISHING", stats.phishing, "left-[17%] top-[24%]", Mail],
    ["URL / DOMAIN", stats.url, "right-[18%] top-[20%]", Link2],
    ["NETWORK", stats.network, "left-[18%] bottom-[18%]", Globe2],
    ["MALWARE", stats.malware, "right-[18%] bottom-[18%]", Shield],
  ] as const;
  return (
    <div className="relative min-h-[410px] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(6,182,212,.10),transparent_32%)]">
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(14,116,144,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(14,116,144,.08)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500/15" />
      <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-500/15" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-2xl" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 410" preserveAspectRatio="none">
        {[[150,100],[750,90],[155,330],[745,330]].map(([x,y],i) => <line key={i} x1="450" y1="205" x2={x} y2={y} stroke="rgba(6,182,212,.20)" strokeWidth="1.5" strokeDasharray="6 8" />)}
      </svg>
      {nodes.map(([label, value, pos, Icon]) => (
        <div key={label} className={`absolute z-10 ${pos}`}>
          <div className="flex min-w-28 flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:border-cyan-500/30">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/10 text-cyan-600"><Icon className="h-5 w-5" /></div>
            <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</div>
            <div className="mt-1 text-xl font-black text-[var(--text)]">{value}</div>
          </div>
        </div>
      ))}
      <div className="absolute left-1/2 top-1/2 z-20 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan-400/40 bg-[var(--panel-solid)] shadow-[0_0_70px_rgba(6,182,212,.20)]">
        <div className="text-center">
          <BrainCircuit className="mx-auto h-8 w-8 text-cyan-500" />
          <div className="mt-1 text-xs font-black tracking-widest text-[var(--text)]">AI CORE</div>
          <div className="mt-1 text-[8px] uppercase tracking-[.2em] text-[var(--muted)]">correlating</div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, eyebrow }: { icon: typeof Activity; title: string; eyebrow: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-500/10 text-cyan-600"><Icon className="h-4 w-4" /></div>
      <div>
        <div className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--muted)]">{eyebrow}</div>
        <h2 className="mt-0.5 text-sm font-bold text-[var(--text)]">{title}</h2>
      </div>
    </div>
  );
}

function PostureRow({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px]"><span className="text-[var(--muted)]">{label}</span><span className="font-bold text-[var(--text)]">{value}</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/60 dark:bg-white/5"><div className={`h-full rounded-full ${cls}`} style={{ width: `${Math.min(value * 12, 100)}%` }} /></div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-soft)] p-3"><div className="text-[9px] uppercase tracking-wider text-[var(--muted)]">{label}</div><div className="mt-1 text-xl font-black text-[var(--text)]">{value}</div></div>;
}

function SourceBar({ label, value, total, icon: Icon }: { label: string; value: number; total: number; icon: typeof Globe2 }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-xs">
        <Icon className="h-3.5 w-3.5 text-cyan-600" />
        <span className="flex-1 text-[var(--muted)]">{label}</span>
        <span className="font-bold text-[var(--text)]">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300" style={{ width: `${Math.min((value / total) * 100, 100)}%` }} /></div>
    </div>
  );
}

function HealthRow({ label }: { label: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel-soft)] px-3 py-2.5"><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,.5)]" /><span className="flex-1 text-xs font-medium text-[var(--text)]">{label}</span><span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-600">Operational</span></div>;
}
