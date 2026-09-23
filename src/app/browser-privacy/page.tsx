"use client";

import { useEffect, useState } from "react";
import { Cookie, Copy, Download, Eye, Puzzle, RefreshCw, ShieldCheck } from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Button, PageTitle, Panel } from "@/components/ui";
import {
  BrowserPrivacyScan,
  createBrowserPrivacyPairing,
  listBrowserPrivacyScans,
} from "@/services/api/threatApi";

export default function BrowserPrivacyPage() {
  const [pairingCode, setPairingCode] = useState("");
  const [pairingExpires, setPairingExpires] = useState("");
  const [scans, setScans] = useState<BrowserPrivacyScan[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadScans() {
    try {
      const response = await listBrowserPrivacyScans();
      setScans(response.results);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load browser scans.");
    }
  }

  async function createPairing() {
    setLoading(true);
    setMessage("");

    try {
      const response = await createBrowserPrivacyPairing();
      setPairingCode(response.pairing_code);
      setPairingExpires(response.expires_at);
      setMessage("Pairing code created. Enter it in the companion extension.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create pairing code.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!pairingCode) return;
    await navigator.clipboard.writeText(pairingCode);
    setMessage("Pairing code copied.");
  }

  useEffect(() => {
    void loadScans();
    const timer = window.setInterval(() => void loadScans(), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const latest = scans[0];

  return (
    <ProtectedShell>
      <PageTitle
        title="Browser Privacy"
        description="Inspect browser cookie metadata and installed extension permissions through the Cyber Guard companion scanner."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Cookie className="h-5 w-5 text-cyan-300" />
            <h2 className="font-semibold">Cookie Security</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Cookie values are never sent to the backend. Cyber Guard stores only metadata such as
            name, domain, path, Secure, HttpOnly and SameSite flags.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Feature icon={Eye} title="Metadata only" text="Authentication/session cookie values are never collected." />
            <Feature icon={ShieldCheck} title="Sensitive names" text="Session, auth, token and similar cookie names are flagged." />
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Puzzle className="h-5 w-5 text-cyan-300" />
            <h2 className="font-semibold">Installed Extensions</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            The companion scanner sends extension name, version, enabled state, declared permissions
            and host permissions. These permissions show allowed access, not proof of actual runtime use.
          </p>
          <div className="mt-4 rounded-xl border border-amber-300/10 bg-amber-300/[.04] p-4 text-xs leading-5 text-slate-500">
            Runtime behavior still requires source inspection or a controlled runtime audit.
          </div>
        </Panel>
      </div>

      <Panel className="mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">Connect Browser Scanner</h2>
            <p className="mt-1 text-xs text-slate-500">
              Generate a one-time pairing code. Your normal Cyber Guard JWT is never placed inside the extension.
            </p>
          </div>
          <Button onClick={createPairing} disabled={loading}>
            {loading ? "Generating..." : "Generate Pairing Code"}
          </Button>
        </div>

        {pairingCode && (
          <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/[.05] p-4">
            <div className="text-xs uppercase tracking-[0.15em] text-cyan-300">Pairing Code</div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <code className="rounded-lg bg-black/30 px-4 py-2 text-2xl font-bold tracking-[0.25em] text-white">
                {pairingCode}
              </code>
              <Button variant="ghost" onClick={copyCode}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Expires: {pairingExpires ? new Date(pairingExpires).toLocaleString() : "10 minutes"}
            </p>
          </div>
        )}

        {message && <div className="mt-3 text-sm text-slate-400">{message}</div>}
      </Panel>

      <Panel className="mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Backend Scan History</h2>
            <p className="mt-1 text-xs text-slate-500">Latest browser scans linked to your Cyber Guard account.</p>
          </div>
          <Button variant="ghost" onClick={() => void loadScans()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {!latest ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[.02] p-5 text-sm text-slate-500">
            No browser scan has been received yet. Pair the extension and click Scan browser.
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
              <DataList title="Cookie Metadata" items={latest.cookies.map((cookie) => (
                <div key={cookie.domain + cookie.path + cookie.name} className="rounded-lg border border-white/10 bg-white/[.02] p-3">
                  <div className="font-medium text-slate-200">{cookie.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {cookie.domain} · {cookie.path} · {cookie.secure ? "Secure" : "Not Secure"} ·
                    {cookie.http_only ? " HttpOnly" : " Script-readable"} · SameSite: {cookie.same_site}
                  </div>
                </div>
              ))} />
              <DataList title="Installed Extensions" items={latest.extensions.map((extension) => (
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
              ))} />
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
            <h2 className="font-semibold">Install Browser Privacy Scanner</h2>
            <p className="text-xs text-slate-500">Chrome / Chromium-based browsers</p>
          </div>
        </div>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-400">
          <li>Pull the latest Cyber Guard frontend repository.</li>
          <li>Open chrome://extensions and enable Developer mode.</li>
          <li>Select Load unpacked and choose the browser-extension folder.</li>
          <li>Open the extension and enter the pairing code generated above.</li>
          <li>Click Grant cookie access only when you want cookie metadata.</li>
          <li>Click Scan browser. The extension sends only sanitized metadata to the backend.</li>
        </ol>

        <div className="mt-5 rounded-xl border border-cyan-300/10 bg-cyan-300/[.04] p-4 text-xs leading-5 text-slate-500">
          Cookie values are discarded before the backend receives anything. Browser scanner access uses a short-lived pairing flow instead of your main Cyber Guard access token.
        </div>
      </Panel>
    </ProtectedShell>
  );
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

function DataList({ title, items }: { title: string; items: React.ReactNode[] }) {
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
