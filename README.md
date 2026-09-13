# NeuroSignal

A private, AI-assisted journaling app built with Next.js, Supabase, and Hugging Face inference. It helps people reflect on emotional language; it is not a diagnostic or crisis service.

## Architecture

- **Next.js App Router** serves the UI, authenticated dashboard, and server-side API routes.
- **Supabase Auth + Postgres** stores entries and one analysis per entry. Row-level security ensures each user can only read and change their own data.
- **`/api/journals`** validates and saves an entry.
- **`/api/analyze`** verifies ownership, runs the server-only analysis pipeline, and upserts its result.
- **Hugging Face** uses `j-hartmann/emotion-english-distilroberta-base` by default. If it is unavailable, the app uses a limited local keyword fallback so writing never fails.

## Setup

1. Install dependencies with `npm install`.
2. Create `.env.local` with:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   HUGGINGFACE_API_KEY=your-hugging-face-token
   # Optional: override the default emotion-classification model
   HUGGINGFACE_EMOTION_MODEL=j-hartmann/emotion-english-distilroberta-base
   ```

3. Run [`supabase/schema.sql`](supabase/schema.sql) once in the Supabase SQL editor.
4. Configure Supabase Auth redirect URLs for `http://localhost:3000/api/auth/callback` and the matching production callback URL.
5. Start the app with `npm run dev`.

## Safety notes

The app does not infer imminent danger from ordinary sadness or stress. Crisis language is handled separately with an immediate-support message. If someone may act on thoughts of self-harm, contact local emergency services or find regional support through [Find A Helpline](https://findahelpline.com/).
