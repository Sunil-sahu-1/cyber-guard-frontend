"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, LogIn, ShieldAlert, AlertTriangle } from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Button, EmptyState, Input, Panel, PageTitle, RiskBadge } from "@/components/ui";
import { analyzeBehaviour, analyzeLogin, listAnomalies } from "@/services/api/anomalyApi";
import type { Anomaly } from "@/types/api";

type AnalysisResult = {
  risk_score?: number;
  severity?: string;
  prediction?: string;
  confidence?: number;
  explanation?: string;
  indicators?: string[];
  recommended_actions?: string[];
  anomaly?: {
    risk_score?: number;
    severity?: string;
    explanation?: string;
  };
  [key: string]: unknown;
};

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function cleanPrediction(value?: string) {
  if (!value) return "Analysis completed";
  return humanize(value);
}

function getScore(result: AnalysisResult) {
  return Number(result.risk_score ?? result.anomaly?.risk_score ?? 0);
}

function getSeverity(result: AnalysisResult) {
  return String(result.severity ?? result.anomaly?.severity ?? "SAFE").toUpperCase();
}

export default function Anomalies() {
  const [kind, setKind] = useState<"login" | "behavior">("login");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [items, setItems] = useState<Anomaly[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Record<string, boolean | number>>({
    failed_attempts: 0,
    new_ip: true,
    new_device: true,
    new_location: true,
    unusual_time: true,
    impossible_travel: true,
    suspicious_network: true,
  });

  useEffect(() => {
    listAnomalies().then(setItems).catch(() => {});
  }, []);

  function switchKind(next: "login" | "behavior") {
    setKind(next);
    setResult(null);

    if (next === "login") {
      setForm({
        failed_attempts: 0,
        new_ip: true,
        new_device: true,
        new_location: true,
        unusual_time: true,
        impossible_travel: true,
        suspicious_network: true,
      });
    } else {
      setForm({
        unusual_access: false,
        unusual_resource_access: false,
        unusual_request_volume: false,
        new_device: false,
        new_location: false,
        suspicious_network: false,
      });
    }
  }

  async function run() {
    setBusy(true);
    try {
      const response =
        kind === "login"
          ? await analyzeLogin(form)
          : await analyzeBehaviour(form);

      setResult(response as AnalysisResult);
    } catch (error) {
      setResult({
        severity: "ERROR",
        prediction: "Analysis failed",
        explanation:
          error instanceof Error
            ? error.message
            : "The anomaly analysis could not be completed.",
      });
    } finally {
      setBusy(false);
    }
  }

  function setField(key: string, value: boolean | number) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <ProtectedShell>
      <PageTitle
        title="Anomaly Center"
        description="Test login and behaviour signals against the backend anomaly engine."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel className="p-6">
          <div className="flex gap-2">
            <Button
              variant={kind === "login" ? "primary" : "ghost"}
              onClick={() => switchKind("login")}
            >
              <LogIn className="h-4 w-4" />
              Login
            </Button>

            <Button
              variant={kind === "behavior" ? "primary" : "ghost"}
              onClick={() => switchKind("behavior")}
            >
              <Activity className="h-4 w-4" />
              Behaviour
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(kind === "login"
              ? [
                  "failed_attempts",
                  "new_ip",
                  "new_device",
                  "new_location",
                  "unusual_time",
                  "impossible_travel",
                  "suspicious_network",
                ]
              : [
                  "unusual_access",
                  "unusual_resource_access",
                  "unusual_request_volume",
                  "new_device",
                  "new_location",
                  "suspicious_network",
                ]
            ).map((key) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.02] p-3 text-sm text-slate-400"
              >
                <span>{humanize(key)}</span>

                {key === "failed_attempts" ? (
                  <Input
                    type="number"
                    min={0}
                    className="ml-3 w-24"
                    value={Number(form[key] ?? 0)}
                    onChange={(event) =>
                      setField(key, Number(event.target.value))
                    }
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={Boolean(form[key])}
                    onChange={(event) =>
                      setField(key, event.target.checked)
                    }
                    className="h-4 w-4 accent-cyan-300"
                  />
                )}
              </label>
            ))}
          </div>

          <Button className="mt-5" onClick={run} loading={busy}>
            <ShieldAlert className="h-4 w-4" />
            Analyze signals
          </Button>
        </Panel>

        <AnalysisResultPanel result={result} kind={kind} />
      </div>

      <Panel className="mt-5 p-6">
        <h2 className="font-semibold">Anomaly history</h2>

        <div className="mt-4 space-y-2">
          {items.slice(0, 8).map((anomaly) => (
            <div
              key={anomaly.id}
              className="flex items-center justify-between rounded-xl border border-white/10 p-3"
            >
              <div>
                <div className="text-sm text-slate-300">
                  {humanize(anomaly.anomaly_type)}
                </div>
                <div className="text-xs text-slate-600">
                  #{anomaly.id} ·{" "}
                  {new Date(anomaly.detected_at).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm">{anomaly.risk_score}</span>
                <RiskBadge value={anomaly.severity} />
              </div>
            </div>
          ))}

          {!items.length && (
            <EmptyState text="No anomaly history yet." />
          )}
        </div>
      </Panel>
    </ProtectedShell>
  );
}

