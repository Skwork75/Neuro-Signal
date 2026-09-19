import Link from "next/link";
import { ArrowRight, Brain, HeartHandshake, LockKeyhole, MessageCircleHeart, TrendingUp } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Reflect with context",
    description: "Turn a moment of writing into a clearer view of what you may need next.",
    icon: Brain,
  },
  {
    title: "Notice patterns",
    description: "See recurring themes and gentle signals across the days you choose to record.",
    icon: TrendingUp,
  },
  {
    title: "Private by design",
    description: "Your writing belongs to your account, protected with Supabase authentication and row-level security.",
    icon: LockKeyhole,
  },
  {
    title: "Human-feeling support",
    description: "Use guided questions and practical next steps when you need help thinking something through.",
    icon: HeartHandshake,
  },
];

export default function Home() {
  return (
    <div className="min-h-full bg-[#f5f6f0] dark:bg-[#10252a]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" aria-label="NeuroSignal home"><BrandLogo /></Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className={cn(buttonVariants({ size: "lg" }), "bg-emerald-700 text-white shadow-lg shadow-emerald-900/15 hover:bg-emerald-800")}
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 pb-20 lg:px-10">
        <section className="relative grid min-h-[600px] items-center overflow-hidden rounded-[2rem] border border-[#c9d8ca] bg-[#dce9dc] px-7 py-16 text-[#183b3b] shadow-[0_30px_80px_-30px_rgba(24,59,59,.3)] dark:border-emerald-900 dark:bg-[#18393b] dark:text-emerald-50 sm:px-14 sm:py-24 lg:grid-cols-[1.15fr_.85fr] lg:px-20">
          <div className="relative z-10 max-w-2xl animate-soft-rise">
            <p className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300"><MessageCircleHeart className="size-4" />A kinder way to check in</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.06] sm:text-7xl">A quieter place to understand yourself.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#31595a] dark:text-emerald-100/75">
              Write what is real. NeuroSignal helps you notice emotional patterns, explore what might be underneath, and choose a next step that feels possible.
            </p>
            <div className="mt-8 flex flex-col items-center justify-start gap-3 sm:flex-row">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 bg-[#d76b50] px-5 text-white shadow-lg shadow-[#8e3e2f]/20 hover:bg-[#c55d45]",
                )}
              >
                Get Started
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 border-emerald-700 px-5 text-[#183b3b] hover:bg-white/40 dark:border-emerald-700 dark:text-white dark:hover:bg-emerald-900")}
              >
                Sign In
              </Link>
            </div>
          </div>
          <div className="relative hidden min-h-[360px] lg:block animate-soft-rise stagger-2">
            <div className="absolute right-8 top-8 h-72 w-72 rounded-[40%] bg-[#f2c7a9]/80 shadow-2xl shadow-[#a65d45]/15 rotate-6" />
            <div className="absolute right-28 top-24 h-64 w-52 rounded-[45%] bg-[#2d6661] shadow-2xl shadow-emerald-950/20 -rotate-12" />
            <div className="absolute right-20 top-16 flex h-48 w-48 items-center justify-center rounded-full border border-white/40 bg-white/20 backdrop-blur-sm animate-soft-pulse"><HeartHandshake className="size-16 text-white/90" strokeWidth={1.25} /></div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={feature.title} className={cn("animate-soft-rise border-[#d9dfd6] bg-white/65 shadow-none transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/10 dark:border-emerald-900/80 dark:bg-emerald-950/40", `stagger-${index + 1}`)}>
              <CardHeader>
                <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#f2c7a9] text-[#8e3e2f] dark:bg-amber-900/50 dark:text-amber-200">
                  <feature.icon className="size-5" />
                </span>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </section>

        <div className="mt-12 flex items-start gap-3 rounded-2xl border border-[#e6cdb9] bg-[#fff8ee] px-5 py-4 text-sm text-[#765044] dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100/80">
          <HeartHandshake className="mt-0.5 size-4 shrink-0 text-[#c2674d]" />
          NeuroSignal is not a medical diagnosis tool. If you may be in immediate danger,
          call your local emergency number or contact a licensed professional.
        </div>
      </main>
    </div>
  );
}
