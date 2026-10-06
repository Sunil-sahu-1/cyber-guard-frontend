import { apiFetch } from "./client";

export type JsonObject = Record<string, unknown>;

export async function graphSearch(q: string, type = "", minRisk = 0) {
  const params = new URLSearchParams({ q, min_risk: String(minRisk) });
  if (type) params.set("type", type);
  return apiFetch<JsonObject>("/graph/search/?" + params.toString());
}
export async function graphThreat(id: number) { return apiFetch<JsonObject>("/graph/threats/" + id + "/"); }
export async function graphIncident(id: number) { return apiFetch<JsonObject>("/graph/incidents/" + id + "/"); }
export async function graphUser(id: number) { return apiFetch<JsonObject>("/graph/user/" + id + "/"); }

export async function hybridDecision(payload: JsonObject) { return apiFetch<JsonObject>("/intelligence/hybrid/decision/", { method:"POST", body:JSON.stringify(payload) }); }
export async function llmExplain(payload: JsonObject) { return apiFetch<JsonObject>("/intelligence/llm/explain/", { method:"POST", body:JSON.stringify(payload) }); }
export async function llmSummarize(payload: JsonObject) { return apiFetch<JsonObject>("/intelligence/llm/summarize/", { method:"POST", body:JSON.stringify(payload) }); }
export async function llmInvestigate(payload: JsonObject) { return apiFetch<JsonObject>("/intelligence/llm/investigate/", { method:"POST", body:JSON.stringify(payload) }); }
export async function llmAssist(payload: JsonObject) { return apiFetch<JsonObject>("/intelligence/llm/assist/", { method:"POST", body:JSON.stringify(payload) }); }
export async function pipelineAnalyze(payload: JsonObject) { return apiFetch<JsonObject>("/intelligence/pipeline/analyze/", { method:"POST", body:JSON.stringify(payload) }); }
export async function listHybridAudit() { return apiFetch<JsonObject[]>("/intelligence/audit/hybrid/"); }
export async function listLLMAudit() { return apiFetch<JsonObject[]>("/intelligence/audit/llm/"); }
export async function soarApproval(id: number, approval: "APPROVE"|"REJECT") { return apiFetch<JsonObject>("/intelligence/soar/approval/" + id + "/", { method:"POST", body:JSON.stringify({ approval }) }); }

export async function humanRiskMe() { return apiFetch<JsonObject>("/intelligence/human-risk/me/"); }
export async function humanRiskList() { return apiFetch<JsonObject[]>("/intelligence/human-risk/"); }
export async function humanRiskUser(id:number, days=30) { return apiFetch<JsonObject>("/intelligence/human-risk/user/" + id + "/?days=" + days); }
export async function humanRiskHistory(id:number) { return apiFetch<JsonObject[]>("/intelligence/human-risk/" + id + "/history/"); }
export async function humanRiskRecalculate(user_id?:number) { return apiFetch<JsonObject>("/intelligence/human-risk/recalculate/", { method:"POST", body:JSON.stringify(user_id ? {user_id} : {}) }); }
export async function getRiskWeights() { return apiFetch<JsonObject>("/intelligence/human-risk/weights/"); }
export async function setRiskWeights(payload:JsonObject) { return apiFetch<JsonObject>("/intelligence/human-risk/weights/", { method:"POST", body:JSON.stringify(payload) }); }

export async function listPlaybooks() { return apiFetch<JsonObject[]>("/playbooks/"); }
export async function createPlaybook(payload:JsonObject) { return apiFetch<JsonObject>("/playbooks/", { method:"POST", body:JSON.stringify(payload) }); }
export async function updatePlaybook(id:number,payload:JsonObject) { return apiFetch<JsonObject>("/playbooks/" + id + "/", { method:"PATCH", body:JSON.stringify(payload) }); }
export async function deletePlaybook(id:number) { return apiFetch("/playbooks/" + id + "/", { method:"DELETE" }); }
export async function addPlaybookStep(id:number,payload:JsonObject) { return apiFetch<JsonObject>("/playbooks/" + id + "/steps/", { method:"POST", body:JSON.stringify(payload) }); }
export async function launchPlaybook(id:number,payload:JsonObject) { return apiFetch<JsonObject>("/playbooks/" + id + "/run/", { method:"POST", body:JSON.stringify(payload) }); }
export async function listPlaybookRuns() { return apiFetch<JsonObject[]>("/playbooks/runs/"); }
export async function getPlaybookRun(id:number) { return apiFetch<JsonObject>("/playbooks/runs/" + id + "/"); }
export async function approvePlaybookRun(id:number,step_run_id?:number) { return apiFetch<JsonObject>("/playbooks/runs/" + id + "/approve/", { method:"POST", body:JSON.stringify(step_run_id ? {step_run_id} : {}) }); }
export async function rejectPlaybookRun(id:number,reason:string) { return apiFetch<JsonObject>("/playbooks/runs/" + id + "/reject/", { method:"POST", body:JSON.stringify({reason}) }); }
export async function retryPlaybookRun(id:number) { return apiFetch<JsonObject>("/playbooks/runs/" + id + "/retry/", { method:"POST" }); }
export async function cancelPlaybookRun(id:number) { return apiFetch<JsonObject>("/playbooks/runs/" + id + "/cancel/", { method:"POST" }); }

