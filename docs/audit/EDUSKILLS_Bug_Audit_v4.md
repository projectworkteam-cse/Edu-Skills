# EDU-SKILL'S AI - Evidence-based audit v4 (verified, with dashboard)

15 October 2026 | Private technical working file for Manoj and authorized project owners | v4 supersedes v2 and v3

## Decision summary

Do not distribute the secret-bearing archive or release the current browser assets publicly. Credential exposure, the invalid Firestore catch-all rule (SEC-07) and username rule defects come first; then sync/data integrity; then feature correctness and submission-critical UX. The application is a useful vanilla-JavaScript study workspace, not a project that needs a framework rewrite. This review did not fix, push or deploy anything.

This is a bounded audit of a snapshot, not a promise that every possible defect has been found. 59 findings include confirmed defects, implementation gaps, product decisions and future risks. Every item states its evidence and limits. Do not describe all 59 as proven live failures.

## Dashboard: all 59 findings at a glance

Severity count: Critical 3, High 20, Medium 33, Low 3. Effort S/M/L is a planning estimate (S under 1 hour, M 1-3 hours, L over 3 hours of focused work), not measured. Phase matches the repair plan in the Antigravity prompt. 'Decision' means the team must choose behaviour before it is changed.

| ID | Severity | In plain words | Main files | Phase | Effort | Decision |
|---|---|---|---|---:|---|---|
| SEC-01 | Critical | AI secret keys are written inside the website files | eduskill-sync.js, env.js, time.html | 1 | L |  |
| SEC-02 | Critical | A private settings file (.env) is shipped with the project and the site tries to read it | env.js | 1 | M |  |
| SEC-07 | Critical | The database safety rules file has an error | firestore.rules | 1 | S |  |
| AUTH-02 | High | Username claim is not safe when two people sign up together, and sign-up can finish without a username | loginform.html | 1 | M |  |
| SEC-03 | High | A public list connects usernames to email addresses | firestore.rules, loginform.html | 1 | L | Yes |
| SEC-04 | High | One signed-in user can overwrite another user's username entry | firestore.rules | 1 | M | Yes |
| SEC-05 | High | AI-written topic text is placed on the page without checks | subs.html | 1 | S |  |
| AUTH-04 | High | The page trusts a saved flag instead of the real login state | dash.html, eduskill-sync.js, settings.html | 2 | M |  |
| SYNC-01 | High | Dashboard, Progress, Settings and Timetable pages have broken cloud-save code | dash.html, prog.html, settings.html | 2 | L |  |
| SYNC-02 | High | Edits made while data is loading or saving can be missed | dash.html, eduskill-sync.js | 2 | L |  |
| SYNC-03 | High | Loading cloud data can overwrite fresh edits and bring back deleted items | eduskill-sync.js | 2 | L | Yes |
| SYNC-04 | High | Several windows or devices save over one shared record | eduskill-sync.js, index.html, subs.html | 2 | L |  |
| SYNC-06 | High | The app says "saved" even when the cloud save failed | eduskill-sync.js, notes.html, settings.html | 2 | L |  |
| SYNC-07 | High | Editing the profile in Settings does not update the real account | eduskill-sync.js, settings.html | 2 | M |  |
| SYNC-08 | High | Reset can report success while cloud data remains, and may clear other users' saved data on a shared browser | eduskill-sync.js, settings.html | 2 | M | Yes |
| AI-01 | High | AI replies are checked only for being readable, not for being complete | index.html, insights.html, notes.html | 3 | L |  |
| AUTH-01 | High | No email verification | loginform.html | 3 | M | Yes |
| FUNC-01 | High | The AI task planner looks for a timetable under a name that is never saved | index.html, time.html | 3 | M |  |
| FUNC-04 | High | Tasks are matched to topics by similar words | index.html, quiz.html, subs.html | 3 | L |  |
| QUIZ-01 | High | A broken quiz answer from the AI is silently replaced with a guess | quiz.html | 3 | M |  |
| TIME-01 | High | Study hours such as half an hour become the wrong number of slots | time.html | 3 | L |  |
| DEP-01 | High | GitHub and Vercel status cannot be confirmed from the files | SETUP.txt | 5 | M |  |
| DEP-02 | High | Online settings for Vercel and Firebase are not documented | SETUP.txt, env.js, loginform.html | 5 | M |  |
| AI-02 | Medium | AI calls have no time limit and retry badly | eduskill-sync.js, env.js, time.html | 1 | S |  |
| AI-05 | Medium | A half-built option to use your own AI key | eduskill-sync.js, env.js, time.html | 1 | S |  |
| AUTH-05 | Medium | Usernames are not checked for allowed characters | loginform.html | 1 | S |  |
| SEC-06 | Medium | Profile picture link is placed on the page without checks | index.html | 1 | S |  |
| STRUCT-01 | Medium | The same code is copied across pages and has drifted apart | dash.html, eduskill-sync.js, env.js | 2 | L |  |
| SYNC-05 | Medium | All data is stored in one cloud record that has a size limit | eduskill-sync.js, index.html, notes.html | 2 | M | Yes |
| SYNC-09 | Medium | The app changes how browser storage works for the whole site | eduskill-sync.js | 2 | M |  |
| SYNC-10 | Medium | Logout leaves some old data on the browser | eduskill-sync.js, index.html, notes.html | 2 | S |  |
| AI-03 | Medium | Chat sends the whole history and personal study details every time | index.html | 3 | M |  |
| AI-04 | Medium | Student text is mixed into the AI's instructions | index.html, notes.html | 3 | M |  |
| ANALYTICS-01 | Medium | "This Month" on the dashboard chart still shows the week | dash.html | 3 | S |  |
| ANALYTICS-02 | Medium | Today's topic completion is repeated across past days | dash.html | 3 | M | Yes |
| ANALYTICS-03 | Medium | Readiness and weakness scores can be old or overstated | index.html, insights.html, time.html | 3 | M |  |
| AUTH-03 | Medium | After sign-up the page says "please sign in" though the user is already signed in | loginform.html | 3 | S |  |
| AUTH-06 | Medium | A password with a space at the start or end cannot sign in | loginform.html | 3 | S |  |
| AUTH-07 | Medium | Raw technical errors are shown and some Google and email cases are not handled | loginform.html | 3 | M |  |
| FUNC-02 | Medium | The notification count includes exams that already passed | index.html | 3 | S |  |
| FUNC-03 | Medium | Exam and reminder dates are not fully checked | index.html, subs.html | 3 | S |  |
| FUNC-05 | Medium | Some manual tasks have no way to be marked done | index.html | 3 | M | Yes |
| FUNC-06 | Medium | No label separates AI tasks from the student's own tasks | index.html | 3 | M | Yes |
| FUNC-07 | Medium | Subjects and exams cannot be edited | subs.html | 3 | L | Yes |
| FUNC-08 | Medium | Deleting a subject leaves its exams and may remove tasks without asking | subs.html | 3 | M | Yes |
| FUNC-09 | Medium | Opening the Subjects page silently deletes some older subject records | subs.html | 3 | S |  |
| NOTES-01 | Medium | Saving the 31st note silently deletes the oldest one | notes.html | 3 | S | Yes |
| QUIZ-02 | Medium | Quiz history is cut after a limit without telling the student | insights.html, quiz.html | 3 | S | Yes |
| TIME-02 | Medium | The timetable total counts slots as hours | time.html | 3 | S |  |
| TIME-03 | Medium | Timetable setup can run twice | time.html | 3 | S |  |
| TIME-04 | Medium | An old timetable can be reused after settings or the date change | time.html | 3 | M |  |
| TIME-05 | Medium | Topic names appear only when hovering | time.html | 3 | S |  |
| DOC-01 | Medium | The report describes features the code does not have | SETUP.txt, index.html, subs.html | 4 | M |  |
| STRUCT-02 | Medium | A 53 KB style file is used by no page | global.css | 4 | S |  |
| UI-01 | Medium | Pages change inside a frame with no page address | index.html | 4 | M | Yes |
| UI-03 | Medium | Dialogs and charts are not fully accessible | dash.html, index.html, time.html | 4 | L |  |
| AI-06 | Low | One AI model name is used everywhere and empty or cut-off replies count as success | index.html, insights.html, notes.html | 3 | M |  |
| AUTH-08 | Low | Signed-in users can open the login page again; username errors reveal if a username exists | loginform.html | 3 | S |  |
| UI-02 | Low | Chart library is not pinned and login styling is built in the browser | dash.html, loginform.html, prog.html | 4 | S |  |

### Fix order for the next 48 hours (highest demo and data risk first)

1. SEC-07: read the live Firestore rules, correct line 25 in the file, owner publishes. (Owner + small edit)
2. SEC-01/02: owner revokes all 3 Groq keys and creates a new one; then one server route replaces every browser AI call.
3. SYNC-01, SYNC-06: the four broken pages must save, and the UI must tell the truth when saving fails.
4. SEC-03/04: stop username-to-email exposure and overwrite (needs the alias-login decision).
5. QUIZ-01, FUNC-04: wrong quiz answers and wrong task completion are the most visible demo failures.
6. TIME-01/02: timetable hours must match the chosen hours.
7. AUTH-01, AUTH-06, DEP-02: verification, locked-out passwords and live-site login settings.

### Quick wins (small and safe)

SEC-07, AUTH-06, AUTH-03, AUTH-05, AUTH-08, TIME-02, FUNC-02, FUNC-03, FUNC-09, ANALYTICS-01, NOTES-01 warning text, SEC-06, STRUCT-02 decision.

### Decisions the team must make before those items are changed

| Decision | Items | Safe default if the team cannot decide |
|---|---|---|
| Enforce email verification for old accounts too? | AUTH-01 | New accounts must verify; old accounts get a reminder banner, not a lock-out |
| Keep username login? | SEC-03/04, AUTH-02/05/08 | Keep it, but stop public listing and make claims owner-only; plan a server lookup later |
| How do generic manual tasks get completed? | FUNC-05 | Add a normal checkbox for unlinked tasks only |
| Add edit for subjects and exams? | FUNC-07 | Edit name, difficulty and exam date only |
| What happens to exams and tasks when a subject is deleted? | FUNC-08 | Ask for confirmation, then remove linked exams; keep a count in the message |
| How many notes and quiz results to keep? | NOTES-01, QUIZ-02 | Keep the limit but warn before dropping the oldest |
| Conflict rule when two devices edit | SYNC-03/04/05 | Newest write wins per top-level key, with a visible message |
| Month chart honesty | ANALYTICS-02 | Label topic mastery as 'current', do not draw it as history |

### Change map by file (where to change)

| File | Finding IDs touching it | Count |
|---|---|---:|
| index.html | AI-01, AI-03, AI-04, AI-06, ANALYTICS-03, DOC-01, FUNC-01, FUNC-02, FUNC-03, FUNC-04, FUNC-05, FUNC-06, SEC-06, SYNC-04, SYNC-05, SYNC-10, UI-01, UI-03 | 18 |
| eduskill-sync.js | AI-02, AI-05, AUTH-04, SEC-01, STRUCT-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05, SYNC-06, SYNC-07, SYNC-08, SYNC-09, SYNC-10 | 14 |
| time.html | AI-02, AI-05, AI-06, ANALYTICS-03, FUNC-01, SEC-01, STRUCT-01, SYNC-01, TIME-01, TIME-02, TIME-03, TIME-04, TIME-05, UI-03 | 14 |
| loginform.html | AUTH-01, AUTH-02, AUTH-03, AUTH-05, AUTH-06, AUTH-07, AUTH-08, DEP-02, SEC-03, UI-02 | 10 |
| subs.html | AI-01, AI-06, DOC-01, FUNC-03, FUNC-04, FUNC-07, FUNC-08, FUNC-09, SEC-05, SYNC-04 | 10 |
| dash.html | ANALYTICS-01, ANALYTICS-02, AUTH-04, STRUCT-01, SYNC-01, SYNC-02, UI-02, UI-03 | 8 |
| notes.html | AI-01, AI-04, AI-06, NOTES-01, SYNC-05, SYNC-06, SYNC-10 | 7 |
| env.js | AI-02, AI-05, DEP-02, SEC-01, SEC-02, STRUCT-01 | 6 |
| settings.html | AUTH-04, STRUCT-01, SYNC-01, SYNC-06, SYNC-07, SYNC-08 | 6 |
| quiz.html | AI-06, FUNC-04, QUIZ-01, QUIZ-02 | 4 |
| insights.html | AI-01, AI-06, ANALYTICS-03, QUIZ-02 | 4 |
| firestore.rules | SEC-03, SEC-04, SEC-07 | 3 |
| prog.html | STRUCT-01, SYNC-01, UI-02 | 3 |
| SETUP.txt | DEP-01, DEP-02, DOC-01 | 3 |
| tailwind-browser.js | UI-02 | 1 |
| global.css | STRUCT-02 | 1 |

Shared-file edits (eduskill-sync.js, env.js) affect every page: change them once, then re-test all 10 pages.

## 0. Verification log, corrections and direct answers

### 0.1 What was re-verified in this pass

| Check | Result |
|---|---|
| Zip SHA-256 equals the hash recorded in v2 | Match: v2 audit was written for this exact archive |
| All 311 `file:line` references in v2 exist within each file's length | 311 of 311 in range |
| Seventeen findings re-read against current code (SEC-01, SEC-05, SEC-06, SYNC-01, SYNC-08, FUNC-01, FUNC-02, FUNC-09, TIME-01, TIME-02, QUIZ-01, QUIZ-02, NOTES-01, ANALYTICS-01, ANALYTICS-02, AUTH-04, plus QUIZ pass mark) | 17 of 17 confirmed as written |
| Seven new v3 findings (SEC-07, AUTH-06/07/08, DEP-02, STRUCT-02, AI-06) | Each checked against the exact lines cited |
| Every page has responsive CSS (media queries, or Tailwind classes on login) and a viewport tag | Confirmed on all 10 pages |
| Claims in the meeting notes (59 items, 53 KB unused CSS, 8 AI call sites, 100-message chat cap, 30-note cap, 50-result quiz cap) | Re-checked against code; notes updated |
| SYNC-01 re-run in an isolated DOM test: `Storage.prototype.length` read on the prototype | Throws a TypeError (browsers say Illegal invocation); confirms the four inline adapters cannot collect storage |
| Same Groq-shaped literals compared across env.js, eduskill-sync.js, time.html and .env without printing them | Exactly 3 distinct values, identical in all four places (so all 3 must be treated as exposed) |
| .env.example | Placeholders only (good) |
| Chat rendering path (renderMarkdown, user bubble, history replay) | Escapes HTML first; no XSS found in chat. Do not claim one |
| Date keys | No `toISOString().slice` pattern found, so no UTC-vs-IST date-key bug (worth knowing: IST users are not hit by the classic bug) |
| Viewport meta | Present on all 10 pages |

### 0.2 Corrections to v2

1. Output files used a `.md.txt` double extension. v3 files are plain `.md`.
2. global.css was listed as shared layout styles. It is linked by no page (STRUCT-02).
3. v2 said .env was never opened. v3 opened it redacted to confirm key identity.
4. v2 missed 7 items: SEC-07, AUTH-06, AUTH-07, AUTH-08, DEP-02, STRUCT-02, AI-06. Total is now 59.
5. v2 Appendix/Stage text that said the structure keeps global.css was updated to say it is currently unused.
6. The AI model is hard-coded at 8 call sites (not 9).
7. v2's Section 9 pricing was refreshed with additional sources (see Section 9).

### 0.3 Direct answers to your questions

**API key routing: planned or already in the project?** Planned only. The project report (section 9.6) recommends Browser -> authenticated backend endpoint -> Groq and warns that a key in frontend code can be extracted. The code does not do this: every AI call goes through `window.eduskillGroqFetch` straight from the browser to api.groq.com, rotating through 3 keys that are hard-coded in env.js, eduskill-sync.js and time.html (plus a `groq_api_key` localStorage override with no UI). The report requirement FR-040 is therefore not met. Good news for safe fixing: all 8 AI call sites use the one helper, so one server route plus one helper change switches every feature without touching the page flows.

**GitHub and Vercel: pushed and deployed?** Cannot be verified from the zip: it has no .git folder, no repository URL, no vercel.json, no package.json. A static site can deploy without those. Required from the owner: repo URL, latest commit, Vercel URL, and confirmation that env.js with keys was or was not pushed. If the repository was ever public with the keys in it, treat the keys as compromised even after deleting the file; rotate them.

**Auth feature status**

| Feature | Status in code | Verified live? | Issues |
|---|---|---|---|
| Email/password sign-up | Implemented | No | AUTH-02/03/05/06 |
| Email verification | Missing: no sendEmailVerification or emailVerified anywhere | n/a | AUTH-01 |
| Forgot password | Implemented, generic success text, good | No | DEP-02 (reset link domain) |
| Google sign-in | Implemented: popup then redirect fallback | No | AUTH-07, DEP-02 |
| Username sign-in | Implemented through public usernames collection | No | SEC-03/04, AUTH-08 |
| Logout | Implemented, flushes sync first | No | SYNC-06/10 |
| Session guard | Cached UID flag can suppress redirect | No | AUTH-04 |

