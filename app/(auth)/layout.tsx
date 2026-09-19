import { HeartHandshake, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-[#15373a] px-4 py-10 dark:bg-[#0c2025]">
      <div className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-[#d76b50]/10 blur-3xl" />
      <div className="relative w-full max-w-md animate-soft-rise">
        <div className="mb-7 flex flex-col items-center text-center text-white">
          <BrandLogo markClassName="size-12 rounded-2xl" nameClassName="text-2xl text-white [&>span]:text-emerald-200" className="mb-3 flex-col gap-2" />
          <p className="mt-1 max-w-xs text-sm leading-6 text-emerald-100/70">
            A private space to write, reflect, and find a little more room to breathe.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-white/10 bg-[#fbfaf5] p-7 shadow-2xl shadow-black/20 dark:bg-[#18373a]">{children}</div>
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-emerald-100/55"><ShieldCheck className="size-3.5" />Private by design <span className="text-emerald-300/40">/</span> <HeartHandshake className="size-3.5" />Human-feeling support</div>
      </div>
    </div>
  );
}
