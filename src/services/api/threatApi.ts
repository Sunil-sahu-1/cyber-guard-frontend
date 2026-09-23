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

export interface SelfProtectionIPLookup {
  ip: string;
  version: string;
  is_public: boolean;
  continent?: string | null;
  continent_code?: string | null;
  country?: string | null;
  country_code?: string | null;
  region?: string | null;
  region_code?: string | null;
  city?: string | null;
  postal?: string | null;
  capital?: string | null;
  calling_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_eu?: boolean | null;
  borders?: string | null;
  flag?: { img?: string | null; emoji?: string | null; emoji_unicode?: string | null };
  connection?: { asn?: number | null; organization?: string | null; isp?: string | null; domain?: string | null };
  timezone?: { id?: string | null; abbr?: string | null; is_dst?: boolean | null; offset?: number | null; utc?: string | null; current_time?: string | null };
  public_exposure?: {
    reverse_dns?: string | null;
    network_domain?: string | null;
    asn?: number | null;
    organization?: string | null;
    isp?: string | null;
    note?: string;
  };
  source?: string;
}

export async function lookupSelfProtectionIPv4(ipv4: string) {
  return apiFetch<{
    message: string;
    lookup: SelfProtectionIPLookup;
    ipv6_policy: {
      editable: boolean;
      mode: string;
      description: string;
    };
  }>("/threats/self-protection/ip-lookup/", {
    method: "POST",
    body: JSON.stringify({ ipv4 }),
  });
}


export interface BrowserPrivacyScan {
  id: number;
  browser: string;
  browser_version: string;
  platform: string;
  cookie_count: number;
  sensitive_cookie_count: number;
  extension_count: number;
  high_impact_extension_count: number;
  cookies: Array<{
    name: string;
    domain: string;
    path: string;
    secure: boolean;
    http_only: boolean;
    same_site: string;
    host_only?: boolean;
    session?: boolean;
  }>;
  extensions: Array<{
    id: string;
    name: string;
    version: string;
    enabled: boolean;
    type: string;
    permissions: string[];
    host_permissions: string[];
    high_impact_permissions: string[];
  }>;
  summary: {
    cookie_count: number;
    sensitive_cookie_count: number;
    cookie_domains: number;
    extension_count: number;
    enabled_extension_count: number;
    high_impact_extension_count: number;
    metadata_only: boolean;
    cookie_values_received: boolean;
    declared_permissions_are_not_runtime_proof: boolean;
  };
  scanned_at: string;
}

export async function createBrowserPrivacyPairing() {
  return apiFetch<{
    message: string;
    pairing_code: string;
    expires_at: string;
    expires_in_seconds: number;
  }>("/browser-privacy/pair/", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function listBrowserPrivacyScans() {
  return apiFetch<{
    count: number;
    results: BrowserPrivacyScan[];
  }>("/browser-privacy/scans/history/");
}


export async function createBrowserPrivacyAutoToken() {
  return apiFetch<{
    message: string;
    scan_token: string;
    expires_in_seconds: number;
  }>("/browser-privacy/auto-token/", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
