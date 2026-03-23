# LeetRepeat — Project Status

> **Generated:** 2026-03-23  
> **Compared against:** [PLAN.md](./PLAN.md) (v1.1, 2026-03-23)

---

## Summary

**Feature freeze as of 3/22/26.** The app is done enough. Phase 1 and Phase 2 are fully complete. Phase 3 core items are shipped (analytics, mock interview, drill, countdown, streaks, dashboard redesign, simplified attempt form, 3-tab nav). All remaining feature work is tabled until 50 LeetCode problems are completed. The only work in scope now is **usability improvements** — making it easier/faster to log attempts and see what needs review.

---

## Bug Fixes (3/23/26)

| Bug                                            | Fix                                                                                                                                                                                                             |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Readiness score always clamped to 100 (S tier) | `src/lib/srs.ts` — `Math.round(score * 100)` → `Math.round(score)`. The weighted sum already yields a 0–100 value; the `* 100` multiplied it into 0–10000, which then clamped to 100 for any non-trivial usage. |

---

## Personal Data Note

Historical activity was backfilled using a **local-only, gitignored script** (`scripts/seed-my-history.ts`). This script:

- Is excluded from version control (listed in `.gitignore`) — it is **never committed to the repo**
- Makes **no schema changes** — it only inserts rows into the existing `attempts` and `userProblemStates` tables using the same API the app itself uses
- Has **no impact on other users or fresh installs** — every new user starts with a clean slate; the script is tied to a single account by user ID
- Introduces **no migrations, no tech debt, and no structural changes** — it is a one-time local database operation, not a feature

Fresh clones of this repo run `scripts/seed.ts` to get problem metadata only. No user activity data is ever committed or shared.

---

## Phase 1 — Foundation ✅ COMPLETE

| Roadmap Item                                                    | Status |
| --------------------------------------------------------------- | :----: |
| Initialize Next.js project (App Router, TypeScript, Tailwind)   |   ✅   |
| Configure Drizzle ORM + PostgreSQL connection (Supabase)        |   ✅   |
| Define Drizzle schema + generate initial migration              |   ✅   |
| Implement database seed script (`problems.json` → Problem rows) |   ✅   |
| Set up NextAuth with GitHub OAuth                               |   ✅   |
| Build Problem List page (browse, filter by category/difficulty) |   ✅   |
| Build Problem Detail page (problem info, LC/NC links)           |   ✅   |
| Build Attempt Form (streamlined 3-step flow — §FR-3)            |   ✅   |
| Build attempt submission API (Attempt + UserProblemState)       |   ✅   |

---

## Phase 2 — The Brain ✅ COMPLETE

| Roadmap Item                                              | Status |
| --------------------------------------------------------- | :----: |
| Implement stability calculation logic (§6.2)              |   ✅   |
| Implement retrievability computation (§6.1)               |   ✅   |
| Build review queue query and API route (§6.3)             |   ✅   |
| Build Review Queue page with skip-with-reason             |   ✅   |
| Review feedback button ("too early / too late")           |   ✅   |
| Implement readiness score computation (§7.1)              |   ✅   |
| Implement tier assignment (§7.2)                          |   ✅   |
| Build Dashboard (unified hub — §FR-6)                     |   ✅   |
| Add complexity comparison logic (auto-flag correctness)   |   ✅   |
| Alternate complexity acceptance (`alternateComplexities`) |   ❌   |

---

## Phase 3 — Polish (PARTIAL)

| Roadmap Item                                    | Status | Notes                                                                                                       |
| ----------------------------------------------- | :----: | ----------------------------------------------------------------------------------------------------------- |
| Build Stats page (charts, retention, category)  |   ✅   | Category breakdown, difficulty progress, retention dist, quality, history                                   |
| Target date countdown                           |   ✅   | Client-side countdown on dashboard. Configurable date + problem count in localStorage. On-track projection. |
| Study plan generator ("12-week plan D→B")       |   ❌   | Not started                                                                                                 |
| Mock interview mode                             |   ✅   | Weak-category targeting, 45-min timer, 1 medium + 1 hard                                                    |
| Pattern-based drill mode                        |   ✅   | Category picker with per-problem retention, sorted weakest-first                                            |
| NeetCode 250 support                            |   ❌   | Schema supports it (`listSource` enum) but no data or pipeline work                                         |
| Data export (JSON download)                     |   ❌   | Not started                                                                                                 |
| Settings page (target date, account management) |   ❌   | No `/settings` route. Target date is handled client-side on dashboard for now.                              |
| Weekly review summary / calendar integration    |   ❌   | Not started                                                                                                 |
| Mobile-responsive layout pass                   |   ❌   | Not done as a dedicated pass                                                                                |
| Onboarding flow for new users                   |   ❌   | Empty dashboard exists but no first-time guidance walkthrough                                               |
| Streak tracking                                 |   ✅   | Current + best streak computed from attempt dates, displayed on dashboard                                   |
| Dark mode                                       |   ✅   | Theme toggle + localStorage persistence (moved from Phase 4)                                                |
| Nav consolidation                               |   ✅   | 3 primary tabs: Dashboard, Drill, Mock. Other pages accessible via links.                                   |

