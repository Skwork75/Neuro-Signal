import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  EMOTION_EMOJI,
  formatEntryDate,
  levelBadgeClass,
  mapJournal,
  type JournalRow,
} from "@/lib/journal";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("journal_entries")
    .select("*, analysis_results(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const entries = ((data ?? []) as JournalRow[]).map(mapJournal);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">History</h1>
        <p className="text-sm text-slate-500">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      {entries.length === 0 ? (
        <Card className="items-center py-12 text-center">
          <CardContent className="space-y-3">
            <p className="text-slate-600">You have not written any entries yet.</p>
            <Link
              href="/journal/new"
              className={cn(buttonVariants(), "bg-indigo-600 text-white hover:bg-indigo-500")}
            >
              Write first entry
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="bg-white">
              <CardContent className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl">
                    {entry.analysis ? EMOTION_EMOJI[entry.analysis.dominantEmotion] : "📝"}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {formatEntryDate(entry.createdAt)}
                  </span>
                  {entry.analysis ? (
                    <>
                      <Badge className={levelBadgeClass(entry.analysis.stressLevel)}>
                        Stress {entry.analysis.stressLevel}
                      </Badge>
                      <Badge className={levelBadgeClass(entry.analysis.riskLevel)}>
                        Risk {entry.analysis.riskLevel}
                      </Badge>
                    </>
                  ) : null}
                </div>
                <p className="line-clamp-3 text-sm text-slate-600">{entry.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
