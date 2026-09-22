"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  Globe2,
  Lock,
  MapPin,
  Network,
  RefreshCw,
  Search,
  Shield,
} from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Button, Input, PageTitle, Panel } from "@/components/ui";
import { lookupSelfProtectionIPv4, type SelfProtectionIPLookup } from "@/services/api/threatApi";

export default function SelfProtectionPage() {
  const [ipv4, setIpv4] = useState("");
  const [ipv6, setIpv6] = useState("");
  const [result, setResult] = useState<SelfProtectionIPLookup | null>(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(true);
  const [error, setError] = useState("");

  async function detectDeviceIPs() {
    setDetecting(true);
    try {
      const [v4Response, v6Response] = await Promise.allSettled([
        fetch("https://api.ipify.org?format=json", { cache: "no-store" }),
        fetch("https://api6.ipify.org?format=json", { cache: "no-store" }),
      ]);

      if (v4Response.status === "fulfilled" && v4Response.value.ok) {
        const data = await v4Response.value.json();
        if (typeof data.ip === "string") setIpv4(data.ip);
      }

      if (v6Response.status === "fulfilled" && v6Response.value.ok) {
        const data = await v6Response.value.json();
        if (typeof data.ip === "string") setIpv6(data.ip);
      }
    } catch {
      setError("Automatic public IP detection failed. Enter a public IPv4 manually.");
    } finally {
      setDetecting(false);
    }
  }

  async function lookup() {
    if (!ipv4.trim()) {
      setError("Enter a public IPv4 address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await lookupSelfProtectionIPv4(ipv4.trim());
      setResult(response.lookup);
    } catch (e) {
      setError(e instanceof Error ? e.message : "IP lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void detectDeviceIPs();
  }, []);

  useEffect(() => {
    if (ipv4) void lookup();
    // Initial device IPv4 only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detecting]);

  return (
    <ProtectedShell>
      <PageTitle
        title="Self Protection"
        description="Inspect your public IPv4, network ownership, location and public exposure indicators."
        action={
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Self-protection monitor
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[.9fr_1.5fr]">
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-300/20">
              <Shield className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="font-semibold">Your public IPs</h2>
              <p className="text-xs text-slate-500">
                IPv4 drives the lookup. IPv6 is read-only and device-observed.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Field label="IPv4 — lookup input">
              <div className="flex gap-2">
                <Input
                  value={ipv4}
                  onChange={(e) => setIpv4(e.target.value)}
                  placeholder="203.0.113.10"
                />
                <Button onClick={lookup} loading={loading} title="Lookup IPv4">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </Field>

            <Field label="IPv6 — read only">
              <Input
                value={detecting ? "Detecting..." : ipv6 || "IPv6 not available"}
                readOnly
                disabled
              />
            </Field>

            <Button
              variant="ghost"
              className="w-full"
              onClick={async () => {
                await detectDeviceIPs();
                setTimeout(() => void lookup(), 0);
              }}
              loading={detecting}
            >
              <RefreshCw className="h-4 w-4" />
              Detect device IPs again
            </Button>

            <div className="rounded-xl border border-amber-300/10 bg-amber-300/[.04] p-3 text-xs leading-5 text-slate-500">
              The IPv6 field is intentionally locked. An arbitrary IPv4 address
              cannot be mathematically converted into its real IPv6 address.
              If this device has public IPv6, it is detected separately.
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </Panel>

        <div className="space-y-5">
          {result ? <IPOverview result={result} /> : <Panel className="grid min-h-[420px] place-items-center p-6 text-center text-sm text-slate-600">Run an IPv4 lookup to populate your self-protection data.</Panel>}
        </div>
      </div>
    </ProtectedShell>
  );
}

function IPOverview({ result }: { result: SelfProtectionIPLookup }) {
  return (
    <>
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[.18em] text-slate-600">Public IP identity</div>
            <div className="mt-2 flex items-center gap-3">
              <Globe2 className="h-6 w-6 text-cyan-300" />
              <span className="break-all text-2xl font-semibold">{result.ip}</span>
            </div>
          </div>
          <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
            {result.version} · PUBLIC
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Country" value={result.country} />
          <Stat label="Region" value={result.region} />
          <Stat label="City" value={result.city} />
          <Stat label="Postal" value={result.postal} />
        </div>
      </Panel>

      <div className="grid gap-5 md:grid-cols-2">
        <InfoCard
          icon={MapPin}
          title="Location"
          rows={[
            ["Continent", result.continent],
            ["Country code", result.country_code],
            ["Region code", result.region_code],
            ["Capital", result.capital],
            ["Calling code", result.calling_code],
            ["Latitude", result.latitude],
            ["Longitude", result.longitude],
            ["EU", result.is_eu == null ? null : result.is_eu ? "Yes" : "No"],
            ["Borders", result.borders],
          ]}
        />

        <InfoCard
          icon={Network}
          title="Network / ASN"
          rows={[
            ["ASN", result.connection?.asn],
            ["Organization", result.connection?.organization],
            ["ISP", result.connection?.isp],
            ["Network domain", result.connection?.domain],
            ["Reverse DNS", result.public_exposure?.reverse_dns],
          ]}
        />

        <InfoCard
          icon={Activity}
          title="Timezone"
          rows={[
            ["Timezone", result.timezone?.id],
            ["Abbreviation", result.timezone?.abbr],
            ["UTC offset", result.timezone?.utc],
            ["DST", result.timezone?.is_dst == null ? null : result.timezone.is_dst ? "Active" : "Inactive"],
            ["Current local time", result.timezone?.current_time],
          ]}
        />

        <InfoCard
          icon={Lock}
          title="Public exposure"
          rows={[
            ["Public", result.is_public ? "Yes" : "No"],
            ["Reverse DNS", result.public_exposure?.reverse_dns],
            ["ASN", result.public_exposure?.asn],
            ["Organization", result.public_exposure?.organization],
            ["ISP", result.public_exposure?.isp],
            ["Network domain", result.public_exposure?.network_domain],
          ]}
        />
      </div>

      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-cyan-300" />
          <h2 className="font-semibold">Network identity snapshot</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Flag" value={result.flag?.emoji} />
          <Stat label="ASN" value={result.connection?.asn} />
          <Stat label="ISP" value={result.connection?.isp} />
          <Stat label="Organization" value={result.connection?.organization} />
          <Stat label="Network domain" value={result.connection?.domain} />
          <Stat label="Reverse DNS" value={result.public_exposure?.reverse_dns} />
        </div>
      </Panel>

      <Panel className="p-5">
        <h2 className="font-semibold">Geographic coordinates</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Stat label="Latitude" value={result.latitude} />
          <Stat label="Longitude" value={result.longitude} />
        </div>
        <div className="mt-4 rounded-xl border border-white/5 bg-white/[.025] p-4 text-xs leading-5 text-slate-500">
          IP geolocation is approximate. It identifies the network's likely
          geographic area, not the exact physical address of a device.
        </div>
      </Panel>

      <Panel className="p-5">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-slate-200">
            Raw lookup data
          </summary>
          <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-black/30 p-4 text-xs leading-5 text-slate-500">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </Panel>

      <Panel className="p-5">
        <h2 className="font-semibold">Public usage / ownership view</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          This section shows the public network ownership signals available
          from the lookup: reverse DNS, ASN, organization, ISP and network
          domain. It does not claim to enumerate every website using the IP.
        </p>
        <div className="mt-4 rounded-xl border border-white/5 bg-white/[.025] p-4">
          <div className="text-xs text-slate-600">Lookup source</div>
          <div className="mt-1 text-sm text-slate-300">{result.source}</div>
        </div>
      </Panel>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-slate-400">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Stat({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.025] p-4">
      <div className="text-xs text-slate-600">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-200">
        {value == null || value === "" ? "Not available" : String(value)}
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  rows,
}: {
  icon: typeof Network;
  title: string;
  rows: Array<[string, string | number | boolean | null | undefined]>;
}) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-cyan-300" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="mt-4 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 rounded-lg bg-white/[.025] px-3 py-2 text-sm">
            <span className="text-slate-600">{label}</span>
            <span className="max-w-[65%] break-words text-right text-slate-300">
              {value == null || value === "" ? "Not available" : String(value)}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
