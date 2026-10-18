# EDU-SKILLS - Audit & Engineering Handoff Report

> **Prepared for Claude Code Review / Debugging Session**  
> **Repository:** `projectworkteam-cse/Edu-Skills`  
> **Latest Git Commit:** `c009f48` (`phase 4: V3-LOW-14, release gate`)  
> **Branch:** `main` (synced with remote)  
> **Status:** All 4 Audit Phases Completed; Unit, Smoke, and E2E Test Suites 100% Green.

---

## 1. Executive Summary

This codebase is a full-stack student study planner and AI assistant:
- **Frontend:** Vanilla HTML/CSS/JavaScript in `public/` (served as static assets via Vercel).
- **Backend:** Node.js Vercel Serverless Functions in `api/` (proxies AI completions via Groq and resolves usernames via Firebase Admin).
- **Database & Auth:** Firebase Authentication (Email/Password + Google OAuth) and Cloud Firestore (client-side shard sync).
- **Engineering Discipline:** Built strictly under **Ponytail** principles (writing the minimal code that completely solves the problem, prioritizing native platform/browser standards, zero added runtime dependencies, and documenting shortcuts with `// ponytail:`).

---

## 2. Complete Phase Implementation Log

### Phase 1: Demo Blockers & Critical Data Safety (`4d29c4a`)
- **`V3-HIGH-01` (Login Form Styling Reset):**
  - Added button and input baseline resets in `public/css/base.css` and `public/css/login.css`.
  - Added `whitespace-nowrap` to social login separators in `public/loginform.html` to eliminate raw browser-default gray buttons and misaligned text.
- **`V3-HIGH-02` (CI / Clean Checkout Gate):**
  - Updated `.github/workflows/ci.yml` to execute `npm ci`, install Playwright dependencies, and run full test suites.
  - Added `"e2e": "python scripts/e2e.py"` to `package.json`.
- **`V3-HIGH-03` (Silent Cloud Save / Sync Failures):**
  - Added `#syncPill` in `public/index.html` header, dynamically listening to `eduskill-sync-status` events (`Saved`, `Saving...`, `Offline - kept on this device`, `Not saved - tap to retry`).
  - Added a `beforeunload` guard warning users if tabs are closed while dirty/saving.
  - Exported `window.eduskillSyncNow` from `public/js/eduskill-sync.js` for manual retry.
- **`V3-HIGH-04` (Safe Account Deletion):**
  - In `public/settings.html` (`deleteUserAccount`), required password re-authentication via `fb.auth.EmailAuthProvider.credential` before deleting cloud data.
  - Added unit test in `tests/delete-account.test.js` verifying that an invalid password aborts before any Firestore batch deletion occurs.
- **`V3-MED-06` (Smart Notes Empty Input Guard):**
  - In `public/notes.html` (`generateNotes`), guarded against empty input (`!material && !subject`) with honest, actionable error messages instead of uncaught property exceptions.

---

### Phase 2: Feature Completeness & CDN Resilience (`8b06d0f`)
- **`V3-MED-07` (Decoupled Task & Topic Completion):**
  - Decoupled task checkboxes from subject topic completion in `public/index.html`.
  - Rule enforced: checking a task tracks daily study effort; topic completion is strictly awarded by passing the subject quiz. Added unit test in `tests/tasks.test.js`.
- **`V3-MED-08` (Single Task Deletion):**
  - Added individual task deletion via `deleteTask(id)` and an accessible delete button (`.task-del`, `aria-label="Delete task: ..."`) on each task row in `public/index.html`. Added unit test in `tests/tasks.test.js`.
- **`V3-MED-09` (CDN-Resilient Navigation):**
  - Guarded navigation against Font Awesome CDN blockages: `#menuBtn` and `.icon-btn` given minimum dimensions (`40px x 40px`) and `.menu-btn::after { content: "Menu"; }`.
  - Permanently docked the sidebar on desktop screens (`@media (min-width: 1024px)`).
  - Provided fallback text for the floating AI assistant button (`.ai-fab`). Tested and verified in Chromium with `cdnjs.cloudflare.com` blocked.
- **`V3-MED-11` (Editable Topics in Subjects Modal):**
  - In `public/subs.html`, added topic addition, renaming, and deletion in the subject edit modal.
  - Generates stable IDs (`t_<uuid>`), prevents duplicate topic names, and automatically prunes orphaned tasks referencing deleted topics. Added unit test in `tests/subjects-topics.test.js`.
- **`V3-MED-12` (Honest Weakness Analysis Reporting):**
  - In `public/insights.html` (`detectWeaknesses`), integrated `EduAI.parseAiJson` to honestly display `"AI tips unavailable. Showing built-in suggestions."` on empty or invalid AI responses rather than claiming full AI analysis completed. Added unit test in `tests/insights.test.js`.

---

### Phase 3: Hardening, Config Consolidation & CSP (`3c3cc0a`)
- **`V3-LOW-15` (Username Validation Alignment):**
  - Aligned username regex in `api/auth/resolve-username.js` to `/^[a-z0-9_]{3,20}$/`, strictly matching client-side sign-up (`public/loginform.html`) and `firestore.rules` (disallowing dots).
  - Added test cases for usernames with dots (`'a.b'`, `'user.name'`) to `tests/resolve-username.test.js`.
- **`V3-LOW-13` (Consolidated Firebase Config & Retired Legacy Profile):**
  - Extracted public Firebase configuration to `public/js/firebase-config.js` (`window.EDU_FIREBASE_CONFIG`).
  - Refactored `public/js/env.js`, `public/js/eduskill-sync.js`, and `public/loginform.html` to reference `EDU_FIREBASE_CONFIG`. `grep -rn AIza public` matches only one file.
  - In `api/groq.js`: deleted the temporary `legacy` profile from `FEATURES`. Rejection with HTTP 400 (`bad_feature`) is now enforced on missing or unknown features. Updated `tests/groq.test.js`.
