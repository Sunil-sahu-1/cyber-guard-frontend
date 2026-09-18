import {apiFetch} from "./client";import type {AuditLog} from "@/types/api";
export async function listAuditLogs(query=""){return apiFetch<AuditLog[]>(`/audit/?${query}`)}
export async function listMyAuditLogs(){return apiFetch<AuditLog[]>("/audit/my/")}
export async function listAdminAuditLogs(query=""){return apiFetch<AuditLog[]>(`/audit/admin/?${query}`)}
export async function getAuditLog(id:number){return apiFetch<AuditLog>(`/audit/${id}/`)}