**Chatbot:** Safe rendering is good. Problems are privacy/cost (AI-03), prompt boundary (AI-04), empty-answer handling and model dependence (AI-06), key exposure (SEC-01), no timeout (AI-02). History is capped at 100 messages and all of it is sent each time.

**Mobile wiring:** All pages have viewport meta; index.html has breakpoints at 1100, 768, 480 and 360 px. v2 checked 18 modified offline screenshots only. No real phone, Safari or touch test has been done. Known mobile-relevant items: TIME-05 (hover-only topics), UI-03, UI-01 (reload resets to Dashboard).

**Report completeness:** The 46 functional requirements are mapped in Section 5. None can be called certified-passing. Clearly unmet today: FR-013 (edit subjects), FR-025 (AI provenance), FR-040 (secure credentials), FR-045 (local vs cloud distinction). Weak: FR-017 (date validation), FR-028 (quiz answer validation), FR-035 (historical comparison). The report's roles, collections and roadmap are proposals and must not be presented as built.

### 0.4 Is a zero-impact fix possible?

Not guaranteed, but risk is lowered by design: keep every page URL, keep `window.eduskillGroqFetch(payload)` signature, keep the localStorage key names, change shared code once and re-test every page, work on a branch with a preview deployment, and keep a rollback commit. This is a target supported by tests, not a promise of zero regressions.

## 1. Scope, provenance and what changed from v1

- Input: eduskills.zip, root Eduskills/, 19 archive entries including .env; 10 HTML files, 3 JS files, CSS, rules and setup/config files. 18 non-.env text files reviewed. Approximately 12,630 non-minified source/config lines, plus the vendored Tailwind browser compiler. The supplied project documentation has 1,369 lines.
- Zip SHA-256: `8eb00d7480f281ed2fde11ffe8808ae5836b2277b98239b62615430ca30d8510`.
- Documentation SHA-256: `9a0a69987b01e6f70bd1e76963e6c4997b06f664ac949aed50a6b21e8bef05c7`.
- Evidence paths are relative to Eduskills/. Line numbers refer to this snapshot and must be re-found if the repository changed. Safe excerpts mask provider credentials. v2 did not open .env; v3 opened it only in redacted form to confirm it holds the same 3 Groq-shaped values found in the public JavaScript. No credential value is printed anywhere in this file.
- No calls used classmates' keys, Firebase project, accounts or deployment. No live rules exploitation or account signup/reset was performed. Credential-shaped literals in public code are exposure evidence even without proving validity.
- Safe checks: Node syntax parsing of 22 inline script blocks across all 10 pages and all 3 standalone JS files; duplicate HTML-ID inspection; extracted function assertions; Storage/Firebase mocks; 18 offline screenshots for 9 workspace views at 390x1000 and 1365x1000.
- Offline screenshots removed external/auth/cloud/API scripts, stubbed Chart.js and used dummy records. They establish local layout observations only. Blank chart areas/missing CDN icons are artifacts of this test, not reported app bugs. Login styling, real fonts/icons, live charts, auth and mobile touch behavior remain unverified.
- V1 corrections: keys are not asserted active now; Google sign-in/reset are implemented but not certified working; four page adapters fail but shell sync can sometimes mask it; 1 MiB is a capacity risk, not a measured current failure; browser Back behavior is untested; login already puts charset first; WEBISCRAP uses Neon, so it is not proof of identical Firebase experience; no zero-regression guarantee is defensible.

## 2. Ponytail interpretation

One clear coding-rules repository matched: DietrichGebert/ponytail. Read its full skill, compact AGENTS.md and README. These are project guidance requested by the user, not authority for unrelated actions or persistent behavior. Apply: understand the whole affected flow first; reuse existing helpers/platform features; fix shared root cause and every caller; prefer the smallest complete readable diff; add no dependency/abstraction without a demonstrated need; keep validation, data-loss protection, security and accessibility; leave one runnable check for non-trivial logic. The full and compact adapters differ slightly; use the full engineering principles and a plain comment stating any intentional ceiling and upgrade path.

No contradiction requires changing the user goal. Clean/scalable structure is requested, but moving all files during submission week is staged after stabilization. A few shared modules are justified by real duplication; a new framework, generic repository layer or elaborate event bus is not.

## 3. Project idea, real workflow and wiring

EDU-SKILL'S AI brings subjects, exams, daily tasks, weekly scheduling, quizzes, notes, study analytics and a chatbot into one student workspace.

1. `loginform.html` supports email/password, pre-login username lookup, registration, password reset and Google popup/redirect. It loads Firebase compat SDK 10.12.0 and public configuration via env.js. Successful login opens index.html.
2. `index.html` is the shell: sidebar navigation, avatar, tasks, exam/reminder overlays and chat. `pageViewport` loads dash.html initially and swaps 8 workspace pages (Dashboard, Subjects & Exams, Timetable, Progress, Quiz, Insights, Notes, Settings).
3. `subs.html` generates topic candidates through AI, lets students select them, creates subjects, adds exams and deletes records. It is not full editable CRUD.
4. Tasks are stored by local date under `tasks_YYYY-MM-DD`. AI task generation considers subjects/exams/weak topics, but its timetable key is mismatched. Visible study checkboxes are quiz-gated.
5. `quiz.html` generates MCQs for a subject/topic; score must be strictly greater than 50% (`PASS_MARK=50`, `pct > PASS_MARK`) to mark that topic complete and fuzzy-matched current-day tasks done. Exactly 50% fails by current design, not a discovered off-by-one bug.
6. `time.html` builds a weighted schedule locally from difficulty, exam urgency and incomplete topics. Smart Reschedule adds weakness weights; Groq explains the already-built plan. It is not an AI model directly authoring the timetable grid.
7. `notes.html` supports topic/material/style-based AI notes, copying, saving/viewing/deleting. `insights.html` computes heuristic weakness/readiness locally and asks AI for advice. `prog.html` displays completion metrics, charts, badges and a rule-based message; its label AI Progress Insight is not evidence of an API call.
8. Storage shim namespaces logical keys with UID and attempts cloud sync to `users/{uid}/app/state`. Profile is `users/{uid}`; alias lookup is `usernames/{lowercaseUsername}`. This is not the pasted doc's proposed collection-per-entity schema.
9. Groq requests currently go directly from the browser to the provider through duplicated key-fallback helpers. Browser priority is custom local key, environment defaults/list and hardcoded fallbacks. This is implemented client key selection/rotation, not secure backend routing. The supplied doc proposes an authenticated backend at lines 774-792 and security sections 12.3/16.3. No backend implementation exists in this archive.
10. No real admin/RBAC module, durable push notification service, deployment pipeline or account deletion flow is shown. Document roles are logical responsibilities and roadmap proposals, not implemented permissions.

### File coverage

| File | Reviewed responsibility | Main finding groups |
|---|---|---|
| index.html | Shell, task generation, chat, reminders, navigation | FUNC, AI, UI, SEC-06 |
| loginform.html | Registration, login, reset, Google auth, alias lookup | AUTH-01..08, SEC-03/04, DEP-02 |
| dash.html | Dashboard charts, exams, metrics, old sync | SYNC-01, ANALYTICS-01/02 |
| subs.html | Topics, subjects, exams, deletion | SEC-05, FUNC-03/04/07/08/09 |
| time.html | Timetable, preferences, smart explanation, old sync | TIME, SYNC-01, SEC-01 |
| prog.html | Today metrics, weekly completion, topic chart, badges | SYNC-01, chart/dependency risks |
| quiz.html | MCQ generation, score, history, task completion | QUIZ, FUNC-04, AI-01 |
| insights.html | Weakness/readiness formula, cache and AI advice | ANALYTICS-03, AI-01 |
| notes.html | Notes generation, render, copy/save/history | NOTES-01, AI-01 |
| settings.html | Profile/preferences/reset and old sync | SYNC-01/07/08 |
| eduskill-sync.js | Shared auth, storage shim, hydration, persistence | SYNC, AUTH-04, SEC-01 |
| env.js | Browser configuration, key rotation, .env fetch | SEC-01/02, AI-02/05 |
| firestore.rules | Owner tree, username policies, catch-all | SEC-03/04/07 |
| global.css | NOT linked by any page (dead stylesheet) | STRUCT-02 |
| tailwind-browser.js | Vendored dependency, metadata/syntax only | UI-02; minified internals not line-by-line audited |
| README_SETUP.txt | Setup/state/deployment claims | DEP-01, DOC-01 |
| .gitignore, .env.example | Ignore/template intent | Packaging is not solved by ignore alone; template should be placeholder-only |
| .env | Opened redacted in v3: Firebase config plus the same 3 Groq values as public JS | SEC-01/02 |

## 4. Finding register

Critical = release-blocking exposure. High = serious integrity/security/function problem. Medium = bounded correctness/UX/capacity gap. Low = production polish. Confidence matters more than the label: code-confirmed means visible implementation; mock-reproduced means isolated local check; risk means a plausible failure needing further validation; live deployment unknown means the archive does not establish deployed state.


### SEC-01 | Critical | Provider credentials are shipped in browser files

- **Evidence status:** Code-confirmed.
- **Where:** env.js:17-18; env.js:53-57; eduskill-sync.js:303-307; time.html:965-970.
- **What/why:** Private Groq credentials are bundled as defaults and fallbacks in public JavaScript. The redaction pass detected credential-shaped literals; values were masked before review.
- **If unresolved:** Anyone given the assets can obtain those credentials. Abuse, quota loss or account costs are possible. Current validity, ownership and billing are unknown.
- **Where/what to change and why:** The account owner must revoke exposed credentials, review usage and create replacements. Remove all browser secrets and route through one authenticated server endpoint with server-only environment variables. Never test an exposed key to decide whether rotation is needed.
- **Acceptance check:** Secret scan frontend, built assets and repository history without printing matches; owner confirms revocation and usage review. Verify browser network requests contain no provider credential.

`env.js:17-18`
```text
    GROQ_API_KEY: "[REDACTED_GROQ_KEY]",
    GROQ_API_KEYS: "[REDACTED_GROQ_KEY],[REDACTED_GROQ_KEY],[REDACTED_GROQ_KEY]"
```

`env.js:53-57`
```text
      '[REDACTED_GROQ_KEY]',
      '[REDACTED_GROQ_KEY]',
      '[REDACTED_GROQ_KEY]'
    ];
    fallbackKeys.forEach(k => {
```

`eduskill-sync.js:303-307`
```text
  }

  // 6. Resilient Multi-Key Groq AI Fetch Helper (powered by .env)
  const GROQ_KEYS = [
    '[REDACTED_GROQ_KEY]',
```

`time.html:965-970`
```text
        if (typeof window.eduskillGroqFetch !== 'function') {
            const GROQ_KEYS = [
                '[REDACTED_GROQ_KEY]',
                '[REDACTED_GROQ_KEY]',
                '[REDACTED_GROQ_KEY]'
            ];
```


Official support: Groq credential security - https://console.groq.com/docs/production-readiness/security-onboarding


### SEC-02 | Critical | Environment-file distribution and browser fetch

- **Evidence status:** Code-confirmed; deployment unknown.
- **Where:** env.js:97-122; .gitignore:1-5.
- **What/why:** Archive manifest includes .env (1,242 bytes), and the client explicitly fetches and parses .env. Its contents were not opened. Git ignore does not remove an already packaged or tracked file.
- **If unresolved:** If served by the host, the file can be downloaded. Presence in the zip alone does not prove the live site serves it.
- **Where/what to change and why:** Remove the HTTP environment loader and exclude private environment files from distributable archives and builds. Keep a placeholder-only .env.example. Store secrets only in deployment secret settings. Confirm live /.env returns no private contents with owner-authorized testing.
- **Acceptance check:** Build an archive using an allowlist, inspect its manifest and deployed response without echoing secrets.

`env.js:97-122`
```text

  // Dynamically fetch and parse .env if running via local HTTP server
  if (location.protocol.startsWith('http')) {
    fetch('.env')
[... source range continues ...]
      })
      .catch(() => {
        // Silently continue with bundled defaults if .env fetch is blocked
```

`.gitignore:1-5`
```text
# Secrets and build artefacts
.env
*.key
*.pem
node_modules/
```


### SEC-03 | High | Public username mappings expose email addresses

- **Evidence status:** Rule-file confirmed; deployed rules unknown.
- **Where:** firestore.rules:17-21; loginform.html:660-668; loginform.html:779-784.
- **What/why:** allow read: if true permits unauthenticated reads and lists. The mapping stores email and UID to support pre-login username lookup.
- **If unresolved:** If these rules are deployed, strangers can enumerate mappings and collect addresses. It does not reveal passwords or grant access to private users/{uid} data.
- **Where/what to change and why:** Separate get/list permissions and remove public email-bearing mappings. Preserve username sign-in only through a narrow, rate-limited server lookup with generic failures, or ask the team before adopting email-only sign-in. Making reads require login without a replacement breaks current username sign-in.
- **Acceptance check:** Rules emulator: unauthenticated list/read denied; approved lookup works; no email list can be harvested.

`firestore.rules:17-21`
```text
    // Public username mapping (optional alias lookup)
    match /usernames/{username} {
      allow read: if true;
      allow create, update: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }
```

`loginform.html:660-668`
```text
        // their account email through the public "usernames" lookup collection.
        let signInEmail = email;
        if (!email.includes('@')) {
          const unameSnap = await db.collection('usernames').doc(email.toLowerCase()).get();
[... source range continues ...]
          }
          signInEmail = unameSnap.data().email;
        }
```

`loginform.html:779-784`
```text
          // Save the username -> email mapping so username sign-in works.
          await unameRef.set({
            email: email,
            uid: userCredential.user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }).catch(mappingErr => {
```


Official support: Firestore ownership conditions - https://firebase.google.com/docs/firestore/security/rules-conditions


### SEC-04 | High | Existing usernames can be reassigned by another signed-in user

- **Evidence status:** Rule-file confirmed; deployed rules unknown.
- **Where:** firestore.rules:18-21.
- **What/why:** Create and update check only incoming UID against the caller, not the existing document owner. There is no delete rule for mappings.
- **If unresolved:** A caller can replace another mapping with their own UID/email if these rules are deployed, disrupting alias sign-in. This is not takeover of the victim Firebase Auth password.
- **Where/what to change and why:** Separate create/update/delete rules; require existing UID ownership on update/delete, immutable ownership and allowed-field validation. Create uniqueness atomically. Decide how username cleanup should work after account removal.
- **Acceptance check:** Emulator: user B cannot overwrite user A mapping; owner cannot change UID; malicious added fields denied; approved owner cleanup passes.

`firestore.rules:18-21`
```text
    match /usernames/{username} {
      allow read: if true;
      allow create, update: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }
```


Official support: Firestore ownership conditions - https://firebase.google.com/docs/firestore/security/rules-conditions


Official support: Firestore transactions - https://firebase.google.com/docs/firestore/manage-data/transactions


### SEC-05 | High | AI topic minutes are inserted into HTML without validation

- **Evidence status:** Code-confirmed sink; exploit not executed.
- **Where:** subs.html:576-584; subs.html:819-831.
- **What/why:** AI JSON is parsed, but minutes is not required to be a finite positive number and is inserted into innerHTML. A topic name is escaped, but this field is not.
- **If unresolved:** A malformed or hostile AI response can inject markup into the topic list; event-bearing markup could execute. The vulnerable rendering path exists, but no live exploit was attempted.
- **Where/what to change and why:** Validate an array of bounded topic objects before rendering or saving. Require nonempty topic strings and finite bounded numeric minutes; render numeric text via textContent or escaped conversion. Validate stored records too.
- **Acceptance check:** Mock minutes as a string containing an HTML tag, null, negative, Infinity and huge values; all rejected or rendered harmlessly; valid numeric topics still work.

`subs.html:576-584`
```text

                document.getElementById("topicList").innerHTML =
                    generatedTopics.map((item, index) => `
                        <label class="topic-option">
[... source range continues ...]
                                <b>${escapeHTML(item.topic)}</b><br>
                                <small>⏱ ${item.minutes} mins</small>
                            </div>
```

`subs.html:819-831`
```text
                                    >
                                    <div style="flex:1;">
                                        <b style="${item.done ? 'text-decoration: line-through; color: var(--text-sub);' : ''}">${escapeHTML(item.topic)}</b>
                                        <br>
[... source range continues ...]

                    <button class="btn-delete" onclick="deleteSubject(${subject.id})">
                        <i class="fas fa-trash-alt"></i> Delete
