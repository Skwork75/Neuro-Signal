import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  showName?: boolean;
  nameClassName?: string;
};

export function BrandLogo({ className, markClassName, showName = true, nameClassName }: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className={cn("flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-sm shadow-indigo-200", markClassName)}>
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className="size-6">
          <path d="M4 16h4l2.6-6 4.1 13L18 7l2.4 9H28" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="18" cy="7" r="2.3" fill="currentColor" />
          <circle cx="10.6" cy="10" r="1.65" fill="currentColor" opacity=".86" />
          <circle cx="20.4" cy="16" r="1.65" fill="currentColor" opacity=".86" />
        </svg>
      </span>
      {showName ? <span className={cn("font-semibold tracking-tight text-slate-950", nameClassName)}>Neuro<span className="text-indigo-600">Signal</span></span> : null}
    </span>
  );
}