---

## Phase 4 — Stretch

| Roadmap Item                                       | Status | Notes                                  |
| -------------------------------------------------- | :----: | -------------------------------------- |
| Problem difficulty calibration from aggregate data |   ❌   |                                        |
| Custom problem support                             |   ❌   |                                        |
| Dark mode (moved to Phase 3)                       |   ✅   | Theme toggle + persistence implemented |
| Keyboard shortcuts for review flow                 |   ❌   |                                        |
| Public sharing (shareable readiness profile)       |   ❌   |                                        |
| Additional language support for code storage       |   ❌   | Code stored as plain text, no lang tag |

---

## Functional Requirements — Gap Analysis

### FR-1: Problem Database

| Requirement                                       | Status | Gap                                                                                                             |
| ------------------------------------------------- | :----: | --------------------------------------------------------------------------------------------------------------- |
| FR-1.1: Store NeetCode 150 with full metadata     |   ✅   | —                                                                                                               |
| FR-1.2: Seed from `problems.json`                 |   ✅   | —                                                                                                               |
| FR-1.3: Filter/sort by category, difficulty, etc. |   ⚠️   | Filters exist for category/difficulty/Blind75/search. Missing: completion status filter, retention level filter |
| FR-1.4: Extensible to NeetCode 250 / custom       |   ⚠️   | Schema supports it, no implementation yet                                                                       |

### FR-2: User Accounts

| Requirement                        | Status | Gap                                                |
| ---------------------------------- | :----: | -------------------------------------------------- |
| FR-2.1: GitHub or Google OAuth     |   ⚠️   | GitHub only. Google OAuth not configured.          |
| FR-2.2: Private workspace per user |   ✅   | All queries scoped to `userId`                     |
| FR-2.3: Set target interview date  |   ❌   | Column exists in schema but no UI to set/update it |
| FR-2.4: Export data as JSON        |   ❌   | Not implemented                                    |

### FR-3: Attempt Logging

| Requirement                                             | Status | Gap                                                                                      |
| ------------------------------------------------------- | :----: | ---------------------------------------------------------------------------------------- |
| FR-3.1: Log attempt with all fields                     |   ✅   | Streamlined 3-step flow: outcome → quality → details. Code is textarea (not CodeMirror). |
| FR-3.2: Auto-compare complexity + flag mismatches       |   ✅   | Normalization + comparison done server-side                                              |
| FR-3.3: Attempt history preserved, viewable per problem |   ❌   | Attempts are stored but **not displayed** on the problem detail                          |
| FR-3.4: Most recent attempt drives SRS update           |   ✅   | —                                                                                        |

### FR-4: Spaced Repetition Scheduling

| Requirement                                         | Status |
| --------------------------------------------------- | :----: |
| FR-4.1: Stability + retrievability per user-problem |   ✅   |
| FR-4.2: Stability recalculated on each attempt      |   ✅   |
| FR-4.3: Daily review queue sorted by priority       |   ✅   |
| FR-4.4: Users can work on any problem at any time   |   ✅   |

### FR-5: Interview Readiness Scoring

| Requirement                                                | Status | Gap                                                                                          |
| ---------------------------------------------------------- | :----: | -------------------------------------------------------------------------------------------- |
| FR-5.1: Overall readiness score (coverage, retention, etc) |   ✅   | 4/5 metrics active (pace not implemented)                                                    |
| FR-5.2: Tier assignment (S/A/B/C/D)                        |   ✅   | —                                                                                            |
| FR-5.3: Surface weak categories                            |   ✅   | Bottom 5 shown on dashboard                                                                  |
| FR-5.4: Target date pace projection                        |   ⚠️   | Client-side on-track projection on dashboard (problems/day needed). No full tier projection. |

### FR-6: Dashboard

| Requirement                                            | Status | Gap                                                                                                   |
| ------------------------------------------------------ | :----: | ----------------------------------------------------------------------------------------------------- |
| FR-6.1: Tier, score, due today/week, days until target |   ✅   | Tier, score, due-today count, countdown to target date with days remaining. No "due this week" count. |
| FR-6.2: Category coverage heatmap                      |   ✅   | Weak categories shown with avg R + toggleable full category view                                      |
| FR-6.3: Streak / consistency indicator                 |   ✅   | Current streak + best streak displayed prominently in quick stats                                     |
| FR-6.4: Quick link to start review queue               |   ✅   | Review queue on dashboard with direct "Review" links to attempt form                                  |

