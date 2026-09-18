import {apiFetch} from "./client";import type {Anomaly} from "@/types/api";
export async function analyzeLogin(payload:Record<string,unknown>){return apiFetch<unknown>("/anomaly/login/analyze/",{method:"POST",body:JSON.stringify(payload)})}
export async function analyzeBehaviour(payload:Record<string,unknown>){return apiFetch<unknown>("/anomaly/behavior/",{method:"POST",body:JSON.stringify(payload)})}
export async function createLoginActivity(payload:Record<string,unknown>){return apiFetch<unknown>("/anomaly/login/activity/",{method:"POST",body:JSON.stringify(payload)})}
export async function listAnomalies(){return apiFetch<Anomaly[]>("/anomaly/history/")}
export async function getAnomaly(id:number){return apiFetch<Anomaly>(`/anomaly/${id}/`)}
export async function listLoginActivity(){return apiFetch<unknown[]>("/anomaly/login/history/")}
export async function getLoginActivity(id:number){return apiFetch<unknown>(`/anomaly/login/activity/${id}/`)}
export async function listBehaviourHistory(){return apiFetch<unknown[]>("/anomaly/behavior/history/")}
export async function getBehaviour(id:number){return apiFetch<unknown>(`/anomaly/behavior/${id}/`)}
