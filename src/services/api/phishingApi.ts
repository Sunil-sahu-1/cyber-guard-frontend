import { apiFetch } from "./client";
import type { PhishingScan, ScanResponse } from "@/types/api";
export async function analyzeUrl(url: string) {
  return apiFetch<ScanResponse>("/phishing/url/analyze/", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}
export async function analyzeEmail(payload: { sender: string; subject: string; body: string }) {
  return apiFetch<ScanResponse>("/phishing/email/analyze/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export async function listPhishingHistory() {
  return apiFetch<PhishingScan[]>("/phishing/history/");
}
export async function getPhishingScan(id: number) {
  return apiFetch<PhishingScan>(`/phishing/${id}/`);
}
export async function deletePhishingScan(id: number) {
  return apiFetch(`/phishing/${id}/delete/`, { method: "DELETE" });
}

export interface EmailScreenshotOCRResponse {
  message: string;
  ocr: {
    raw_text: string;
    text_length: number;
    engine: string;
  };
  extracted: {
    sender: string;
    subject: string;
    body: string;
  };
  analysis: ScanResponse;
}

export async function analyzeEmailScreenshot(file: File) {
  const formData = new FormData();
  formData.append("screenshot", file);

  return apiFetch<EmailScreenshotOCRResponse>("/phishing/email/ocr/", {
    method: "POST",
    body: formData,
  });
}