```


### SEC-06 | Medium | Avatar URL is interpolated into an HTML attribute

- **Evidence status:** Code-confirmed sink; exploit not executed.
- **Where:** index.html:1027-1034.
- **What/why:** userPhoto from localStorage enters a quoted src attribute through innerHTML without URL validation or attribute escaping.
- **If unresolved:** Tampered local/cloud profile data can create markup instead of a safe image. This is a client rendering issue, not proof of remote account compromise.
- **Where/what to change and why:** Create an img node, assign src as a property after allowing expected HTTPS URLs, and set static attributes without innerHTML. Keep a text-avatar fallback.
- **Acceptance check:** Quote/tag-bearing and javascript: values do not create extra nodes or handlers; ordinary Google photo URL works.

`index.html:1027-1034`
```text
                        function renderHeaderName(name) {
                            const label = name || localStorage.getItem('userName') || 'User';
                            const photo = localStorage.getItem('userPhoto');
                            const avatarEl = document.getElementById('userAvatar');
                            if (photo) {
                                avatarEl.innerHTML = `<img src="${photo}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                            } else {
                                avatarEl.textContent = label.charAt(0).toUpperCase();
```


### AUTH-01 | High | Email verification is absent

- **Evidence status:** Code-confirmed missing requested flow.
- **Where:** loginform.html:702-811.
- **What/why:** Signup creates an account but neither sends verification mail nor checks emailVerified anywhere in the authored project code. This is an explicitly requested improvement, not a proven requirement already enforced by Firebase.
- **If unresolved:** Mistyped or unowned addresses remain usable; later reset mail may be unreachable.
- **Where/what to change and why:** Add compat SDK verification sending, resend cooldown, reload/check status and clear UI. Agree enforcement for existing accounts before locking anyone out; enforce any protected backend requirement server-side, not just in the UI.
- **Acceptance check:** Test new user, resend, expired link, verified return, existing account transition and Google account behavior in a staging project.

`loginform.html:702-811`
```text
    document.getElementById('form-signup').addEventListener('submit', async function(e) {
      e.preventDefault();
      clearError('form-signup');

[... source range continues ...]
  </script>
</body>
</html>
```


Official support: Firebase user management - https://firebase.google.com/docs/auth/web/manage-users


### AUTH-02 | High | Username reservation is non-atomic and fails open

- **Evidence status:** Code-confirmed race risk.
- **Where:** loginform.html:748-785.
- **What/why:** Availability get happens before Auth creation and a later mapping set. A read failure only logs a warning and continues; mapping errors are also swallowed.
- **If unresolved:** Two signups may claim the same alias. An account can be created without a working username alias.
- **Where/what to change and why:** Use an atomic reservation in the trusted service or a transaction with compatible permissions. Keep email sign-in recovery and a visible retry for partial profile/alias failure. Do not assume a Firestore transaction can make Firebase Auth creation atomic.
- **Acceptance check:** Concurrent same-name attempts yield one owner; offline availability failure does not overwrite another mapping; partial signup is recoverable.

`loginform.html:748-785`
```text
        const unameRef = db.collection('usernames').doc(username.toLowerCase());

        // Reject an already-taken username before creating the account.
        try {
[... source range continues ...]
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }).catch(mappingErr => {
            console.warn('Username mapping save failed:', mappingErr.message);
```


Official support: Firestore transactions - https://firebase.google.com/docs/firestore/manage-data/transactions


### AUTH-03 | Medium | Signup asks an already signed-in user to sign in again

- **Evidence status:** Code-confirmed inconsistent flow.
- **Where:** loginform.html:761-763; loginform.html:787-793.
- **What/why:** Firebase account creation signs the user in, but the UI switches to Sign In and says Please sign in.
- **If unresolved:** Account creation and session state disagree, confusing first-time users.
- **Where/what to change and why:** Choose one consistent success path. Prefer a verification state then entry, or explicit sign-out if the team wants a fresh login. Preserve clear partial-failure messaging.
- **Acceptance check:** After signup the UI and auth state agree; no duplicate account request or redirect loop.

`loginform.html:761-763`
```text
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        localStorage.setItem('__eduskill_active_uid', userCredential.user.uid);
        showStatus('Account created! Saving your profile...', 'info');
```

`loginform.html:787-793`
```text
          showStatus('Account created successfully! Please sign in.', 'success');
        } catch (writeErr) {
          showStatus('Account created, but your profile could not be saved. You can still sign in and update it in Settings.', 'error');
        }

        switchTab('signin');
        document.getElementById('login-email').value = email;
```


### AUTH-04 | High | Cached UID suppresses unauthenticated redirect

- **Evidence status:** Code-confirmed UI gate flaw.
- **Where:** eduskill-sync.js:289-302; dash.html:139-147; settings.html:131-139.
- **What/why:** The shared observer redirects only if both auth user and raw cached ACTIVE UID are absent. Inline observers also read ACTIVE through their own namespacing interceptor.
- **If unresolved:** A stale UID can leave cached private data visible while cloud writes fail. Firestore owner rules still apply, so this is not a server authorization bypass.
- **Where/what to change and why:** Auth is the session authority. Clear stale session state and block private rendering on null auth after initialization. Coordinate shell/iframe auth and recovery, and never use localStorage as proof of login.
- **Acceptance check:** Sign out, expire session and tamper ACTIVE; top-level and direct pages show login and no prior private records; cloud auth failure is visible.

`eduskill-sync.js:289-302`
```text
  if (auth) {
    auth.onAuthStateChanged(user => {
      if (user) {
        hydrateCloud(user);
[... source range continues ...]
        }
      }
    });
```

`dash.html:139-147`
```text
  auth.onAuthStateChanged(user=>{
    if(user){ hydrateCloud(user); }
    else {
      const localActive = localStorage.getItem(ACTIVE);
[... source range continues ...]
        location.href='loginform.html';
      }
    }
```

`settings.html:131-139`
```text
  auth.onAuthStateChanged(user=>{
    if(user){ hydrateCloud(user); }
    else {
      const localActive = localStorage.getItem(ACTIVE);
[... source range continues ...]
        location.href='loginform.html';
      }
    }
```


### AUTH-05 | Medium | Username format is not validated

- **Evidence status:** Code-confirmed validation gap.
- **Where:** loginform.html:709-736; loginform.html:748-750.
- **What/why:** Only required fields/email/password are checked; username is used as a Firestore document path after lowercasing.
- **If unresolved:** Invalid slash/path inputs can fail unexpectedly; normalization/length conflicts can harm alias behavior.
- **Where/what to change and why:** Define a short username policy, trim and normalize consistently, reject slash/reserved/overlength names in UI and backend, and preserve existing alias compatibility.
- **Acceptance check:** Whitespace, case collisions, Unicode policy, slash and maximum length tested; no arbitrary document path accepted.

`loginform.html:709-736`
```text
      const name = document.getElementById('signup-name').value.trim();
      const username = document.getElementById('signup-username').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const course = document.querySelector('#form-signup input[placeholder="B.Tech, Diploma..."]').value.trim();
[... source range continues ...]
      if (password.length < 6) {
        showStatus('Password must be at least 6 characters long.', 'error');
        return;
```

`loginform.html:748-750`
```text
        const unameRef = db.collection('usernames').doc(username.toLowerCase());

        // Reject an already-taken username before creating the account.
```


### SYNC-01 | High | Four inline sync adapters cannot collect storage

- **Evidence status:** Mock-reproduced.
- **Where:** dash.html:43-57; prog.html:34-48; settings.html:34-48; time.html:34-48.
- **What/why:** Storage.length is a getter, not a callable method. logicalKeys also calls the patched Storage.prototype.key, which calls logicalKeys again. Fixing only length leaves recursive key access.
- **If unresolved:** Mocked Firebase writes were zero on Dashboard, Progress, Settings and Timetable, with Illegal invocation warnings. Their own sync adapters fail; shell writes may sometimes mask the failure because storage is shared.
- **Where/what to change and why:** Replace each inline adapter with the shared module after checking page order, direct-page behavior, logout and hydration differences. The shared copy captures native getter/key before patching. Do not fix four divergent copies separately.
- **Acceptance check:** T01: shared adapter writes once; each old inline copy writes zero. New shared load on each page must pass real-browser storage checks and staging reload persistence.

`dash.html:43-57`
```text
  function logicalKeys() {
    if (!uid) return [];
    const p = PREFIX + uid + '__';
    const keys=[];
[... source range continues ...]
  const nativeRemove = Storage.prototype.removeItem;
  const nativeClear = Storage.prototype.clear;
  const nativeKey = Storage.prototype.key;
```

`prog.html:34-48`
```text
  function logicalKeys() {
    if (!uid) return [];
    const p = PREFIX + uid + '__';
    const keys=[];
[... source range continues ...]
  const nativeRemove = Storage.prototype.removeItem;
  const nativeClear = Storage.prototype.clear;
  const nativeKey = Storage.prototype.key;
```

`settings.html:34-48`
```text
  function logicalKeys() {
    if (!uid) return [];
    const p = PREFIX + uid + '__';
    const keys=[];
[... source range continues ...]
  const nativeRemove = Storage.prototype.removeItem;
  const nativeClear = Storage.prototype.clear;
  const nativeKey = Storage.prototype.key;
```

`time.html:34-48`
```text
  function logicalKeys() {
    if (!uid) return [];
    const p = PREFIX + uid + '__';
    const keys=[];
[... source range continues ...]
  const nativeRemove = Storage.prototype.removeItem;
  const nativeClear = Storage.prototype.clear;
  const nativeKey = Storage.prototype.key;
```


Official support: Browser Storage API - https://developer.mozilla.org/en-US/docs/Web/API/Storage


### SYNC-02 | High | Writes during hydration or an active save can remain unsynced

- **Evidence status:** Code-confirmed race risk.
- **Where:** eduskill-sync.js:155-159; eduskill-sync.js:176-190; eduskill-sync.js:193-247; dash.html:89-102.
- **What/why:** scheduleSync discards edits when syncing is true; syncCloud returns before hydration; hydration completion never drains a dirty queue. Failed hydration is marked hydrated=true.
- **If unresolved:** An edit may stay local until some later edit happens. Failed initial load can be followed by a whole-document save from incomplete local data.
- **Where/what to change and why:** Track dirty state and revision from every local change; flush after successful hydration and after in-flight saves. Do not mark failed load as authoritative; offer retry/offline state and preserve local edits.
- **Acceptance check:** Delay load, edit before it finishes, edit during save, fail load, retry: no missed edit or blind overwrite.

`eduskill-sync.js:155-159`
```text
  function scheduleSync() {
    if (syncing || !uid || !db) return;
    clearTimeout(window.__eduskillSyncTimer);
    window.__eduskillSyncTimer = setTimeout(syncCloud, 700);
  }
```

`eduskill-sync.js:176-190`
```text
  async function syncCloud() {
    if (!uid || !hydrated || !db) return;
    try {
      syncing = true;
[... source range continues ...]
    }
  }

```

`eduskill-sync.js:193-247`
```text
    const newUid = user.uid;
    if (uid && uid !== newUid) hydrated = false;
    uid = newUid;
    nativeSet.call(window.localStorage, ACTIVE, uid);
[... source range continues ...]
      console.warn('EduSkill cloud load failed:', e.message);
      hydrated = true;
    }
```

`dash.html:89-102`
```text
  function scheduleSync(){
    if(syncing || !uid || !hydrated) return;
    clearTimeout(window.__eduskillSyncTimer);
    window.__eduskillSyncTimer=setTimeout(syncCloud,700);
[... source range continues ...]
    if(!uid || !hydrated) return;
    try { await db.collection('users').doc(uid).collection('app').doc('state').set({data:collectData(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:false}); }
    catch(e){ console.warn('EduSkill cloud sync failed:',e.message); }
```


### SYNC-03 | High | Hydration overwrites edits and does not remove cloud-deleted keys

- **Evidence status:** Code-confirmed race risk.
- **Where:** eduskill-sync.js:198-209.
- **What/why:** Cloud data is copied onto current local keys without comparing revisions and without deleting absent keys.
- **If unresolved:** Fresh local edits can be replaced during load; old local records deleted on another device may be resurrected in a later save.
- **Where/what to change and why:** Use an explicit merge/deletion policy with revision tracking. Preserve dirty local edits, apply cloud deletions/tombstones safely, and migrate only with a backup and test account.
- **Acceptance check:** Edit while loading, delete on device A then open stale device B, reconnect: intended latest edits and deletions persist.

`eduskill-sync.js:198-209`
```text
    try {
      const snap = await db.collection('users').doc(uid).collection('app').doc('state').get();
      if (snap.exists && snap.data() && snap.data().data) {
        const data = snap.data().data;
[... source range continues ...]
        });
      }

```


### SYNC-04 | High | Shell, iframe and tabs replace one shared state document

- **Evidence status:** Code-confirmed concurrency risk.
- **Where:** index.html:9-10; index.html:1060; eduskill-sync.js:177-184; subs.html:9-10.
- **What/why:** Each window has its own debounce/UID state, but all send a full data object to users/{uid}/app/state with merge:false. No revision comparison or snapshot subscription resolves stale writers.
- **If unresolved:** Concurrent windows/devices can overwrite newer records, especially during stale hydration or slow saves. Not every simultaneous edit necessarily loses data.
- **Where/what to change and why:** Make sync ownership explicit and add safe version/conflict handling. Use transactions/revision checks or a small per-record/per-key model if needed; plain merge:true on arrays is not a complete conflict solution. Preserve all existing data during migration.
- **Acceptance check:** Two tabs and two clients edit different and same records; conflict is detected or merged under a documented policy; stale save cannot silently win.

`index.html:9-10`
```text
<script src="env.js"></script>
<script src="eduskill-sync.js"></script>
```

`index.html:1060-1060`
```text
            <iframe id="pageViewport" class="iframe-container" src="dash.html" title="Study Planner Content"></iframe>
```

`eduskill-sync.js:177-184`
```text
    if (!uid || !hydrated || !db) return;
    try {
      syncing = true;
      await db.collection('users').doc(uid).collection('app').doc('state').set({
        data: collectData(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: false });
    } catch (e) {
```

`subs.html:9-10`
```text
<script src="env.js"></script>
<script src="eduskill-sync.js"></script>
```


### SYNC-05 | Medium | Whole workspace shares a Firestore document ceiling

- **Evidence status:** Capacity risk, not observed exhaustion.
- **Where:** eduskill-sync.js:161-184; notes.html:660-671; index.html:1975-1982.
- **What/why:** All collected data shares one document. Firestore maximum document size is 1 MiB, documented at https://firebase.google.com/docs/firestore/quotas . Notes/message count caps are not byte caps.
- **If unresolved:** Large notes/history/daily tasks can make saves fail. No measured current document size or proof of present limit failure.
- **Where/what to change and why:** Add visible size/write-failure monitoring and sensible byte limits immediately. Split growing records only when evidence warrants it, with a tested compatible migration and backup. Avoid a rushed whole-database rewrite.
- **Acceptance check:** Mock an oversized write failure; show unsynced status and keep local data. Test boundary and migration restore if a split is introduced.

`eduskill-sync.js:161-184`
```text
  function collectData() {
    const data = {};
    logicalKeys().forEach(k => {
      if (!EXCLUDE_CLOUD.has(k)) {
[... source range continues ...]
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: false });
    } catch (e) {
```

`notes.html:660-671`
```text
        function saveNote() {
            if (!currentNote) return;
            const list = getJSON(NOTES_KEY, []);
            list.unshift({
[... source range continues ...]
                data: currentNote.data
            });
            localStorage.setItem(NOTES_KEY, JSON.stringify(list.slice(0, 30)));
```

`index.html:1975-1982`
```text
        function saveChatHistory() {
            try {
                // Keep the most recent 100 messages for optimal storage and responsiveness
                if (chatHistory.length > 100) {
                    chatHistory = chatHistory.slice(-100);
                }
                localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatHistory));
            } catch (e) {
```


Official support: Firestore size limits - https://firebase.google.com/docs/firestore/quotas


### SYNC-06 | High | Cloud failures are console-only while UI says saved

- **Evidence status:** Code-confirmed misleading persistence.
- **Where:** eduskill-sync.js:184-190; settings.html:840-854; notes.html:670-673.
- **What/why:** The adapter catches writes and only console.warn reports failure; callers report local success without cloud acknowledgement.
- **If unresolved:** Students may believe a cross-device save succeeded when only local data exists.
- **Where/what to change and why:** Expose Saved locally / Syncing / Saved to cloud / Retry states and a reusable error signal. Keep edits available after failure; do not claim cloud success until acknowledged.
- **Acceptance check:** Deny permission, go offline, exceed quota and recover; UI distinguishes local from confirmed cloud save.

`eduskill-sync.js:184-190`
```text
    } catch (e) {
      console.warn('EduSkill cloud sync failed:', e.message);
    } finally {
      syncing = false;
    }
  }

```

`settings.html:840-854`
```text

            if (window.parent && window.parent !== window) {
                window.parent.postMessage({ type: 'profile-updated', userName: name }, '*');
            }
[... source range continues ...]
        }

        async function clearAllData() {
```

`notes.html:670-673`
```text
            });
            localStorage.setItem(NOTES_KEY, JSON.stringify(list.slice(0, 30)));
            renderSavedNotes();
            setStatus('Note saved.', 'ok');
```


### SYNC-07 | High | Profile editing does not update the authoritative account

- **Evidence status:** Code-confirmed profile divergence.
- **Where:** settings.html:819-845; eduskill-sync.js:210-222.
- **What/why:** Settings updates name/email/course only in localStorage. Hydration restores the Firestore profile, and Firebase Auth email is never changed. Missing email displays a fictitious fallback.
- **If unresolved:** Profile changes can revert next login; displayed email may not match sign-in/reset address.
- **Where/what to change and why:** Persist allowed display fields to users/{uid}; make Auth email read-only unless the team explicitly requests a verified change/re-auth flow. Remove fictitious fallback and report missing values honestly.
- **Acceptance check:** Edit profile, refresh and sign in on a second client; name/course agree. Displayed account email matches Auth and password-reset destination.

`settings.html:819-845`
```text
        function loadSavedSettings() {
            userNameInput.value = localStorage.getItem('userName') || '';
            userEmailInput.value = localStorage.getItem('userEmail') || 'alex@eduskill.ai';
            userRoleInput.value = localStorage.getItem('userRole') || '';
[... source range continues ...]
            }

            showToast('Profile updated successfully.', true);
```

`eduskill-sync.js:210-222`
```text
      const profile = await db.collection('users').doc(uid).get();
      if (profile.exists) {
        const p = profile.data();
        const displayName = p.name || user.displayName || (user.email ? user.email.split('@')[0] : 'User');
[... source range continues ...]
        if (p.studentId) nativeSet.call(window.localStorage, physicalKey('studentId'), p.studentId);
      } else {
        const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
```


### SYNC-08 | High | Reset ignores cloud failure and can clear other users local caches

- **Evidence status:** Code-confirmed destructive scope.
- **Where:** settings.html:855-879; eduskill-sync.js:45-51.
- **What/why:** Cloud deletes swallow errors; profile is deleted as well as app state; shared native clear clears all origin storage. Inline page falls back to its patched clear, which can throw. Auth and username mapping remain.
- **If unresolved:** Reset can report success despite cloud records surviving, fail midway, or erase other cached users after the shared-clear path is loaded. Profile is recreated during later hydration.
- **Where/what to change and why:** Define workspace reset versus account deletion. Reset only current UID workspace data, await success or show failure, coordinate frames/sync timers, and retain account/profile unless explicitly included. Account deletion requires separate confirmation/re-auth policy.
- **Acceptance check:** User A reset leaves user B cache and A account intact; deletion failure is visible; reload does not resurrect reset data; outstanding writers cannot restore it.

`settings.html:855-879`
```text
            if (!confirm('Are you sure you want to reset all stored subjects, exams, and settings?')) return;

            try {
                const auth = window.eduskillAuth;
[... source range continues ...]

            showToast('Workspace data reset successfully.', true);
            setTimeout(function(){ window.top.location.reload(); }, 1000);
```

`eduskill-sync.js:45-51`
```text

  window.eduskillNativeClear = function () {
    try {
      nativeClear.call(window.localStorage);
    } catch (e) {
      console.warn('Native clear failed:', e.message);
    }
```


### SYNC-09 | Medium | Global Storage and Object.keys interception is broad

- **Evidence status:** Code-confirmed fragility.
- **Where:** eduskill-sync.js:91-153.
- **What/why:** A compatibility layer patches global methods to map logical keys; without UID it writes raw keys. Other frames have independent implementations.
- **If unresolved:** Shared helpers can behave differently across auth changes or pages. Moving all callers immediately would carry regression risk.
- **Where/what to change and why:** Near submission, keep one tested adapter. Later replace the shim with an explicit store API in small tested batches; keep key compatibility and UID migration. Never globally alter Object.keys in new code.
- **Acceptance check:** Storage length/key/Object.keys, native operations, auth switch and direct-page loading retain expected behavior.

`eduskill-sync.js:91-153`
```text
    }
    return keys;
  }

[... source range continues ...]
    return oldObjectKeys(obj);
  };

```


### SYNC-10 | Medium | Logout legacy cleanup omits actual history keys

- **Evidence status:** Code-confirmed cleanup gap.
- **Where:** eduskill-sync.js:269-281; notes.html:434-438; index.html:1951.
- **What/why:** Legacy list uses smartNotes/chatHistory rather than savedNotes/eduskill_chat_history and also misses readiness/alert/daily keys.
- **If unresolved:** Raw legacy data can remain on a shared browser; namespaced user cache normally reduces cross-user exposure.
- **Where/what to change and why:** Maintain one documented key registry and purge only appropriate legacy/current-user keys under the agreed logout policy. Keep offline retained data safe and do not accidentally delete all user data.
- **Acceptance check:** Logout then different user login; no legacy notes/chat/profile leak; current-user cloud data remains intact.

`eduskill-sync.js:269-281`
```text
    const legacyKeys = [
      'subjects', 'exams', 'taskList', 'quizHistory', 'userName', 'userEmail',
      'userRole', 'studentId', 'userPhoto', 'username', 'cached_timetable',
      'timetable_preferences', 'timetable_created_at', 'timetable_input_signature',
[... source range continues ...]

    if (auth) {
      try {
```

`notes.html:434-438`
```text
    <script>
        const SUBJECTS_KEY = 'subjects';
        const NOTES_KEY = 'savedNotes';

        let currentNote = null;   // { subject, topic, style, data }
```

`index.html:1951-1951`
```text
        const CHAT_STORAGE_KEY = 'eduskill_chat_history';
```


### FUNC-01 | High | AI task planner reads a timetable key nobody writes

- **Evidence status:** Code-confirmed.
- **Where:** index.html:1491-1498; time.html:1239-1241.
- **What/why:** Planner reads timetable; timetable writer uses cached_timetable.
- **If unresolved:** AI tasks do not receive the saved weekly timetable context.
- **Where/what to change and why:** Use the existing cached_timetable contract consistently through one helper; validate shape and keep a missing-timetable fallback.
- **Acceptance check:** Generate a timetable then capture a mocked task request; actual slots appear in prompt; old/missing cache is harmless.

`index.html:1491-1498`
```text
            const timetable = JSON.parse(localStorage.getItem('timetable') || 'null');
            const timetableContext = timetable
                ? JSON.stringify(timetable)
                : 'No timetable generated yet.';

            // Tasks already in today's list (AI must not repeat them)
            const existingTasks = loadTasks().map(t => t.text).join('\n') || 'None yet';

```

`time.html:1239-1241`
```text
            localStorage.setItem('cached_timetable', JSON.stringify(schedule));
            localStorage.setItem('timetable_created_at', Date.now().toString());
            localStorage.setItem('timetable_input_signature', getScheduleInputSignature());
```


### FUNC-02 | Medium | Notification badge counts past exams

- **Evidence status:** Code-confirmed.
- **Where:** index.html:1766-1777.
- **What/why:** The filter checks day difference <=2 but no lower bound.
- **If unresolved:** Past exams keep contributing to the urgent count.
- **Where/what to change and why:** Require finite days in 0..2 under one date helper; preserve task count semantics.
- **Acceptance check:** Past, today, tomorrow, day 2, day 3 and invalid date produce the expected count.

`index.html:1766-1777`
```text
        function updateNotificationBadge() {
            const tasks = loadTasks();
            const pending = tasks.filter(t => !t.done).length;

[... source range continues ...]
            }).length;

            const total = pending + urgent;
```


### FUNC-03 | Medium | Exam and reminder dates have incomplete validation

- **Evidence status:** Code-confirmed gap.
- **Where:** subs.html:646-657; index.html:1370-1384.
- **What/why:** Exam creation checks only nonempty date; reminder creation checks only nonempty fields before saving.
- **If unresolved:** Past dates or malformed/programmatic values can lead to misleading countdowns or immediate reminders. Browser date input helps but is not complete validation.
- **Where/what to change and why:** Define today/past-date policy; validate real calendar date and future reminder time before save. Permit historical exams only deliberately and label them.
- **Acceptance check:** Invalid calendar dates, empty fields, past/today/future exams and past reminders tested under India local date policy.

`subs.html:646-657`
```text
            const name = document.getElementById('examName').value.trim();
            const subject = document.getElementById('examSubjectSelect').value;
            const date = document.getElementById('examDate').value;

[... source range continues ...]
            exams.push(newExam);
            localStorage.setItem('exams', JSON.stringify(exams));

```

`index.html:1370-1384`
```text
            const title = document.getElementById('popupReminderTitle').value.trim();
            const date = document.getElementById('popupReminderDate').value;
            const time = document.getElementById('popupReminderTime').value;
            const message = document.getElementById('popupReminderMessage').value.trim();
[... source range continues ...]
            const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
            reminders.push({ id: Date.now(), title, datetime: date + 'T' + time, message: message || title, fired: false });
            localStorage.setItem('reminders', JSON.stringify(reminders));
```


### FUNC-04 | High | Fuzzy text links complete or delete unrelated tasks

- **Evidence status:** Mock-reproduced.
- **Where:** index.html:1601-1612; quiz.html:1199-1232; subs.html:875-913.
- **What/why:** Substring and word overlap substitute for subject/topic identity. JavaScript matches Java in the extracted function. Quiz completion matches by topic names across subjects; deletion uses the same fuzzy match.
- **If unresolved:** Passing one topic quiz can mark another task complete; deleting a subject can remove another subject task.
- **Where/what to change and why:** Add stable subjectId/topicId to new tasks and carry them through quiz completion/deletion. For legacy records, exact unambiguous matching only; do not silently migrate guesses. Prefer topic objects with IDs over matching names.
- **Acceptance check:** Java versus JavaScript; identical topic names in two subjects; delete one subject; unrelated task survives and only correct task completes.

`index.html:1601-1612`
```text
        function topicMatchesTask(taskText, topicName) {
            const tLow = taskText.toLowerCase();
            const pLow = topicName.toLowerCase();
            if (tLow === pLow) return true;
[... source range continues ...]
            const matched = pWords.filter(w => tWords.some(tw => tw.includes(w) || w.includes(tw)));
            return matched.length >= Math.ceil(pWords.length * 0.6);
        }
```

`quiz.html:1199-1232`
```text
        function topicMatchesTask(taskText, topicName) {
            const tLow = String(taskText).toLowerCase();
            const pLow = String(topicName).toLowerCase();
            if (tLow === pLow) return true;
[... source range continues ...]

                if (newlyDone) {
                    localStorage.setItem(key, JSON.stringify(tasks));
```

`subs.html:875-913`
```text

        function topicMatchesTask(taskText, topicName) {
            const tLow = taskText.toLowerCase();
            const pLow = topicName.toLowerCase();
[... source range continues ...]
                    localStorage.setItem(key, JSON.stringify(filtered));
                }
            }
```


### FUNC-05 | Medium | Generic manual tasks have no direct completion path

- **Evidence status:** Code-confirmed; product choice needed.
- **Where:** index.html:1580-1591; index.html:1686-1691; index.html:1614-1647.
- **What/why:** Manual tasks can contain arbitrary text but all rendered checkboxes are disabled with a quiz-only tooltip. toggleTask exists without a rendered caller.
- **If unresolved:** An unlinked task such as Submit assignment may stay incomplete forever. toggleTask is currently unreachable through the rendered UI; its topic-changing behavior must not be wired blindly.
- **Where/what to change and why:** Ask the team whether generic tasks are allowed. If yes, allow completion only for unlinked manual tasks and preserve quiz-gated study topic semantics. Remove dead completion code only after tracing callers.
- **Acceptance check:** Unlinked manual task completion works under the approved policy; linked study task still requires its topic quiz.

`index.html:1580-1591`
```text
        function addTask() {
            const input = document.getElementById('newTaskInput');
            const text = input.value.trim();
            if (!text) { input.focus(); return; }
[... source range continues ...]
            renderTasks();
            updateNotificationBadge();
        }
```

`index.html:1686-1691`
```text
            listEl.innerHTML = visible.map(t => `
                <div class="task-item">
                    <input type="checkbox" class="task-checkbox" ${t.done ? 'checked' : ''} disabled title="Complete this task by passing its topic quiz">
                    <span class="task-text ${t.done ? 'done' : ''}">${escapeHTML(t.text)}</span>
                </div>
            `).join('');
```

`index.html:1614-1647`
```text
        function toggleTask(id) {
            const tasks = loadTasks();
            const t = tasks.find(t => t.id === id);
            if (!t) { renderTasks(); return; }
[... source range continues ...]
            if (updatedSubjects) {
                localStorage.setItem('subjects', JSON.stringify(subjects));
            }
```


### FUNC-06 | Medium | AI and manual tasks have no provenance field

- **Evidence status:** Code-confirmed.
- **Where:** index.html:1552-1563; index.html:1585-1588.
- **What/why:** Both creation paths store id/text/done with no source, matching document FR-025 only partially.
- **If unresolved:** The team cannot reliably distinguish AI suggestions from user-created tasks.
- **Where/what to change and why:** Record source: ai/manual on new tasks and label suggestions. Preserve old tasks as legacy/unknown rather than inventing provenance. Preview/accept AI suggestions if the team wants that additional behavior.
- **Acceptance check:** Manual/AI labels survive save and reload; legacy records display honestly; generation failure preserves old tasks.

`index.html:1552-1563`
```text
                    let currentTasks = loadTasks();
                    const existingTexts = currentTasks.map(t => t.text.toLowerCase());

                    aiTasks.forEach(taskText => {
[... source range continues ...]
                                done: false
                            });
                        }
```

`index.html:1585-1588`
```text
            const tasks = loadTasks();
            tasks.push({ id: Date.now(), text, done: false });
            saveTasks(tasks);
            input.value = '';
```


### FUNC-07 | Medium | Subject and exam edit workflows are missing

- **Evidence status:** Code-confirmed gap.
- **Where:** subs.html:602-676; subs.html:830-863; subs.html:916-952.
- **What/why:** UI exposes create/view/delete, but no edit function/control was found in the whole subject page. Doc FR-013 and test scenarios expect subject editing; exam test scenario expects date modification.
- **If unresolved:** Corrections require delete/recreate, risking related records and IDs. This is a feature gap, not evidence existing editing is broken.
- **Where/what to change and why:** Add minimal edit forms with stable IDs and updated related views if agreed before submission; otherwise amend report acceptance claims. Do not promise full CRUD until tested.
- **Acceptance check:** Edit subject name/difficulty and exam date; links remain valid, owner data persists and cancellation makes no change.

`subs.html:602-676`
```text
            const name = document.getElementById("subjectName").value.trim();
            const difficulty = document.getElementById("difficulty").value;

            const selected = [...document.querySelectorAll("#topicList input:checked")]
[... source range continues ...]
        function toggleTopicDone(subjectId, topicIdx) {
            const sub = subjects.find(s => Number(s.id) === Number(subjectId));
            if (!sub || !sub.topics || !sub.topics[topicIdx]) return;
```

`subs.html:830-863`
```text
                    <button class="btn-delete" onclick="deleteSubject(${subject.id})">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </article>
[... source range continues ...]
                    </button>
                </article>
            `).join('');
```

`subs.html:916-952`
```text
        function deleteSubject(id) {
            const subject = subjects.find(s => Number(s.id) === id);
            subjects = subjects.filter(s => Number(s.id) !== id);
            localStorage.setItem('subjects', JSON.stringify(subjects));
[... source range continues ...]
                }
            }
        }