export async function listIntegrations() { return apiFetch<JsonObject[]>("/integrations/"); }
export async function createIntegration(payload:JsonObject) { return apiFetch<JsonObject>("/integrations/", { method:"POST", body:JSON.stringify(payload) }); }
export async function updateIntegration(id:number,payload:JsonObject) { return apiFetch<JsonObject>("/integrations/" + id + "/", { method:"PATCH", body:JSON.stringify(payload) }); }
export async function deleteIntegration(id:number) { return apiFetch("/integrations/" + id + "/", { method:"DELETE" }); }
export async function testIntegration(id:number) { return apiFetch<JsonObject>("/integrations/" + id + "/test/", { method:"POST" }); }
export async function syncIntegration(id:number) { return apiFetch<JsonObject>("/integrations/" + id + "/sync/", { method:"POST" }); }
export async function oauthConnect(provider:string) { return apiFetch<JsonObject>("/integrations/oauth/connect/" + encodeURIComponent(provider) + "/"); }
export async function oauthCallback(payload:JsonObject) { return apiFetch<JsonObject>("/integrations/oauth/callback/", { method:"POST", body:JSON.stringify(payload) }); }
export async function oauthDisconnect(id:number) { return apiFetch<JsonObject>("/integrations/oauth/" + id + "/disconnect/", { method:"POST" }); }

export async function listMeetings() { return apiFetch<JsonObject[]>("/meetings/"); }
export async function createMeeting(payload:JsonObject) { return apiFetch<JsonObject>("/meetings/", { method:"POST", body:JSON.stringify(payload) }); }
export async function getMeeting(id:number) { return apiFetch<JsonObject>("/meetings/" + id + "/"); }

export async function retentionStatus() { return apiFetch<JsonObject>("/governance/retention/status/"); }
export async function enforceRetention(archive_only=true) { return apiFetch<JsonObject>("/governance/retention/enforce/", { method:"POST", body:JSON.stringify({archive_only}) }); }
export async function listConsent() { return apiFetch<JsonObject[]>("/governance/consent/"); }
export async function grantConsent(payload:JsonObject) { return apiFetch<JsonObject>("/governance/consent/grant/", { method:"POST", body:JSON.stringify(payload) }); }
export async function revokeConsent(permission_scope:string) { return apiFetch<JsonObject>("/governance/consent/revoke/", { method:"POST", body:JSON.stringify({permission_scope}) }); }

export async function submitTask(payload:JsonObject) { return apiFetch<JsonObject>("/tasks/submit/", { method:"POST", body:JSON.stringify(payload) }); }
export async function pollTask(taskId:string) { return apiFetch<JsonObject>("/tasks/" + encodeURIComponent(taskId) + "/"); }

export async function dashboardOverview() { return apiFetch<JsonObject>("/dashboards/overview/"); }
export async function dashboardRisk() { return apiFetch<JsonObject>("/dashboards/risk/"); }
export async function dashboardPlaybooks() { return apiFetch<JsonObject>("/dashboards/playbooks/"); }
export async function dashboardIntegrations() { return apiFetch<JsonObject>("/dashboards/integrations/"); }

export async function listPolicies() { return apiFetch<JsonObject[]>("/policies/"); }
export async function createPolicy(payload:JsonObject) { return apiFetch<JsonObject>("/policies/", { method:"POST", body:JSON.stringify(payload) }); }
export async function getPolicy(id:number) { return apiFetch<JsonObject>("/policies/" + id + "/"); }
export async function updatePolicy(id:number,payload:JsonObject) { return apiFetch<JsonObject>("/policies/" + id + "/", { method:"PUT", body:JSON.stringify(payload) }); }
export async function deletePolicy(id:number) { return apiFetch("/policies/" + id + "/", { method:"DELETE" }); }
