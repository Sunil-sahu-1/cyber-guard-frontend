export type Severity = "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ThreatStatus = "DETECTED" | "REVIEWED" | "RESOLVED" | "FALSE_POSITIVE";

export interface User {
  id: number;
  user_id: string;
  username?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role?: string;
  is_staff?: boolean;
}
export interface AuthResponse {
  message: string;
  access: string;
  refresh: string;
  user: User;
}
export interface ThreatEvidence {
  id: number;
  evidence_type: string;
  evidence_value: string;
  risk_contribution: number;
  created_at: string;
}
export interface ThreatAnalysis {
  id: number;
  model_name: string;
  model_version: string;
  prediction: string;
  confidence: number;
  score: number;
  analysis_result: Record<string, unknown>;
  created_at: string;
}
export interface Threat {
  id: number;
  user: number;
  threat_type: string;
  source_type: string;
  input_data: string;
  risk_score: number;
  severity: Severity;
  status: ThreatStatus;
  explanation: string;
  detected_at: string;
  updated_at: string;
  evidence: ThreatEvidence[];
  analyses: ThreatAnalysis[];
}
export interface ScanResponse {
  message: string;
  url?: string;
  risk_score: number;
  severity: Severity;
  prediction: string;
  confidence: number;
  indicators: string[];
  features?: Record<string, unknown>;
  recommendation?: string;
  explanation: string;
  recommended_actions: string[];
  threat_id: number;
  scan_id: number;
  incident?: { id: number; severity: Severity; status: string };
  model_results?: {
    trained_url_model?: Record<string, unknown>;
    url_security_engine?: {
      original_url?: string;
      final_url?: string;
      original_domain?: string;
      final_domain?: string;
      redirect_analysis?: {
        redirect_count?: number;
        redirect_chain?: string[];
        shortener_detected?: boolean;
      };
      url_intelligence?: {
        source_url?: string;
        brand?: string | null;
        tld?: string | null;
        ip_address?: string | null;
        location?: string | null;
        hosting_provider?: string | null;
        asn?: string | number | null;
        page_title?: string | null;
        status_code?: number | null;
        content_type?: string | null;
        detection_date?: string | null;
        certificate?: {
          subject?: string;
          issuer?: string;
          valid_from?: string;
          valid_until?: string;
          status?: string;
        } | null;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}
export interface PhishingScan {
  id: number;
  user: number;
  scan_type: string;
  input_data: string;
  risk_score: number;
  result: Severity;
  explanation: string;
  status: string;
  created_at: string;
  updated_at: string;
  url_analysis?: Record<string, unknown>;
  email_analysis?: Record<string, unknown>;
}
export interface ImpersonationScan {
  id: number;
  user: number;
  scan_type: string;
  file_name: string;
  file_size: number;
  risk_score: number;
  result: Severity;
  explanation: string;
  status: string;
  created_at: string;
  updated_at: string;
  deepfake_analysis?: Record<string, unknown>;
  identity_analysis?: Record<string, unknown>;
  evidence?: ThreatEvidence[];
}
export interface Anomaly {
  id: number;
  user: number | null;
  anomaly_type: string;
  risk_score: number;
  severity: Severity;
  status: string;
  explanation: string;
  detected_at: string;
  updated_at: string;
}
export interface Incident {
  id: number;
  incident_type: string;
  title: string;
  description: string;
  severity: Severity;
  status: string;
  risk_score: number;
  created_by: number;
  assigned_to: number | null;
  source_type: string;
  source_id: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  evidence: Record<string, unknown>[];
  response_actions: Record<string, unknown>[];
}
export interface AuditLog {
  id: number;
  user_id: string;
  user_email: string;
  action: string;
  ip_address: string;
  user_agent: string;
  resource: string;
  resource_id: string;
  description: string;
  status: string;
  created_at: string;
}
