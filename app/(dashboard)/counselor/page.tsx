import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import CounselorWorkspace from "@/components/counselor/counselor-workspace";

export default async function CounselorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("journal_entries")
    .select("id, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return <CounselorWorkspace entries={(data ?? []) as { id: string; content: string; created_at: string }[]} />;
}