import { redirect } from "next/navigation";
import { Brain } from "lucide-react";
import { logout } from "@/app/(dashboard)/actions";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/journal/new", label: "New Entry" },
    { href: "/history", label: "History" },
  ];

  return (
    <div className="flex min-h-full">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Brain className="size-5" />
          </span>
          <span className="font-semibold text-slate-900">NeuroSignal</span>
        </div>
        <SidebarNav navItems={navItems} />
        <div className="mt-auto space-y-3 p-4">
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-900">
            Not a medical diagnosis tool. If you are in crisis, call 14416.
          </p>
          <form action={logout}>
            <Button type="submit" variant="outline" className="w-full">
              Log out
            </Button>
          </form>
        </div>
      </aside>
      <main className="min-h-full flex-1 overflow-y-auto bg-slate-50 p-6">{children}</main>
    </div>
  );
}
