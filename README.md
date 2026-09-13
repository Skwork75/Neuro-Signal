# NeuroSignal

> A calm, private space to understand what your words may be telling you.

NeuroSignal is an AI-assisted journaling and reflection app for noticing emotional patterns over time. Users can write private entries, add quick check-ins, explore recurring themes, search their own journal, and use a guided counselor flow to turn a difficult moment into a small next step.

NeuroSignal is a reflective wellbeing tool. It is **not** a medical diagnosis tool, therapist, emergency service, or replacement for qualified professional care.

## What You Can Do

- **Write and reflect** with a focused journal editor and optional context such as energy, events, needs, and actions.
- **Understand each entry** through emotion, stress, support signals, themes, recommendations, and a follow-up reflection question.
- **Check in quickly** with mood, energy, and a short note when a full entry feels like too much.
- **See patterns** across recent entries, including recurring themes and average energy.
- **Ask your journal** to find relevant moments from your own writing.
- **Talk it through** in the counselor section with structured questions, optional extra context, and selected journal entries.
- **Protect personal data** with Supabase authentication and row-level security.
- **Switch themes** between a light interface and a green, low-glare dark mode.

## Product Flow

```text
Write or check in
            |
            v
Private Supabase storage
            |
            v
Emotion and theme analysis
            |
            +--> Entry insights and recommendations
            +--> Patterns across entries
            +--> Journal search
            +--> Guided counselor reflection
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router and React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 and custom design tokens |
| UI | Base UI, Lucide icons, class-variance-authority |
| Authentication and database | Supabase Auth and PostgreSQL |
| Emotion inference | Hugging Face Inference API |
| Validation | Zod |
| Deployment target | Vercel |

## Application Structure

```text
app/
   (auth)/                 Sign-in and sign-up screens
   (dashboard)/            Authenticated product experience
      counselor/            Guided counselor-style reflection
      dashboard/            Overview, check-ins, and recent entries
      history/              Journal history
      journal/new/          Entry creation and analysis
      patterns/             Recurring themes and energy patterns
      ask/                  Search across the user's journal
   api/
      counselor/            Counselor reflection endpoint
      journals/             Entry creation endpoint
      analyze/              Entry analysis endpoint
      journal-search/       Private journal retrieval endpoint
      checkins/             Quick check-in endpoint
components/               Shared UI and feature components
lib/
   analyze.ts              Emotion, stress, theme, and safety analysis
   auth.ts                 Current-user helpers
   journal.ts              Journal mapping and display helpers
   supabase/               Browser and server Supabase clients
supabase/schema.sql       Database tables, indexes, triggers, and RLS policies
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- A Supabase project
- A Hugging Face access token for model-backed emotion inference

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
HUGGINGFACE_API_KEY=your-hugging-face-token

# Optional. The default model is shown here.
HUGGINGFACE_EMOTION_MODEL=j-hartmann/emotion-english-distilroberta-base
```

Do not commit `.env.local` or expose private tokens in client-side code.

### 3. Set up the database

Open the Supabase SQL editor and run [`supabase/schema.sql`](supabase/schema.sql). It creates or upgrades:

- `journal_entries`
- `analysis_results`
- `quick_checkins`
- indexes and update triggers
- row-level security policies scoped to the authenticated user

### 4. Configure authentication

Add these redirect URLs in Supabase Authentication settings:

```text
http://localhost:3000/api/auth/callback
https://your-production-domain.com/api/auth/callback
```

Enable the sign-in providers you want to support. Email/password authentication is supported by the current UI.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server locally |

## API Overview

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/journals` | `POST` | Save an authenticated journal entry |
| `/api/analyze` | `POST` | Analyze and persist one owned journal entry |
| `/api/checkins` | `POST` | Save a quick mood and energy check-in |
| `/api/journal-search` | `POST` | Search the authenticated user's entries |
| `/api/counselor` | `POST` | Combine counselor questions with optional journal context |

Every user-facing data endpoint verifies the current Supabase user before reading or writing personal content.

## Analysis Behavior

When `HUGGINGFACE_API_KEY` is available, NeuroSignal uses the configured text-classification model. If the model request is unavailable, the app falls back to a limited local keyword-based analysis so journal writing can still complete.

The analysis can identify:

- dominant emotion: happy, sad, angry, fear, or neutral
- stress level and support-risk signal
- recurring themes such as work, relationships, rest, health, and change
- practical recommendations and reflection questions
- crisis-language indicators that trigger immediate-support guidance

These signals are deliberately framed as reflection aids, not clinical conclusions.

## Deploying to Vercel

1. Import the repository into Vercel.
2. Keep the detected framework as **Next.js**.
3. Add the same environment variables from `.env.local` to the Vercel project settings.
4. Run the Supabase schema and add the production auth callback URL before testing sign-in.
5. Deploy with the default build command: `npm run build`.

After deployment, verify sign-up, sign-in, journal creation, analysis, counselor reflection, and dark mode using the production URL.

## Privacy and Safety

Journal content and analysis records are protected by Supabase row-level security. The counselor flow only accepts journal entry IDs belonging to the authenticated user.

NeuroSignal does not diagnose mental health conditions. It also does not treat ordinary sadness or stress as an emergency. If someone may act on thoughts of self-harm or harm to others, contact local emergency services immediately or find confidential regional support at [Find A Helpline](https://findahelpline.com/).

## License

This project is private and does not currently declare an open-source license.
