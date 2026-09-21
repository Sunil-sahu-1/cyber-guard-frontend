import { apiFetch } from "./client";
import type { Threat } from "@/types/api";
export async function listThreats() {
  return apiFetch<Threat[]>("/threats/");
}
export async function getThreat(id: number) {
  return apiFetch<Threat>(`/threats/${id}/`);
}
export async function analyzeThreat(payload: Record<string, unknown>) {
  return apiFetch<unknown>("/threats/analyze/", { method: "POST", body: JSON.stringify(payload) });
}
export async function updateThreat(id: number, payload: Record<string, unknown>) {
  return apiFetch<Threat>(`/threats/${id}/`, { method: "PATCH", body: JSON.stringify(payload) });
}
export async function deleteThreat(id: number) {
  return apiFetch(`/threats/${id}/delete/`, { method: "DELETE" });
}