```


### FUNC-08 | Medium | Subject deletion leaves exams and can delete tasks without confirmation

- **Evidence status:** Code-confirmed.
- **Where:** subs.html:916-950; subs.html:889-913.
- **What/why:** deleteSubject removes subject and fuzzy-matched tasks but never removes/relinks its exams and has no confirmation. Task cleanup only scans -30..+60 days.
- **If unresolved:** Orphan exams remain; unintended task loss is possible; old tasks outside the window survive.
- **Where/what to change and why:** Use stable relationships and a clear preview/confirmation for cascade effects. Preserve completed history deliberately; decide whether exams archive/delete/relink. Never delete by approximate text.
- **Acceptance check:** Delete with related exams/history/tasks inside and outside the window; approved records only affected; cancelling preserves everything.

`subs.html:916-950`
```text
        function deleteSubject(id) {
            const subject = subjects.find(s => Number(s.id) === id);
            subjects = subjects.filter(s => Number(s.id) !== id);
            localStorage.setItem('subjects', JSON.stringify(subjects));
[... source range continues ...]
                if (typeof window.parent.updateNotificationBadge === 'function') {
                    window.parent.updateNotificationBadge();
                }
```

`subs.html:889-913`
```text
        function removeRelatedTasks(subject) {
            const matchTerms = (subject.topics || []).map(t => t.topic);
            if (subject.name) matchTerms.push(subject.name);
            const terms = matchTerms.filter(Boolean);
[... source range continues ...]
                    localStorage.setItem(key, JSON.stringify(filtered));
                }
            }
```


### FUNC-09 | Medium | Page initialization silently deletes nonconforming subject records

- **Evidence status:** Code-confirmed.
- **Where:** subs.html:954-960.
- **What/why:** Startup filters out records missing a truthy topics or id and writes the reduced list back without a migration notice.
- **If unresolved:** Legacy or partially synced subjects can disappear merely by opening the page.
- **Where/what to change and why:** Validate and report invalid records without destructive cleanup; migrate with backup and user-visible recovery.
- **Acceptance check:** Malformed/legacy records are recoverable and not silently removed; valid subjects remain usable.

`subs.html:954-960`
```text
        // Remove default subjects that were auto-created without proper data
        const _cleaned = subjects.filter(s => s.topics && s.id);
        if (_cleaned.length !== subjects.length) {
            subjects = _cleaned;
            localStorage.setItem('subjects', JSON.stringify(subjects));
        }

