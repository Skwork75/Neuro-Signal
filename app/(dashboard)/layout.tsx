import { redirect } from "next/navigation";
import { BarChart3, Brain, History, LayoutDashboard, PenLine, Search } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";
import { logout } from "@/app/(dashboard)/actions";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "there";

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/journal/new", label: "New Entry" },
    { href: "/history", label: "History" },
    { href: "/patterns", label: "Patterns" },
    { href: "/ask", label: "Ask journal" },
    { href: "/counselor", label: "Counselor" },
  ];

  return (
    <div className="app-grid flex min-h-full bg-[#f5f6f0] dark:bg-emerald-950">
      <aside className="hidden w-72 flex-col border-r border-emerald-900/70 bg-[#15373a] text-white md:flex">
        <Link href="/dashboard" className="px-6 py-7"><BrandLogo nameClassName="text-white [&>span]:text-emerald-300" /></Link>
        <div className="mx-5 mb-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xs leading-5 text-emerald-100/70">
          <span className="font-semibold text-emerald-800 dark:text-emerald-300">A quiet space</span><br />to notice what you need.
        </div>
        <SidebarNav navItems={navItems} />
        <div className="mt-auto space-y-3 p-4">
          <p className="rounded-xl border border-amber-700/40 bg-amber-950/30 px-3 py-2 text-[11px] leading-4 text-amber-100/80">
            Not a medical diagnosis tool. If you are in immediate danger, call your local emergency number.
          </p>
          <form action={logout}>
            <Button type="submit" variant="outline" className="w-full">
              Log out
            </Button>
          </form>
        </div>
      </aside>
      <main className="min-h-full flex-1 overflow-y-auto p-4 pb-24 sm:p-6 md:pb-6">
        <div className="mx-auto mb-6 flex max-w-5xl items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-700/80">
          <p className="text-sm text-slate-600 dark:text-emerald-100/70">
            Welcome back, <span className="font-semibold text-slate-900 dark:text-emerald-50">{displayName}</span>
          </p>
          <ThemeToggle />
        </div>
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white/95 px-1 py-2 backdrop-blur dark:border-emerald-900/80 dark:bg-emerald-950/95 md:hidden">
        {[
          { href: "/dashboard", label: "Home", icon: LayoutDashboard },
          { href: "/journal/new", label: "Write", icon: PenLine },
          { href: "/history", label: "History", icon: History },
          { href: "/patterns", label: "Patterns", icon: BarChart3 },
          { href: "/ask", label: "Ask", icon: Search },
          { href: "/counselor", label: "Support", icon: Brain },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-emerald-100/70 dark:hover:bg-emerald-900/70 dark:hover:text-emerald-200">
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
