import { apiFetch } from "./client";
import type { ImpersonationScan } from "@/types/api";

export async function analyzeImage(file: File) {
  const form = new FormData();

  // Backend ImageAnalyzeView expects the multipart field name "image".
  form.append("image", file, file.name);

  return apiFetch<unknown>("/impersonation/image/analyze/", {
    method: "POST",
    body: form,
  });
}

export async function analyzeVideo(file: File) {
  const form = new FormData();

  // Backend VideoAnalyzeView expects the multipart field name "video".
  form.append("video", file, file.name);

  return apiFetch<unknown>("/impersonation/video/analyze/", {
    method: "POST",
    body: form,
  });
}

export async function analyzeVoice(file: File) {
  const form = new FormData();

  // Backend VoiceAnalyzeView expects the multipart field name "voice".
  form.append("voice", file, file.name);

  return apiFetch<unknown>("/impersonation/voice/analyze/", {
    method: "POST",
    body: form,
  });
}

export async function listImpersonationHistory() {
  return apiFetch<ImpersonationScan[]>("/impersonation/history/");
}

export async function getImpersonationScan(id: number) {
  return apiFetch<ImpersonationScan>(`/impersonation/${id}/`);
}

export async function deleteImpersonationScan(id: number) {
  return apiFetch(`/impersonation/${id}/delete/`, {
    method: "DELETE",
  });
}
