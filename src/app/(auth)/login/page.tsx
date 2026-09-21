"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button, Input, Panel } from "@/components/ui";

export default function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await signIn(id, pw);
      router.replace("/dashboard");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-bg flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/20">
            <Shield className="h-6 w-6 text-cyan-300" />
          </div>
          <div>
            <div className="text-xl font-semibold">Cyber Guard</div>
            <div className="text-xs text-slate-500">Security Operations Platform</div>
          </div>
        </div>

        <Panel className="p-7 glow">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to access your security console.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block text-sm text-slate-400">
              User ID
              <Input
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="mt-2"
                placeholder="e.g. analyst01"
                required
              />
            </label>

            <label className="block text-sm text-slate-400">
              Password
              <div className="relative mt-2">
                <Input
                  type={show ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Minimum 12 characters"
                  className="pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-cyan-300 hover:text-cyan-200">
                Forgot password?
              </Link>
            </div>

            {err && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
                {err}
              </div>
            )}

            <Button className="w-full" loading={loading}>
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link href="/register" className="text-cyan-300 hover:text-cyan-200">
              Create account
            </Link>
          </div>
        </Panel>
      </div>
    </main>
  );
}