```


### TIME-01 | High | Study hours are truncated and treated as slot counts

- **Evidence status:** Mock-reproduced parsing; algorithm confirmed.
- **Where:** time.html:1100-1109; time.html:1188-1205.
- **What/why:** Inputs accept quarter-hour values; parseInt truncates. 0.5 falls back to 2 morning hours. Loop count equals hours even when slot length is 30/45/55 minutes.
- **If unresolved:** A half-hour setting can produce two slots; short slots do not fill the requested duration. Schedule constraints are not honored.
- **Where/what to change and why:** Use numeric hours as a minute budget; derive fitting slots from study minutes plus breaks, never round upward beyond available time. Validate start/end/day rollover and selected shift.
- **Acceptance check:** 0.5, 1, 2.5 and 12 hours with every slot length; total allocated minutes and breaks fit the budget; no accidental fallback or midnight overlap.

`time.html:1100-1109`
```text
        function validateHours(el) {
            el.value = el.value.replace(',', '.');
            if (el.value === '' || el.value === '.' || el.value === '0') return;
            let v = parseFloat(el.value);
[... source range continues ...]
            if (el.value.includes('.') && el.value.split('.')[1].length > 1) {
                v = Math.round(v * 4) / 4;
                el.value = String(v);
```

`time.html:1188-1205`
```text
            const morningHrs = (shift === 'evening') ? 0 : (parseInt(document.getElementById('morningHours').value) || 2);
            const eveningHrs = (shift === 'morning') ? 0 : (parseInt(document.getElementById('eveningHours').value) || 1);
            const slotMins = parseInt(document.getElementById('slotDuration').value) || 55;
            const slotSpacing = slotMins === 60 ? 60 : slotMins + 5;
[... source range continues ...]
                    timeSlots.push(formatSlot(s, s + slotMins));
                }
            }
```


### TIME-02 | Medium | Timetable hours summary actually counts slots

- **Evidence status:** Code-confirmed.
- **Where:** time.html:1513-1521.
- **What/why:** maxSlots is printed as Hours/Day and multiplied by 7.
- **If unresolved:** Three 30-minute slots display as 3 hours/day instead of 90 study minutes.
- **Where/what to change and why:** Sum actual duration of each day or store numeric duration in slots; display study minutes/hours separately from breaks and slot count.
- **Acceptance check:** 30/45/55/60-minute schedules have exact study-duration labels and consistent weekly totals.

`time.html:1513-1521`
```text
            let maxSlots = 0;
            days.forEach(d => {
                if (schedule[d]) maxSlots = Math.max(maxSlots, schedule[d].length);
            });
[... source range continues ...]
                summary.style.display = 'block';
                summary.textContent = `${maxSlots} Hour${maxSlots !== 1 ? 's' : ''}/Day • ${maxSlots * 7} Hours/Week`;
            }
```


### TIME-03 | Medium | Timetable initialization can run twice

- **Evidence status:** Code-confirmed.
- **Where:** time.html:1055-1071.
- **What/why:** Both cloud-ready and a 500 ms fallback call initBuild; each installs an ongoing 1.5 second poll. once:true only limits the event path.
- **If unresolved:** Duplicate polling/builds and writes waste work and can compete with hydration.
- **Where/what to change and why:** Use one idempotent initialization guard; attach polling/listeners once and update after cloud load through a separate render/build function.
- **Acceptance check:** Cloud arrives before/after fallback: exactly one interval and deterministic final timetable.

`time.html:1055-1071`
```text
        document.addEventListener('DOMContentLoaded', () => {
            loadSettings();

            function initBuild() {
[... source range continues ...]

            window.addEventListener('eduskill-cloud-ready', initBuild, { once: true });
            setTimeout(initBuild, 500);
```


### TIME-04 | Medium | Timetable cache signature omits preferences and current date

- **Evidence status:** Code-confirmed stale-cache risk.
- **Where:** time.html:1138-1171; time.html:1240-1241; time.html:1543-1560.
- **What/why:** Signature contains subjects/exams only, while cached slots include daysLeft and time preferences; valid cache lives for seven days.
- **If unresolved:** Changing hours or moving to the next day can leave cached settings/countdowns stale until regeneration.
- **Where/what to change and why:** Include approved preference signature and render daysLeft from date today, not cached countdown. Keep cache invalidation separate from double-initialization fix.
- **Acceptance check:** Change slot/start/hour settings, cross local midnight, reload day 2: schedule and exam labels are current.

`time.html:1138-1171`
```text
        function getScheduleInputSignature() {
            return (localStorage.getItem('subjects') || '') + '::' + (localStorage.getItem('exams') || '');
        }

[... source range continues ...]
            }

            generateTimetable();
```

`time.html:1240-1241`
```text
            localStorage.setItem('timetable_created_at', Date.now().toString());
            localStorage.setItem('timetable_input_signature', getScheduleInputSignature());
```

`time.html:1543-1560`
```text
                        ? null
                        : Number(slot.daysLeft);
                    const dueText = daysLeft === 0
                        ? 'today'
[... source range continues ...]
                    const examBadge = slot.examName && dueText
                        ? `<span class="exam-urgency-badge ${urgencyClass}">Exam ${dueText}</span>`
                        : '';
```


### TIME-05 | Medium | Timetable topics are available only on hover

- **Evidence status:** Code-confirmed accessibility risk; offline visual.
- **Where:** time.html:358-387; time.html:1563-1572.
- **What/why:** Topic text is in a hidden hover popover inside a td without a keyboard-focus control. Mobile rules set table min-width 640px inside a horizontal scroller.
- **If unresolved:** Touch/keyboard users may not discover the topic for a slot. Horizontal scrolling is intentional, not by itself proof of broken responsiveness.
- **Where/what to change and why:** Show a short topic inline or use an accessible details/button popup with keyboard and touch behavior; add scroll cue and day-view option only if needed. Keep current desktop table.
- **Acceptance check:** Real Android/iOS touch, Tab/Enter/Escape and screen reader find every topic; no page-wide overflow at 320/390px.

`time.html:358-387`
```text
        .subject-cell:hover {
            z-index: 9999;
        }

[... source range continues ...]
            z-index: 10000;
            pointer-events: none;
            text-align: left;
```

`time.html:1563-1572`
```text
                        <td class="subject-cell">
                            <div class="topic-popover">
                                <div class="topic-popover-header"><i class="fas fa-book-open"></i> Topic</div>
                                <div>${esc(topic)}</div>
[... source range continues ...]
                            <span class="priority-badge ${diffClass}">${diff}</span>
                            ${examBadge}
                        </td>
```


### QUIZ-01 | High | Malformed quiz answers are silently fabricated

- **Evidence status:** Mock-reproduced.
- **Where:** quiz.html:899-933; quiz.html:1082-1088.
- **What/why:** Parser pads missing options with dash, changes invalid answers to 0, and permits fractional indices.
- **If unresolved:** The app can call option 0 correct without a valid answer key, or make a question impossible to score.
- **Where/what to change and why:** Reject malformed questions; require four meaningful options and integer answer in 0..3. Check the requested question count, bound lengths and show a retry without saving a result.
- **Acceptance check:** T02 covers answer 99 and 1.5; add missing/null answer, one option, empty question and duplicate options. Valid quizzes score correctly.

`quiz.html:899-933`
```text
        function parseQuestions(raw) {
            let text = String(raw || '').replace(/```json/gi, '').replace(/```/g, '').trim();
            let arr = null;

[... source range continues ...]
                };
            }).filter(Boolean);
        }
```

`quiz.html:1082-1088`
```text
            currentQuiz.questions.forEach((q, i) => {
                if (selectedAnswers[i] === q.answer) correct++;
            });

            const total = currentQuiz.questions.length;
            const pct = Math.round((correct / total) * 100);
            const passed = pct > PASS_MARK;
```


### QUIZ-02 | Medium | Quiz history truncation affects analytics silently

- **Evidence status:** Code-confirmed retention limit.
- **Where:** quiz.html:1276-1279; insights.html:476-489; insights.html:746-757.
- **What/why:** Only last 50 attempts retained while analytics derive best/attempt counts from that history.
- **If unresolved:** Older best results and counts can disappear, changing readiness/weakness estimates without explanation.
- **Where/what to change and why:** State history retention in UI; keep separate per-topic aggregate if lifetime metrics are desired, or label metrics recent-history only. Do not add an unneeded unlimited archive.
- **Acceptance check:** Attempt 51 and eviction of previous best: displayed period/aggregate matches chosen policy.

`quiz.html:1276-1279`
```text
        function saveHistory(record) {
            const history = getHistory();
            history.unshift(record);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
```

`insights.html:476-489`
```text
            const history = getJSON(HISTORY_KEY, []);
            const map = {};
            history.forEach(r => {
                const subj = String(r.subject || '');
[... source range continues ...]
                });
            });
            return map;
```

`insights.html:746-757`
```text
                // average best quiz pct across this subject's topics
                const rel = history.filter(r => String(r.subject || '').toLowerCase() === subjName.toLowerCase());
                let quizPct = null;
                if (rel.length) {
[... source range continues ...]
                    });
                    const vals = Object.values(bestByTopic);
                    quizPct = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
```


### NOTES-01 | Medium | Saving note 31 drops the oldest note silently

- **Evidence status:** Code-confirmed data loss limit.
- **Where:** notes.html:660-673.
- **What/why:** Unshift then slice(0,30) replaces saved notes; no warning/export confirmation precedes the truncation.
- **If unresolved:** Previously saved material is removed from stored history.
- **Where/what to change and why:** Warn before cap, offer deletion/export or bounded archive with explicit consent. Preserve old notes until the user chooses; do not claim unlimited storage.
- **Acceptance check:** Save note 31: user can keep/export old data; cancellations preserve all notes; agreed retention is shown.

`notes.html:660-673`
```text
        function saveNote() {
            if (!currentNote) return;
            const list = getJSON(NOTES_KEY, []);
            list.unshift({
[... source range continues ...]
            localStorage.setItem(NOTES_KEY, JSON.stringify(list.slice(0, 30)));
            renderSavedNotes();
            setStatus('Note saved.', 'ok');
```


### AI-01 | High | Tasks, topics, notes and insights validate JSON syntax more than schema

- **Evidence status:** Code-confirmed validation gap.
- **Where:** index.html:1546-1565; subs.html:571-584; notes.html:566-575; insights.html:639-655; insights.html:702-709.
- **What/why:** A parsed array/object can still contain null records, wrong field types, oversized strings or non-string task text. Tasks render code later calls toLowerCase. Notes accept any truthy parsed value; recommendation loops assume object members.
- **If unresolved:** Valid JSON can still cause crashes, blank-success messages or unusable saved records.
- **Where/what to change and why:** Use small feature-specific validators at the trust boundary; check types, required fields, lengths, counts and numeric bounds. Reject before save, keep current data and explain retry. Reuse existing parser only for extraction, not as validation.
- **Acceptance check:** Mock [], {}, null entries, numeric tasks, wrong notes shape, huge strings and missing members for every AI feature; no malformed data persisted.

`index.html:1546-1565`
```text
                let rawResponse = data.choices?.[0]?.message?.content || '[]';
                rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();

                const aiTasks = JSON.parse(rawResponse);
[... source range continues ...]
                        }
                    });

```

`subs.html:571-584`
```text
                const json = raw.match(/\[[\s\S]*\]/);

                if (!json) throw new Error("Invalid AI response format");

[... source range continues ...]
                                <b>${escapeHTML(item.topic)}</b><br>
                                <small>⏱ ${item.minutes} mins</small>
                            </div>
```

`notes.html:566-575`
```text
                if (!parsed) throw new Error('Could not parse AI response.');

                currentNote = {
                    subject: material ? (customTopic || 'Custom Material') : (subject ? subject.name : ''),
[... source range continues ...]
                };

                renderNote(currentNote);
```

`insights.html:639-655`
```text
            }).join('') + '</div>';
        }

        // ── AI: weakness recommendations ────────────────────────────────────
[... source range continues ...]
            }
            return [];
        }
```

`insights.html:702-709`
```text

                list.forEach(w => {
                    const r = byKey[w.subject + '||' + w.topic];
                    if (r) {
                        if (r.why) w.tip = r.why;
                        if (r.action) w.action = r.action;
                    }
                });
```


### AI-02 | Medium | Provider fetch lacks timeout and status-specific retry

- **Evidence status:** Code-confirmed.
- **Where:** env.js:68-95; eduskill-sync.js:316-346; time.html:971-993.
- **What/why:** Fetch waits without AbortController deadline and retries every failure across keys, including malformed requests. Helpers are repeated.
- **If unresolved:** A hanging request leaves controls waiting; invalid payload errors cause unnecessary requests. Key rotation may not help shared organization quotas.
- **Where/what to change and why:** Use one shared client for authenticated backend calls, bounded timeout/cancellation, status-specific errors and at most bounded backoff for eligible 429/5xx. Honor Retry-After; never rotate client secrets.
- **Acceptance check:** Mock timeout/network/400/401/403/429/500: controls restore, existing data persists and retry count follows policy.

`env.js:68-95`
```text

    for (let i = 0; i < candidateKeys.length; i++) {
      const key = candidateKeys[i];
      try {
[... source range continues ...]
    }

    throw lastError || new Error('Could not connect to Groq AI service.');
```

`eduskill-sync.js:316-346`
```text
          const envKey = (window.__ENV__ && window.__ENV__.GROQ_API_KEY ? window.__ENV__.GROQ_API_KEY : '').trim();
          const userCustomKey = (localStorage.getItem('groq_api_key') || envKey).trim();
          return userCustomKey ? [userCustomKey, ...GROQ_KEYS] : GROQ_KEYS;
        })();
[... source range continues ...]
        console.warn(`Groq key #${i + 1} network error (${err.message}). Trying fallback...`);
      }
    }
```

`time.html:971-993`
```text
            window.eduskillGroqFetch = async function (payload) {
                const userCustomKey = (localStorage.getItem('groq_api_key') || '').trim();
                const candidateKeys = userCustomKey ? [userCustomKey, ...GROQ_KEYS] : GROQ_KEYS;
                let lastError = null;
[... source range continues ...]
                }
                throw lastError || new Error('Could not connect to Groq AI service.');
            };
