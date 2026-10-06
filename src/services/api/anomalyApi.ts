import { apiFetch } from "./client";
import type { JsonObject } from "./enterpriseApi";

export async function analyzeLogin(payload:JsonObject){ return apiFetch<JsonObject>("/anomaly/login/analyze/",{method:"POST",body:JSON.stringify(payload)}); }
export async function analyzeBehavior(payload:JsonObject){ return apiFetch<JsonObject>("/anomaly/behavior/",{method:"POST",body:JSON.stringify(payload)}); }
export async function recordLoginActivity(payload:JsonObject){ return apiFetch<JsonObject>("/anomaly/login/activity/",{method:"POST",body:JSON.stringify(payload)}); }
export async function listAnomalies(){ return apiFetch<JsonObject[]>("/anomaly/history/"); }
export async function listBehaviorHistory(){ return apiFetch<JsonObject[]>("/anomaly/behavior/history/"); }
export async function getBehavior(id:number){ return apiFetch<JsonObject>("/anomaly/behavior/" + id + "/"); }
export async function listLoginHistory(){ return apiFetch<JsonObject[]>("/anomaly/login/history/"); }
export async function getLoginActivity(id:number){ return apiFetch<JsonObject>("/anomaly/login/activity/" + id + "/"); }
export async function getAnomaly(id:number){ return apiFetch<JsonObject>("/anomaly/" + id + "/"); }
