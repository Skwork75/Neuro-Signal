import Link from "next/link";
import { ArrowRight, Brain, Heart, Shield, Sparkles, TrendingUp } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "AI Analysis",
    description: "Turn each journal entry into emotion and stress insights in seconds.",
    icon: Brain,
  },
  {
    title: "Emotional Trends",
    description: "See how your feelings shift over time so patterns are easier to notice.",
    icon: TrendingUp,
  },
  {
    title: "Private & Secure",
    description: "Your writing stays in your account. Analysis is only used to support you.",
    icon: Shield,
  },
  {
    title: "Personalized Tips",
    description: "Get gentle, practical suggestions based on what you actually wrote.",
    icon: Heart,
  },
];

export default function Home() {
  return (
    <div className="min-h-full bg-[#f5f8f6]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
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
            className={cn(buttonVariants({ size: "lg" }), "bg-indigo-600 text-white hover:bg-indigo-500")}
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-16">
        <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-emerald-950 px-6 py-16 text-white shadow-2xl shadow-emerald-950/15 sm:px-14 sm:py-24">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-200"><Sparkles className="size-4" />A private space to notice</p>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">Make sense of the days you are living.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-emerald-50/75">
              Write freely. NeuroSignal helps you spot emotional patterns, understand what you may need, and choose one small next step.
            </p>
            <div className="mt-8 flex flex-col items-center justify-start gap-3 sm:flex-row">
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 bg-amber-300 px-5 text-emerald-950 hover:bg-amber-200",
                )}
              >
                Get Started
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 border-emerald-700 px-5 text-white hover:bg-emerald-900")}
              >
                Sign In
              </Link>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-20 -bottom-40 size-[34rem] rounded-full border-[70px] border-emerald-800/60" />
          <div className="pointer-events-none absolute top-12 right-20 hidden h-28 w-28 rounded-full border border-amber-200/40 sm:block" />
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-white/80 shadow-sm">
              <CardHeader>
                <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <feature.icon className="size-5" />
                </span>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </section>

        <div className="mt-12 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-center text-sm text-amber-900">
          NeuroSignal is not a medical diagnosis tool. If you may be in immediate danger,
          call your local emergency number or contact a licensed professional.
        </div>
      </main>
    </div>
  );
}
