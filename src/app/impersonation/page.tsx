"use client";

import { useEffect, useRef, useState } from "react";
import { FileVideo, Image as ImageIcon, ScanFace, Upload, X, PlayCircle, ShieldCheck } from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Button, Panel, PageTitle, RiskBadge } from "@/components/ui";
import { analyzeImage, analyzeVideo } from "@/services/api/impersonationApi";

type AnalysisResult = {
  risk_score: number;
  result: string;
  explanation: string;
  prediction?: string;
  confidence?: number;
  indicators?: string[];
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
      ...(response.risk ? { risk_score: response.risk.risk_score, result: response.risk.severity } : {}),
      ...(response.ai_analysis ?? {}),
    };
  }
  return value as AnalysisResult;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function MediaGuard() {
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<"image" | "video">("image");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");

  const file = kind === "image" ? imageFile : videoFile;

  useEffect(() => {
    if (!imageFile) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function switchMode(next: "image" | "video") {
    setKind(next);
    setErr("");
    setResult(null);
  }

  function validateFile(selected: File, type: "image" | "video") {
    const allowed = type === "image" ? IMAGE_TYPES : VIDEO_TYPES;
    const extension = "." + (selected.name.split(".").pop() || "").toLowerCase();

    if (!allowed.includes(extension)) {
      return "Unsupported " + type + " format. Supported formats: " + allowed.join(", ") + ".";
    }
    if (selected.size > MAX_FILE_SIZE) return "File size must not exceed 20 MB.";
    if (selected.size === 0) return "The selected file is empty.";
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
      setErr(kind === "image" ? "Choose an image before starting the analysis." : "Choose a video before starting the analysis.");
      return;
    }

    setErr("");
    setLoading(true);
    try {
      const response = kind === "image" ? await analyzeImage(file) : await analyzeVideo(file);
      setResult(normalizeResult(response));
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Media analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  function clearCurrentFile() {
    if (kind === "image") {
      setImageFile(null);
      if (imageRef.current) imageRef.current.value = "";
    } else {
      setVideoFile(null);
      if (videoRef.current) videoRef.current.value = "";
    }
    setResult(null);
    setErr("");
  }

  return (
    <ProtectedShell>
      <PageTitle title="Media Guard" description="Analyze photos and videos separately for impersonation and deepfake indicators." />

      <Panel className="p-5 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => switchMode("image")} className={"rounded-2xl border p-5 text-left transition " + (kind === "image" ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/10 bg-white/[.02] hover:bg-white/[.05]")}>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-300/10"><ImageIcon className="h-5 w-5 text-cyan-300" /></div>
              <div><div className="font-semibold">Photo Analysis</div><div className="text-xs text-slate-500">JPG, JPEG, PNG, WEBP</div></div>
            </div>
          </button>

          <button type="button" onClick={() => switchMode("video")} className={"rounded-2xl border p-5 text-left transition " + (kind === "video" ? "border-violet-300/40 bg-violet-300/10" : "border-white/10 bg-white/[.02] hover:bg-white/[.05]")}>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-300/10"><FileVideo className="h-5 w-5 text-violet-300" /></div>
              <div><div className="font-semibold">Video Analysis</div><div className="text-xs text-slate-500">MP4, MOV, AVI, MKV, WEBM</div></div>
            </div>
          </button>
        </div>
      </Panel>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.95fr]">
        <Panel className="p-6">
          {kind === "image" ? (
            <ImageUploader file={imageFile} preview={preview} inputRef={imageRef} onSelect={selectImage} onClear={clearCurrentFile} />
          ) : (
            <VideoUploader file={videoFile} inputRef={videoRef} onSelect={selectVideo} onClear={clearCurrentFile} />
          )}

          {err && <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{err}</div>}

          <Button className="mt-5 w-full sm:w-auto" onClick={run} loading={loading}>
            <ScanFace className="h-4 w-4" />
            {kind === "image" ? "Analyze photo" : "Analyze video"}
          </Button>
        </Panel>

        {result ? <Result result={result} kind={kind} /> : (
          <Panel className="grid min-h-[500px] place-items-center p-6">
            <div className="text-center">
              {kind === "image" ? <ImageIcon className="mx-auto h-12 w-12 text-cyan-300/50" /> : <FileVideo className="mx-auto h-12 w-12 text-violet-300/50" />}
              <h2 className="mt-4 font-semibold">{kind === "image" ? "Photo analysis ready" : "Video analysis ready"}</h2>
              <p className="mt-1 text-sm text-slate-600">Upload a {kind === "image" ? "photo" : "video"} to see the deepfake analysis results.</p>
            </div>
          </Panel>
        )}
      </div>
    </ProtectedShell>
  );
}

