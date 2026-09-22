"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, BarChart3, FileAudio, Gauge, Mic, ShieldCheck, SlidersHorizontal, Volume2, X } from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Button, Panel, PageTitle, RiskBadge } from "@/components/ui";
import { analyzeVoice } from "@/services/api/impersonationApi";

type TechnicalAnalysis = {
  sample_rate_hz?: number;
  channels?: number;
  duration_seconds?: number;
  loudness_analysis?: {
    peak_amplitude_db?: number;
    rms_level_db?: number;
    dynamic_range_db?: number;
    crest_factor?: number;
  };
  frequency_analysis?: Record<string, number>;
  stereo_analysis?: {
    stereo_width_percent?: number;
    phase_correlation?: number;
    left_channel_level_db?: number;
    right_channel_level_db?: number;
  };
  quality_metrics?: {
    signal_to_noise_ratio_db?: number;
    dc_offset_percent?: number;
    clipping_detected?: boolean;
    clipping_ratio_percent?: number;
    overall_quality?: number;
    headroom_db?: number;
  };
  quality_note?: string;
};

type Result = {
  risk_score: number;
  result: string;
  explanation: string;
  prediction?: string;
  confidence?: number;
  indicators?: string[];
  recommendation?: string;
  detector_note?: string;
  features?: Record<string, unknown>;
  signal_components?: Record<string, number>;
  technical_analysis?: TechnicalAnalysis;
};