- **`V3-MED-10` (Enforce CSP & Subresource Security):**
  - In `vercel.json`: promoted `Content-Security-Policy-Report-Only` to enforced `Content-Security-Policy`.
  - Added `crossorigin="anonymous"` and `referrerpolicy="no-referrer"` to all third-party CDN scripts and stylesheets across all HTML files.

---

### Phase 4: Polish & Release Gate (`c009f48`)
- **`V3-LOW-14` (Visual Polish):**
  - **Timetable Box Border:** In `public/time.html`, replaced the 2px solid black print border with `border: 1px solid var(--card-border); border-radius: 10px;`.
  - **Mobile Settings Tabs:** In `public/settings.html`, added `flex-wrap: wrap;` and `flex: 1 1 auto;` to `.settings-nav` to prevent tab clipping on mobile viewports (e.g. 390px/375px).
  - **Badge Background Highlights:** In `public/prog.html`, ensured `.badge-info`, `h5`, and `p` have `background: transparent;` to eliminate stray highlight boxes.
- **Release Gate Validation:**
  - Ran syntax, secret, contract, unit, smoke, and end-to-end tests. All pass with 0 errors.

---

## 3. Test & Verification Suite

You can reproduce all verification checks locally:

```bash
# 1. Syntax, secret scanning, and JSON integrity
npm run check

# 2. Schema and contract checks
npm run contracts

# 3. Unit test suite (64 tests across 15 suites)
npm test

# 4. Full verify gate
npm run verify

# 5. Playwright headless browser smoke test across all 8 pages
python scripts/smoke.py . seeded

# 6. Playwright end-to-end feature driver test (28 user flows)
python scripts/e2e.py
```

### Current Verification Metrics:
- **`node scripts/check.mjs`:** `OK: all inline scripts parse, no secret patterns, JSON valid`
- **`node scripts/contract-check.mjs`:** `contract-check: 0 error(s), 0 warning(s)`
- **`npm test`:** `64 passed, 0 failed, 0 warnings (duration: ~1.1s)`
- **`scripts/smoke.py`:** `GATE PASS: smoke test passed with 0 errors.`
- **`scripts/e2e.py`:** `28 / 28 PASS, page errors: []`

---

## 4. Architecture & Key Files Map

```
edu-skills/
├── api/
│   ├── groq.js                  # Authenticated, quota-limited Groq proxy (rate limits, verified JWT)
│   ├── send-email.js            # Transactional email helper
│   └── auth/
│       └── resolve-username.js  # Server-side username -> email lookup via Firebase Admin
├── lib/
│   ├── auth.js                  # verifyFirebaseUser (validates Firebase ID tokens)
│   ├── rate-limit.js            # In-memory sliding window rate limiter
│   └── admin.js                 # Firebase Admin initialization
├── public/
│   ├── index.html               # Main application shell (sidebar, navigation, task list, sync status pill)
│   ├── loginform.html           # Authentication portal (Email/Password, Google OAuth, Username resolution)
│   ├── dash.html                # Dashboard view (metrics, upcoming exams, progress chart)
│   ├── subs.html                # Subjects & Exams management with AI topic generation & editing
│   ├── time.html                # Timetable view & Smart Reschedule engine
│   ├── quiz.html                # Interactive quiz generator & evaluator
│   ├── notes.html               # Smart Notes generator
│   ├── insights.html            # Study Insights & Weakness detection
│   ├── prog.html                # Progress metrics & milestone badges
│   ├── settings.html            # Profile, notification reminders, re-auth account deletion
│   ├── css/
│   │   ├── base.css             # Design tokens, CSS variables, resets
│   │   ├── components.css       # Shared component styles
│   │   └── login.css            # Auth portal styles
│   └── js/
│       ├── firebase-config.js   # Consolidated public Firebase client configuration
│       ├── env.js               # Client environment configuration
│       ├── eduskill-sync.js     # Firestore cloud sync & offline fallback adapter
│       ├── domain/              # Pure logic (dates.js, tasks.js, migrate.js, timetable-sig.js)
│       ├── services/            # Client services (ai-client.js, storage.js, sync-shards.js)
│       └── lib/                 # Shared UI helpers (ui.js)
├── tests/                       # Unit tests using node:test
├── scripts/
│   ├── check.mjs                # Pre-commit syntax & secret linter
│   ├── contract-check.mjs       # Contract & schema validator
│   ├── smoke.py                 # Multi-page browser smoke suite
│   └── e2e.py                   # Full end-to-end user simulation suite
├── firestore.rules              # Firestore security rules
└── vercel.json                  # Vercel deployment config, security headers & CSP
```

---

## 5. Owner-Only Production Setup (Non-Code)

If deploying to a live Vercel environment, ensure the following configuration in the Vercel Dashboard:

1. **`GROQ_API_KEYS`:**
   - One or more Groq API keys separated by commas (supports automatic round-robin key rotation and fallback).
2. **`FIREBASE_SERVICE_ACCOUNT`:**
   - Must be the **complete JSON private key object** from Google Cloud / Firebase Console (not an email address).
   - Generated from: Firebase Console → Project Settings → Service Accounts → Generate new private key.
3. **`FIREBASE_API_KEY`:**
   - Web API Key used by backend auth token validation (`lib/auth.js`).
4. **Deploy `firestore.rules`:**
   - Deploy `firestore.rules` to Cloud Firestore via Firebase CLI (`firebase deploy --only firestore:rules`) or by copying to the Firebase Console Rules editor.
