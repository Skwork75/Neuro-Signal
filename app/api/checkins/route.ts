import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const checkInSchema = z.object({
  mood: z.enum(["Great", "Good", "Okay", "Low", "Rough"]),
  energy: z.number().int().min(1).max(5),
  note: z.string().trim().max(280).optional(),
});

export async function POST(request: Request) {
  try {
    const body = checkInSchema.safeParse(await request.json());
    if (!body.success) return NextResponse.json({ error: "Choose a mood and energy level." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    const { error } = await supabase.from("quick_checkins").insert({ user_id: user.id, ...body.data });
    if (error) {
      console.error("Quick check-in insert failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      const setupError = ["42P01", "42703", "42501", "23502", "23514", "PGRST205"].includes(error.code);
      return NextResponse.json(
        {
          error: setupError
            ? "Quick check-ins are not set up for this database. Run supabase/schema.sql in Supabase, then try again."
            : process.env.NODE_ENV === "development"
              ? `Could not save your check-in: ${error.message}`
              : "Could not save your check-in. Please try again.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save your check-in." }, { status: 500 });
  }
}
