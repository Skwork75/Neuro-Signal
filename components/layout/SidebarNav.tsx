"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, Brain, History, LayoutDashboard, PenLine, Search } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
};

export function SidebarNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();
  const icons = [LayoutDashboard, PenLine, History, BarChart3, Search, Brain];

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item, index) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = icons[index] ?? LayoutDashboard;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-emerald-100/70 dark:hover:bg-emerald-900/70 dark:hover:text-emerald-200",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
