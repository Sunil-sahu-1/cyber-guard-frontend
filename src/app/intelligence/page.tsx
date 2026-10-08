"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  BrainCircuit,
  Search,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Network,
  GitBranch,
  MessageSquareText,
  Workflow,
  UserRound,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Button, Input, PageTitle, Panel, Select } from "@/components/ui";
import * as api from "@/services/api/enterpriseApi";
import type { JsonObject } from "@/services/api/enterpriseApi";

type Signal = {
  source: string;
  score: number;
  indicators: string[];
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30";

const signalOptions = [
  ["Rule engine", "rule_engine"],
  ["Behavior", "behavior"],
  ["Graph", "graph"],
  ["ML model", "ml_model"],
  ["Threat intelligence", "threat_intelligence"],
];

export default function IntelligencePage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [minRisk, setMinRisk] = useState("0");
  const [graph, setGraph] = useState<JsonObject | null>(null);
  const [result, setResult] = useState<JsonObject | null>(null);
  const [threatId, setThreatId] = useState("");
  const [incidentId, setIncidentId] = useState("");
  const [question, setQuestion] = useState("");
  const [signals, setSignals] = useState<Signal[]>([
    { source: "rule_engine", score: 50, indicators: ["Review requested"] },
  ]);
  const [risk, setRisk] = useState<JsonObject | null>(null);
  const [audit, setAudit] = useState<JsonObject[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(fn: () => Promise<JsonObject>) {
    setBusy(true);
    setError("");
    try {
      setResult(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function searchGraph() {
    setBusy(true);
    setError("");
    try {
      setGraph(await api.graphSearch(query, type, Number(minRisk) || 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Graph search failed");
    } finally {
      setBusy(false);
    }
  }

  async function load() {
    try {
      const [profile, hybridAudit, llmAudit] = await Promise.all([
        api.humanRiskMe(),
        api.listHybridAudit(),
        api.listLLMAudit(),
      ]);
      setRisk(profile);
      setAudit([...(hybridAudit || []), ...(llmAudit || [])]
        .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))
        .slice(0, 20));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load intelligence data");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const canInvestigate = Boolean(threatId || incidentId);

  function updateSignal(index: number, patch: Partial<Signal>) {
    setSignals(current =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function toggleSignal(source: string) {
    setSignals(current => {
      const exists = current.some(item => item.source === source);
      if (exists) return current.filter(item => item.source !== source);
      return [...current, { source, score: 50, indicators: [] }];
    });
  }

  return (
    <ProtectedShell>
      <PageTitle
        title="Security Intelligence"
        description="Investigate threats, combine security signals, use AI-assisted analysis, and review explainable intelligence."
        action={<BrainCircuit className="h-5 w-5 text-cyan-300" />}
      />

      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <Panel className="p-5">
          <SectionTitle icon={<Network className="h-4 w-4 text-cyan-300" />} title="Security graph search" />
          <p className="mt-1 text-xs text-slate-500">
            Find threats, incidents, users, IPs, and devices without entering query JSON.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Field label="Search">
              <Input placeholder="Threat, IP, device or user" value={query} onChange={e => setQuery(e.target.value)} />
            </Field>
            <Field label="Entity type">
              <Select value={type} onChange={e => setType(e.target.value)}>
                <option value="">All types</option>
                <option value="THREAT">Threat</option>
                <option value="INCIDENT">Incident</option>
                <option value="USER">User</option>
                <option value="IP">IP</option>
                <option value="DEVICE">Device</option>
              </Select>
            </Field>
            <Field label="Minimum risk score">
              <Input type="number" min="0" max="100" value={minRisk} onChange={e => setMinRisk(e.target.value)} />
            </Field>
          </div>

          <Button className="mt-4" onClick={searchGraph} loading={busy}>
            <Search className="h-4 w-4" /> Search graph
          </Button>

          {graph && <GraphResults data={graph} />}
        </Panel>

        <Panel className="p-5">
          <SectionTitle icon={<ShieldCheck className="h-4 w-4 text-cyan-300" />} title="My human risk" />
          {risk ? (
            <>
              <div className="mt-4 flex items-end gap-3">
                <div className="text-5xl font-bold text-slate-100">{formatNumber(risk.risk_score)}</div>
                <span className="mb-1 rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs">
                  {formatLabel(String(risk.risk_level ?? "UNKNOWN"))}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                Review status: {formatLabel(String(risk.review_status ?? "Not reviewed"))}
              </div>

              {Array.isArray(risk.contributing_signals) && risk.contributing_signals.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Contributing signals</div>
                  <div className="mt-2 space-y-2">
                    {risk.contributing_signals.slice(0, 5).map((item, i) => (
                      <div key={i} className="rounded-lg border border-white/10 bg-white/[.02] p-3 text-sm">
                        <DisplayValue value={item} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button className="mt-4" onClick={() => act(api.humanRiskRecalculate)} loading={busy}>
                <RefreshCw className="h-4 w-4" /> Recalculate risk
              </Button>
            </>
          ) : (
            <LoadingState />
          )}
        </Panel>
      </div>

      <Panel className="mt-5 p-5">
        <SectionTitle icon={<GitBranch className="h-4 w-4 text-cyan-300" />} title="Hybrid security decision" />
        <p className="mt-1 text-xs text-slate-500">
          Select the evidence sources and assign their risk contribution. No JSON required.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Threat ID (optional)">
            <Input type="number" min="1" placeholder="e.g. 12" value={threatId} onChange={e => setThreatId(e.target.value)} />
          </Field>
          <Field label="Incident ID (optional)">
            <Input type="number" min="1" placeholder="e.g. 7" value={incidentId} onChange={e => setIncidentId(e.target.value)} />
          </Field>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-5">
          {signalOptions.map(([label, source]) => {
            const active = signals.some(item => item.source === source);
            return (
              <label key={source} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm transition ${active ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/[.02] text-slate-400"}`}>
                <input type="checkbox" checked={active} onChange={() => toggleSignal(source)} className="h-4 w-4 accent-cyan-400" />
                {label}
              </label>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          {signals.map((signal, index) => (
            <div key={signal.source} className="rounded-xl border border-white/10 bg-white/[.02] p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_140px_1.5fr]">
                <Field label="Signal source">
                  <Input value={formatLabel(signal.source)} disabled />
                </Field>
                <Field label="Score">
                  <Input type="number" min="0" max="100" value={signal.score} onChange={e => updateSignal(index, { score: Math.max(0, Math.min(100, Number(e.target.value))) })} />
                </Field>
                <Field label="Indicator">
                  <Input placeholder="e.g. New device detected" value={signal.indicators[0] ?? ""} onChange={e => updateSignal(index, { indicators: e.target.value ? [e.target.value] : [] })} />
                </Field>
              </div>
            </div>
          ))}
        </div>

        <Button className="mt-4" loading={busy} onClick={() => act(() => api.hybridDecision({
          signals,
          threat_id: threatId ? Number(threatId) : null,
          incident_id: incidentId ? Number(incidentId) : null,
        }))}>
          <GitBranch className="h-4 w-4" /> Run hybrid decision
        </Button>
      </Panel>

      <Panel className="mt-5 p-5">
        <SectionTitle icon={<Workflow className="h-4 w-4 text-cyan-300" />} title="Unified security pipeline" />
        <p className="mt-1 text-xs text-slate-500">
          Run the complete intelligence pipeline for a specific threat.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <Field label="Threat ID">
            <Input type="number" min="1" placeholder="Enter threat ID" value={threatId} onChange={e => setThreatId(e.target.value)} />
          </Field>
          <Button loading={busy} disabled={!threatId} onClick={() => act(() => api.pipelineAnalyze({ threat_id: Number(threatId), enable_llm: true }))}>
            <Workflow className="h-4 w-4" /> Run pipeline
          </Button>
        </div>
      </Panel>

      <Panel className="mt-5 p-5">
        <SectionTitle icon={<Sparkles className="h-4 w-4 text-cyan-300" />} title="AI security analyst" />
        <p className="mt-1 text-xs text-slate-500">
          Ask a security question or generate evidence-grounded analysis.
        </p>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Your question</label>
          <textarea
            className={`${inputClass} min-h-28 resize-y`}
            placeholder="Example: What should I investigate first for this threat?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button loading={busy} disabled={!question.trim()} onClick={() => act(() => api.llmAssist({ question: question.trim() }))}>
            <MessageSquareText className="h-4 w-4" /> Ask analyst
          </Button>
          <Button variant="ghost" loading={busy} disabled={!threatId && !incidentId} onClick={() => act(() => api.llmExplain({
            threat_id: threatId ? Number(threatId) : null,
            incident_id: incidentId ? Number(incidentId) : null,
            evidence: [],
          }))}>
            Explain case
          </Button>
          <Button variant="ghost" loading={busy} disabled={!threatId && !incidentId} onClick={() => act(() => api.llmSummarize({
            alert: { threat_id: threatId ? Number(threatId) : undefined, incident_id: incidentId ? Number(incidentId) : undefined },
            evidence: [],
          }))}>
            Summarize
          </Button>
          <Button variant="ghost" loading={busy} disabled={!threatId} onClick={() => act(() => api.llmInvestigate({
            threat_id: Number(threatId),
            evidence: [],
          }))}>
            Investigate
          </Button>
        </div>

        {!canInvestigate && (
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[.02] p-3 text-xs text-slate-500">
            Enter a Threat ID or Incident ID to enable case-specific analysis.
          </div>
        )}
      </Panel>

      {error && (
        <Panel className="mt-5 border border-red-400/20 p-4 text-sm text-red-300">
          <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>
        </Panel>
      )}

      {result && (
        <Panel className="mt-5 p-5">
          <div className="flex items-center justify-between">
            <SectionTitle icon={<ShieldCheck className="h-4 w-4 text-cyan-300" />} title="Latest intelligence" />
            <Button variant="ghost" onClick={() => setResult(null)}>Clear</Button>
          </div>
          <ResponseCards data={result} />
        </Panel>
      )}

      <Panel className="mt-5 p-5">
        <SectionTitle icon={<HistoryIcon />} title="Intelligence audit trail" />
        {audit.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {audit.map((item, i) => (
              <div key={String(item.id ?? i)} className="rounded-xl border border-white/10 bg-white/[.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-200">
                    {formatLabel(String(item.decision ?? item.prompt_identifier ?? item.model ?? "Audit event"))}
                  </span>
                  <span className="text-xs text-slate-500">{formatDate(item.created_at)}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  {item.risk_score !== undefined && <Metric label="Risk score" value={item.risk_score} />}
                  {item.severity !== undefined && <Metric label="Severity" value={item.severity} />}
                  {item.confidence !== undefined && <Metric label="Confidence" value={item.confidence} />}
                  {item.approval_status !== undefined && <Metric label="Approval" value={item.approval_status} />}
                </div>
                {item.reasoning && <p className="mt-3 text-xs leading-5 text-slate-400">{String(item.reasoning)}</p>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<UserRound className="h-5 w-5" />} text="No intelligence audit records found yet." />
        )}
      </Panel>
    </ProtectedShell>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return <div className="flex items-center gap-2"><span>{icon}</span><h2 className="font-semibold">{title}</h2></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>{children}</label>;
}

function GraphResults({ data }: { data: JsonObject }) {
  const results = Array.isArray(data.results) ? data.results : [];
  const summary = data.risk_summary;

  return (
    <div className="mt-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Matches" value={data.count ?? results.length} />
        {isObject(summary) && <Metric label="Risk score" value={summary.risk_score ?? summary.average_risk ?? "—"} />}
        {isObject(summary) && <Metric label="Risk level" value={summary.risk_level ?? summary.overall_severity ?? "—"} />}
      </div>
      <div className="mt-4">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Graph matches</div>
        {results.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {results.slice(0, 12).map((item, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[.02] p-3">
                <DisplayValue value={item} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Search className="h-5 w-5" />} text="No matching graph entities found." />
        )}
      </div>
    </div>
  );
}

function ResponseCards({ data }: { data: JsonObject }) {
  const entries = Object.entries(data).filter(([, value]) => value !== null && value !== undefined && value !== "");
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-xl border border-white/10 bg-white/[.02] p-4">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{formatLabel(key)}</div>
          <div className="mt-2 text-sm text-slate-200"><DisplayValue value={value} /></div>
        </div>
      ))}
    </div>
  );
}

function DisplayValue({ value }: { value: unknown }): ReactNode {
  if (value === null || value === undefined || value === "") return <span className="text-slate-500">—</span>;
  if (typeof value === "boolean") return value
    ? <span className="text-amber-300">Yes</span>
    : <span className="text-emerald-300">No</span>;
  if (typeof value === "number") return <span className="font-semibold text-cyan-200">{formatNumber(value)}</span>;
  if (typeof value === "string") return <span className="break-words whitespace-pre-wrap">{value}</span>;
  if (Array.isArray(value)) {
    if (!value.length) return <span className="text-slate-500">None</span>;
    return <div className="space-y-2">{value.slice(0, 12).map((item, i) => <div key={i} className="rounded-lg border border-white/10 bg-black/10 p-2"><DisplayValue value={item} /></div>)}</div>;
  }
  if (typeof value === "object") {
    return <div className="space-y-2">{Object.entries(value as Record<string, unknown>).map(([key, item]) => <div key={key} className="flex items-start justify-between gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0"><span className="shrink-0 text-xs text-slate-500">{formatLabel(key)}</span><span className="text-right"><DisplayValue value={item} /></span></div>)}</div>;
  }
  return <span>{String(value)}</span>;
}

function Metric({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-lg border border-white/10 bg-white/[.02] p-3"><div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div><div className="mt-1 text-sm font-semibold text-slate-200">{typeof value === "number" ? formatNumber(value) : formatLabel(String(value ?? "—"))}</div></div>;
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">{icon}{text}</div>;
}

function LoadingState() {
  return <div className="mt-6 flex items-center gap-2 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" /> Loading risk profile…</div>;
}

function HistoryIcon() {
  return <RefreshCw className="h-4 w-4 text-cyan-300" />;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Number.isInteger(number) ? String(number) : number.toFixed(2) : String(value ?? "—");
}

function formatDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}
