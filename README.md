# EDU-SKILL'S AI v4 — Hardened Student Study Platform

A lightweight, accessible, privacy-respecting student study companion and academic planner web application built with vanilla HTML/CSS/JavaScript, Firebase 10.12.0 compat SDK, Firestore sharded multi-key cloud sync, Groq AI serverless proxy, and Brevo transactional email delivery.

---

## 1. System Architecture & Tech Stack

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │                     User Browser                       │
                                    │  index.html (Navigation, Tasks, Reminders, Chat Drawer)│
                                    │  ├─ dash.html (Weekly/Monthly Progress, Exams, Metrics)│
                                    │  ├─ subs.html (Subjects & Exams Management)            │
                                    │  ├─ time.html (Shift Timetable Generator & Scheduler)  │
                                    │  ├─ quiz.html (AI Quiz Generation & History Tracking)  │
                                    │  ├─ notes.html (Revision Notes Generator & Saved Notes)│
                                    │  ├─ insights.html (Weakness Ranking & Readiness Gauge) │
                                    │  ├─ prog.html (Subject Mastery & Charts)               │
                                    │  └─ settings.html (Account, Profile, Preferences, Reset│
                                    └───────────────────────────┬────────────────────────────┘
                                                                │
                            ┌───────────────────────────────────┼───────────────────────────────────┐
                            │                                   │                                   │
                            ▼                                   ▼                                   ▼
             ┌─────────────────────────────┐     ┌─────────────────────────────┐     ┌─────────────────────────────┐
             │    js/services/storage.js   │     │      /api/groq (Vercel)     │     │   /api/send-email (Vercel)  │
             │   js/services/sync-shards.js│     │ Serverless Secure AI Proxy  │     │   Brevo Email Dispatcher    │
             │   js/eduskill-sync.js       │     │ Identity Toolkit Token Auth │     │ Verifies Email & Resets Pass│
             │  Local Storage Namespacing  │     │ Per-user Rate Limits        │     │ Verified Recipient Lock     │
             │  Corruption Auto-Recovery   │     │ Server-side Token Ceilings  │     │ Fixed HTML Templates        │
             │              │              │     │              │              │     │              │              │
             │              ▼              │     │              ▼              │     │              ▼              │
             │   Cloud Sync: Firestore DB  │     │      Groq Cloud API         │     │         Brevo API           │
             │   users/{uid}/app/{shard}   │     │  openai/gpt-oss-120b        │     │  api.brevo.com/v3/smtp/email│
             │   (core, quiz, timetable,   │     │  Key rotation pool failover │     │                             │
             │    notes, state)            │     │                             │     │                             │
             └─────────────────────────────┘     └─────────────────────────────┘     └─────────────────────────────┘
```

- **Frontend Core**: Standard Vanilla HTML5, CSS3, ES6+ JavaScript. No bloated single-page framework.
- **Styling Architecture**: Pre-written static CSS (`css/base.css`, `css/components.css`, `css/login.css`). Completely replaced the 275 KB browser-side Tailwind JIT compiler runtime.
- **Charts**: Chart.js 4.4.2 (`chart.umd.min.js`) with flicker-free in-place updates via `chart.update('none')`.
- **Icons**: FontAwesome 6.5.2 & Lucide Icons.
- **Authentication**: Firebase Auth 10.12.0 compat (Email/Password with 8-character minimum, atomic Firestore username registration with rollback, Google OAuth popup with redirect fallback).
- **Database**: Cloud Firestore with multi-shard isolation (`users/{uid}/app/{core,quiz,timetable,notes,state}`) and strict security rules enforcing owner-only read/write access.
- **Serverless Endpoints (Vercel)**:
  - `POST /api/groq`: Serverless Node.js proxy with Firebase Identity Toolkit verification, verified-email check, per-user in-memory fixed-window rate limits (best effort per serverless instance), token ceilings per feature, overall request deadlines (24s), and server-side key pool rotation.
  - `POST /api/send-email`: Serverless transactional mailer via Brevo; recipient strictly locked to verified token email.
  - `POST /api/auth/resolve-username`: Serverless username-to-email resolver with strict IP rate limiting.

---

## 2. Environment Variables & Secret Management

All sensitive secrets are kept strictly out of client source code. Secrets are managed in `.env` for local development and in the Vercel Project Dashboard for production.

### Required Environment Variables

| Variable Name | Required Where | Description |
|---|---|---|
| `FIREBASE_API_KEY` | `.env`, `js/env.js`, Vercel | Public web app identifier for Firebase client SDK. |
| `FIREBASE_AUTH_DOMAIN` | `.env`, `js/env.js`, Vercel | Firebase Auth domain (e.g., `eduskillai-3e807.firebaseapp.com`). |
| `FIREBASE_PROJECT_ID` | `.env`, `js/env.js`, Vercel | Firebase Project ID (`eduskillai-3e807`). |
| `FIREBASE_STORAGE_BUCKET` | `.env`, `js/env.js`, Vercel | Firebase Storage Bucket. |
| `FIREBASE_MESSAGING_SENDER_ID` | `.env`, `js/env.js`, Vercel | Messaging sender identifier. |
| `FIREBASE_APP_ID` | `.env`, `js/env.js`, Vercel | Firebase Web App App ID. |
| `FIREBASE_SERVICE_ACCOUNT` | `.env`, Vercel (Optional) | Server-only Firebase admin credentials JSON for server-side username resolution. |
| `GROQ_API_KEY` | `.env`, Vercel | Private server API key for Groq Cloud LLM service. |
| `GROQ_API_KEYS` | `.env`, Vercel (Optional) | Comma-separated list of fallback Groq keys for automatic failover. |
| `GROQ_MODEL` | `.env`, Vercel (Optional) | Target model override (defaults to `openai/gpt-oss-120b`). |
| `BREVO_API_KEY` | `.env`, Vercel | Private server API key for Brevo transactional email. |
| `MAIL_FROM` / `BREVO_SENDER_EMAIL` | `.env`, Vercel | Verified sender email in your Brevo account. |
| `BREVO_SENDER_NAME` | `.env`, Vercel | Sender display name (e.g. `EDU-SKILL'S AI`). |

> **Security Rule**: Sensitive server files (`.env*`, `firestore.rules`, `lib/`, `tests/`, `docs/`) are excluded from deployment via `.vercelignore` and `.gitignore`. Only static client assets in `public/` are served (`outputDirectory: "public"`).

---

## 3. Data Architecture & Storage Contracts

### Client-Side Storage
All local state is isolated by user UID:
- Key pattern: `eduskill_user_{uid}__{storeKey}`.
- Handled by `js/services/storage.js`: provides corrupted JSON auto-backup to `corrupt_{key}` without crashing.
- Supported stores: `subjects`, `exams`, `tasks_YYYY-MM-DD`, `timetable`, `cached_timetable`, `timetable_preferences`, `quizHistory`, `notes`, `weakTopics`, `examReadiness`, `tasksCompletedTotal`, `eduskill_reminders`.

### Sharded Cloud Synchronization
State is divided into discrete Firestore shard documents under `users/{uid}/app/{shard}`:
- `core`: Subjects and exams.
- `quiz`: Quiz history records (capped to latest 50).
- `timetable`: Generated study schedules and preferences.
- `notes`: Saved smart revision notes (capped to 30).
- `state`: Daily task lists (`tasks_YYYY-MM-DD`), progress metrics, reminders, and UI state.
- **Concurrency & Merge**: Each shard tracks its own `updatedAt` timestamp with a newer-wins merge strategy, avoiding large document limits and race conditions.

---

## 4. Key Algorithms & Heuristics

1. **ID-Based Task-Topic Linking (`js/domain/tasks.js`)**:
   - Tasks reference subject and topic IDs directly: `ref: { sid, tid }`.
   - Eliminates fuzzy string regex guessing. Marking a topic done updates exactly matching linked tasks.

2. **Stable Timetable Signature (`js/domain/timetable-sig.js`)**:
   - Timetable regeneration hashes only structural schedule constraints (exam dates, subject counts, user study hours).
   - Ticking off tasks or changing completed topic flags does not cause unwanted timetable regenerations.

3. **Study Timetable Allocation (`time.html`)**:
   - Parses study hours as `parseFloat` (supports `0.5`, `1.0`, `1.5`, `2.0` hours).
   - Allocates morning and evening shift slots within exact minute budgets.
   - Prioritizes subjects by exam urgency (`daysLeft <= 7`), difficulty weight, and incomplete topics.

4. **Exam Readiness Estimator (`insights.html`)**:
   - Scoped strictly to each subject's own topics and quiz records (no cross-subject contamination).
   - Weighted formulation: `topicCompletionPct * 0.6 + quizScorePct * 0.4`, with proximity modifiers for exams within 3 or 7 days.
   - If an exam has no topics and no quiz history, displays "Insufficient data" rather than synthesizing a fake score.

5. **Non-Blocking UI & Dialog System (`js/lib/ui.js`)**:
   - Replaced all 12 blocking native `alert()` and `confirm()` calls with accessible `EduUI.confirmDialog` and `EduUI.toast`.
   - Includes full focus trapping, `aria-modal="true"`, `aria-live="polite"`, and `Escape` key listeners.

---

## 5. Local Setup & Testing

### Prerequisites
- Node.js `>= 20.0.0` (for built-in test runner)

### Running Checks and Unit Tests
```bash
# 1. Run sanity check (syntax parse of all HTML inline scripts, JS files, and secret scanner)
npm run check

# 2. Run unit test suite (44 tests covering security, auth, rate-limiting, data sync, dates, tasks, and UI)
npm test

# 3. Run full verification gate
npm run verify
```

### Running Locally
```bash
# Start a local static file server
python -m http.server 8080
# or
npx serve . -l 8080
```
Navigate to `http://localhost:8080/loginform.html`.

---

## 6. Vercel Deployment Instructions

1. Push your repository to GitHub.
2. In the Vercel Dashboard, select **Add New Project** and import the repository.
3. Under **Settings -> Environment Variables**, configure:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_API_KEY`
   - `GROQ_API_KEY`
   - `BREVO_API_KEY`
   - `BREVO_SENDER_EMAIL`
   - `BREVO_SENDER_NAME`
4. Deploy. `vercel.json` will automatically configure serverless functions under `/api/`, enforce security headers, and rewrite `/` to `/index.html`.
