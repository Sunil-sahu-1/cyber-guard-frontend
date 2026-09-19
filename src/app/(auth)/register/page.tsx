"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button, Input, Panel } from "@/components/ui";

type RegisterForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  user_id: string;
  password: string;
  password_confirm: string;
};

const initialForm: RegisterForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  user_id: "",
  password: "",
  password_confirm: "",
};

function getApiError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Registration failed. Please try again.";
  }

  const message = error.message || "";

  try {
    const parsed: unknown = JSON.parse(message);

    if (
      parsed &&
      typeof parsed === "object" &&
      "detail" in parsed &&
      typeof parsed.detail === "string"
    ) {
      return parsed.detail;
    }

    if (parsed && typeof parsed === "object") {
      const messages: string[] = [];

      Object.entries(parsed).forEach(([field, value]) => {
        const text = Array.isArray(value)
          ? value.join(", ")
          : String(value);

        messages.push(field + ": " + text);
      });

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }
  } catch {
    // The API returned a normal text error.
  }

  return message || "Registration failed. Please try again.";
}

export default function Register() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(
    field: keyof RegisterForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (form.password.length < 12) {
      setError("Password must contain at least 12 characters.");
      return;
    }

    if (form.password !== form.password_confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await signUp(form);
      router.replace("/login?registered=1");
    } catch (error) {
      setError(getApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-bg flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-300/20">
            <Shield className="h-6 w-6 text-cyan-300" />
          </div>

          <div>
            <div className="text-xl font-semibold">
              Create Cyber Guard account
            </div>
            <div className="text-sm text-slate-500">
              Register using the backend authentication service.
            </div>
          </div>
        </div>

        <Panel className="p-7 glow">
          <form
            onSubmit={submit}
            className="grid gap-4 sm:grid-cols-2"
          >
            <label className="text-sm text-slate-400">
              First name
              <Input
                className="mt-2"
                value={form.first_name}
                onChange={(event) =>
                  updateField("first_name", event.target.value)
                }
                placeholder="First name"
                required
              />
            </label>

            <label className="text-sm text-slate-400">
              Last name
              <Input
                className="mt-2"
                value={form.last_name}
                onChange={(event) =>
                  updateField("last_name", event.target.value)
                }
                placeholder="Last name"
                required
              />
            </label>

            <label className="text-sm text-slate-400">
              Email
              <Input
                className="mt-2"
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="text-sm text-slate-400">
              Phone number
              <Input
                className="mt-2"
                type="tel"
                value={form.phone_number}
                onChange={(event) =>
                  updateField("phone_number", event.target.value)
                }
                placeholder="+919876543210"
                required
              />
            </label>

            <label className="text-sm text-slate-400 sm:col-span-2">
              User ID
              <Input
                className="mt-2"
                value={form.user_id}
                onChange={(event) =>
                  updateField("user_id", event.target.value)
                }
                placeholder="e.g. analyst01"
                required
              />
              <span className="mt-1 block text-xs text-slate-600">
                4–50 characters: letters, numbers, ., _ and -
              </span>
            </label>

            <label className="text-sm text-slate-400">
              Password
              <div className="relative mt-2">
                <Input
                  className="pr-11"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  placeholder="Minimum 12 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>

            <label className="text-sm text-slate-400">
              Confirm password
              <div className="relative mt-2">
                <Input
                  className="pr-11"
                  type={showConfirm ? "text" : "password"}
                  value={form.password_confirm}
                  onChange={(event) =>
                    updateField(
                      "password_confirm",
                      event.target.value
                    )
                  }
                  placeholder="Re-enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-label={
                    showConfirm
                      ? "Hide confirmation password"
                      : "Show confirmation password"
                  }
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <div className="sm:col-span-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="sm:col-span-2 flex items-center justify-between gap-3 pt-2">
              <Link
                href="/login"
                className="text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft className="mr-1 inline h-4 w-4" />
                Back to login
              </Link>

              <Button
                type="submit"
                loading={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </main>
  );
}
