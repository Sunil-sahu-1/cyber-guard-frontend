import Link from "next/link";
export default function NotFound() {
  return (
    <main className="space-bg grid min-h-screen place-items-center p-6">
      <div className="text-center">
        <div className="text-6xl font-semibold text-cyan-300/30">404</div>
        <h1 className="mt-3 text-xl font-semibold">Signal not found</h1>
        <p className="mt-1 text-sm text-slate-500">The requested security view does not exist.</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-xl bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 ring-1 ring-cyan-300/20"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
