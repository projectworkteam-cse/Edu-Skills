# EDU-SKILL'S AI v4 — Student Study Platform

A lightweight, accessible, privacy-respecting student study companion and exam revision platform built with vanilla HTML/CSS/JavaScript, Firebase 10.12.0 compat SDK, Firestore cloud synchronization, Groq AI API, and Brevo transactional email delivery.

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
             │       js/eduskill-sync.js      │     │      /api/groq (Vercel)     │     │   /api/send-email (Vercel)  │
             │   Local Storage Namespacing │     │ Serverless Secure AI Proxy  │     │   Brevo Email Dispatcher    │
             │   eduskill_user_{uid}__{key}│     │ Validates Bearer ID Token   │     │ Verifies Email & Resets Pass│
             │              │              │     │ Rate limits & sanitizes     │     │ Sends branded email links   │
             │              ▼              │     │              │              │     │              │              │
             │   Cloud Sync: Firestore DB  │     │              ▼              │     │              ▼              │
             │   users/{uid}/app/state     │     │      Groq Cloud API         │     │         Brevo API           │
             │   users/{uid} (profile)     │     │  openai/gpt-oss-120b        │     │  api.brevo.com/v3/smtp/email│
             └─────────────────────────────┘     └─────────────────────────────┘     └─────────────────────────────┘
