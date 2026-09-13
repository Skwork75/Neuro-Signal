"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium text-indigo-600">NeuroSignal</p>
      <h1 className="text-2xl font-semibold text-slate-900">We could not load this page</h1>
      <p className="text-sm text-slate-600">Your journal entries are safe. Please try again.</p>
      <div className="flex gap-3">
        <Button type="button" onClick={reset}>Try again</Button>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>Go to dashboard</Link>
      </div>
    </main>
  );
}
