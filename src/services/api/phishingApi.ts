import {apiFetch} from "./client";import type {PhishingScan,ScanResponse} from "@/types/api";
export async function analyzeUrl(url:string){return apiFetch<ScanResponse>("/phishing/url/analyze/",{method:"POST",body:JSON.stringify({url})})}
export async function analyzeEmail(payload:{sender:string;subject:string;body:string}){return apiFetch<ScanResponse>("/phishing/email/analyze/",{method:"POST",body:JSON.stringify(payload)})}
export async function listPhishingHistory(){return apiFetch<PhishingScan[]>("/phishing/history/")}
export async function getPhishingScan(id:number){return apiFetch<PhishingScan>(`/phishing/${id}/`)}
export async function deletePhishingScan(id:number){return apiFetch(`/phishing/${id}/delete/`,{method:"DELETE"})}
