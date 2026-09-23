"use client";

import type { ReactNode } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={"glass rounded-2xl " + className}>{children}</section>;
}

export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-1 text-[10px] uppercase tracking-[.22em] text-[var(--accent)]">Cyber Guard / Command Center</div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] md:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({
  children,
  loading = false,
  variant = "primary",
  ...props
}: {
  children: ReactNode;
  loading?: boolean;
  variant?: "primary" | "ghost" | "danger";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls =
    variant === "primary"
      ? "bg-cyan-500/10 text-[var(--accent)] ring-1 ring-cyan-500/20 hover:bg-cyan-500/15"
      : variant === "danger"
        ? "bg-red-500/10 text-red-600 ring-1 ring-red-500/20 hover:bg-red-500/15"
        : "bg-[var(--panel-soft)] text-[var(--text)] ring-1 ring-[var(--border)] hover:bg-white/10";
  return (
    <button
      {...props}
      className={
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 " +
        cls +
        " " +
        (props.className ?? "")
      }
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
      <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-slate-600" />
      {text}
    </div>
  );
}

export function RiskBadge({ value }: { value: string }) {
  const v = value.toUpperCase();
  const cls =
    v === "CRITICAL"
      ? "bg-red-400/15 text-red-300 ring-red-300/20"
      : v === "HIGH"
        ? "bg-orange-400/15 text-orange-300 ring-orange-300/20"
        : v === "MEDIUM"
          ? "bg-amber-400/15 text-amber-300 ring-amber-300/20"
          : v === "LOW"
            ? "bg-yellow-400/10 text-yellow-200 ring-yellow-300/15"
            : "bg-emerald-400/10 text-emerald-300 ring-emerald-300/15";
  return <span className={"rounded-full px-2.5 py-1 text-xs font-semibold ring-1 " + cls}>{v}</span>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-xl border border-[var(--border)] bg-[var(--panel-soft)] px-3.5 py-3 text-sm text-[var(--text)] outline-none placeholder:text-slate-600 focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/10 " +
        (props.className ?? "")
      }
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        "min-h-36 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-soft)] px-3.5 py-3 text-sm text-[var(--text)] outline-none placeholder:text-slate-600 focus:border-cyan-300/40 " +
        (props.className ?? "")
      }
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        "w-full rounded-xl border border-[var(--border)] bg-[var(--panel-solid)] px-3.5 py-3 text-sm text-[var(--text)] outline-none focus:border-cyan-300/40 " +
        (props.className ?? "")
      }
    />
  );
}
