"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Radio,
} from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { EmptyState, Panel, PageTitle, RiskBadge } from "@/components/ui";
import { listThreats } from "@/services/api/threatApi";
import { listIncidents } from "@/services/api/incidentApi";
import { listPhishingHistory } from "@/services/api/phishingApi";
import type { Threat, Incident, PhishingScan } from "@/types/api";
import { RiskChart } from "@/components/charts/RiskChart";
export default function Dashboard() {
  const [threats, setThreats] = useState<Threat[]>([]),
    [incidents, setIncidents] = useState<Incident[]>([]),
    [phishingScans, setPhishingScans] = useState<PhishingScan[]>([]);
  useEffect(() => {
    Promise.all([listThreats(), listIncidents(), listPhishingHistory()])
      .then(([t, i, p]) => {
        setThreats(t);
        setIncidents(i);
        setPhishingScans(p);
      })
      .catch(() => {});
  }, []);
  const critical = threats.filter((t) => t.severity === "CRITICAL").length;
  const high = threats.filter((t) => t.severity === "HIGH").length;
  const open = incidents.filter((i) => !["RESOLVED", "CLOSED"].includes(i.status)).length;
  const avg = Math.round(
    threats.length ? threats.reduce((a, t) => a + t.risk_score, 0) / threats.length : 0,
  );
  const emailTrend = useMemo(() => {
    const counts: Record<string, number> = {
      PHISHING: 0,
      SUSPICIOUS: 0,
      SPAM: 0,
      PROMOTIONAL: 0,
      LEGITIMATE: 0,
    };

    phishingScans
      .filter((scan) => scan.scan_type === "EMAIL")
      .slice(0, 50)
      .forEach((scan) => {
        const details =
          scan.email_analysis?.analysis_details &&
          typeof scan.email_analysis.analysis_details === "object"
            ? (scan.email_analysis.analysis_details as Record<string, unknown>)
            : {};

        const engine =
          details.engine_result &&
          typeof details.engine_result === "object"
            ? (details.engine_result as Record<string, unknown>)
            : {};

        let category =
          typeof details.content_category === "string"
            ? details.content_category
            : typeof engine.content_category === "string"
              ? engine.content_category
              : typeof engine.prediction === "string"
                ? engine.prediction
                : "";

        category = category.toUpperCase();

        if (category === "LIKELY_PHISHING") category = "PHISHING";
        if (category === "LOW_RISK" || category === "SAFE") category = "LEGITIMATE";

        if (category in counts) {
          counts[category] += 1;
        } else if (scan.result === "SAFE" || scan.result === "LOW") {
          counts.LEGITIMATE += 1;
        } else {
          counts.SUSPICIOUS += 1;
        }
      });

    return Object.entries(counts);
  }, [phishingScans]);

  const chart = useMemo(
    () =>
      threats
        .slice(0, 7)
        .reverse()
        .map((t) => ({ label: "#" + t.id, value: t.risk_score })),
    [threats],
  );
  return (
    <ProtectedShell>
      <PageTitle
        title="Security Command Center"
        description="Live view of detection activity, risk signals, and active incidents."
        action={
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Protected session
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={ShieldAlert}
          label="Threats detected"
          value={threats.length}
          hint="From your account"
        />
        <Stat
          icon={AlertTriangle}
          label="High / critical"
          value={high + critical}
          hint="Needs attention"
        />
        <Stat icon={Radio} label="Open incidents" value={open} hint="Response queue" />
        <Stat icon={Activity} label="Average risk" value={avg} hint="Out of 100" />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel className="p-5">
          <div className="mb-5">
            <h2 className="font-semibold">Email Trend Data</h2>
            <p className="text-sm text-slate-500">
              Recent email categories from stored analysis results.
            </p>
          </div>

          <div className="space-y-3">
            {emailTrend.map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[.025] p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
                  <span className="text-sm text-slate-300">
                    {label.replaceAll("_", " ")}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-200">
                  {value}
                </span>
              </div>
            ))}
            {!phishingScans.some((scan) => scan.scan_type === "EMAIL") && (
              <EmptyState text="No email trend data yet. Run an email analysis first." />
            )}
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="mb-5">
            <h2 className="font-semibold">Trend interpretation</h2>
            <p className="text-sm text-slate-500">
              The trend checks content category first, then falls back to risk severity for older records.
            </p>
          </div>
          <div className="space-y-2 text-sm text-slate-400">
            <div className="rounded-xl bg-white/[.03] px-3 py-2">
              <span className="text-slate-200">PHISHING</span> — strong phishing classification.
            </div>
            <div className="rounded-xl bg-white/[.03] px-3 py-2">
              <span className="text-slate-200">SPAM</span> — unsolicited/spam signals.
            </div>
            <div className="rounded-xl bg-white/[.03] px-3 py-2">
              <span className="text-slate-200">PROMOTIONAL</span> — marketing/event content.
            </div>
            <div className="rounded-xl bg-white/[.03] px-3 py-2">
              <span className="text-slate-200">SUSPICIOUS</span> — suspicious security signals.
            </div>
            <div className="rounded-xl bg-white/[.03] px-3 py-2">
              <span className="text-slate-200">LEGITIMATE</span> — no separate spam/promotional/phishing category stored.
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Risk signal history</h2>
              <p className="text-sm text-slate-500">Recent analyzed threats</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-slate-600" />
          </div>
          {chart.length ? (
            <RiskChart data={chart} />
          ) : (
            <EmptyState text="Run a scan to populate risk history." />
          )}
        </Panel>
        <Panel className="p-5">
          <h2 className="font-semibold">Recent threats</h2>
          <div className="mt-4 space-y-3">
            {threats.slice(0, 6).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[.025] p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm text-slate-200">
                    {t.threat_type.replaceAll("_", " ")} · {t.source_type}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Threat #{t.id}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-300">{t.risk_score}</span>
                  <RiskBadge value={t.severity} />
                </div>
              </div>
            ))}
            {!threats.length && <EmptyState text="No threats recorded yet." />}
          </div>
        </Panel>
      </div>
    </ProtectedShell>
  );
}
function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
          <Icon className="h-5 w-5" />
        </div>
        <ShieldCheck className="h-4 w-4 text-emerald-400/70" />
      </div>
      <div className="mt-5 text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-slate-300">{label}</div>
      <div className="mt-1 text-xs text-slate-600">{hint}</div>
    </Panel>
  );
}
