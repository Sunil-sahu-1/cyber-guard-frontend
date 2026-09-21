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
            description="Frame and temporal analysis"
            formats="MP4, MOV, AVI, MKV, WEBM"
          />

          <ModeButton
            active={kind === "voice"}
            onClick={() => switchMode("voice")}
            icon={<Mic className="h-5 w-5 text-emerald-300" />}
            title="Voice Verification"
            description="Synthetic voice and anti-spoofing"
            formats="WAV, MP3, M4A, FLAC, OGG, AAC"
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
            />
          ) : kind === "video" ? (
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
            {kind === "image"
              ? "Analyze photo"
              : kind === "video"
                ? "Analyze video"
                : "Verify voice"}
          </Button>
        </Panel>

        {result ? (
          <Result result={result} kind={kind} />
        ) : (
          <Panel className="grid min-h-[500px] place-items-center p-6">
            <div className="text-center">
              {kind === "image" ? (
                <ImageIcon className="mx-auto h-12 w-12 text-cyan-300/50" />
              ) : kind === "video" ? (
                <FileVideo className="mx-auto h-12 w-12 text-violet-300/50" />

              <h2 className="mt-4 font-semibold">
                {kind === "image"
                  ? "Photo analysis ready"
                  : kind === "video"
                    ? "Video analysis ready"
                    : "Media analysis ready"}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Upload a{" "}
                {kind === "image"
                  ? "photo"
                  : kind === "video"
                    ? "video"
                    : "voice recording"}{" "}
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
}: {
  file: File | null;
  preview: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (file: File | undefined) => void;
  onClear: () => void;
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
          ["Face detection", "Facial presence and structure"],
          ["Visual artifacts", "Edges, lighting and compression"],
          ["Metadata", "Available file metadata signals"],
        ].map(([title, text]) => (
          <div
            key={title}
            className="rounded-xl border border-white/10 bg-white/[.02] p-3"
          >
            <div className="text-xs font-medium text-slate-300">{title}</div>
            <div className="mt-1 text-xs leading-5 text-slate-600">
              {text}
            </div>
          </div>
        ))}
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

      <div className="mt-4 rounded-xl border border-violet-300/10 bg-violet-300/[.03] p-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
          <div>
            <div className="text-sm font-medium text-slate-300">
              Video-specific analysis
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Frame-level AI inference and temporal consistency signals are
              analyzed independently from photo analysis.
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
}: {
  result: AnalysisResult;
  kind: AnalysisKind;
}) {
  const keys =
    kind === "image"
      ? [
          "prediction",
          "confidence",
          "face_detected",
          "multiple_faces",
          "face_manipulation_indicator",
          "lighting_inconsistency",
          "edge_artifact_indicator",
          "compression_anomaly",
          "metadata_missing",
        ]
      : [
          "prediction",
          "confidence",
          "face_detected",
          "multiple_faces",
          "temporal_consistency",
          "frame_anomaly",
          "motion_inconsistency",
          "face_manipulation_indicator",
          "compression_anomaly",
          "metadata_missing",
        ];

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
        <RiskBadge value={result.result} />
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/[.02] p-4">
        <div className="text-sm font-medium">Analysis explanation</div>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {result.explanation}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {Object.entries(result)
          .filter(([key]) => keys.includes(key))
          .map(([key, value]) => (
            <div
              key={key}
              className="rounded-xl border border-white/10 p-3"
            >
              <div className="text-xs capitalize text-slate-600">
                {humanize(key)}
              </div>
              <div className="mt-1 text-sm text-slate-300">
                {String(value)}
              </div>
            </div>
          ))}
      </div>

      {result.indicators?.length ? (
        <Indicators items={result.indicators} />
      ) : null}
    </Panel>
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
