"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Could not connect to Supabase. Check your Supabase URL and restart the dev server.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h2 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-emerald-50">Check your email</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-emerald-100/65">
          We sent a confirmation link to <span className="font-medium text-slate-700">{email}</span>.
          Confirm your inbox, then sign in to start journaling.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Start gently</p>
      <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-emerald-50">Make space for what is real.</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-emerald-100/65">
        Create a private journal with thoughtful, AI-supported reflection.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="fullName"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="h-10 pl-8"
              placeholder="Your name"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 pl-8"
              placeholder="you@email.com"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 pr-9 pl-8"
              placeholder="At least 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#e6cdb9] bg-[#fff8ee] px-3 py-3 text-xs leading-5 text-[#765044] dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100/80">
          NeuroSignal is not a medical diagnosis tool and does not replace professional
          mental health care.
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-10 w-full bg-emerald-700 text-white hover:bg-emerald-800"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Create Account
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500 dark:text-emerald-100/60">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-emerald-700 hover:underline dark:text-emerald-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