### FR-7: Analytics

| Requirement                                       | Status | Gap                                                    |
| ------------------------------------------------- | :----: | ------------------------------------------------------ |
| FR-7.1: Problems solved over time (line chart)    |   ✅   | Attempt history bar chart (last 30 days)               |
| FR-7.2: Retrievability distribution (histogram)   |   ✅   | Strong/Good/Fading/Weak/Critical histogram             |
| FR-7.3: Category breakdown with avg retention     |   ✅   | Color-coded bars by retention                          |
| FR-7.4: Time spent trends (solve + study)         |   ⚠️   | Summary totals shown (total/avg) but no trend chart    |
| FR-7.5: Improvement trends (quality + confidence) |   ❌   | Not implemented — no per-problem improvement over time |

---

## Other Observations

### Schema vs. Plan Gaps

- **`patternTags`** — defined in the plan's data model but **not in the Drizzle schema**. All `problems.json` entries have `"patternTags": []`. The column doesn't exist in the DB. This blocks future pattern-based filtering and cross-cutting drill modes.
- **`alternateComplexities`** — called out in the plan (§12, Q1) but not implemented. Would reduce false-negative complexity comparisons.
- **`retrievability`** — the plan shows this as a stored column on `UserProblemState`. In practice it's computed on-the-fly from `stability` and `lastReviewedAt`, which is correct (no stale data). The schema column was correctly omitted.

### Landing Page

- Plan says `/` should show product info + sign in for unauthenticated users. Currently it just redirects everyone to `/dashboard`. There's no marketing/landing page.

### Code Editor

- Plan originally specified CodeMirror 6 for syntax highlighting in the attempt form. Currently using a plain `<textarea>` behind a collapsible "Add code" toggle. This is intentional for the simplified design — CodeMirror 6 upgrade is a nice-to-have.

### Attempt History on Problem Detail

- FR-3.3 says users should be able to view all past attempts for any problem. The problem detail page currently shows the problem info, notes, and complexity — but **no attempt history section**. Past attempts are stored in the DB but there's no UI to view them per-problem.

### Problem List Filters

- Plan specifies filters for completion status and retention level. Currently only: search, difficulty, category, and Blind 75 toggle. Adding "Attempted / Not Attempted" and "Retention: Strong / Fading / Weak" filters would be useful.

---

## Current Focus: Usability Only

> Feature freeze in effect. Only changes that make logging/reviewing faster are in scope.

### In Scope (usability improvements)

1. **Attempt history on problem detail page** — see past attempts inline so you know your history before reviewing
2. **Problem list filters** — add "Attempted / Not Attempted" and retention-level filters for quick navigation
3. **Reduce friction in logging flow** — fewer clicks from dashboard → attempt → back to dashboard
4. **Surface R/S/next review date on problem detail** — so you can see SRS state without going to dashboard

### Tabled (resume after 50 problems)

- Settings page, Google OAuth, data export, CodeMirror, study plan generator, weekly summaries, NeetCode 250, mobile layout, onboarding, pattern tags, keyboard shortcuts, landing page, alternate complexities, custom problems, improvement/time trend charts

---

## Ideas That Came Up During Review

1. **Attempt diff view** — when viewing attempt history, show a side-by-side or inline diff of code between attempt N and N-1. The data is already stored; this is purely a UI feature. Would be a strong "wow" feature for the README.

2. **Dashboard "due this week" count** — the plan calls for it (FR-6.1) and it's trivial to add alongside "due today". Just query `nextReviewAt <= now() + 7 days`.

3. **Consistency streak on dashboard** — ✅ Now implemented. Current + best streak shown in quick stats.

4. **Readiness score trend** — store daily snapshots of the readiness score (or compute from attempt history). Show a line chart on the dashboard: "Your score over the last 30 days." Gives a sense of momentum that the current static number doesn't.

5. **"Quick review" mode** — instead of navigating to LeetCode, let users do a flashcard-style review: show problem title → mentally recall approach → reveal optimal complexity + their notes → rate confidence (1-5). Faster than a full attempt for maintenance reviews of mastered problems. Would dramatically increase review throughput for high-S problems.

6. **Problem detail page is underutilizing data** — it has the problem info and notes, but doesn't show: current R and S values, next review date, total attempts, best quality achieved, or the complexity comparison results from past attempts. All of this data exists in `UserProblemState` and `Attempt`. Surfacing it would make the page much more useful.

7. **Review queue problem count in nav** — show a badge on the "Review" nav link with the number of due problems. Constant gentle nudge without requiring the user to click into the page.

8. **Bulk skip in review queue** — when 15+ problems are due, let users bulk-skip by category ("skip all Easy Arrays problems"). The skip-with-reason API already exists; this is a UI convenience.
