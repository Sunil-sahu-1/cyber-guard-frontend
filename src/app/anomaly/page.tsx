"use client";

import { useEffect, useState } from "react";
import { Activity, ShieldAlert, History, PlusCircle, RefreshCw } from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Button, PageTitle, Panel, RiskBadge } from "@/components/ui";
import * as anomalyApi from "@/services/api/anomalyApi";
import type { JsonObject } from "@/services/api/enterpriseApi";

type LoginForm = {
  failed_attempts: number;
  ip_address: string;
  device_id: string;
  location: string;
  new_ip: boolean;
  new_device: boolean;
  new_location: boolean;
  unusual_time: boolean;
  impossible_travel: boolean;
  suspicious_network: boolean;
  status: "SUCCESS" | "FAILED" | "BLOCKED";
};

type BehaviorForm = {
  unusual_access: boolean;
  unusual_resource_access: boolean;
  unusual_request_volume: boolean;
  new_device: boolean;
  new_location: boolean;
  suspicious_network: boolean;
  activity_type: "LOGIN" | "LOGOUT" | "ACCESS" | "NETWORK" | "DEVICE" | "OTHER";
  ip_address: string;
  location: string;
  device_id: string;
};

type ActivityForm = {
  status: "SUCCESS" | "FAILED" | "BLOCKED";
  ip_address: string;
  location: string;
  device_id: string;
  failure_reason: string;
};

const defaultLogin: LoginForm = {
  failed_attempts: 0,
  ip_address: "",
  device_id: "",
  location: "",
  new_ip: false,
  new_device: false,
  new_location: false,
  unusual_time: false,
  impossible_travel: false,
  suspicious_network: false,
  status: "SUCCESS",
};

const defaultBehavior: BehaviorForm = {
  unusual_access: false,
  unusual_resource_access: false,
  unusual_request_volume: false,
  new_device: false,
  new_location: false,
  suspicious_network: false,
  activity_type: "ACCESS",
  ip_address: "",
  location: "",
  device_id: "",
};

const defaultActivity: ActivityForm = {
  status: "SUCCESS",
  ip_address: "",
  location: "",
  device_id: "",
  failure_reason: "",
};