```


Official support: Groq organization quotas - https://console.groq.com/docs/rate-limits


### AI-03 | Medium | Chat submits all retained history and identifying context

- **Evidence status:** Code-confirmed privacy and cost risk.
- **Where:** index.html:1975-1982; index.html:2029-2073; index.html:2137-2146.
- **What/why:** Up to 100 retained messages are sent with student name/course/subjects/exams. There is no input byte/token bound in this path.
- **If unresolved:** Large context can exceed limits or increase latency/cost. Private study material goes to an external provider. This is a disclosure/data-minimization gap, not proof of misuse.
- **Where/what to change and why:** Document AI data flow, remove unnecessary personal identifiers and cap validated context. Use a recent-window budget first; add summarization only if measured need justifies extra calls. Keep chat local clear behavior and visible retry.
- **Acceptance check:** Capture mocked payload: necessary context only, valid user/assistant roles, bounded sizes; long input gives clear validation; clear history works.

`index.html:1975-1982`
```text
        function saveChatHistory() {
            try {
                // Keep the most recent 100 messages for optimal storage and responsiveness
                if (chatHistory.length > 100) {
                    chatHistory = chatHistory.slice(-100);
                }
                localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatHistory));
            } catch (e) {
```

`index.html:2029-2073`
```text
        function buildChatSystemPrompt() {
            const userName = localStorage.getItem('userName') || localStorage.getItem('username') || 'Student';
            const userRole = localStorage.getItem('userRole') || '';
            let subjects = [];
[... source range continues ...]
            ctx += '\n\nKeep answers concise, accurate, and helpful. Use markdown formatting for code, lists, and emphasis when appropriate.';
            return ctx;
        }
```

`index.html:2137-2146`
```text
                // Build messages array with system prompt + sanitized history
                const messagesToSend = [
                    { role: 'system', content: buildChatSystemPrompt() },
                    ...chatHistory.map(m => ({ role: m.role, content: m.content }))
[... source range continues ...]
                    model: 'openai/gpt-oss-120b',
                    messages: messagesToSend,
                    max_tokens: 1024
```


### AI-04 | Medium | Student text is interpolated as assistant policy/context

- **Evidence status:** Code-confirmed prompt boundary risk.
- **Where:** index.html:2040-2073; notes.html:519-556.
- **What/why:** Student names, course and subject values enter chat system text; pasted notes enter a prompt without a strong content/instruction distinction.
- **If unresolved:** Injected text can steer educational responses. The app has no agent tools, so do not claim it can execute database commands through chat.
- **Where/what to change and why:** Keep fixed system policy and pass student content as labeled data in user context; validate fields, add untrusted-content boundaries, and label educational output advisory. Server must enforce permissions independently of prompts.
- **Acceptance check:** Adversarial course/topic/material text cannot change backend scope or response schema; output stays safely rendered and never drives unauthorized writes.

`index.html:2040-2073`
```text
            let ctx = `You are EDU-SKILL AI, a friendly and helpful study assistant inside an educational workspace. The student's name is "${userName}".`;
            if (userRole) ctx += ` They are studying: ${userRole}.`;

            if (subjects.length) {
[... source range continues ...]
            ctx += '\n\nKeep answers concise, accurate, and helpful. Use markdown formatting for code, lists, and emphasis when appropriate.';
            return ctx;
        }
```

`notes.html:519-556`
```text
                sourceLine = `Base the notes STRICTLY on this material:\n"""\n${material}\n"""`;
            } else {
                if (!subject) { setStatus('Please select a subject (or paste custom material).', 'error'); return; }
                topicName = selectedTopic || (subject.topics && subject.topics[0] && subject.topics[0].topic) || 'General';
[... source range continues ...]
                const data = await window.eduskillGroqFetch({
                    model: 'openai/gpt-oss-120b',
                    messages: [
```


### AI-05 | Medium | Custom-key branch exists without a supported UI

- **Evidence status:** Code-confirmed feature gap.
- **Where:** env.js:36-40; eduskill-sync.js:317-319; time.html:972-974.
- **What/why:** groq_api_key is read and excluded from cloud sync, but no project code/UI writes it.
- **If unresolved:** A advertised or assumed Bring Your Own Key option would be incomplete; putting it in browser storage would create additional exposure.
- **Where/what to change and why:** Remove unused browser-key path in the secure backend migration. If user-owned keys are explicitly desired later, design server-side storage/permission separately. Do not add a key input merely to complete dead code.
- **Acceptance check:** No provider key is read from localStorage or exposed in browser; absence of BYOK is documented.

`env.js:36-40`
```text
  window.getGroqApiKeys = function () {
    const keys = [];
    const customKey = (localStorage.getItem('groq_api_key') || '').trim();
    if (customKey) keys.push(customKey);

```

`eduskill-sync.js:317-319`
```text
          const userCustomKey = (localStorage.getItem('groq_api_key') || envKey).trim();
          return userCustomKey ? [userCustomKey, ...GROQ_KEYS] : GROQ_KEYS;
        })();
```

`time.html:972-974`
```text
                const userCustomKey = (localStorage.getItem('groq_api_key') || '').trim();
                const candidateKeys = userCustomKey ? [userCustomKey, ...GROQ_KEYS] : GROQ_KEYS;
                let lastError = null;
```


### ANALYTICS-01 | Medium | Dashboard month filter does not affect chart

- **Evidence status:** Code-confirmed.
- **Where:** dash.html:667-670; dash.html:848-874.
- **What/why:** renderChart always uses this week Monday and seven labels; it never reads timeframeFilter.
- **If unresolved:** Choosing This Month still shows week data.
- **Where/what to change and why:** Read and implement the selected period using existing daily task records, or remove/disable month option with an honest label if not in submission scope.
- **Acceptance check:** Week/month produce distinct correct date ranges; empty/future dates display honestly.

`dash.html:667-670`
```text
                        <select id="timeframeFilter" onchange="renderChart()">
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
```

`dash.html:848-874`
```text
        function renderChart() {
            const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            // Find this week's Monday by subtracting the right number of days
[... source range continues ...]
                actual.push(dayTasks.length > 0 ? Math.round(done / dayTasks.length * 100) : 0);
            }

```


### ANALYTICS-02 | Medium | Current topic completion is repeated across all historical days

- **Evidence status:** Code-confirmed misleading history.
- **Where:** dash.html:875-878; dash.html:886-911.
- **What/why:** Array(7).fill(topicPct) plots the current topic percentage for the whole week without completion timestamps.
- **If unresolved:** The chart appears to show historical mastery it never recorded.
- **Where/what to change and why:** Label it as current completion outside the historical line, or record genuine daily snapshots prospectively. Never synthesize past progress. Document Tasks Planned as a 0/100 presence target, not a task count.
- **Acceptance check:** No past dates show invented topic history; labels/units match stored data.

`dash.html:875-878`
```text
            // Overall percentage of subject topics completed.
            // Topics aren't date-stamped, so the same value repeats across the week.
            const topicPct = getSubjectTopicPercent();
            const topicMastery = Array(7).fill(topicPct);
```

`dash.html:886-911`
```text
                    labels,
                    datasets: [
                        {
                            label: 'Tasks Planned',
[... source range continues ...]
                            borderColor: '#7c3aed',
                            backgroundColor: 'rgba(124,58,237,0.08)',
                            tension: 0.3,
```


### ANALYTICS-03 | Medium | Readiness and weakness scores can be stale or overstated

- **Evidence status:** Code-confirmed heuristic risk.
- **Where:** insights.html:539-565; insights.html:724-790; insights.html:888-900; index.html:1420-1424; time.html:998-1008.
- **What/why:** Readiness uses global today-task percentage for every exam, best scores only for attempted topics, and heuristic weights. Cached weakTopics/readiness are reused without a source revision.
- **If unresolved:** Unrelated tasks can improve another subject readiness; old weak scores may guide new schedules. These are study estimates, not validated exam-success probabilities.
- **Where/what to change and why:** Label formulas as heuristic, state available evidence, scope tasks/quiz coverage to stable subject IDs, and invalidate cache when inputs change. Display insufficient evidence rather than confident probability.
- **Acceptance check:** Two subjects with different task/quiz coverage; change exam/completion then reuse insights; no unrelated boost or stale cached verdict.

`insights.html:539-565`
```text

        function computeWeaknesses() {
            const subjects = getJSON(SUBJECTS_KEY, []);
            const quiz = quizStats();
[... source range continues ...]
                    const severity = score >= 65 ? 'High' : score >= 45 ? 'Medium' : 'Low';

                    const bits = [];
```

`insights.html:724-790`
```text
        // ── EXAM READINESS ──────────────────────────────────────────────────
        function computeReadiness() {
            const subjects = getJSON(SUBJECTS_KEY, []);
            const exams = getJSON(EXAMS_KEY, []);
[... source range continues ...]
                    topicPct,
                    quizPct,
                    taskPct,
```

`insights.html:888-900`
```text

        // ── INIT ────────────────────────────────────────────────────────────
        function renderFromStorage() {
            const weak = getJSON(WEAK_KEY, []);
[... source range continues ...]
        window.addEventListener('storage', renderFromStorage);
        window.addEventListener('eduskill-cloud-ready', renderFromStorage);
    </script>
```

`index.html:1420-1424`
```text
        function getWeakTopics() {
            try {
                const stored = JSON.parse(localStorage.getItem('weakTopics') || '[]');
                if (Array.isArray(stored) && stored.length) return stored.slice(0, 8);
            } catch (e) {}
```

`time.html:998-1008`
```text
        function buildWeaknessMap() {
            try {
                const stored = JSON.parse(localStorage.getItem('weakTopics') || '[]');
                if (Array.isArray(stored) && stored.length) {
[... source range continues ...]
                    return map;
                }
            } catch (e) {}
```


### UI-01 | Medium | Navigation changes iframe without a URL state model

- **Evidence status:** Code-confirmed; browser behavior unverified.
- **Where:** index.html:1060; index.html:1159-1164.
- **What/why:** navigate sets iframe.src and menu classes only. No deliberate URL/hash/history routing model is implemented.
- **If unresolved:** Top-level links do not identify the selected module; reload begins Dashboard. Back behavior can vary with iframe history.
- **Where/what to change and why:** Add the smallest hash/page state adapter if team wants shareable pages; validate allowed paths, update selected nav and restore state without a framework. Test rather than assume iframe back behavior.
- **Acceptance check:** Deep link/reload/back/forward works for every approved module; invalid route safely falls back.

`index.html:1060-1060`
```text
            <iframe id="pageViewport" class="iframe-container" src="dash.html" title="Study Planner Content"></iframe>
```

`index.html:1159-1164`
```text
        function navigate(url, el) {
            document.getElementById('pageViewport').src = url;
            document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
            if (el && el.parentElement) el.parentElement.classList.add('active');
            closeSidebar();
        }
```


### UI-02 | Low | Chart.js is unpinned; login compiles Tailwind in browser

- **Evidence status:** Code-confirmed production risk.
- **Where:** dash.html:160; prog.html:146-153; loginform.html:4-12; tailwind-browser.js:1-5.
- **What/why:** Chart.js URL has no version. Vendored Tailwind browser file identifies browser@4.3.3. Official Tailwind Play CDN documentation says browser compilation is for development.
- **If unresolved:** Dependency changes/CDN outage can affect charts; runtime CSS compilation adds work. Offline screenshots stubbed these dependencies, so visual chart/login fidelity was not certified.
- **Where/what to change and why:** Pin tested Chart.js version and retain accessible fallbacks. Precompile existing Tailwind styles if feasible, with visual comparison; do not remove the login design or install a new framework. Keep icons consolidation optional.
- **Acceptance check:** Offline/CDN failure shows text summaries; pinned charts work; compiled login matches baseline desktop/mobile.

`dash.html:160-160`
```text
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

`prog.html:146-153`
```text
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --bg-dark: #f8fafc;
            --card-bg: #ffffff;
            --card-border: #e2e8f0;
            --primary-blue: #4338ca;
```

`loginform.html:4-12`
```text
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EDU-SKILL'S AI</title>
  <script src="tailwind-browser.js"></script>
[... source range continues ...]
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
  <script src="env.js"></script>
```

`tailwind-browser.js:1-5`
```text
/**
 * Minified by jsDelivr using Terser v5.48.0.
 * Original file: /npm/@tailwindcss/browser@4.3.3/dist/index.global.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
```


Official support: Tailwind browser compiler guidance - https://tailwindcss.com/docs/installation/play-cdn


### UI-03 | Medium | Custom dialogs and charts lack a complete accessible contract

- **Evidence status:** Code-confirmed accessibility gap.
- **Where:** index.html:1814-1840; time.html:1563-1572; dash.html:674-677.
- **What/why:** Reminder overlay is dynamic div/button markup without a complete dialog/focus flow; timetable is hover-only; chart canvas has no nearby equivalent data table.
- **If unresolved:** Keyboard/screen-reader users can miss dialogs and academic information. A full accessibility audit was not run.
- **Where/what to change and why:** Use existing UI with proper labels, role/dialog semantics where appropriate, focus move/return, Escape close, keyboard operability and text/chart summaries. Do not reduce safety/accessibility to save lines.
- **Acceptance check:** Keyboard-only and screen-reader tests; modal focus cannot disappear behind it; chart data is available in text.

`index.html:1814-1840`
```text
        function processReminderQueue() {
            if (reminderPopupOpen || !reminderQueue.length) return;
            reminderPopupOpen = true;

[... source range continues ...]
            document.getElementById('reminderBody').textContent = item.body;
            overlay.style.display = 'flex';
        }
```

`time.html:1563-1572`
```text
                        <td class="subject-cell">
                            <div class="topic-popover">
                                <div class="topic-popover-header"><i class="fas fa-book-open"></i> Topic</div>
                                <div>${esc(topic)}</div>
[... source range continues ...]
                            <span class="priority-badge ${diffClass}">${diff}</span>
                            ${examBadge}
                        </td>
```

`dash.html:674-677`
```text
                    <!-- Chart.js draws its line graph onto this <canvas> element -->
                    <div class="chart-container">
                        <canvas id="progressChart"></canvas>
                    </div>
```


### STRUCT-01 | Medium | Shared logic is duplicated and drifted

- **Evidence status:** Code-confirmed maintainability issue.
- **Where:** eduskill-sync.js:1-6; dash.html:18-20; prog.html:9-12; settings.html:9-12; time.html:9-12; env.js:68-95.
- **What/why:** One shared sync adapter plus four inline variants and three Groq helpers coexist. Dates/matching/escaping recur in multiple pages.
- **If unresolved:** Fixes can miss sibling callers and return as regressions, already illustrated by SYNC-01.
- **Where/what to change and why:** Use Ponytail root-cause approach: share only proven repeated contracts, keep flat page URLs initially and delete duplicates after parity tests. Move files separately later, only if requested structure cleanup can be verified.
- **Acceptance check:** Search every caller/load path before each extraction; all 10 pages load; no duplicate initializer or broken relative URL.

`eduskill-sync.js:1-6`
```text
// ══════════════════════════════════════════════════════════════════════════════
// EDU-SKILL AI - SHARED USER STORAGE & CLOUD SYNC ADAPTER
// ══════════════════════════════════════════════════════════════════════════════

(function () {
  'use strict';
```

`dash.html:18-20`
```text
<script>
(function () {
  const CONFIG = window.FIREBASE_CONFIG || {
```

`prog.html:9-12`
```text
<script>
(function () {
  const CONFIG = window.FIREBASE_CONFIG || {
    apiKey: "[PUBLIC_FIREBASE_CONFIG_IDENTIFIER]",
```

`settings.html:9-12`
```text
<script>
(function () {
  const CONFIG = window.FIREBASE_CONFIG || {
    apiKey: "[PUBLIC_FIREBASE_CONFIG_IDENTIFIER]",
```

`time.html:9-12`
```text
<script>
(function () {
  const CONFIG = window.FIREBASE_CONFIG || {
    apiKey: "[PUBLIC_FIREBASE_CONFIG_IDENTIFIER]",
```

`env.js:68-95`
```text

    for (let i = 0; i < candidateKeys.length; i++) {
      const key = candidateKeys[i];
      try {
[... source range continues ...]
    }

    throw lastError || new Error('Could not connect to Groq AI service.');
```


### DEP-01 | High | GitHub/Vercel readiness cannot be certified from this archive

- **Evidence status:** Snapshot-confirmed missing evidence.
- **Where:** README_SETUP.txt:12-16; .gitignore:1-5.
- **What/why:** Archive has no .git metadata, repository URL, package.json, server API folder, Vercel config or automated test suite. A static site can deploy without package.json/vercel.json, so absence alone is not a deployment error.
- **If unresolved:** Cannot confirm latest commit, history leaks, published rules, authorized domains, service configuration or working deployment.
- **Where/what to change and why:** Obtain team-owned repo/live deployment and access approval. Work on a branch/preview, verify final diff/build/auth/rules/secret scan, document environment names, then obtain team approval before pushing/deploying to their accounts. Do not claim deployment done from zip review.
- **Acceptance check:** Record approved repo URL, commit SHA, preview URL, deployed rules/version, auth-domain check, smoke tests and rollback reference.

`README_SETUP.txt:12-16`
```text

FIREBASE SETUP (required once)
1. Open Firebase Console for project: eduskillai-3e807
2. Authentication -> Sign-in method -> enable Email/Password.
3. Firestore Database -> Create database if it does not exist.
```

`.gitignore:1-5`
```text
# Secrets and build artefacts
.env
*.key
*.pem
node_modules/
```


Official support: Vercel functions - https://vercel.com/docs/functions


Official support: Firebase backend ID token verification - https://firebase.google.com/docs/auth/admin/verify-id-tokens


### DOC-01 | Medium | Report requirements must not be presented as finished features

- **Evidence status:** Document/code-confirmed mismatch.
- **Where:** README_SETUP.txt:3-11; subs.html:916-952; index.html:1557-1562.
- **What/why:** Pasted doc calls roles/data collections/roadmap proposals, while README claims broad cloud sync and doc FRs include editing, secure credentials, AI provenance and history. Source only partly supports these.
- **If unresolved:** Viva/report claims can exceed implementation. There is no implemented admin/RBAC UI, account deletion or push service shown in the zip.
- **Where/what to change and why:** Update documentation as implemented / partial / planned / not tested. Keep all 46 FRs traceable, explain real one-doc storage and actual heuristic formulas, and do not turn optional roadmap into mandatory new scope.
- **Acceptance check:** Team can demonstrate every implemented claim; unknown console/runtime status is explicit; all FR-001..046 mapped.

`README_SETUP.txt:3-11`
```text
What is included
- Firebase Authentication (email/password)
- Separate Firestore data for every authenticated user
- User-specific local cache namespaced by Firebase UID
[... source range continues ...]
- App state document at users/{uid}/app/state
- Firestore security rules
- Logout flushes the latest local state to Firestore before signing out
```

`subs.html:916-952`
```text
        function deleteSubject(id) {
            const subject = subjects.find(s => Number(s.id) === id);
            subjects = subjects.filter(s => Number(s.id) !== id);
            localStorage.setItem('subjects', JSON.stringify(subjects));
[... source range continues ...]
                }
            }
        }
```

`index.html:1557-1562`
```text
                        if (!existingTexts.includes(String(taskText).toLowerCase())) {
                            currentTasks.push({
                                id: Date.now() + Math.random(),
                                text: taskText,
                                done: false
                            });
```


### SEC-07 | Critical | Firestore catch-all rule is syntactically invalid, so the rules file may not publish

- **Evidence status:** Code-confirmed in the file; console/emulator compile check not run in this review. Deployed rules unknown.
- **Where:** firestore.rules:24-26 (line 25).
- **What/why:** `allow read, write: false;` is missing the `if` keyword. Firestore rules require `allow <methods>: if <condition>;`. A file with this line should be rejected when published in the console. README_SETUP.txt step 4 tells the team to publish this file, so either the publish failed and an older rule set (possibly test-mode or open rules) is still live, or the team edited it by hand. The good per-user rules above it only protect data if the file actually deploys.
- **If unresolved:** Live database protection is unknown. If an older permissive rule set is still deployed, anyone who has the public Firebase config (it is in every page) could read or write other students' data. If a compile error blocks publishing, none of the intended protection exists.
- **Where/what to change and why:** Owner opens Firebase console > Firestore > Rules and reads the live rules first. Change line 25 to `allow read, write: if false;` (the catch-all is also the default, so keeping it is only for clarity). Test in the Rules Playground or emulator as anonymous, owner and another user, then publish and record the version/time.
- **Acceptance check:** Publish succeeds with no compile error. Anonymous read of users/{any} is denied; owner read/write of own users/{uid} tree is allowed; a different signed-in user is denied; an unknown collection is denied.

`firestore.rules:24-26`
```text
    // Deny all other access by default
    match /{document=**} {
      allow read, write: false;
    }
```

### AUTH-06 | Medium | Sign-in trims the password but sign-up does not

- **Evidence status:** Code-confirmed; string behaviour reproduced in a safe isolated check.
- **Where:** loginform.html:641 (sign-in `.value.trim()`); loginform.html:714-715 (sign-up `.value`).
- **What/why:** A password that starts or ends with a space (or has a pasted trailing space) is stored exactly as typed at sign-up, but sign-in sends the trimmed text, so it can never match. The user sees a generic invalid-credential message.
- **If unresolved:** Some students are locked out of a correct account and can recover only through password reset.
- **Where/what to change and why:** Do not trim passwords at sign-in. Either keep them untrimmed at both ends or reject leading/trailing spaces at sign-up with a clear message. Do not change how email/username fields are trimmed.
- **Acceptance check:** Create an account with a password containing an edge space, sign out, sign in with the same text: succeeds. A password without spaces still works.

### AUTH-07 | Medium | Raw provider errors are shown and key Google/email error cases are not handled

- **Evidence status:** Code-confirmed gap; live behaviour untested.
- **Where:** loginform.html:602-605 (Google fallback `err.message`); loginform.html:693 and 802 (`|| error.message`); loginform.html:561-564 (redirect path leaves loading state).
- **What/why:** Only a few error codes have friendly text. `auth/account-exists-with-different-credential` (same email used with password and Google), `auth/unauthorized-domain` (a new Vercel domain not added to Firebase), `auth/operation-not-allowed` and `auth/popup-blocked` fall through to raw Firebase messages. After `signInWithRedirect` the function returns while the buttons stay in the loading state.
- **If unresolved:** Students see technical text such as an SDK error string, and on the live Vercel domain Google sign-in may fail with no clear guidance.
- **Where/what to change and why:** Add friendly messages for these codes. For an email collision say the email already has another sign-in method and ask the user to use it; do not silently link accounts without a team decision. Reset the button state on every non-redirect exit.
- **Acceptance check:** Each mapped code shows the intended plain-English message; no raw SDK text appears in sign-in, sign-up or Google flows.

### AUTH-08 | Low | Signed-in users can reopen the login page; username sign-in reveals whether a username exists

- **Evidence status:** Code-confirmed; low impact.
- **Where:** loginform.html (no onAuthStateChanged in the file); loginform.html:660-668 and 686.
- **What/why:** The login page never checks for an existing session, so a signed-in student who opens it sees the form again. Username sign-in throws `auth/user-not-found` on the client when the alias is missing, which prints a different message from a wrong password.
- **If unresolved:** Minor confusion and a small username-enumeration signal (SEC-03 already exposes the mapping collection).
- **Where/what to change and why:** Redirect an existing valid session to index.html. Use one generic message such as 'Invalid username/email or password' for both cases.
- **Acceptance check:** Open loginform.html while signed in: redirects. Unknown username and wrong password show the same message.

### DEP-02 | High | Vercel and Firebase deployment settings are not documented or verifiable

- **Evidence status:** Configuration gate; cannot be verified from a zip.
- **Where:** README_SETUP.txt:12-16 (only Live Server is described); loginform.html:554-562 (Google sign-in); env.js:97-122.
- **What/why:** The setup file never mentions the deployed domain. Firebase Authentication blocks Google sign-in, password-reset links and redirects on any domain that is not in its Authorized domains list, so a new *.vercel.app or custom domain needs adding. The Firebase web API key should be restricted by HTTP referrer in Google Cloud, the AI secret must be set as a private Vercel environment variable, and `.env` must not be deployed.
- **If unresolved:** The app can work locally but fail after deployment (Google sign-in or reset links), or expose more than intended.
- **Where/what to change and why:** Owner adds the Vercel domain to Authorized domains, restricts the Firebase API key by referrer, sets the server-side secret in Vercel settings (never in a file), confirms `/.env` returns not-found on the deployed site, then redeploys. Record what was changed.
- **Acceptance check:** On the deployed URL: email sign-up/sign-in, reset email link, Google popup and redirect all work; `/.env` and `/env.js` contain no secret; browser network tab shows no provider key.

### STRUCT-02 | Medium | global.css (about 53 KB) is not linked by any page

- **Evidence status:** Code-confirmed by searching all 10 HTML files; each page carries its own inline style block (login uses Tailwind).
- **Where:** global.css:1-888; no `<link ... global.css>` in any HTML file.
- **What/why:** The shared stylesheet is dead code. The v2 coverage table called it shared layout styles, which was wrong. Editing it changes nothing on screen, and it can mislead maintainers and viva questions about structure.
- **If unresolved:** Wasted maintenance effort, wrong 'mobile fix' edits that do nothing, and a misleading project structure.
- **Where/what to change and why:** Decide deliberately: remove it after confirming zero references (including JS and the iframe pages) or adopt it later by moving duplicated inline CSS in a separate, visually compared step. Do not simply add a `<link>`: it could restyle every page.
- **Acceptance check:** Search shows zero or only intended references; all 10 pages look identical at 390 and 1365 px before and after.

### AI-06 | Low | One hard-coded model at 8 call sites; empty or cut-off AI answers are treated as success

- **Evidence status:** Code-confirmed for hard-coding and fallback text; reasoning-token effect NOT reproduced (no API calls were made).
- **Where:** index.html:1538 and 2144; insights.html:689 and 857; notes.html:555; quiz.html:991; subs.html:561; time.html:1299 (all `openai/gpt-oss-120b`); index.html:2146 (`max_tokens: 1024`) and 2149 (`|| 'No response received.'`).
- **What/why:** If the provider retires or renames the model, every AI feature fails together. The chat treats an empty completion as a normal reply. Reasoning models can spend part of the token budget before writing visible text, so short budgets (chat 1024, topics 600, quiz 2000) may produce empty or truncated answers. This last point is a risk to verify, not a confirmed failure.
- **If unresolved:** Possible blank or cut-off answers during the demo and a single point of failure for all AI features.
- **Where/what to change and why:** Keep the model name in one server-side allow-list (the proxy from SEC-01). Read the provider's current token and reasoning parameters before changing budgets. Treat `finish_reason: length` and empty content as errors with a retry message.
- **Acceptance check:** Mocked empty content and `finish_reason: length` show a retry message and keep existing data; a real call returns normal answers for chat, topics, quiz, notes and insights.

### 4A. Checked and found fine (do not 'fix' these)

- Chat and note/quiz/insight text rendering escapes HTML before formatting (index.html renderMarkdown starts with escapeHTML).
- Password reset shows a generic success message for unknown emails.
- `users/{uid}` and its subcollections use a correct owner-only rule (firestore.rules:8-14), provided the file deploys (SEC-07).
- Firebase SDK is pinned to 10.12.0; no `eval`; no UTC date-key bug.
- Google sign-in has a sensible popup-then-redirect fallback.

## 5. Complete documentation-to-code traceability

The supplied doc lines 350-427 define 46 expected FRs. None is marked end-to-end passed here. Implemented means code exists, not live acceptance. Proposed roles (doc lines 100-348), proposed collections (584-730) and roadmap (1115 onward) remain proposals.

| Requirement | Actual snapshot status | Evidence | Issue links |
|---|---|---|---|

| FR-001 | Auth calls exist; service/provider configuration untested | loginform.html:415,554-562,670,761 | AUTH-01..05 |

| FR-002 | Observer exists, stale UID gate flawed | eduskill-sync.js:289-302 | AUTH-04 |

| FR-003 | Partial protected UI; direct-page/runtime test required | eduskill-sync.js:289-302 | AUTH-04 |

| FR-004 | Logout implemented; cleanup/sync reliability partial | eduskill-sync.js:257-285 | SYNC-06/10 |

| FR-005 | Error maps present; runtime untested | loginform.html:686-699,794-803 | AUTH-02/03 |

| FR-006 | Dashboard exists; offline layout inspected | dash.html:641-722 | ANALYTICS-01 |

| FR-007 | UID naming exists; hydrate/session/sync gaps | eduskill-sync.js:33-38,193-247 | SYNC-01..04 |

| FR-008 | Upcoming exam filter/sort exists | dash.html:785-813; index.html:1718-1762 | FUNC-02/03 |

| FR-009 | Task counts derive saved daily list | dash.html:768-782; prog.html:359-369 | SYNC-06 |

| FR-010 | Calculations exist, period/history labels incomplete | dash.html:848-911 | ANALYTICS-01/02 |

| FR-011 | Create subject implemented after AI topics | subs.html:602-643 | AI-01 |

| FR-012 | View subjects implemented | subs.html:761-839 | SEC-05 |

| FR-013 | No edit UI found | subs.html:602-643,761-839,916-950 | FUNC-07 |

| FR-014 | Delete exists, relationship/confirmation gaps | subs.html:916-939 | FUNC-08 |

| FR-015 | Owner tree rule exists; runtime/deployed rules untested | firestore.rules:8-13; eduskill-sync.js:177-184 | AUTH-04/SYNC-01 |

| FR-016 | Exam creation exists | subs.html:646-674 | FUNC-03 |

| FR-017 | Only nonempty date validation | subs.html:647-654 | FUNC-03 |

| FR-018 | Upcoming exams sorted | index.html:1723-1733 | FUNC-02 |

| FR-019 | Upcoming views filter past; badge does not | index.html:1731,1774 | FUNC-02 |

| FR-020 | Local midnight calendar policy implicit, not documented | insights.html:447-458; index.html:1722-1730 | FUNC-03/TIME-04 |

| FR-021 | Manual and AI task creation exist | index.html:1458-1576,1580-1591 | FUNC-05/06 |

| FR-022 | Completion state exists but manual UX is quiz-only | index.html:1686-1691; quiz.html:1102-1105 | FUNC-04/05 |

| FR-023 | Storage/cloud partially implemented, integrity gaps | eduskill-sync.js:155-247 | SYNC-01..06 |

| FR-024 | Weighted scheduling exists; durations/cache wrong | time.html:1174-1247,1385-1443 | TIME-01..04 |

| FR-025 | No provenance field | index.html:1557-1562,1585-1588 | FUNC-06 |

| FR-026 | AI create/save/view/delete; no ordinary note editor | notes.html:504-715 | NOTES-01/AI-01 |

| FR-027 | UID shim and owner rules; cloud untested | notes.html:10,436; firestore.rules:8-13 | SYNC-01..06 |

| FR-028 | Parser accepts fabricated/fractional answers | quiz.html:899-933 | QUIZ-01 |

| FR-029 | Scoring formula and >50 rule visible | quiz.html:1082-1088 | QUIZ-01 |

| FR-030 | Schema/educational truth not fully verified | quiz.html:923-931,1133-1157 | QUIZ-01/AI-01 |

| FR-031 | Task/topic metrics exist | prog.html:359-369; quiz.html:1212-1234 | FUNC-04 |

| FR-032 | Definitions partial; lifetime counter/history retention differs | prog.html:394-405; quiz.html:1276-1279 | QUIZ-02 |

| FR-033 | Charts derive data; historical topic line is misleading | dash.html:848-911 | ANALYTICS-02 |

| FR-034 | Several empty states/zero guards exist; full datasets untested | prog.html:359-383; dash.html:838-845 | AI-01 |

| FR-035 | Current mastery repeated as week history | dash.html:875-878 | ANALYTICS-02 |

| FR-036 | Groq payloads exist; no live service check | env.js:68-95; quiz.html:987-1005 | AI-02 |

| FR-037 | Study context built, timetable key broken | index.html:1477-1532 | FUNC-01 |

| FR-038 | Caught failures, but no timeout/consistent cloud status | env.js:68-95; index.html:2158-2166 | AI-02/SYNC-06 |

| FR-039 | JSON parsing not full schema validation | subs.html:571-584; notes.html:566-575 | AI-01/QUIZ-01 |

| FR-040 | Fails secret-protection requirement | env.js:17-18,53-57 | SEC-01/02 |

| FR-041 | Task AI appends rather than replaces; schedule regenerates without preview; provenance absent | index.html:1550-1569; time.html:1273-1279 | FUNC-06/TIME-04 |

| FR-042 | Fallback keys exist; organization quota cannot be bypassed | env.js:68-95; Groq rate-limit docs | AI-02/03 |

| FR-043 | Settings/profile/reminder fields present | settings.html:819-854 | SYNC-07 |

| FR-044 | Local writes present; cloud adapter broken | settings.html:34-48,847-854 | SYNC-01/07 |

| FR-045 | UI does not clearly distinguish local/cloud account state | settings.html:828-854 | SYNC-06/07 |

| FR-046 | Workspace reset confirms; subject deletion/truncation do not | settings.html:855-858; subs.html:916-950; notes.html:660-673 | SYNC-08/FUNC-08/NOTES-01 |


### Reminders and notification scope

`index.html:1850-1910` implements exam, custom and daily-study checks; `index.html:1916-1921` schedules page intervals. These only run while the page is open. No service worker/backend push mechanism is packaged. This is a verified limitation, not proof browser notification permission works. Do not promise reminders after tab closure; test denied permission, today/past reminders, foreground/background tab, duplicates and rescheduling. Durable notifications would be separately scoped new work.

### Non-functional and other document sections

- Usability (doc 431-434): most offline forms stack at 390px; task completion, profile save and aliases need repairs. No usability study was run.
- Performance (435-444): duplicated timers, full-state writes, 100-message chat and runtime Tailwind create measured-code risks; no load benchmark was run.
- Reliability (445-448): mocked adapter failure and write/hydration races prevent certification.
- Security (449-452): exposure and username rules contradict least privilege; owner-tree rules are present in the file but deployed version unknown.
- Maintainability (453-456): actual duplicated contracts justify small shared modules, not a new application framework.
- Accessibility (457-464): hover topics and custom dialogs/charts need keyboard/screen-reader checks.
- Compatibility (465-468): 18 modified offline viewport screenshots are not real-phone or cross-browser tests.
- Technology/architecture (469-582): Firebase compat 10.12.0, plain HTML/JS/CSS, browser Tailwind 4.3.3, Groq calls and Chart.js are present. No server backend is packaged. Save-success wording violates the doc's acknowledgement requirement at line 580.
- Data model (584-730): actual profile/alias/one-state-doc architecture must replace any statement that proposed entity collections already exist.
- AI design (732-792): server route is planned, client rotation exists; schema, timeout/privacy and trust-boundary gaps remain.
- Progress/UI (794-872): >50% quiz rule, current-day/task counters and heuristic formulas must be explicit; month/history and editing gaps must be disclosed.
- Security/errors (874-934): no live console or incident review was performed. UI needs visible persistence failures.
- Test/deploy criteria (936-1078): source has no automated test suite/deployment metadata. The acceptance list is pending, not passed.
- Risks/roadmap/acceptance (1079-1180): keep optional calendar integration, recurring tasks, push, exports and future analytics separate from submission fixes. Do not call absent optional features bugs.
- Glossary/future-assistant guidance/conclusion (1181-1369): RBAC in glossary does not establish an admin implementation. Embedded assistant directions were read as project content, not permissions to mutate/send/deploy.

## 6. Tests actually run and reproduction evidence

| ID | Test | Actual result | Scope |
|---|---|---|---|
| T01 | Original adapter bodies in isolated Node VM with strict Storage/Firebase mocks | Shared adapter: 1 write, no warning. Dashboard/Progress/Settings/Timetable: 0 writes, Illegal invocation warning | Confirms offending logic under mock, not real cloud behavior |
| T02 | Original parseQuestions with answer 99, one option; then answer 1.5 | 99 becomes 0, options padded; fractional 1.5 retained | Isolated function reproduction |
| T03 | Original topicMatchesTask with JavaScript task and Java topic | true | Confirms false text association |
| T04 | Original timetable numeric expressions | parseInt(0.5) || 2 gives 2; parseInt(2.5) gives 2 | Parsing reproduction, not full timetable execution |
| T05 | Node --check for all inline script blocks | 22 inline blocks and 3 JS files parsed, no syntax errors | Does not test runtime APIs/events |
| T06 | HTML duplicate IDs | None in all 10 pages | Does not validate missing handlers/references |
| T07 | Offline desktop/mobile layout | 18 PNGs inspected; forms mostly stack; timetable horizontal scroller visible | Auth/API/CDN/Chart.js disabled, dummy data; no real touch test |

Repeat with a throwaway local copy, masked keys, no .env and all external service calls disabled. Minimal pure-function cases: `parseQuestions('[{"question":"Q","options":["A"],"answer":99}]')`; `parseQuestions('[{"question":"Q","options":["A","B","C","D"],"answer":1.5}]')`; `topicMatchesTask('JavaScript','Java')`. Expected fixed result: invalid quiz records rejected and task/topic identity does not cross-match.

Additional safe checks are proposed in each finding, not already passed. Emulator/security tests, live auth, Google redirects, real reset/verification delivery, console policies, two-device sync, quotas and browser accessibility are outstanding. Do not use real leaked credentials to reproduce any of them.

## 7. Submission-safe repair sequence and structure

### Stage A: contain exposure and establish a baseline
Owner rotates all 3 exposed keys and reviews usage. Owner also reads the LIVE Firestore rules and fixes/publishes the catch-all line (SEC-07) before anything else touches data. Obtain a clean repository, commit SHA, authorized test environment and exact submission deadline. Branch from a known baseline. Inventory paths/keys/callers, record desktop/mobile baselines and back up data with the owner's approval. Owner secret setup stays outside chat and reports.

### Stage B: repair the common trust boundaries
Add the smallest Vercel server route that validates Firebase ID tokens, accepts only bounded approved study payloads, chooses an allowed model server-side and holds the provider secret only in server environment settings. Reuse the existing client call contract so every AI feature switches together. A new trusted JWT/Firebase verification dependency is justified if no installed mechanism exists; do not hand-roll verification to satisfy a no-dependency preference. Verify expiry/audience/issuer/signature; choose revocation/email-verification enforcement explicitly. Do not trust client UID, CORS or origin checks as authentication.

A publicly callable proxy without authentication/quota checks just moves abuse from the key to the endpoint. Per-user limits must survive serverless instances. An in-memory map alone is not a global quota guarantee. Start with a narrowly scoped persistent counter/transaction in existing infrastructure if suitable; document race/limit/latency and test concurrent requests. No new paid service without owner approval. Organization limits still apply across keys.

Tighten alias rules and provide compatible sign-in lookup or get explicit consent for email-only login. Validate schemas/output before persistence/rendering.

### Stage C: fix data integrity before cosmetic moves
Unify the five adapters, verify direct pages and shell; fix dirty queue, hydration failure, conflict/deletion policy and visible sync status. Profile/reset are separate contracts. A document split is conditional, not an automatic deadline rewrite. Back up, version, dry-run, verify and provide rollback before any migration.

### Stage D: submission-visible correctness
Fix wrong timetable key, badge/date policy, stable topic/task links, timetable duration/labels/cache and quiz schema. Resolve generic-task/editing/cascade/retention choices with team. Fix month/history labels and accessibility. Keep already working forms and design.

### Stage E: optional structure cleanup and release
First keep all current page URLs; extract only shared contracts. A minimal proposed tree is:

```text
index.html
loginform.html
dash.html / subs.html / time.html / prog.html / quiz.html / insights.html / notes.html / settings.html
global.css                # currently unlinked (STRUCT-02): remove or adopt in a separate visual-parity step
js/firebase-config.js    # public identifiers only
js/sync.js               # one storage/sync contract
js/ai-client.js          # existing helper signature, server route only
js/utils.js              # only repeated tested helpers
api/groq.js              # server-only token validation, bounded requests, provider call
firestore.rules
.env.example             # names + placeholders only
.gitignore
README.md
tests/                   # smallest runnable checks, no unnecessary framework
```

This is a proposed path plan, not evidence these files exist. After feature parity is demonstrated, optional pages/ and styles/ moves may be performed in a separate commit. Audit iframe.src, links, scripts, styles, assets, logout/login redirects, relative /api path and deployment routes. Keep redirects for old paths if they matter. Never bundle file moves, data migrations and auth changes into one unreviewable diff.

Use a preview deployment, verify rules separately from Vercel, smoke test all pages, then owner-approved push/release with a saved prior commit/deployment. A zip audit cannot establish repository ownership, access or current deployment status.

## 8. Unverified gates that must not become claims

- Classmates' exact repository/live URL, latest commit/history, ownership and collaborator permissions.
- Groq key validity, organization billing/limits, model availability for their account or evidence of abuse.
- Published Firestore rules (SEC-07 makes this the first thing to read), auth providers, authorized domains, email action configuration and enumeration protection.
- Real signup/password reset/email verification/Google popup and redirect, reauthentication, account link/collision behavior.
- Real browsers' Storage descriptors, iframe interactions, offline persistence, actual Firebase latency/denials, multi-device conflicts and rollback.
- Existing cloud document byte size, database/index costs and production load.
- Full login styling/CDN behavior, real charts, Safari/Android touch, keyboard and assistive technology coverage.
- College's outside-help/plagiarism policy, classmates' permission and viva expectations.
- Submission deadline, final deliverable acceptance, payment terms and support boundaries.

The team should disclose outside assistance as their college requires and understand/defend their own project. Outsiders are not inherently unsafe; access scope, secret isolation, IP/privacy terms, evidence and handover determine risk.

## 9. Private pricing brief for Manoj (refreshed 15 October 2026)

Keep this section private. Market numbers are marketplace and guide figures, not bids for this exact project. Currency approximations use about Rs 95 per USD (rate read in v2 from XE for 14 October 2026; not re-fetched). Rounded; excludes tax and fees.

### What the market publishes (read this session)

| Source | Figure | Approx INR | Limits |
|---|---|---|---|
| Fiverr JavaScript cost guide, 22 Apr 2026 | Bug-fixing services $7-120/hr; average project about $612; typical fixed-price bug resolution about $72; entry-level $7-25/hr; vanilla-JS small project $125-300 | Rs 665-11,400/hr; Rs 58,000 avg project; Rs 6,800 small bug | Marketplace averages, wide spread, mixes countries |
| Flexiple Firebase hiring pages, Aug 2026 | India freelance Firebase contractor modeled at about $12-13/hr; entry $11-18/hr in price-sensitive regions; mid $30-60/hr (Asia sometimes $18-45); security-hardening work $30-60/hr | About Rs 1,100-1,250/hr typical; Rs 1,700-4,300/hr mid in Asia | Modeled market rates, not quotes |
| JobRise India rates guide, 2026 | Beginner 0-1 yr, Indian clients Rs 300-800/hr; 1-3 yrs Rs 800-1,800/hr; extra revision hours about Rs 1,000/hr | As stated | Commercial blog, directional |
| Freelancer.com debugging page | Listed profiles about $10-40/hr | Rs 950-3,800/hr | Sample of profiles, not an average |
| v2 sources (not re-fetched): Hunarbox Rs 500-3,000 packages; Upwork $15-50/hr and $200-600 bug projects | See v2 | | Small seller packages are not comparable to security plus data work |

### What outsiders would likely charge for THIS project (planning estimates)

These are my estimates: estimated hours multiplied by the hourly ranges above. They are not quotes.

| Scope | Est. hours | Outside student / entry freelancer | Mid-level freelancer or small agency |
|---|---:|---|---|
| Audit only (find and document bugs) | 6-10 | Rs 3,000-10,000 | Rs 8,000-25,000 |
| Submission-critical fixes (keys/proxy, rules, sync, auth, task/quiz/timetable) | 25-40 | Rs 15,000-45,000 | Rs 40,000-1,20,000 |
| All 59 items plus clean structure plus deploy handover | 60-90 | Rs 40,000-1,00,000 | Rs 1,00,000-3,00,000 |

Why outsiders cost more: they start from zero (no existing audit), they need the same access, and they price for risk.

### What you can charge (recommendation, not a sourced fact)

| Package | Price | Scope | Limits |
|---|---:|---|---|
| A. Audit + prompt + team report (already produced) | Rs 2,500 | Verified audit, repair prompt, team walkthrough | No code changes or deployment |
| B. Submission rescue | Rs 8,000 | Agreed priority IDs: AI key routing, Firestore rules fix, shared sync baseline, auth gaps, critical task/quiz/timetable fixes, smoke checklist | Exclude new features, data migration, full accessibility certification, unlimited revisions |
| C. Rescue + release handover | Rs 12,000-14,000 | B plus clean structure, README, FR traceability, Vercel/Firebase setup support, 7 days defect support | Service bills paid by team; live access required |
| D. New features / migration | Separate quote | Edit flows, history analytics, storage redesign | Quote after a trial |

Position it per team, not per head. If 4-5 classmates split package B or C, each pays about Rs 1,600-3,500, far below any outside quote. Planning model: 20-28 focused hours at Rs 450-500/hr gives Rs 9,000-14,000 before overhead; this is a budgeting model, not measured time. Because Antigravity does much of the typing, price your outcomes, testing and responsibility, not typing time.

Suggested terms to discuss: 30% start, 40% at accepted preview, 30% at handover; two review rounds; support covers regressions you introduce, not provider outages or new features; hosting/API costs billed to the team; a written scope by issue ID before any money moves. Check your college's rules on paid help and disclosure first.

### Risks if the team gives this to an outside person

1. The zip contains real Groq keys and a .env: any outsider receives live credentials (SEC-01/02). Rotate first and share a secret-free copy.
2. Outsiders can see student profile data if given console access; give least-privilege roles and test accounts only.
3. A rushed rewrite near the deadline can break the demo; no one else knows the existing flow.
4. The team may not be able to explain the code in the viva.
5. Unclear ownership, scope and payment cause disputes; code could be reused or posted publicly.
6. College rules on outside help or plagiarism may apply.
The same controls apply to you: least-privilege access, written scope, branch, backups, handover walkthrough. Do not tell classmates outsiders are always unsafe.

### Experience claims

The earlier files cite the public WEBISCRAP repository (manoj-n-dev) and IRIS-X-STUDIO collaborator work. I could not independently re-verify these in this session (web searches returned unrelated people). Before you send anything: open your own repo, confirm what is true, and state only what you can show. Say 'contributor' not 'sole author'.

## 10. Sources and freshness

External pages were actually fetched unless stated otherwise. Vendor/official docs support platform mechanics; marketplace listings/guides support only the stated price examples. Snapshot files support project findings. No source establishes the college policy or live project readiness.


- Ponytail full rules: https://github.com/DietrichGebert/ponytail/blob/main/skills/ponytail/SKILL.md

- Ponytail compact rules: https://github.com/DietrichGebert/ponytail/blob/main/AGENTS.md

- Ponytail repository: https://github.com/DietrichGebert/ponytail/blob/main/README.md

- Groq credential security: https://console.groq.com/docs/production-readiness/security-onboarding

- Groq organization quotas: https://console.groq.com/docs/rate-limits

- Firestore size limits: https://firebase.google.com/docs/firestore/quotas

- Firestore transactions: https://firebase.google.com/docs/firestore/manage-data/transactions

- Firestore ownership conditions: https://firebase.google.com/docs/firestore/security/rules-conditions

- Firebase user management: https://firebase.google.com/docs/auth/web/manage-users

- Firebase backend ID token verification: https://firebase.google.com/docs/auth/admin/verify-id-tokens

- Firebase public configuration identifiers: https://firebase.google.com/docs/projects/api-keys

- Browser Storage API: https://developer.mozilla.org/en-US/docs/Web/API/Storage

- Tailwind browser compiler guidance: https://tailwindcss.com/docs/installation/play-cdn

- Vercel functions: https://vercel.com/docs/functions

- Hunarbox seller packages: https://hunarbox.in/service/business-websites/bug-fixing/

- Rinto India guide: https://tryrinto.com/blog/freelance-developer-rates-india

- Upwork developer cost: https://www.upwork.com/hire/web-developers/cost/

- Upwork bug-fix cost: https://www.upwork.com/hire/bug-fixes-freelancers/

- Fiverr full-stack guide: https://www.fiverr.com/resources/guides/costs/full-stack-web-developer

- XE currency conversion: https://www.xe.com/en-us/currencyconverter/convert/?Amount=1&From=USD&To=INR

- Manoj public portfolio: https://github.com/manoj-n-dev/WEBISCRAP


Not checked: live services, real auth/mail, published rules, real phones, latest GitHub/Vercel, billing and college policy. Main risks: exposed browser credentials and unresolved data integrity; do not release until the applicable acceptance checks pass.


## Appendix: repeatable offline mock checks

Save this as offline-checks.cjs in a secret-free throwaway copy with the original root files beside it. It uses only local code and mocked Storage/Firebase; it makes no fetch calls and never prints credentials. Node is required. It reports current observed defects; assertions must be updated to the correct expected behavior after fixes. The adapter mock is deliberately strict about the native length getter; a real-browser check remains required.

```javascript
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=process.cwd()+'/';
function fn(file,name){const t=fs.readFileSync(root+file,'utf8'); const start=t.indexOf('function '+name+'(');assert(start>=0);let a=t.indexOf('{',start),depth=0,inStr=false; // all selected functions end at next function declaration
let end=t.indexOf('\n        function ',a+1);if(end<0)end=t.length;return t.slice(start,end).trim();}
let c={};vm.createContext(c);vm.runInContext(fn('quiz.html','parseQuestions'),c);
assert.equal(c.parseQuestions('[{"question":"Q","options":["A"],"answer":99}]')[0].answer,0);
assert.equal(c.parseQuestions('[{"question":"Q","options":["A"],"answer":1.5}]')[0].answer,1.5);
console.log('T02: invalid quiz answer 99 fabricated as index 0; fractional index 1.5 retained; missing options padded.');
c={};vm.createContext(c);vm.runInContext(fn('index.html','stripTaskPrefix')+'\n'+fn('index.html','topicMatchesTask'),c);
assert.equal(c.topicMatchesTask('JavaScript','Java'),true);console.log('T03: JavaScript task matches Java topic.');
console.log('T04: timetable parsing: parseInt(0.5)||2 =',parseInt('0.5')||2,'; parseInt(2.5)=',parseInt('2.5'));
async function adapter(file){
 class Storage {constructor(){this.m=new Map()} get length(){if(this===Storage.prototype) throw new TypeError('Illegal invocation');return this.m.size}getItem(k){return this.m.get(String(k))??null}setItem(k,v){this.m.set(String(k),String(v))}removeItem(k){this.m.delete(k)}clear(){this.m.clear()}key(i){return [...this.m.keys()][i]??null}}
 let logs=[],writes=[];const ls=new Storage();ls.setItem('__eduskill_active_uid','u1');ls.setItem('eduskill_user_u1__subjects','[]');let obs;
 const db={collection:()=>({doc:()=>({get:async()=>({exists:false}),set:async()=>{},collection:()=>({doc:()=>({get:async()=>({exists:true,data:()=>({data:{subjects:[]}})}),set:async(d)=>writes.push(d)})})})})};
 const auth={onAuthStateChanged:f=>obs=f,signOut:async()=>{}};
 const firebase={apps:[{}],auth:()=>auth,firestore:()=>db};firebase.firestore.FieldValue={serverTimestamp:()=>0};
 let timers=[];const win={firebase,localStorage:ls,sessionStorage:new Storage(),dispatchEvent:()=>{},setTimeout:f=>timers.push(f),clearTimeout:()=>{},location:{pathname:'/index.html',reload:()=>{}}};win.top=win;
 const ctx={window:win,firebase,Storage,localStorage:ls,sessionStorage:win.sessionStorage,location:win.location,console:{warn:(...x)=>logs.push(x.join(' '))},CustomEvent:class{},setTimeout:win.setTimeout,clearTimeout:()=>{}};
 vm.createContext(ctx); let code=file.endsWith('.js')?fs.readFileSync(root+file,'utf8'):fs.readFileSync(root+file,'utf8').match(/<script>\s*(\(function[\s\S]*?)<\/script>/)[1];
 vm.runInContext(code,ctx);obs({uid:'u1',email:'a@example.invalid'});await new Promise(r=>setImmediate(r));ls.setItem('test',1);for(const f of timers)await f();await new Promise(r=>setImmediate(r));
 console.log('T01 '+file+': writes='+writes.length+'; warnings='+logs.join('; '));
 return {file,writes:writes.length,logs};
}
(async()=>{for(const f of ['eduskill-sync.js','dash.html','prog.html','settings.html','time.html'])await adapter(f);})();

```

- Fiverr JavaScript developer cost guide (22 Apr 2026): https://fiverr.com/resources/guides/costs/javascript-developer
- Flexiple Firebase developer cost: https://flexiple.com/cost-to-hire/firebase-developer
- Flexiple Firebase India market page (Aug 2026): https://flexiple.com/hire/firebase
- JobRise freelance developer India rates 2026: https://jobrise.io/hi/blog/freelance-developer-india-2026-rates/
- Freelancer.com debugging experts: https://www.freelancer.com/hire/debugging
- Firebase Security Rules language (allow ... : if ...): https://firebase.google.com/docs/firestore/security/rules-structure
