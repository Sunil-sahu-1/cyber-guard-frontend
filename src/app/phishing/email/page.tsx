"use client";

import { useState } from "react";
import { Mail, ScanSearch } from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Button, Input, Panel, PageTitle, RiskBadge, Textarea } from "@/components/ui";
import { analyzeEmail } from "@/services/api/phishingApi";
import type { ScanResponse } from "@/types/api";

export default function PhishingEmailPage() {
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!body.trim() && !subject.trim() && !sender.trim()) {
      setErr("Enter email content first.");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      setResult(await analyzeEmail({ sender, subject, body }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Email analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedShell>
      <PageTitle
        title="Email Analysis"
        description="Analyze suspicious email content for phishing and social-engineering indicators."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_.95fr]">
        <Panel className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-400/10 ring-1 ring-violet-300/20">
              <Mail className="h-5 w-5 text-violet-300" />
            </div>
            <div>
              <h2 className="font-semibold">Email analysis</h2>
              <p className="text-xs text-slate-500">Check sender, subject and message content.</p>
            </div>
          </div>
          <div className="space-y-4">
            <label className="block text-sm text-slate-400">
              Sender
              <Input
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="mt-2"
                placeholder="sender@example.com"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Subject
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-2"
                placeholder="Your account requires verification"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Email body
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-2 min-h-40"
                placeholder="Paste the complete email content here..."
              />
            </label>
          </div>
          {err && (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
              {err}
            </div>
          )}
          <Button className="mt-5" onClick={run} loading={loading}>
            <ScanSearch className="h-4 w-4" />
            Run AI analysis
          </Button>
        </Panel>
        {result ? (
          <Result result={result} />
        ) : (
          <Empty text="Submit an email to see the backend model output." />
        )}
      </div>
    </ProtectedShell>
  );
}
function Result({ result }: { result: ScanResponse }) {
  return (
    <Panel className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-[.18em] text-slate-600">Classification</div>
          <div className="mt-2 text-2xl font-semibold">{result.prediction}</div>
        </div>
        <RiskBadge value={result.severity} />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Metric label="Risk" value={result.risk_score + "/100"} />
        <Metric label="Confidence" value={result.confidence + "%"} />
      </div>
      <Info title="Explanation">
        <p className="text-sm leading-6 text-slate-400">{result.explanation}</p>
      </Info>
      <Info title="Indicators">
        <div className="flex flex-wrap gap-2">
          {result.indicators?.length ? (
            result.indicators.map((x, i) => (
              <span
                key={i}
                className="rounded-full bg-violet-400/10 px-3 py-1 text-xs text-violet-200 ring-1 ring-violet-300/15"
              >
                {x}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-600">No indicators returned.</span>
          )}
        </div>
      </Info>
      <Info title="Recommended actions">
        <div className="space-y-2">
          {result.recommended_actions?.map((x, i) => (
            <div key={i} className="rounded-xl bg-white/[.03] px-3 py-2 text-sm text-slate-400">
              {x}
            </div>
          ))}
        </div>
      </Info>
    </Panel>
  );
}
function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-xl border border-white/10 p-4">
      <div className="mb-2 text-sm font-medium">{title}</div>
      {children}
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.025] p-4">
      <div className="text-xs text-slate-600">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <Panel className="grid min-h-[460px] place-items-center p-6">
      <div className="text-center">
        <ScanSearch className="mx-auto h-12 w-12 text-violet-300/50" />
        <h2 className="mt-4 font-semibold">Awaiting an analysis</h2>
        <p className="mt-1 text-sm text-slate-600">{text}</p>
      </div>
    </Panel>
  );
}