export default function AnomalyPage() {
  const [login, setLogin] = useState<LoginForm>(defaultLogin);
  const [behavior, setBehavior] = useState<BehaviorForm>(defaultBehavior);
  const [activity, setActivity] = useState<ActivityForm>(defaultActivity);
  const [result, setResult] = useState<JsonObject | null>(null);
  const [history, setHistory] = useState<JsonObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run(fn: () => Promise<JsonObject>) {
    setLoading(true);
    setError("");
    try {
      setResult(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const [a, b, c] = await Promise.all([
        anomalyApi.listAnomalies(),
        anomalyApi.listBehaviorHistory(),
        anomalyApi.listLoginHistory(),
      ]);
      setHistory([...(a || []), ...(b || []), ...(c || [])].slice(0, 40));
    } catch (e) {
      setError(e instanceof Error ? e.message : "History load failed");
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  return (
    <ProtectedShell>
      <PageTitle
        title="Anomaly Center"
        description="Analyze login and behavioral anomalies, record activity, and inspect backend-generated history."
        action={<Activity className="h-5 w-5 text-cyan-300" />}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel className="p-5">
          <h2 className="font-semibold">Login anomaly</h2>
          <p className="mt-1 text-xs text-slate-500">Enter the login signals you want the backend to analyze.</p>

          <div className="mt-4 space-y-3">
            <Field label="Failed attempts">
              <input type="number" min={0} value={login.failed_attempts}
                onChange={e => setLogin({ ...login, failed_attempts: Math.max(0, Number(e.target.value)) })}
                className={inputClass} />
            </Field>
            <Field label="IP address">
              <input value={login.ip_address} placeholder="192.168.1.10"
                onChange={e => setLogin({ ...login, ip_address: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Device ID">
              <input value={login.device_id} placeholder="device-001"
                onChange={e => setLogin({ ...login, device_id: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Location">
              <input value={login.location} placeholder="Bhubaneswar, Odisha"
                onChange={e => setLogin({ ...login, location: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Login status">
              <select value={login.status} onChange={e => setLogin({ ...login, status: e.target.value as LoginForm["status"] })} className={inputClass}>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </Field>
            <Toggle label="New IP" checked={login.new_ip} onChange={v => setLogin({ ...login, new_ip: v })} />
            <Toggle label="New device" checked={login.new_device} onChange={v => setLogin({ ...login, new_device: v })} />
            <Toggle label="New location" checked={login.new_location} onChange={v => setLogin({ ...login, new_location: v })} />
            <Toggle label="Unusual time" checked={login.unusual_time} onChange={v => setLogin({ ...login, unusual_time: v })} />
            <Toggle label="Impossible travel" checked={login.impossible_travel} onChange={v => setLogin({ ...login, impossible_travel: v })} />
            <Toggle label="Suspicious network" checked={login.suspicious_network} onChange={v => setLogin({ ...login, suspicious_network: v })} />
          </div>

          <Button className="mt-4 w-full" loading={loading}
            onClick={() => run(() => anomalyApi.analyzeLogin(login as unknown as JsonObject))}>
            <PlusCircle className="h-4 w-4" /> Analyze login
          </Button>
        </Panel>

        <Panel className="p-5">
          <h2 className="font-semibold">Behavior anomaly</h2>
          <p className="mt-1 text-xs text-slate-500">Select the behavioral signals detected for this activity.</p>

          <div className="mt-4 space-y-3">
            <Toggle label="Unusual access" checked={behavior.unusual_access} onChange={v => setBehavior({ ...behavior, unusual_access: v })} />
            <Toggle label="Unusual resource access" checked={behavior.unusual_resource_access} onChange={v => setBehavior({ ...behavior, unusual_resource_access: v })} />
            <Toggle label="Unusual request volume" checked={behavior.unusual_request_volume} onChange={v => setBehavior({ ...behavior, unusual_request_volume: v })} />
            <Toggle label="New device" checked={behavior.new_device} onChange={v => setBehavior({ ...behavior, new_device: v })} />
            <Toggle label="New location" checked={behavior.new_location} onChange={v => setBehavior({ ...behavior, new_location: v })} />
            <Toggle label="Suspicious network" checked={behavior.suspicious_network} onChange={v => setBehavior({ ...behavior, suspicious_network: v })} />

            <Field label="Activity type">
              <select value={behavior.activity_type} onChange={e => setBehavior({ ...behavior, activity_type: e.target.value as BehaviorForm["activity_type"] })} className={inputClass}>
                <option value="ACCESS">Resource Access</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="NETWORK">Network Activity</option>
                <option value="DEVICE">Device Activity</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="IP address">
              <input value={behavior.ip_address} placeholder="192.168.1.10"
                onChange={e => setBehavior({ ...behavior, ip_address: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Location">
              <input value={behavior.location} placeholder="Bhubaneswar, Odisha"
                onChange={e => setBehavior({ ...behavior, location: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Device ID">
              <input value={behavior.device_id} placeholder="device-001"
                onChange={e => setBehavior({ ...behavior, device_id: e.target.value })} className={inputClass} />
            </Field>
          </div>

          <Button className="mt-4 w-full" loading={loading}
            onClick={() => run(() => anomalyApi.analyzeBehavior(behavior as unknown as JsonObject))}>
            <PlusCircle className="h-4 w-4" /> Analyze behavior
          </Button>
        </Panel>

        <Panel className="p-5">
          <h2 className="font-semibold">Record login activity</h2>
          <p className="mt-1 text-xs text-slate-500">Save a login event to the user's activity history.</p>

          <div className="mt-4 space-y-3">
            <Field label="Status">
              <select value={activity.status} onChange={e => setActivity({ ...activity, status: e.target.value as ActivityForm["status"] })} className={inputClass}>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </Field>
            <Field label="IP address">
              <input value={activity.ip_address} placeholder="Leave blank to use current IP"
                onChange={e => setActivity({ ...activity, ip_address: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Location">
              <input value={activity.location} placeholder="Bhubaneswar, Odisha"
                onChange={e => setActivity({ ...activity, location: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Device ID">
              <input value={activity.device_id} placeholder="device-001"
                onChange={e => setActivity({ ...activity, device_id: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Failure reason">
              <input value={activity.failure_reason} placeholder="Optional"
                onChange={e => setActivity({ ...activity, failure_reason: e.target.value })} className={inputClass} />
            </Field>
          </div>

          <Button className="mt-4 w-full" loading={loading}
            onClick={() => run(() => anomalyApi.recordLoginActivity(activity as unknown as JsonObject))}>
            <PlusCircle className="h-4 w-4" /> Record activity
          </Button>
        </Panel>
      </div>

      {error && (
        <Panel className="mt-5 border border-red-400/20 p-4 text-sm text-red-300">{error}</Panel>
      )}

      {result && (
        <Panel className="mt-5 p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-cyan-300" />
            <h2 className="font-semibold">Latest analysis</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <ResponseSummary data={result} />
          </div>
        </Panel>
      )}

      <Panel className="mt-5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-cyan-300" />
            <h2 className="font-semibold">Anomaly history</h2>
          </div>
          <Button variant="ghost" onClick={loadHistory}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {history.map((item, i) => (
            <div key={String(item.id ?? i)} className="rounded-xl border border-white/10 bg-white/[.02] p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">#{String(item.id ?? "-")}</span>
                {item.severity ? <RiskBadge value={String(item.severity)} /> : null}
              </div>
              <div className="mt-2 text-sm font-medium">
                {String(item.anomaly_type ?? item.activity_type ?? item.status ?? "Activity")}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {String(item.explanation ?? item.location ?? item.created_at ?? "")}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </ProtectedShell>
  );
}

const inputClass = "w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[.03] px-3 py-2.5">
      <span className="text-sm text-slate-300">{label}</span>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-4 w-4 accent-cyan-400" />
    </label>
  );
}

function ResponseSummary({ data }: { data: JsonObject }) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        if (value === null || value === undefined || value === "") return null;
        return (
          <div key={key} className="rounded-xl border border-white/10 bg-white/[.02] p-4">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{formatLabel(key)}</div>
            <div className="mt-2 text-sm text-slate-200"><DisplayValue value={value} /></div>
          </div>
        );
      })}
    </>
  );
}

function DisplayValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-slate-500">—</span>;
  if (typeof value === "boolean") return <span className={value ? "text-amber-300" : "text-emerald-300"}>{value ? "Yes" : "No"}</span>;
  if (typeof value === "number") return <span className="font-semibold text-cyan-200">{value}</span>;
  if (typeof value === "string") return <span className="break-words">{value || "—"}</span>;
  if (Array.isArray(value)) return value.length ? <div className="space-y-2">{value.map((item, index) => <div key={index} className="rounded-lg border border-white/10 bg-black/10 p-2"><DisplayValue value={item} /></div>)}</div> : <span className="text-slate-500">None</span>;
  if (typeof value === "object") return <div className="mt-1 space-y-2">{Object.entries(value as Record<string, unknown>).map(([key, item]) => <div key={key} className="flex items-start justify-between gap-4 border-b border-white/5 pb-2 last:border-0 last:pb-0"><span className="shrink-0 text-xs text-slate-500">{formatLabel(key)}</span><span className="text-right"><DisplayValue value={item} /></span></div>)}</div>;
  return <span>{String(value)}</span>;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}
