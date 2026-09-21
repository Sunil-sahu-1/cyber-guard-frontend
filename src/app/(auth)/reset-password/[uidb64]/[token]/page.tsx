"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Shield } from "lucide-react";
import { confirmPasswordReset } from "@/services/api/authApi";
import { Button, Input, Panel } from "@/components/ui";

export default function ResetPassword() {
  const params = useParams<{ uidb64: string; token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password.length < 12) {
      setError("Password must contain at least 12 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(params.uidb64, params.token, password, confirm);
      router.replace("/login?reset=success");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to reset password.");
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
          <h1 className="text-2xl font-semibold">Set new password</h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Choose a strong password with at least 12 characters.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm text-slate-400">
              New password
              <div className="relative mt-2">
                <Input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-11"
                  placeholder="Minimum 12 characters"
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

            <label className="block text-sm text-slate-400">
              Confirm new password
              <div className="relative mt-2">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pr-11"
                  placeholder="Re-enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm leading-6 text-red-200">
                {error}
              </div>
            )}

            <Button className="w-full" loading={loading}>
              Reset password
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