function ImageUploader({file, preview, inputRef, onSelect, onClear}: {file: File | null; preview: string; inputRef: React.RefObject<HTMLInputElement | null>; onSelect: (file: File | undefined) => void; onClear: () => void}) {
  return <>
    <div className="mb-5 flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-300/10 ring-1 ring-cyan-300/20"><ImageIcon className="h-5 w-5 text-cyan-300" /></div>
      <div><h2 className="font-semibold">Photo Deepfake Analysis</h2><p className="text-xs text-slate-500">Check facial and visual manipulation indicators.</p></div>
    </div>

    <input ref={inputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={event => onSelect(event.target.files?.[0])} />

    <div onClick={() => inputRef.current?.click()} className="cursor-pointer rounded-2xl border border-dashed border-cyan-300/25 bg-cyan-300/[.03] p-6 text-center transition hover:bg-cyan-300/[.06]">
      {preview ? <img src={preview} alt="Selected photo preview" className="mx-auto max-h-64 max-w-full rounded-xl object-contain" /> : <Upload className="mx-auto h-12 w-12 text-cyan-300/60" />}
      <div className="mt-4 text-sm font-medium">{file ? file.name : "Choose a photo"}</div>
      <div className="mt-1 text-xs text-slate-600">JPG, JPEG, PNG or WEBP • Maximum 20 MB</div>
    </div>

    {file && <FileInfo file={file} icon={<ImageIcon className="h-4 w-4 text-cyan-300" />} onClear={onClear} />}

    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {[["Face detection", "Facial presence and structure"], ["Visual artifacts", "Edges, lighting and compression"], ["Metadata", "Available file metadata signals"]].map(([title, text]) => (
        <div key={title} className="rounded-xl border border-white/10 bg-white/[.02] p-3">
          <div className="text-xs font-medium text-slate-300">{title}</div>
          <div className="mt-1 text-xs leading-5 text-slate-600">{text}</div>
        </div>
      ))}
    </div>
  </>;
}

function VideoUploader({file, inputRef, onSelect, onClear}: {file: File | null; inputRef: React.RefObject<HTMLInputElement | null>; onSelect: (file: File | undefined) => void; onClear: () => void}) {
  return <>
    <div className="mb-5 flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-300/10 ring-1 ring-violet-300/20"><FileVideo className="h-5 w-5 text-violet-300" /></div>
      <div><h2 className="font-semibold">Video Deepfake Analysis</h2><p className="text-xs text-slate-500">Upload a video for frame and temporal manipulation analysis.</p></div>
    </div>

    <input ref={inputRef} type="file" className="hidden" accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,.mp4,.mov,.avi,.mkv,.webm" onChange={event => onSelect(event.target.files?.[0])} />

    <div onClick={() => inputRef.current?.click()} className="cursor-pointer rounded-2xl border border-dashed border-violet-300/25 bg-violet-300/[.03] p-10 text-center transition hover:bg-violet-300/[.06]">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-300/10"><Upload className="h-8 w-8 text-violet-300/70" /></div>
      <div className="mt-4 text-sm font-medium">{file ? file.name : "Choose a video"}</div>
      <div className="mt-2 text-xs text-slate-500">Supported video formats</div>
      <div className="mt-1 text-xs text-slate-600">MP4 • MOV • AVI • MKV • WEBM</div>
      <div className="mt-1 text-xs text-slate-600">Maximum 20 MB</div>
    </div>

    {file && <FileInfo file={file} icon={<PlayCircle className="h-4 w-4 text-violet-300" />} onClear={onClear} />}

    <div className="mt-4 rounded-xl border border-violet-300/10 bg-violet-300/[.03] p-4">
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
        <div><div className="text-sm font-medium text-slate-300">Video-specific analysis</div><p className="mt-1 text-xs leading-5 text-slate-500">This uploader is independent from photo analysis. A selected photo will not be sent to the video endpoint.</p></div>
      </div>
    </div>
  </>;
}

function FileInfo({file, icon, onClear}: {file: File; icon: React.ReactNode; onClear: () => void}) {
  return <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[.03] p-3">
    <div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[.04]">{icon}</div><div className="min-w-0"><div className="truncate text-sm text-slate-300">{file.name}</div><div className="text-xs text-slate-600">{formatBytes(file.size)}</div></div></div>
    <button type="button" onClick={onClear} className="ml-3 rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="Remove selected file"><X className="h-4 w-4" /></button>
  </div>;
}

function Result({result, kind}: {result: AnalysisResult; kind: "image" | "video"}) {
  const keys = kind === "image"
    ? ["prediction","confidence","face_detected","multiple_faces","face_manipulation_indicator","lighting_inconsistency","edge_artifact_indicator","compression_anomaly","metadata_missing"]
    : ["prediction","confidence","face_detected","multiple_faces","temporal_consistency","frame_anomaly","motion_inconsistency","face_manipulation_indicator","compression_anomaly","metadata_missing"];

  return <Panel className="p-6">
    <div className="flex items-start justify-between"><div><div className="text-xs uppercase tracking-[.18em] text-slate-600">{kind === "image" ? "Photo result" : "Video result"}</div><div className="mt-2 text-2xl font-semibold">{result.risk_score}/100</div></div><RiskBadge value={result.result}/></div>
    <div className="mt-5 rounded-xl border border-white/10 bg-white/[.02] p-4"><div className="text-sm font-medium">Analysis explanation</div><p className="mt-2 text-sm leading-6 text-slate-400">{result.explanation}</p></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(result).filter(([key]) => keys.includes(key)).map(([key,value]) => <div key={key} className="rounded-xl border border-white/10 p-3"><div className="text-xs capitalize text-slate-600">{key.replaceAll("_"," ")}</div><div className="mt-1 text-sm text-slate-300">{String(value)}</div></div>)}</div>
    {result.indicators?.length ? <div className="mt-5"><div className="text-sm font-medium">Indicators</div><div className="mt-2 flex flex-wrap gap-2">{result.indicators.map((item,index)=><span key={index} className="rounded-full bg-violet-400/10 px-3 py-1 text-xs text-violet-200 ring-1 ring-violet-300/15">{item}</span>)}</div></div> : null}
  </Panel>;
}
