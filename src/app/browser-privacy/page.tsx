"use client";

import { Cookie, Download, Eye, Puzzle, ShieldCheck } from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Button, PageTitle, Panel } from "@/components/ui";

export default function BrowserPrivacyPage() {
  return (
    <ProtectedShell>
      <PageTitle
        title="Browser Privacy"
        description="Inspect cookie metadata and installed extension permissions with the Cyber Guard companion extension."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Cookie className="h-5 w-5 text-cyan-300" />
            <h2 className="font-semibold">Cookie Security</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            The scanner can show cookie names, domains, paths, Secure, HttpOnly and SameSite flags.
            Cookie values are intentionally hidden because session and authentication values are credentials.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Feature icon={Eye} title="Metadata only" text="No cookie value is displayed or transmitted." />
            <Feature icon={ShieldCheck} title="Sensitive names" text="Session, auth, token and similar names are flagged." />
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Puzzle className="h-5 w-5 text-cyan-300" />
            <h2 className="font-semibold">Installed Extensions</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            The companion extension lists installed extensions, versions, enabled state, declared permissions
            and host permissions. Declared permissions indicate allowed access, not proof of actual runtime data use.
          </p>
          <div className="mt-4 rounded-xl border border-amber-300/10 bg-amber-300/[.04] p-4 text-xs leading-5 text-slate-500">
            For actual runtime behavior, the extension source or a controlled runtime audit is required.
          </div>
        </Panel>
      </div>

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
          <li>Select Load unpacked.</li>
          <li>Select the browser-extension folder from the frontend repository.</li>
          <li>Open Cyber Guard Browser Privacy Scanner and click Scan browser.</li>
          <li>Grant cookie access only when you want to inspect cookie metadata.</li>
        </ol>

        <div className="mt-5 rounded-xl border border-cyan-300/10 bg-cyan-300/[.04] p-4 text-xs leading-5 text-slate-500">
          Cookie access is requested explicitly and the scanner never sends cookie values to Cyber Guard or any external server.
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
