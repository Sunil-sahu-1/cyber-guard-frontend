"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Cookie, Download, Eye, Puzzle, RefreshCw, ShieldCheck, Radio } from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Button, PageTitle, Panel } from "@/components/ui";
import {
  BrowserPrivacyScan,
  createBrowserPrivacyDashboardScan,
  listBrowserPrivacyScans,
} from "@/services/api/threatApi";

type ScannerState = "detecting" | "connected" | "scanning" | "offline" | "error";

export default function BrowserPrivacyPage() {
  const [scans, setScans] = useState<BrowserPrivacyScan[]>([]);
  const [scannerState, setScannerState] = useState<ScannerState>("detecting");
  const [message, setMessage] = useState("Looking for the Cyber Guard browser scanner...");
  const [lastScan, setLastScan] = useState<string>("");

  const loadScans = useCallback(async () => {
    try {
      const response = await listBrowserPrivacyScans();
      setScans(response.results);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load browser scans.");
    }
  }, []);

  const requestScan = useCallback(() => {
    if (typeof window === "undefined") return;
    window.postMessage(
      {
        source: "cyber-guard-dashboard",
        type: "CYBER_GUARD_SCAN_REQUEST",
      },
      window.location.origin,
    );
  }, []);

  useEffect(() => {
    let scanInFlight = false;

    const handleExtensionMessage = async (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const message = event.data;
      if (!message || typeof message.type !== "string") return;

      if (message.type === "CYBER_GUARD_EXTENSION_READY") {
        setScannerState("connected");
        setMessage("Browser scanner detected. Collecting browser privacy data automatically.");
        requestScan();
        return;
      }

      if (message.type !== "CYBER_GUARD_SCAN_RESULT") return;

      if (!message.ok) {
        setScannerState("error");
        setMessage(message.error || "Browser scanner could not collect data.");
        return;
      }

      if (scanInFlight) return;
      scanInFlight = true;
      setScannerState("scanning");
      setMessage("Browser data collected. Securing and saving the metadata...");

      try {
        await createBrowserPrivacyDashboardScan(message.data);
        setLastScan(new Date().toLocaleString());
        setMessage("Browser privacy data updated automatically.");
        setScannerState("connected");
        await loadScans();
      } catch (error) {
        setScannerState("error");
        setMessage(error instanceof Error ? error.message : "Unable to save browser scan.");
      } finally {
        scanInFlight = false;
      }
    };

    window.addEventListener("message", handleExtensionMessage);

    // The bridge can load before React hydration. Repeated status requests make
    // detection reliable without requiring the user to open the extension.
    const statusTimer = window.setInterval(() => {
      window.postMessage(
        {
          source: "cyber-guard-dashboard",
          type: "CYBER_GUARD_STATUS_REQUEST",
        },
        window.location.origin,
      );
    }, 2000);

    const scanTimer = window.setInterval(requestScan, 60000);

    void loadScans();

    window.setTimeout(() => {
      if (scannerState === "detecting") {
        setScannerState("offline");
        setMessage("Browser scanner not detected. Install the Cyber Guard companion once to enable automatic scanning.");
      }
    }, 7000);

    return () => {
      window.removeEventListener("message", handleExtensionMessage);
      window.clearInterval(statusTimer);
      window.clearInterval(scanTimer);
    };
  }, [loadScans, requestScan, scannerState]);

  const latest = scans[0];

  return (
    <ProtectedShell>
      <PageTitle
        title="Browser Privacy"
        description="Automatic browser privacy monitoring. Cookie metadata and installed extension permissions are collected by the companion scanner and synced to Cyber Guard."
        action={
          <div className="flex items-center gap-3">
            <StatusDot state={scannerState} />
            <span className="text-sm text-slate-400">
              {scannerState === "connected" || scannerState === "scanning" ? "Automatic monitoring" : "Scanner unavailable"}
            </span>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Cookie className="h-5 w-5 text-cyan-300" />
            <h2 className="font-semibold">Cookie Security</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Cookie values are never uploaded. Cyber Guard receives metadata such as name, domain,
            path, Secure, HttpOnly and SameSite flags.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Feature icon={Eye} title="Metadata only" text="Authentication/session cookie values are discarded before upload." />
            <Feature icon={ShieldCheck} title="Sensitive names" text="Session, auth, token and similar names are automatically flagged." />
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Puzzle className="h-5 w-5 text-cyan-300" />
            <h2 className="font-semibold">Installed Extensions</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Cyber Guard automatically reads extension name, version, enabled state, declared
            permissions and host permissions from the browser extension-management API.
          </p>
          <div className="mt-4 rounded-xl border border-amber-300/10 bg-amber-300/[.04] p-4 text-xs leading-5 text-slate-500">
            Declared permissions indicate allowed access. They do not by themselves prove actual runtime data usage.
          </div>
        </Panel>
      </div>

      <Panel className="mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-cyan-300" />
              <h2 className="font-semibold">Automatic Browser Monitoring</h2>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">{message}</p>
            {lastScan && <p className="mt-1 text-xs text-slate-600">Last automatic sync: {lastScan}</p>}
          </div>
          <Button variant="ghost" onClick={requestScan}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Scan Now
          </Button>
        </div>
      </Panel>

      <Panel className="mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Latest Browser Scan</h2>
            <p className="mt-1 text-xs text-slate-500">
              Data comes from the browser companion and is stored against your Cyber Guard account.
            </p>
          </div>
          <Button variant="ghost" onClick={() => void loadScans()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {!latest ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[.02] p-5 text-sm text-slate-500">
            No scan received yet. Once the companion is installed and active, this section updates automatically.
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric value={latest.cookie_count} label="Cookies" />
              <Metric value={latest.sensitive_cookie_count} label="Sensitive names" />
              <Metric value={latest.extension_count} label="Extensions" />
              <Metric value={latest.high_impact_extension_count} label="High-impact" />
              <Metric value={latest.summary.cookie_domains} label="Cookie domains" />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <DataList
                title="Cookie Metadata"
                items={latest.cookies.map((cookie) => (
                  <div key={cookie.domain + cookie.path + cookie.name} className="rounded-lg border border-white/10 bg-white/[.02] p-3">
                    <div className="font-medium text-slate-200">{cookie.name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {cookie.domain} · {cookie.path} · {cookie.secure ? "Secure" : "Not Secure"} ·
                      {cookie.http_only ? " HttpOnly" : " Script-readable"} · SameSite: {cookie.same_site}
                    </div>
                  </div>
                ))}
              />
              <DataList
                title="Installed Extensions"
                items={latest.extensions.map((extension) => (
                  <div key={extension.id || extension.name} className="rounded-lg border border-white/10 bg-white/[.02] p-3">
                    <div className="font-medium text-slate-200">{extension.name || "Unnamed extension"}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      v{extension.version || "unknown"} · {extension.enabled ? "Enabled" : "Disabled"} · ID: {extension.id || "unknown"}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      Permissions: {extension.permissions.join(", ") || "None declared"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Hosts: {extension.host_permissions.join(", ") || "None declared"}
                    </div>
                    {extension.high_impact_permissions.length > 0 && (
                      <div className="mt-2 text-xs text-amber-300">
                        High-impact: {extension.high_impact_permissions.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              />
            </div>

            <div className="text-xs text-slate-500">
              Last scan: {new Date(latest.scanned_at).toLocaleString()} · Browser: {latest.browser || "Unknown"} ·
              Platform: {latest.platform || "Unknown"}
            </div>
          </div>
        )}
      </Panel>

      <Panel className="mt-5 p-5">
        <div className="flex items-center gap-3">
          <Download className="h-5 w-5 text-cyan-300" />
          <div>
            <h2 className="font-semibold">One-Time Setup</h2>
            <p className="text-xs text-slate-500">After the companion is installed, there is no pairing code or manual scan workflow.</p>
          </div>
        </div>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-400">
          <li>Install the Cyber Guard Browser Privacy Scanner extension once.</li>
          <li>Open this Browser Privacy page.</li>
          <li>The dashboard detects the extension automatically.</li>
          <li>Browser metadata is collected automatically and synced every minute while the dashboard is open.</li>
        </ol>

        <div className="mt-5 rounded-xl border border-cyan-300/10 bg-cyan-300/[.04] p-4 text-xs leading-5 text-slate-500">
          The browser itself still controls extension installation and permission approval. A website cannot silently install an extension or bypass browser permission controls.
        </div>
      </Panel>
    </ProtectedShell>
  );
}

function StatusDot({ state }: { state: ScannerState }) {
  const active = state === "connected" || state === "scanning";
  return <span className={"h-2.5 w-2.5 rounded-full " + (active ? "bg-emerald-400" : "bg-amber-400")} />;
}

function Feature({ icon: Icon, title, text }: { icon: typeof Eye; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.025] p-4">
      <Icon className="h-4 w-4 text-cyan-300" />
      <div className="mt-2 text-sm font-semibold text-slate-200">{title}</div>
      <div className="mt-1 text-xs leading-5 text-slate-500">{text}</div>
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.025] p-4">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function DataList({ title, items }: { title: string; items: ReactNode[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-200">{title}</h3>
      <div className="max-h-[420px] space-y-2 overflow-auto">
        {items.length > 0 ? items : (
          <div className="rounded-lg border border-white/10 p-4 text-xs text-slate-500">No data.</div>
        )}
      </div>
    </div>
  );
}
