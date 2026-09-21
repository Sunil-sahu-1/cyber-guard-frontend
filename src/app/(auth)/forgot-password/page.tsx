"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Shield } from "lucide-react";
import { requestPasswordReset } from "@/services/api/authApi";
import { Button, Input, Panel } from "@/components/ui";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const data = await requestPasswordReset(email.trim());
      setMessage(data.message);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to process the request.");
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
            <div className="text-xs text-slate-500">Password Recovery</div>
          </div>
        </div>

        <Panel className="p-7 glow">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-400/10">
            <Mail className="h-5 w-5 text-cyan-300" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold">Forgot password?</h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Enter your registered email address. If an account exists, we will send a password reset
            link.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm text-slate-400">
              Email address
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
                placeholder="you@example.com"
                required
              />
            </label>

            {message && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm leading-6 text-emerald-200">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <Button className="w-full" loading={loading}>
              Send reset link
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-cyan-300 hover:text-cyan-200">
              <ArrowLeft className="mr-1 inline h-4 w-4" />
              Back to login
            </Link>
          </div>
        </Panel>
      </div>
    </main>
  );
}
