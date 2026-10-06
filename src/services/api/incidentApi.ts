import { apiFetch } from "./client";
import type { Incident } from "@/types/api";

export async function listIncidents(){ return apiFetch<Incident[]>("/incidents/"); }
export async function createIncident(payload:Record<string,unknown>){ return apiFetch<Incident>("/incidents/",{method:"POST",body:JSON.stringify(payload)}); }
export async function getIncident(id:number){ return apiFetch<Incident>("/incidents/" + id + "/"); }
export async function deleteIncident(id:number){ return apiFetch("/incidents/" + id + "/delete/",{method:"DELETE"}); }
export async function addEvidence(id:number,payload:Record<string,unknown>){ return apiFetch<unknown>("/incidents/" + id + "/evidence/",{method:"POST",body:JSON.stringify(payload)}); }
export async function addResponseAction(id:number,payload:Record<string,unknown>){ return apiFetch<unknown>("/incidents/" + id + "/response/",{method:"POST",body:JSON.stringify(payload)}); }
export async function executeResponseAction(id:number){ return apiFetch<unknown>("/incidents/response/" + id + "/execute/",{method:"POST"}); }
export async function resolveIncident(id:number){ return apiFetch<Incident>("/incidents/" + id + "/resolve/",{method:"POST"}); }
export async function explainIncident(id:number,payload:Record<string,unknown>={}){ return apiFetch<Record<string,unknown>>("/incidents/" + id + "/explain/",{method:"POST",body:JSON.stringify(payload)}); }
export async function getIncidentTimeline(id:number){ return apiFetch<Record<string,unknown>[]>("/incidents/" + id + "/timeline/"); }
export async function transitionIncident(id:number,status:string){ return apiFetch<Record<string,unknown>>("/incidents/" + id + "/transition/",{method:"POST",body:JSON.stringify({status})}); }