const TYPES = [
  ".wav",
  ".mp3",
  ".m4a",
  ".flac",
  ".ogg",
  ".aac",
  ".webm",
  ".opus",
  ".wma",
  ".aiff",
  ".aif",
  ".caf",
  ".amr",
  ".mka",
  ".ac3",
  ".mp2",
  ".mpeg",
  ".mpga",
];
const MAX_SIZE = 20 * 1024 * 1024;

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? (bytes / 1024).toFixed(1) + " KB"
    : (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function VoiceVerificationPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectFile(selected?: File) {
    if (!selected) return;

    const extension = "." + (selected.name.split(".").pop() || "").toLowerCase();

    if (!TYPES.includes(extension)) {
      setError(
        "Unsupported audio format. Try WAV, MP3, M4A, FLAC, OGG, AAC, WEBM, OPUS, WMA, AIFF, CAF, AMR, MKA, AC3 or MP2 • MPEG • MPGA.",
      );
      return;
    }

    if (selected.size > MAX_SIZE) {
      setError("Audio file must not exceed 20 MB.");
      return;
    }

    if (!selected.size) {
      setError("The selected audio file is empty.");
      return;
    }

    setFile(selected);
    setResult(null);
    setError("");
  }

  function clearFile() {
    setFile(null);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function verifyVoice() {
    if (!file) {
      setError("Choose a voice recording first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = (await analyzeVoice(file)) as {
        ai_analysis?: Result;
        risk?: { risk_score: number; severity: string };
        scan?: Result;
      };

      const analysis = response.ai_analysis ?? response.scan;

      if (!analysis) {
        throw new Error("The server returned an unexpected voice analysis response.");
      }

      setResult({
        ...analysis,
        risk_score: response.risk?.risk_score ?? analysis.risk_score,
        result: response.risk?.severity ?? analysis.result,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedShell>
      <PageTitle
        title="Voice Verification"
        description="Dedicated AI voice detection and anti-spoofing analysis."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-300/10 ring-1 ring-emerald-300/20">
              <Mic className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-semibold">AI Voice Verification</h2>
              <p className="text-xs text-slate-500">
                Detect synthetic and heavily processed speech signals.
              </p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="audio/*"
            onChange={(event) => selectFile(event.target.files?.[0])}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl border border-dashed border-emerald-300/25 bg-emerald-300/[.03] p-10 text-center transition hover:bg-emerald-300/[.06]"
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-300/10">
              <FileAudio className="h-8 w-8 text-emerald-300" />
            </div>
            <div className="mt-4 text-sm font-medium">
              {file ? file.name : "Choose a voice recording"}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              WAV • MP3 • MPEG • MPGA • M4A • FLAC • OGG • AAC • WEBM • OPUS • WMA • AIFF • CAF •
              AMR • MKA
            </div>
            <div className="mt-1 text-xs text-slate-600">
              Maximum 20 MB • First 30 seconds analyzed • Recommended: 5–30 seconds of clear speech
            </div>
          </button>

          {file && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[.03] p-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileAudio className="h-5 w-5 shrink-0 text-emerald-300" />
                <div className="min-w-0">
                  <div className="truncate text-sm text-slate-300">{file.name}</div>
                  <div className="text-xs text-slate-600">{formatBytes(file.size)}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"
                aria-label="Remove audio"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {preview && (
            <div className="mt-4 rounded-xl border border-emerald-300/10 bg-emerald-300/[.03] p-4">
              <div className="mb-2 text-xs uppercase tracking-[.16em] text-slate-600">
                Recording preview
              </div>
              <audio controls src={preview} className="w-full" />
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <Button className="mt-5 w-full" onClick={verifyVoice} loading={loading}>
            <Mic className="h-4 w-4" />
            Verify Voice
          </Button>

          <div className="mt-5 rounded-xl border border-amber-300/10 bg-amber-300/[.03] p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <p className="text-xs leading-5 text-slate-500">
                Frequency consistency alone is not enough. Human voices naturally change, and modern
                AI voices can also introduce variation. This system combines multiple acoustic
                signals.
              </p>
            </div>
          </div>
        </Panel>

        {result ? (
          <VoiceResult result={result} />
        ) : (
          <Panel className="grid min-h-[500px] place-items-center p-6">
            <div className="text-center">
              <Mic className="mx-auto h-12 w-12 text-emerald-300/40" />
              <h2 className="mt-4 font-semibold">Voice analysis ready</h2>
              <p className="mt-1 max-w-sm text-sm text-slate-600">
                Upload a recording and start verification to see the acoustic analysis and
                synthetic-voice risk assessment.
              </p>
            </div>
          </Panel>
        )}
      </div>
    </ProtectedShell>
  );
}

function VoiceResult({ result }: { result: Result }) {
  const features = result.features ?? {};
  const components = result.signal_components ?? {};

  const featureLabels: Record<string, string> = {
    duration_seconds: "Recording length",
    speech_ratio: "Speech detected",
    silence_ratio: "Silence",
    pitch_mean_hz: "Average pitch",
    pitch_std_hz: "Pitch variation",
    pitch_range_hz: "Pitch range",
    jitter: "Jitter",
    shimmer: "Shimmer",
    spectral_centroid_std_hz: "Spectral variation",
    spectral_bandwidth_std_hz: "Bandwidth variation",
    spectral_flatness_std: "Spectral texture variation",
    mfcc_variability: "Voice/timbre variation",
    mfcc_delta_variability: "Timbre change",
    energy_std_db: "Volume variation",
    energy_range_db: "Volume range",
    zero_crossing_std: "Frequency crossing variation",
    spectral_flux_std: "Sound transition variation",
    harmonic_ratio: "Harmonic content",
    clipping_ratio: "Clipping detected",
    voiced_frame_ratio: "Voiced audio",
  };

  const formatFeature = (key: string, value: unknown) => {
    const number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) return String(value);
    if (key.includes("ratio")) return Math.round(number * 100) + "%";
    if (key.includes("hz")) return number.toFixed(2) + " Hz";
    if (key === "duration_seconds") return number.toFixed(2) + " seconds";
    if (key === "jitter" || key === "shimmer") return number.toFixed(5);
    if (key === "clipping_ratio") return (number * 100).toFixed(2) + "%";
    return number.toFixed(3);
  };

  return (
    <Panel className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[.18em] text-slate-600">
            Voice verification result
          </div>
          <div className="mt-2 text-3xl font-semibold">{Math.round(result.risk_score)}/100</div>
          <div className="mt-1 text-xs text-slate-500">
            Synthetic voice risk score returned by the analysis engine
          </div>
        </div>
        <RiskBadge value={result.result} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Metric label="Prediction" value={humanize(result.prediction ?? "Not provided")} />
        <Metric
          label="Confidence"
          value={
            result.confidence === undefined
              ? "Not provided"
              : `${Math.round(
                  result.confidence <= 1
                    ? result.confidence * 100
                    : result.confidence,
                )}%`
          }
        />
      </div>

      {result.explanation && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[.02] p-4">
          <div className="text-sm font-medium">Analysis explanation</div>
          <p className="mt-2 text-sm leading-6 text-slate-400">{result.explanation}</p>
        </div>
      )}

      {result.recommendation && (
        <div className="mt-4 rounded-xl border border-cyan-300/10 bg-cyan-300/[.03] p-4">
          <div className="text-xs uppercase tracking-[.12em] text-slate-600">
            Recommendation from analysis
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">{result.recommendation}</p>
        </div>
      )}

      {result.indicators?.length ? (
        <div className="mt-5">
          <div className="text-sm font-medium">Detected indicators</div>
          <div className="mt-2 space-y-2">
            {result.indicators.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-violet-300/10 bg-violet-300/[.03] p-3 text-sm leading-5 text-slate-400"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {Object.keys(components).length > 0 && (
        <div className="mt-5">
          <div className="text-sm font-medium">Acoustic signal analysis</div>
          <p className="mt-1 text-xs text-slate-600">
            Actual component scores returned by the voice analysis engine.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {Object.entries(components).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-white/10 bg-white/[.02] p-3">
                <div className="text-xs capitalize text-slate-600">{humanize(key)}</div>
                <div className="mt-1 text-lg font-semibold text-slate-200">
                  {Number(value).toFixed(2)}/100
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(features).length > 0 && (
        <details className="mt-5 rounded-xl border border-white/10 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-300">
            Technical measurements from the recording
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {Object.entries(features)
              .filter(([key]) => key in featureLabels)
              .map(([key, value]) => (
                <div key={key} className="rounded-xl border border-white/10 bg-white/[.02] p-3">
                  <div className="text-xs text-slate-600">{featureLabels[key]}</div>
                  <div className="mt-1 text-sm text-slate-300">{formatFeature(key, value)}</div>
                </div>
              ))}
          </div>
        </details>
      )}

      {result.technical_analysis && (
        <TechnicalAudioAnalysis data={result.technical_analysis} />
      )}

      {result.detector_note && (
        <div className="mt-4 rounded-xl border border-amber-300/10 bg-amber-300/[.03] p-4 text-xs leading-5 text-slate-500">
          <span className="font-medium text-slate-400">Detector note: </span>
          {result.detector_note}
        </div>
      )}
    </Panel>
  );
}
function TechnicalAudioAnalysis({ data }: { data: TechnicalAnalysis }) {
  const [activeTab, setActiveTab] = useState<"loudness" | "frequency" | "stereo" | "quality">("loudness");

  const loudness = data.loudness_analysis ?? {};
  const stereo = data.stereo_analysis ?? {};
  const quality = data.quality_metrics ?? {};
  const frequency = data.frequency_analysis ?? {};

  const frequencyLabels: Record<string, { label: string; range: string }> = {
    sub_bass: { label: "Sub Bass", range: "20–60 Hz" },
    bass: { label: "Bass", range: "60–250 Hz" },
    low_mid: { label: "Low Mid", range: "250–500 Hz" },
    mid: { label: "Mid", range: "500–2k Hz" },
    high_mid: { label: "High Mid", range: "2k–4k Hz" },
    presence: { label: "Presence", range: "4k–6k Hz" },
    brilliance: { label: "Brilliance", range: "6k–20k Hz" },
  };

  const number = (value: unknown, digits = 2) =>
    typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "—";

  const tabs = [
    { id: "loudness" as const, label: "Loudness Analysis", icon: Volume2 },
    { id: "frequency" as const, label: "Frequency Analysis", icon: BarChart3 },
    { id: "stereo" as const, label: "Stereo Analysis", icon: SlidersHorizontal },
    { id: "quality" as const, label: "Quality Metrics", icon: Gauge },
  ];

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/30">
      <div className="border-b border-white/10 px-4 pt-3">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={
                  "flex min-w-max items-center gap-2 border-b-2 px-3 py-3 text-xs font-medium transition " +
                  (active
                    ? "border-cyan-300 text-cyan-300"
                    : "border-transparent text-slate-500 hover:text-slate-300")
                }
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Activity className="h-4 w-4 text-cyan-300" />
              Technical Audio Analysis
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Measurements extracted directly from the uploaded recording.
            </p>
          </div>
          <div className="hidden rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 text-right sm:block">
            <div className="text-[10px] uppercase tracking-[.14em] text-slate-600">Recording</div>
            <div className="mt-1 text-xs text-slate-300">
              {number(data.duration_seconds)}s • {data.channels ?? "—"} channel • {data.sample_rate_hz ?? "—"} Hz
            </div>
          </div>
        </div>

        {activeTab === "loudness" && (
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TechnicalMetric label="Peak Amplitude" value={number(loudness.peak_amplitude_db) + " dB"} />
              <TechnicalMetric label="RMS Level" value={number(loudness.rms_level_db) + " dB"} />
              <TechnicalMetric label="Dynamic Range" value={number(loudness.dynamic_range_db) + " dB"} />
              <TechnicalMetric label="Crest Factor" value={number(loudness.crest_factor)} />
            </div>
            <TechnicalNote>
              Peak level shows the highest recorded amplitude, while RMS represents the average energy level.
            </TechnicalNote>
          </div>
        )}

        {activeTab === "frequency" && (
          <div>
            <div className="rounded-xl border border-white/10 bg-white/[.02] p-4">
              <div className="space-y-4">
                {Object.entries(frequencyLabels).map(([key, meta]) => {
                  const value = Number(frequency[key] ?? 0);
                  return (
                    <div key={key}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-400">
                          {meta.label} <span className="text-slate-600">({meta.range})</span>
                        </span>
                        <span className="font-medium text-slate-300">{number(value, 1)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                          style={{ width: Math.min(100, Math.max(0, value)) + "%" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <TechnicalNote>
              Frequency balance shows how the recording's energy is distributed across the audible spectrum.
            </TechnicalNote>
          </div>
        )}

        {activeTab === "stereo" && (
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TechnicalMetric label="Stereo Width" value={number(stereo.stereo_width_percent, 1) + "%"} />
              <TechnicalMetric label="Phase Correlation" value={number(stereo.phase_correlation, 3)} />
              <TechnicalMetric label="Left Channel Level" value={number(stereo.left_channel_level_db) + " dB"} />
              <TechnicalMetric label="Right Channel Level" value={number(stereo.right_channel_level_db) + " dB"} />
            </div>
            <TechnicalNote>
              Stereo width and phase correlation describe the relationship between the left and right channels.
            </TechnicalNote>
          </div>
        )}

        {activeTab === "quality" && (
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TechnicalMetric label="Signal-to-Noise Ratio" value={number(quality.signal_to_noise_ratio_db, 1) + " dB"} />
              <TechnicalMetric label="DC Offset" value={number(quality.dc_offset_percent, 4) + "%"} />
              <TechnicalMetric
                label="Clipping Detected"
                value={quality.clipping_detected === undefined ? "—" : quality.clipping_detected ? "Yes" : "No"}
              />
              <TechnicalMetric label="Overall Quality" value={quality.overall_quality === undefined ? "—" : quality.overall_quality + "/100"} />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <TechnicalMetric label="Clipping Ratio" value={number(quality.clipping_ratio_percent, 4) + "%"} />
              <TechnicalMetric label="Headroom" value={number(quality.headroom_db) + " dB"} />
            </div>
            {data.quality_note && <TechnicalNote>{data.quality_note}</TechnicalNote>}
          </div>
        )}
      </div>
    </div>
  );
}

function TechnicalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.02] p-4">
      <div className="text-xs uppercase tracking-[.12em] text-slate-600">{label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-200">{value}</div>
    </div>
  );
}

function TechnicalNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border border-cyan-300/10 bg-cyan-300/[.03] p-4 text-xs leading-5 text-slate-500">
      <span className="font-medium text-slate-400">Analysis note: </span>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.02] p-3">
      <div className="text-xs uppercase tracking-[.12em] text-slate-600">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-300">{value}</div>
    </div>
  );
}
