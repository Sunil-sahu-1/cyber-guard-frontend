"use client";

import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  MailCheck,
  Megaphone,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import {
  Button,
  Input,
  Panel,
  PageTitle,
  RiskBadge,
  Textarea,
} from "@/components/ui";
import {
  analyzeEmail,
  analyzeEmailScreenshot,
} from "@/services/api/phishingApi";
import type {
  EmailAnalysisResultDetails,
  ScanResponse,
} from "@/types/api";

export default function PhishingEmailPage() {
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");

  async function handleScreenshot(file: File) {
    setErr("");
    setOcrLoading(true);

    try {
      const response = await analyzeEmailScreenshot(file);

      setSender(response.extracted.sender ?? "");
      setSubject(response.extracted.subject ?? "");
      setBody(response.extracted.body ?? "");
      setOcrText(response.ocr.raw_text ?? "");
      setResult(response.analysis);
      setScreenshot(URL.createObjectURL(file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Screenshot OCR failed");
    } finally {
      setOcrLoading(false);
    }
  }

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
        description="Validate the message, detect phishing, spam, promotional content and suspicious links."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_.95fr]">
        <Panel className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-400/10 ring-1 ring-violet-300/20">
              <Mail className="h-5 w-5 text-violet-300" />
            </div>
            <div>
              <h2 className="font-semibold">Email analysis</h2>
              <p className="text-xs text-slate-500">
                Check sender, subject and complete message content.
              </p>
            </div>
          </div>

          <div className="mb-5 rounded-2xl border border-violet-300/15 bg-violet-300/[.04] p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-400/10">
                <ImageIcon className="h-5 w-5 text-violet-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-200">
                  Analyze email from screenshot
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Upload a screenshot of the complete email. OCR will read the
                  full visible content, extract sender/subject/body, fill the
                  fields automatically and run the security classification.
                </p>

                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300/20 bg-black/10 px-4 py-3 text-sm text-violet-200 transition hover:bg-violet-300/[.06]">
                  <Upload className="h-4 w-4" />
                  {ocrLoading ? "Reading screenshot..." : "Upload email screenshot"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/bmp"
                    className="hidden"
                    disabled={ocrLoading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleScreenshot(file);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>

                {screenshot && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                    <img
                      src={screenshot}
                      alt="Uploaded email screenshot"
                      className="max-h-64 w-full object-contain"
                    />
                  </div>
                )}
              </div>
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
          <Empty text="Submit an email to see phishing, spam, promotional and validation results." />
        )}
      </div>
    </ProtectedShell>
  );
}

