import Link from "next/link";
import { ArrowRight, Brain, Heart, Shield, TrendingUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "AI Analysis",
    description: "Turn each journal entry into emotion, stress, and risk insights in seconds.",
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
    <div className="min-h-full bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Brain className="size-5" />
          </span>
          NeuroSignal
        </Link>
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
        <section className="mx-auto max-w-3xl py-16 text-center sm:py-24">
          <p className="mb-4 text-sm font-medium tracking-wide text-indigo-600 uppercase">
            Private mental health journaling
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
            Understand Your Emotional Health
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Write freely. NeuroSignal reads the emotional signal in your words and
            helps you notice stress, risk, and what you need next — without replacing
            professional care.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 bg-indigo-600 px-5 text-white hover:bg-indigo-500",
              )}
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5")}
            >
              Sign In
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          NeuroSignal is not a medical diagnosis tool. If you are in crisis, call 14416,
          or contact a licensed professional.
        </div>
      </main>
    </div>
  );
}
