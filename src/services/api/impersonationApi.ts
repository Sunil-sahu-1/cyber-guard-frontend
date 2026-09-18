import {apiFetch} from "./client";import type {ImpersonationScan} from "@/types/api";
export async function analyzeImage(file:File){const form=new FormData();form.append("file",file);return apiFetch<unknown>("/impersonation/image/analyze/",{method:"POST",body:form})}
export async function analyzeVideo(file:File){const form=new FormData();form.append("file",file);return apiFetch<unknown>("/impersonation/video/analyze/",{method:"POST",body:form})}
export async function listImpersonationHistory(){return apiFetch<ImpersonationScan[]>("/impersonation/history/")}
export async function getImpersonationScan(id:number){return apiFetch<ImpersonationScan>(`/impersonation/${id}/`)}
export async function deleteImpersonationScan(id:number){return apiFetch(`/impersonation/${id}/delete/`,{method:"DELETE"})}