function Result({ result }: { result: ScanResponse }) {
  const features =
    result.features && typeof result.features === "object"
      ? (result.features as Record<string, unknown>)
      : {};

  const validation: EmailAnalysisResultDetails["email_validation"] =
    result.email_validation ?? {};

  const spam: EmailAnalysisResultDetails["spam_analysis"] =
    result.spam_analysis ?? {};

  const promotional: EmailAnalysisResultDetails["promotional_analysis"] =
    result.promotional_analysis ?? {};

  const urls = Array.isArray(features.urls)
    ? (features.urls as unknown[]).map(String)
    : [];

  const suspiciousLink = Boolean(features.suspicious_link);
  const mlProbability =
    typeof features.ml_phishing_probability === "number"
      ? (features.ml_phishing_probability * 100).toFixed(2) + "%"
      : "N/A";

  const category = result.content_category ?? "LEGITIMATE";

  return (
    <Panel className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[.18em] text-slate-600">
            Security classification
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {result.prediction}
          </div>
        </div>
        <RiskBadge value={result.severity} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Metric label="Risk" value={result.risk_score + "/100"} />
        <Metric label="Confidence" value={result.confidence + "%"} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <StatusCard
          icon={MailCheck}
          label="Email validation"
          value={String(validation.status ?? "UNKNOWN").replaceAll("_", " ")}
          detail={
            validation.is_email
              ? "Detected as email · " + String(validation.confidence ?? 0) + "% confidence"
              : "Input does not look like a complete email"
          }
          good={Boolean(validation.is_email)}
        />
        <StatusCard
          icon={Sparkles}
          label="Content category"
          value={category.replaceAll("_", " ")}
          detail="Separate from phishing risk"
          good={category === "LEGITIMATE" || category === "PROMOTIONAL"}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <StatusCard
          icon={spam.detected ? ShieldAlert : CheckCircle2}
          label="Spam check"
          value={spam.detected ? "SPAM DETECTED" : "NO SPAM SIGNAL"}
          detail={"Spam score: " + String(spam.score ?? 0) + "/100"}
          good={!spam.detected}
        />
        <StatusCard
          icon={promotional.detected ? Megaphone : CheckCircle2}
          label="Promotional check"
          value={
            promotional.detected
              ? String(promotional.category ?? "PROMOTIONAL").replaceAll("_", " ")
              : "NOT PROMOTIONAL"
          }
          detail={
            promotional.unsubscribe_detected
              ? "Unsubscribe/marketing signal found"
              : "Marketing/event signals checked"
          }
          good={!promotional.detected}
        />
      </div>

      {result && (
        <Info title="OCR / extracted email text">
          <div className="rounded-xl bg-black/20 p-3">
            <div className="mb-2 text-xs uppercase tracking-[.12em] text-slate-600">
              Screenshot OCR text
            </div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-400">
              {ocrText || "No OCR text returned."}
            </pre>
          </div>
        </Info>
      )}

      <Info title="Explanation">
        <p className="text-sm leading-6 text-slate-400">
          {result.explanation}
        </p>
      </Info>

      <Info title="Email structure check">
        <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
          <Check label="Sender format" value={Boolean(validation.sender_valid)} />
          <Check label="Subject present" value={Boolean(validation.subject_present)} />
          <Check label="Body present" value={Boolean(validation.body_present)} />
          <Check
            label="Email address found"
            value={Boolean(validation.email_addresses_found?.length)}
          />
        </div>
      </Info>

      <Info title="URL / link analysis">
        <div className="space-y-2 text-sm text-slate-400">
          <div>
            Links found: <span className="text-slate-200">{urls.length}</span>
          </div>
          <div>
            Link status:{" "}
            <span className={suspiciousLink ? "text-amber-300" : "text-emerald-300"}>
              {suspiciousLink ? "Suspicious or unverified" : "No suspicious link signal"}
            </span>
          </div>
          {urls.length > 0 && (
            <div className="space-y-1">
              {urls.slice(0, 8).map((url, i) => (
                <div
                  key={i}
                  className="truncate rounded-lg bg-white/[.03] px-3 py-2 text-xs"
                >
                  {url}
                </div>
              ))}
            </div>
          )}
        </div>
      </Info>

      <Info title="AI model details">
        <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
          <Metric label="ML phishing probability" value={mlProbability} />
          <Metric
            label="ML prediction"
            value={String(features.ml_prediction ?? "N/A")}
          />
        </div>
      </Info>

      <Info title="Spam & promotional indicators">
        <div className="space-y-3">
          <TagGroup title="Spam keywords" values={spam.keywords ?? []} />
          <TagGroup title="Spam reasons" values={spam.reasons ?? []} />
          <TagGroup
            title="Promotional keywords"
            values={[
              ...(promotional.keywords ?? []),
              ...(promotional.event_keywords ?? []),
              ...(promotional.registration_keywords ?? []),
            ]}
          />
        </div>
      </Info>

      <Info title="Security indicators">
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
            <span className="text-sm text-slate-600">
              No indicators returned.
            </span>
          )}
        </div>
      </Info>

      <Info title="Recommended actions">
        <div className="space-y-2">
          {result.recommended_actions?.map((x, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/[.03] px-3 py-2 text-sm text-slate-400"
            >
              {x}
            </div>
          ))}
          {result.recommendation && (
            <div className="rounded-xl border border-cyan-300/10 bg-cyan-300/5 px-3 py-2 text-sm text-cyan-100">
              {result.recommendation}
            </div>
          )}
        </div>
      </Info>
    </Panel>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  detail,
  good,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  detail: string;
  good: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.025] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[.12em] text-slate-600">
        <Icon className={good ? "h-4 w-4 text-emerald-300" : "h-4 w-4 text-amber-300"} />
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-200">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{detail}</div>
    </div>
  );
}

function Check({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/[.03] px-3 py-2">
      {value ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-300" />
      )}
      <span>{label}</span>
    </div>
  );
}

function TagGroup({ title, values }: { title: string; values: string[] }) {
  if (!values.length) return null;

  return (
    <div>
      <div className="mb-2 text-xs text-slate-600">{title}</div>
      <div className="flex flex-wrap gap-2">
        {values.slice(0, 20).map((value, i) => (
          <span
            key={i}
            className="rounded-full bg-violet-400/10 px-2.5 py-1 text-xs text-violet-200"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function Info({ title, children }: { title: string; children: ReactNode }) {
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