```

- **Frontend Core**: Standard Vanilla HTML5, CSS3, ES6+ JavaScript. No bloated heavy single-page application framework.
- **Charts**: Chart.js pinned to version `4.4.2` (`chart.umd.min.js`).
- **Icons**: FontAwesome 6.5.2 & Lucide Icons.
- **Authentication**: Firebase Auth 10.12.0 compat (Email/Password, Google OAuth with popup-then-redirect fallback).
- **Database**: Cloud Firestore with strict per-user ownership rules (`users/{uid}`).
- **Serverless Endpoints (Vercel)**:
  - `POST /api/groq`: Serverless Node.js proxy with token authentication, token bounding, and model allow-listing.
  - `POST /api/send-email`: Serverless Brevo transactional email sender for verification and password reset links.

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
| `GROQ_API_KEY` | `.env`, Vercel | Private server API key for Groq Cloud LLM service. |
| `BREVO_API_KEY` | `.env`, Vercel | Private server API key for Brevo transactional email. |
| `BREVO_SENDER_EMAIL` | `.env`, Vercel | Verified sender email in your Brevo account. |
| `BREVO_SENDER_NAME` | `.env`, Vercel | Sender display name (e.g. `EDU-SKILL AI`). |

> **Security Rule**: The `vercel.json` configuration blocks all incoming HTTP requests to `/.env` with `404 Not Found`.

---

## 3. Data Architecture & Storage Contracts

### Client-Side Storage
All local state is isolated by user UID:
- Key pattern: `eduskill_user_{uid}__{storeKey}`
- Unauthenticated / guest state uses `eduskill_guest__{storeKey}`.
- Supported stores: `subjects`, `exams`, `tasks_YYYY-MM-DD`, `timetable`, `cached_timetable`, `timetable_preferences`, `quizHistory`, `savedNotes`, `weakTopics`, `examReadiness`, `tasksCompletedTotal`, `eduskill_reminders`.

### Cloud Synchronization
- Profile document: `users/{uid}` (name, email, username, course, studentId, updatedAt).
- App state document: `users/{uid}/app/state` (contains single `{ data, updatedAt }` map).
- Username registry: `usernames/{cleanUsername}` (`{ uid, email, createdAt }`) to enforce globally unique, lower-case usernames `/^[a-zA-Z0-9_]{3,20}$/`.
- Concurrency & Quota: Debounced 1,500ms sync queue using `{ merge: true }`. Local quota warning at 4 MB.

---

## 4. Heuristics & Algorithm Specifications

1. **Study Timetable Allocation (`time.html`)**:
   - Parses study hours as `parseFloat` (supports `0.5`, `1.5`, `2.0` hours).
   - Generates morning and evening shift slots within exact minute budgets (`hours * 60`).
   - Distributes subjects based on exam urgency (`daysLeft <= 7`), difficulty weight (`Hard` = 3, `Medium` = 2, `Easy` = 1), and topic completion status.

2. **Exam Readiness Estimator (`insights.html`)**:
   - Readiness is scoped strictly to each subject's own topics and quiz records (no cross-subject contamination).
   - Weighted formulation: `topicCompletionPct * 0.6 + quizScorePct * 0.4`, with proximity modifiers for exams within 3 or 7 days.
   - If an exam has no topics and no quiz history, the system displays **"Insufficient data"** instead of synthesizing a fake score.
   - Explicitly documented in the UI as a heuristic study estimate, not an exam guarantee.

3. **Weak Area Priority (`insights.html`)**:
   - Evaluates topics across 4 dimensions: Quiz performance error (`1 - bestScore/100`), Incompletion penalty (`1.0` if not done, `0.15` if done), Exam urgency (`1 - daysLeft/30`), and Subject difficulty multiplier.
   - Fallback suggestions provided even when offline or without AI keys.

4. **Quiz Answer Validator & Passing Mark (`quiz.html`)**:
   - Requires exactly 4 non-empty, distinct string options and an integer answer in `0..3`.
   - Never fabricates answers or pads missing choices with dashes.
   - Passing threshold standardized at `pct >= PASS_MARK` (50% is a pass).

---

## 5. Known Operational Constraints

1. **Reminders & Notifications**:
   - Browser notification scheduling (`index.html`) relies on in-tab JavaScript timers (`setInterval`).
   - Reminders only trigger while the web application is open in an active or background browser tab. Background OS-level push notifications without an open tab require a Service Worker and Push Server (planned roadmap feature).

2. **Retention Limits**:
   - **Quiz History**: Retains the latest 50 quiz sessions (`quizHistory.slice(0, 50)`).
   - **Smart Notes**: Retains up to 30 saved revision notes. When saving note 31, the user is prompted for confirmation before the oldest note is replaced.
   - **AI Chat**: Bounded to 1,000 characters per message and memory is capped to the 10 most recent messages.

---

## 6. Functional Requirements (FR-001..FR-046) Traceability Matrix

| Req ID | Requirement Description | Implementation Status | Verification & Evidence |
|---|---|---|---|
| **FR-001** | User authentication via email/password & Google | **Implemented & Tested** | `loginform.html`, Brevo email verification, Google OAuth popup/redirect. |
| **FR-002** | Auth state persistence & session gate | **Implemented & Tested** | `js/eduskill-sync.js`, `onAuthStateChanged`, unverified user gated out. |
| **FR-003** | Route protection for private pages | **Implemented & Tested** | `js/eduskill-sync.js`, unauthenticated redirect to `loginform.html`. |
| **FR-004** | Clean user logout & cache preservation | **Implemented & Tested** | `js/eduskill-sync.js`, flushes pending queue, unsets active session. |
| **FR-005** | User-friendly auth error mapping | **Implemented & Tested** | `formatAuthError` in `loginform.html`, generic credentials error (no user enumeration). |
| **FR-006** | Dashboard study overview layout | **Implemented & Tested** | `dash.html`, metric cards, responsive layout, chart views. |
| **FR-007** | Per-user Firestore data isolation | **Implemented & Tested** | `firestore.rules`, UID namespacing in `js/eduskill-sync.js`. |
| **FR-008** | Upcoming exams list & chronological sort | **Implemented & Tested** | `dash.html`, `index.html`, `subs.html` sorted by exam date. |
| **FR-009** | Daily task completion metric | **Implemented & Tested** | Derived from daily `tasks_YYYY-MM-DD` records in `dash.html` & `prog.html`. |
| **FR-010** | Weekly & Monthly progress analytics | **Implemented & Tested** | `dash.html` timeframe filter (`week` vs `month`), honest future null display. |
| **FR-011** | Subject creation with difficulty & topics | **Implemented & Tested** | `subs.html`, AI topic generator and manual topic entry. |
| **FR-012** | Subject viewing & progress bars | **Implemented & Tested** | `subs.html`, `prog.html`, dynamically calculated topic mastery. |
| **FR-013** | Subject editing | **Partial / Roadmap** | Subjects can be created, viewed, deleted; full in-place name editing is roadmap. |
| **FR-014** | Subject deletion with confirmation & task cleanup | **Implemented & Tested** | `subs.html` `deleteSubject()`, cleans orphaned tasks with confirmation. |
| **FR-015** | Firestore security rules for subject ownership | **Implemented & Tested** | `firestore.rules` owner-only `request.auth.uid == userId`. |
| **FR-016** | Exam scheduling with subject association | **Implemented & Tested** | `subs.html` `addExam()`, links exam to registered subjects. |
| **FR-017** | Calendar date validation for exams | **Implemented & Tested** | `subs.html`, validates calendar dates; warns on past exam dates. |
| **FR-018** | Exam countdown calculation | **Implemented & Tested** | Dynamic `daysUntil` from calendar midnight today in all views. |
| **FR-019** | Urgent exam notification badge filtering | **Implemented & Tested** | `index.html` filters badge to `daysDiff >= 0 && daysDiff <= 2` (past exams excluded). |
| **FR-020** | Local calendar midnight policy | **Implemented & Tested** | Standardized local date keys `tasks_YYYY-MM-DD` across all modules. |
| **FR-021** | Manual & AI task generation | **Implemented & Tested** | `index.html`, manual task row + Groq AI daily task generator. |
| **FR-022** | Manual task checkbox completion | **Implemented & Tested** | `index.html`, `toggleTask()` enables interactive checkboxes for manual tasks. |
| **FR-023** | Cloud task synchronization | **Implemented & Tested** | `js/eduskill-sync.js` syncs daily task keys to `users/{uid}/app/state`. |
| **FR-024** | Timetable auto-generation with shift constraints | **Implemented & Tested** | `time.html`, `buildShiftSlots`, handles fractional study hours without rollover. |
| **FR-025** | Task provenance tracking (AI vs Manual) | **Implemented & Tested** | `index.html` tags `source: 'manual' \| 'ai'`, displays `.badge-manual` and `.badge-ai`. |
| **FR-026** | Smart revision notes generation & styles | **Implemented & Tested** | `notes.html`, Concise, Detailed, Flashcards, and Exam-focused modes. |
| **FR-027** | Notes storage & cloud synchronization | **Implemented & Tested** | `notes.html` stores notes; synced via `js/eduskill-sync.js`. |
| **FR-028** | Strict quiz answer validation | **Implemented & Tested** | `quiz.html`, rejects malformed answers, requiring 4 distinct options and answer 0..3. |
| **FR-029** | Quiz scoring & pass threshold | **Implemented & Tested** | `quiz.html`, passing mark standardized to `pct >= PASS_MARK` (50%). |
| **FR-030** | Topic completion on quiz pass | **Implemented & Tested** | `quiz.html`, marks topic and related daily tasks done upon scoring >= 50%. |
| **FR-031** | Progress tracking by subject & task count | **Implemented & Tested** | `prog.html`, Chart.js horizontal bars and weekly summary. |
| **FR-032** | Lifetime completion counter & session history | **Implemented & Tested** | `tasksCompletedTotal` counter and explicit 50-session quiz retention. |
| **FR-033** | Progress charts with accurate datasets | **Implemented & Tested** | `dash.html`, `prog.html`, pinned Chart.js 4.4.2, no synthesized fake history. |
| **FR-034** | Empty data state guards across all views | **Implemented & Tested** | Empty states handled in `dash.html`, `subs.html`, `quiz.html`, `prog.html`. |
| **FR-035** | Current topic benchmark vs historical dates | **Implemented & Tested** | `dash.html`, clearly labeled as benchmark; future days set to `null`. |
| **FR-036** | Groq AI integration with server proxy | **Implemented & Tested** | `api/groq.js` serverless function, timeout protection in `js/env.js`. |
| **FR-037** | Timetable dual-key persistence & loading | **Implemented & Tested** | `time.html` dual-writes `cached_timetable` and `timetable`; `index.html` reads with fallback. |
| **FR-038** | AI error boundaries & timeout handling | **Implemented & Tested** | 45-second abort controller, empty response rejection, friendly UI error messages. |
| **FR-039** | AI JSON schema parser with markdown stripping | **Implemented & Tested** | `parseJSONObject` & `parseQuestions` in `notes.html`, `quiz.html`, `subs.html`. |
| **FR-040** | Secure API key handling (no secrets in code) | **Implemented & Tested** | Private keys in `.env` / Vercel env; `vercel.json` blocks `/.env`. |
| **FR-041** | Task appending & schedule idempotency | **Implemented & Tested** | `time.html` `buildInitialized` guard; `index.html` appends unique tasks. |
| **FR-042** | Groq fallback key rotation & rate limit handling | **Implemented & Tested** | Bounded rotation in `js/env.js` and server-side failover in `/api/groq.js`. |
| **FR-043** | User profile & reminder preferences | **Implemented & Tested** | `settings.html` edits profile and notification preferences. |
| **FR-044** | Settings persistence to Cloud Firestore | **Implemented & Tested** | Updates `users/{uid}` and `users/{uid}/app/state` via `js/eduskill-sync.js`. |
| **FR-045** | Local vs Cloud sync status distinction | **Implemented & Tested** | Profile sync and state status clearly signaled in `settings.html`. |
| **FR-046** | Workspace reset with confirmation & purge | **Implemented & Tested** | `settings.html` confirms before reset; purges local namespace and cloud state. |

---

## 7. Local Setup & Testing

1. **Clone or Extract Repository**:
   ```bash
   cd Eduskills
   ```
2. **Configure Environment (`.env`)**:
   Ensure `.env` has your valid `GROQ_API_KEY` and `BREVO_API_KEY`.
3. **Run Local Server**:
   ```bash
   python -m http.server 8080
   ```
4. **Open in Browser**:
   Navigate to `http://localhost:8080/loginform.html`.

---

## 8. Vercel Deployment Instructions

1. Push code to a private GitHub repository.
2. In Vercel, import the repository.
3. In **Settings -> Environment Variables**, add:
   - `GROQ_API_KEY`: Your Groq Cloud API Key.
   - `BREVO_API_KEY`: Your Brevo API Key.
   - `BREVO_SENDER_EMAIL`: Your verified Brevo sender email.
   - `BREVO_SENDER_NAME`: `EDU-SKILL AI`
4. Deploy. The `vercel.json` will route `/api/groq` and `/api/send-email` to serverless execution and secure `/.env`.
