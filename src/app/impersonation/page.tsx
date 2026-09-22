"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileVideo,
  Image as ImageIcon,
  ScanFace,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Button, Panel, PageTitle, RiskBadge } from "@/components/ui";
import {
  analyzeImage,
  analyzeVideo,
} from "@/services/api/impersonationApi";

type AnalysisKind = "image" | "video";
type EvidenceSection = "face" | "visual" | "metadata";

type AnalysisResult = {
  risk_score: number;
  result: string;
  explanation: string;
  prediction?: string;
  confidence?: number;
  indicators?: string[];
  detector_note?: string;
  features?: Record<string, unknown>;
  signal_components?: Record<string, number>;
  web_presence?: Record<string, unknown>;
  [key: string]: unknown;
};

type ApiResult = {
  ai_analysis?: AnalysisResult;
  risk?: { risk_score: number; severity: string };
  scan?: AnalysisResult;
  [key: string]: unknown;
};

const IMAGE_TYPES = [".jpg", ".jpeg", ".png", ".webp"];
const VIDEO_TYPES = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function normalizeResult(value: unknown): AnalysisResult {
  const response = (value ?? {}) as ApiResult;

  if (response.scan) {
    return {
      ...response.scan,
      ...(response.risk
        ? {
            risk_score: response.risk.risk_score,
            result: response.risk.severity,
          }
        : {}),
      ...(response.ai_analysis ?? {}),
    };
  }

  return value as AnalysisResult;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

export default function MediaGuard() {
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<AnalysisKind>("image");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceSection | null>(null);

  const file = kind === "image" ? imageFile : videoFile;

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function switchMode(next: AnalysisKind) {
    setKind(next);
    setErr("");
    setResult(null);
    setSelectedEvidence(null);
  }

  function validateFile(selected: File, type: AnalysisKind) {
    const allowed = type === "image" ? IMAGE_TYPES : VIDEO_TYPES;

    const extension =
      "." + (selected.name.split(".").pop() || "").toLowerCase();

    if (!allowed.includes(extension)) {
      return (
        "Unsupported " +
        type +
        " format. Supported formats: " +
        allowed.join(", ") +
        "."
      );
    }

    if (selected.size > MAX_FILE_SIZE) {
      return "File size must not exceed 20 MB.";
    }

    if (selected.size === 0) {
      return "The selected file is empty.";
    }

    return "";
  }

  function selectImage(selected: File | undefined) {
    if (!selected) return;

    const error = validateFile(selected, "image");

    if (error) {
      setErr(error);
      return;
    }

    setImageFile(selected);
    setResult(null);
    setSelectedEvidence(null);
    setErr("");
  }

  function selectVideo(selected: File | undefined) {
    if (!selected) return;

    const error = validateFile(selected, "video");

    if (error) {
      setErr(error);
      return;
    }

    setVideoFile(selected);
    setResult(null);
    setSelectedEvidence(null);
    setErr("");
  }

  async function run() {
    if (!file) {
      setErr(
        kind === "image"
          ? "Choose an image before starting the analysis."
          : "Choose a video before starting the analysis.",
      );
      return;
    }

    setErr("");
    setLoading(true);

    try {
      const response =
        kind === "image"
          ? await analyzeImage(file)
          : await analyzeVideo(file);
      setResult(normalizeResult(response));
    } catch (error) {
      setErr(
        error instanceof Error
          ? error.message
          : "Media analysis failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearCurrentFile() {
    if (kind === "image") {
      setImageFile(null);
      if (imageRef.current) imageRef.current.value = "";
    } else if (kind === "video") {
      setVideoFile(null);
      if (videoRef.current) videoRef.current.value = "";
    }

    setResult(null);
    setSelectedEvidence(null);
    setErr("");
  }

  return (
    <ProtectedShell>
      <PageTitle
        title="Media Guard"
        description="Analyze photos and videos for impersonation, deepfake and synthetic-media indicators."
      />

      <Panel className="p-5 md:p-6">
        <div className="grid gap-3 lg:grid-cols-2">
          <ModeButton
            active={kind === "image"}
            onClick={() => switchMode("image")}
            icon={<ImageIcon className="h-5 w-5 text-cyan-300" />}
            title="Photo Analysis"
            description="Facial and visual manipulation"
            formats="JPG, JPEG, PNG, WEBP"
          />

          <ModeButton
            active={kind === "video"}
            onClick={() => switchMode("video")}
            icon={<FileVideo className="h-5 w-5 text-violet-300" />}
            title="Video Analysis"
            description="Basic frame, face and visual anomaly screening"
            formats="MP4, MOV, AVI, MKV, WEBM"
          />

        </div>
      </Panel>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.95fr]">
        <Panel className="p-6">
          {kind === "image" ? (
            <ImageUploader
              file={imageFile}
              preview={imagePreview}
              inputRef={imageRef}
              onSelect={selectImage}
              onClear={clearCurrentFile}
              selectedEvidence={selectedEvidence}
              onEvidenceSelect={setSelectedEvidence}
            />
          ) : (
            <VideoUploader
              file={videoFile}
              inputRef={videoRef}
              onSelect={selectVideo}
              onClear={clearCurrentFile}
            />
          )}

          {err && (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
              {err}
            </div>
          )}

          <Button
            className="mt-5 w-full sm:w-auto"
            onClick={run}
            loading={loading}
          >
            <ScanFace className="h-4 w-4" />
            {kind === "image" ? "Analyze photo" : "Analyze video"}
          </Button>
        </Panel>

        {result ? (
          <Result result={result} kind={kind} selectedEvidence={selectedEvidence} onResetEvidence={() => setSelectedEvidence(null)} />
        ) : (
          <Panel className="grid min-h-[500px] place-items-center p-6">
            <div className="text-center">
              {kind === "image" ? (
                <ImageIcon className="mx-auto h-12 w-12 text-cyan-300/50" />
              ) : (
                <FileVideo className="mx-auto h-12 w-12 text-violet-300/50" />
              )}

              <h2 className="mt-4 font-semibold">
                {kind === "image"
                  ? "Photo analysis ready"
                  : kind === "video"
                    ? "Video analysis ready"
                    : "Media analysis ready"}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Upload a{" "}
                {kind === "image" ? "photo" : "video"}{" "}
                to see the analysis results.
              </p>
            </div>
          </Panel>
        )}
      </div>
    </ProtectedShell>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  title,
  description,
  formats,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  formats: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-2xl border p-5 text-left transition " +
        (active
          ? "border-cyan-300/40 bg-cyan-300/10"
          : "border-white/10 bg-white/[.02] hover:bg-white/[.05]")
      }
    >
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/[.04]">
          {icon}
        </div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-slate-500">{description}</div>
          <div className="mt-1 text-[11px] text-slate-600">{formats}</div>
        </div>
      </div>
    </button>
  );
}

function ImageUploader({
  file,
  preview,
  inputRef,
  onSelect,
  onClear,
  selectedEvidence,
  onEvidenceSelect,
}: {
  file: File | null;
  preview: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (file: File | undefined) => void;
  onClear: () => void;
  selectedEvidence: EvidenceSection | null;
  onEvidenceSelect: (section: EvidenceSection) => void;
}) {
  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-300/10 ring-1 ring-cyan-300/20">
          <ImageIcon className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <h2 className="font-semibold">Photo Deepfake Analysis</h2>
          <p className="text-xs text-slate-500">
            Check facial and visual manipulation indicators.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={(event) => onSelect(event.target.files?.[0])}
      />

      <div
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-2xl border border-dashed border-cyan-300/25 bg-cyan-300/[.03] p-6 text-center transition hover:bg-cyan-300/[.06]"
      >
        {preview ? (
          <img
            src={preview}
            alt="Selected photo preview"
            className="mx-auto max-h-64 max-w-full rounded-xl object-contain"
          />
        ) : (
          <Upload className="mx-auto h-12 w-12 text-cyan-300/60" />
        )}

        <div className="mt-4 text-sm font-medium">
          {file ? file.name : "Choose a photo"}
        </div>
        <div className="mt-1 text-xs text-slate-600">
          JPG, JPEG, PNG or WEBP • Maximum 20 MB
        </div>
      </div>

      {file && (
        <FileInfo
          file={file}
          icon={<ImageIcon className="h-4 w-4 text-cyan-300" />}
          onClear={onClear}
        />
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ["face", "Face detection", "Facial presence, count and boxes"],
          ["visual", "Visual artifacts", "Image quality and forensic heuristics"],
          ["metadata", "Metadata", "EXIF, format and camera information"],
        ].map(([section, title, text]) => {
          const key = section as EvidenceSection;
          const active = selectedEvidence === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onEvidenceSelect(key)}
              className={
                "rounded-xl border p-3 text-left transition " +
                (active
                  ? "border-cyan-300/40 bg-cyan-300/10"
                  : "border-white/10 bg-white/[.02] hover:bg-white/[.05]")
              }
            >
              <div className="text-xs font-medium text-slate-300">{title}</div>
              <div className="mt-1 text-xs leading-5 text-slate-600">
                {text}
              </div>
              <div className="mt-2 text-[10px] uppercase tracking-wider text-cyan-300/70">
                {active ? "Showing this section" : "Click to view"}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function VideoUploader({
  file,
  inputRef,
  onSelect,
  onClear,
}: {
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (file: File | undefined) => void;
  onClear: () => void;
}) {
  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-300/10 ring-1 ring-violet-300/20">
          <FileVideo className="h-5 w-5 text-violet-300" />
        </div>
        <div>
          <h2 className="font-semibold">Video Deepfake Analysis</h2>
          <p className="text-xs text-slate-500">
            Upload a video for frame and temporal manipulation analysis.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,.mp4,.mov,.avi,.mkv,.webm"
        onChange={(event) => onSelect(event.target.files?.[0])}
      />

      <div
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-2xl border border-dashed border-violet-300/25 bg-violet-300/[.03] p-10 text-center transition hover:bg-violet-300/[.06]"
      >
        <Upload className="mx-auto h-12 w-12 text-violet-300/70" />
        <div className="mt-4 text-sm font-medium">
          {file ? file.name : "Choose a video"}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          MP4 • MOV • AVI • MKV • WEBM
        </div>
        <div className="mt-1 text-xs text-slate-600">
          Maximum 20 MB
        </div>
      </div>

      {file && (
        <FileInfo
          file={file}
          icon={<FileVideo className="h-4 w-4 text-violet-300" />}
          onClear={onClear}
        />
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Face detection", "Face presence across sampled frames"],
          ["Visual artifacts", "Brightness, sharpness and frame-change signals"],
          ["Metadata", "Resolution, FPS, duration and frame count"],
        ].map(([title, text]) => (
          <div
            key={title}
            className="rounded-xl border border-violet-300/10 bg-violet-300/[.03] p-3"
          >
            <div className="text-xs font-medium text-slate-300">{title}</div>
            <div className="mt-1 text-xs leading-5 text-slate-600">
              {text}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-violet-300/10 bg-violet-300/[.03] p-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
          <div>
            <div className="text-sm font-medium text-slate-300">
              Basic video screening
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Current analysis uses OpenCV frame sampling, face detection and
              visual heuristics. A trained video deepfake model can be added later.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function FileInfo({
  file,
  icon,
  onClear,
}: {
  file: File;
  icon: React.ReactNode;
  onClear: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[.03] p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[.04]">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm text-slate-300">{file.name}</div>
          <div className="text-xs text-slate-600">{formatBytes(file.size)}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="ml-3 rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"
        aria-label="Remove selected file"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function Result({
  result,
  kind,
  selectedEvidence,
  onResetEvidence,
}: {
  result: AnalysisResult;
  kind: AnalysisKind;
  selectedEvidence: EvidenceSection | null;
  onResetEvidence: () => void;
}) {
  const features = (result.features ?? {}) as Record<string, unknown>;
  const face = (result.face_detection ?? {}) as Record<string, unknown>;
  const visual = (result.visual_artifacts ?? {}) as Record<string, unknown>;
  const metadata = (result.metadata ?? {}) as Record<string, unknown>;
  const webPresence = (result.web_presence ?? {}) as Record<string, unknown>;

  const sections = {
    face: face,
    visual: visual,
    metadata: metadata,
  };

  const sectionLabels = {
    face: "Face detection",
    visual: "Visual artifacts",
    metadata: "Metadata",
  };

  const visibleSections: EvidenceSection[] = selectedEvidence
    ? [selectedEvidence]
    : ["face", "visual", "metadata"];

  const renderValue = (value: unknown): string => {
    if (value === null || value === undefined) return "Not available";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "None";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <Panel className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-[.18em] text-slate-600">
            {kind === "image" ? "Photo result" : "Video result"}
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {result.risk_score}/100
          </div>
        </div>
        <RiskBadge value={result.result ?? result.severity ?? "UNKNOWN"} />
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/[.02] p-4">
        <div className="text-sm font-medium">Analysis explanation</div>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {result.explanation ??
            result.recommendation ??
            "Analysis completed."}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          ["Prediction", result.prediction],
          ["Confidence", result.confidence],
          ["Model score", features.ensemble_score ?? result.risk_score],
          ["Trained model", features.fine_tuned_models],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-white/10 p-3">
            <div className="text-xs uppercase tracking-[.12em] text-slate-600">
              {label}
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-slate-300">
              {renderValue(value)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Evidence details</div>
          <div className="mt-1 text-xs text-slate-600">
            {selectedEvidence
              ? `Showing ${sectionLabels[selectedEvidence]} only.`
              : "All evidence sections are shown."}
          </div>
        </div>
        {selectedEvidence && (
          <button
            type="button"
            onClick={onResetEvidence}
            className="text-xs text-cyan-300 hover:text-cyan-200"
          >
            Reset
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-4">
        {visibleSections.map((section) => {
          const data = sections[section];
          const entries = Object.entries(data);
          return (
            <div
              key={section}
              className="rounded-xl border border-white/10 bg-white/[.02] p-4"
            >
              <div className="text-sm font-medium text-slate-200">
                {sectionLabels[section]}
              </div>
              {entries.length ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {entries.map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-white/5 bg-black/10 p-3">
                      <div className="text-xs capitalize text-slate-600">
                        {humanize(key)}
                      </div>
                      <pre className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">
                        {renderValue(value)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-500">
                  No {sectionLabels[section].toLowerCase()} data was returned.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {kind === "image" ? <PublicWebPresence data={webPresence} /> : null}

      {result.web_presence ? (
        <WebPresence data={result.web_presence} />
      ) : null}

      {result.indicators?.length ? (
        <Indicators items={result.indicators} />
      ) : null}
    </Panel>
  );
}



function PublicWebPresence({ data }: { data: Record<string, unknown> }) {
  const status = String(data.status ?? "NOT_AVAILABLE");
  const provider = String(data.provider ?? "Public web index");
  const matches = Array.isArray(data.matches) ? data.matches : [];
  const fingerprint = (data.fingerprint ?? {}) as Record<string, unknown>;

  return (
    <div className="mt-5 rounded-xl border border-cyan-300/10 bg-cyan-300/[.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Public Web Presence</div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Cyber Guard fingerprint + indexed public-web image evidence.
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-cyan-300">
          {humanize(status)}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-white/5 bg-black/10 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-600">SHA-256</div>
          <div className="mt-1 break-all text-xs text-slate-300">{String(fingerprint.sha256 ?? "Not available")}</div>
        </div>
        <div className="rounded-lg border border-white/5 bg-black/10 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-600">Perceptual hash</div>
          <div className="mt-1 break-all text-xs text-slate-300">{String(fingerprint.average_hash ?? "Not available")}</div>
        </div>
      </div>

      {status === "NOT_CONFIGURED" ? (
        <div className="mt-3 rounded-lg border border-amber-300/10 bg-amber-300/[.04] p-3 text-xs leading-5 text-slate-500">
          {String(data.message ?? `Configure the public-web search provider to discover indexed pages.`)}
        </div>
      ) : null}

      {matches.length > 0 ? (
        <div className="mt-4">
          <div className="mb-2 text-xs uppercase tracking-wider text-slate-600">
            Public pages / images found: {matches.length}
          </div>
          <div className="grid gap-2">
            {matches.map((item, index) => {
              const match = (item ?? {}) as Record<string, unknown>;
              const pageUrl = String(match.page_url ?? "");
              const imageUrl = String(match.image_url ?? "");
              return (
                <div key={`${pageUrl}-${imageUrl}-${index}`} className="rounded-lg border border-white/5 bg-black/10 p-3">
                  <div className="text-xs font-medium text-slate-300">
                    {String(match.title ?? `Web match ${index + 1}`)}
                  </div>
                  <div className="mt-2 grid gap-1 text-[11px]">
                    {pageUrl ? (
                      <a href={pageUrl} target="_blank" rel="noreferrer" className="break-all text-cyan-300 hover:text-cyan-200">
                        Public page: {pageUrl}
                      </a>
                    ) : null}
                    {imageUrl ? (
                      <a href={imageUrl} target="_blank" rel="noreferrer" className="break-all text-slate-400 hover:text-white">
                        Image URL: {imageUrl}
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-3 text-[11px] leading-5 text-slate-600">
        Provider: {provider}. {String(data.coverage_note ?? "")}
      </div>
    </div>
  );
}

function WebPresence({ data }: { data: Record<string, unknown> }) {
  const status = String(data.status ?? "UNKNOWN");
  const provider = String(data.provider ?? "Web index");
  const fullMatches = Array.isArray(data.full_matches) ? data.full_matches : [];
  const partialMatches = Array.isArray(data.partial_matches) ? data.partial_matches : [];
  const pages = Array.isArray(data.matching_pages) ? data.matching_pages : [];
  const similar = Array.isArray(data.visually_similar_images) ? data.visually_similar_images : [];
  const entities = Array.isArray(data.web_entities) ? data.web_entities : [];
  const labels = Array.isArray(data.best_guess_labels) ? data.best_guess_labels : [];

  return (
    <div className="mt-6 rounded-2xl border border-cyan-300/10 bg-cyan-300/[.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-200">Public Web Presence</div>
          <div className="mt-1 text-xs text-slate-500">
            Find where this image or visually related copies appear on indexed public web pages.
          </div>
        </div>
        <div className="rounded-lg border border-cyan-300/20 px-2 py-1 text-[10px] uppercase tracking-wider text-cyan-300">
          {status}
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <Metric label="Full matches" value={String(data.full_match_count ?? fullMatches.length)} />
        <Metric label="Partial matches" value={String(data.partial_match_count ?? partialMatches.length)} />
        <Metric label="Matching pages" value={String(data.matching_page_count ?? pages.length)} />
        <Metric label="Similar images" value={String(data.similar_image_count ?? similar.length)} />
      </div>

      {pages.length > 0 && (
        <WebList title="Pages containing matching images" items={pages} page />
      )}

      {fullMatches.length > 0 && (
        <WebList title="Full image matches" items={fullMatches} />
      )}

      {partialMatches.length > 0 && (
        <WebList title="Partial image matches" items={partialMatches} />
      )}

      {similar.length > 0 && (
        <WebList title="Visually similar images" items={similar} />
      )}

      {(entities.length > 0 || labels.length > 0) && (
        <div className="mt-4 rounded-xl border border-white/5 bg-black/10 p-3">
          <div className="text-xs font-medium text-slate-300">Web context</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {labels.map((item, index) => (
              <span key={"label-" + index} className="rounded-lg bg-cyan-300/10 px-2 py-1 text-xs text-cyan-200">
                {String((item as Record<string, unknown>).label ?? "")}
              </span>
            ))}
            {entities.map((item, index) => (
              <span key={"entity-" + index} className="rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-300">
                {String((item as Record<string, unknown>).description ?? "")}
              </span>
            ))}
          </div>
        </div>
      )}

      {status === "NOT_CONFIGURED" && (
        <div className="mt-3 text-xs text-amber-300">
          Public-web tracking is not configured yet. Add GOOGLE_CLOUD_VISION_API_KEY on the backend.
        </div>
      )}

      {data.note ? (
        <div className="mt-3 text-[11px] leading-5 text-slate-600">{String(data.note)}</div>
      ) : null}

      <div className="mt-2 text-[10px] text-slate-700">
        Source: {provider}
      </div>
    </div>
  );
}

function WebList({
  title,
  items,
  page = false,
}: {
  title: string;
  items: unknown[];
  page?: boolean;
}) {
  return (
    <div className="mt-4">
      <div className="text-xs font-medium text-slate-300">{title}</div>
      <div className="mt-2 space-y-2">
        {items.map((item, index) => {
          const record = (item ?? {}) as Record<string, unknown>;
          const url = String(record.url ?? "");
          const titleText = page ? String(record.page_title ?? "") : "";
          if (!/^https?:\\/\\//i.test(url)) return null;

          return (
            <a
              key={url + "-" + index}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-white/5 bg-black/10 p-3 hover:bg-white/[.04]"
            >
              <div className="break-all text-xs text-cyan-300">{url}</div>
              {titleText ? (
                <div className="mt-1 text-xs text-slate-400">{titleText}</div>
              ) : null}
              {record.matching_image_url ? (
                <div className="mt-1 break-all text-[10px] text-slate-600">
                  Matching image: {String(record.matching_image_url)}
                </div>
              ) : null}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.02] p-3">
      <div className="text-xs uppercase tracking-[.12em] text-slate-600">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-300">{value}</div>
    </div>
  );
}

function Indicators({ items }: { items: string[] }) {
  return (
    <div className="mt-5">
      <div className="text-sm font-medium">Indicators</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={index}
            className="rounded-full bg-violet-400/10 px-3 py-1 text-xs text-violet-200 ring-1 ring-violet-300/15"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
