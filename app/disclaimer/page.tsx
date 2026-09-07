import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DisclaimerPage() {
  return (
    <main className="flex min-h-full items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-xl rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-amber-700">
          <AlertTriangle className="size-6" />
          <h1 className="text-2xl font-semibold text-slate-900">Important disclaimer</h1>
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-600">
          NeuroSignal is a journaling and reflection tool, not a medical or diagnostic
          tool. Its analysis is not medical advice and does not replace a qualified
          healthcare professional.
        </p>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          If you may hurt yourself or someone else, call <strong>14416</strong> or text
          <strong>HOME</strong> to <strong>741741</strong>. If you are
          in immediate danger, contact local emergency services.
        </p>
        <Link href="/" className={cn(buttonVariants(), "mt-6 bg-indigo-600 text-white hover:bg-indigo-500")}>
          Go back
        </Link>
      </section>
    </main>
  );
}