function AnalysisResultPanel({
  result,
  kind,
}: {
  result: AnalysisResult | null;
  kind: "login" | "behavior";
}) {
  if (!result) {
    return (
      <Panel className="grid min-h-[500px] place-items-center p-6">
        <EmptyState
          text="Run an anomaly analysis to see a clear risk summary, detected signals and recommended actions."
        />
      </Panel>
    );
  }

  const score = getScore(result);
  const severity = getSeverity(result);
  const prediction = cleanPrediction(result.prediction);
  const confidence =
    result.confidence !== undefined
      ? Number(result.confidence)
      : null;

  const explanation =
    result.explanation ||
    result.anomaly?.explanation ||
    "The anomaly engine completed the analysis.";

  const indicators = Array.isArray(result.indicators)
    ? result.indicators
    : [];

  const actions = Array.isArray(result.recommended_actions)
    ? result.recommended_actions
    : [];

  const isError = severity === "ERROR";

  return (
    <Panel className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[.18em] text-slate-600">
            {kind === "login" ? "Login analysis" : "Behaviour analysis"}
          </div>

          <div className="mt-2 text-3xl font-semibold">
            {isError ? "Analysis failed" : score.toFixed(2) + "/100"}
          </div>

          {!isError && (
            <div className="mt-1 text-sm text-slate-500">
              {prediction}
            </div>
          )}
        </div>

        <RiskBadge value={severity} />
      </div>

      {!isError && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[.025] p-4">
              <div className="text-xs text-slate-600">Risk score</div>
              <div className="mt-1 text-lg font-semibold">
                {score.toFixed(2)} / 100
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[.025] p-4">
              <div className="text-xs text-slate-600">Confidence</div>
              <div className="mt-1 text-lg font-semibold">
                {confidence === null
                  ? "Not provided"
                  : confidence.toFixed(0) + "%"}
              </div>
            </div>
          </div>

          <section className="mt-5 rounded-xl border border-white/10 bg-white/[.02] p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-cyan-300" />
              Analysis summary
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {explanation}
            </p>
          </section>

          <section className="mt-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              Detected signals
            </div>

            {indicators.length ? (
              <div className="mt-3 space-y-2">
                {indicators.map((indicator, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-sm text-slate-400"
                  >
                    {humanize(String(indicator))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                No specific anomaly indicators were returned.
              </p>
            )}
          </section>

          <section className="mt-5">
            <div className="text-sm font-medium">
              Recommended actions
            </div>

            {actions.length ? (
              <div className="mt-3 space-y-2">
                {actions.map((action, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/10 bg-white/[.025] px-4 py-3 text-sm text-slate-400"
                  >
                    {humanize(String(action))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                No additional actions were returned.
              </p>
            )}
          </section>
        </>
      )}
    </Panel>
  );
}
