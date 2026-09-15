"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, errorMessage } from "@/lib/api";
import { Button, Field, Input, PasswordInput } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);
    if (!email.trim() || !password) {
      setFieldError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      const signedIn = await login(email.trim(), password);
      toast.success(`Welcome back, ${signedIn.name}`);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFieldError("Invalid email or password.");
        toast.error("Sign in failed", "The email or password you entered is incorrect.");
      } else if (err instanceof ApiError && err.status === 400) {
        setFieldError("Please enter a valid email address and password.");
        toast.error("Sign in failed", errorMessage(err));
      } else {
        toast.error("Cannot sign in right now", errorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-brand-900 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center text-white">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-900/40">
            <TrendingUp className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Vertex Management</h1>
          <p className="mt-1 text-sm text-slate-300">Students, fees and teacher commissions</p>
        </div>

        <form onSubmit={onSubmit} noValidate className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
          <p className="mb-6 text-sm text-slate-500">Use your admin or teacher account.</p>

          <div className="space-y-4">
            <Field label="Email">
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@vertex.com"
                aria-invalid={!!fieldError}
              />
            </Field>
            <Field label="Password" error={fieldError}>
              <PasswordInput
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                aria-invalid={!!fieldError}
              />
            </Field>
          </div>

          <Button type="submit" className="mt-6 w-full" loading={submitting}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
