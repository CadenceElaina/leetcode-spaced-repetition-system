# Spaced Repetition LeetCode Tracker — Project Plan

> **Last updated:** 2026-03-17
> **Status:** Planning

---

## 1. What Is This?

A free web app for tracking spaced repetition practice on LeetCode/NeetCode problems. Users log their attempts, confidence, and performance on each problem. The app schedules reviews using a decay-based algorithm (like Anki but purpose-built for coding problems) and tells you how prepared you are for interviews at different company tiers.

**The gap:** No free tool combines a curated problem list (NeetCode 150/250) + structured per-problem tracking (code, notes, solve metrics) + spaced repetition scheduling + interview readiness scoring. Anki can't do code well. LeetCode doesn't do spaced repetition. NeetCode tracks completion but not retention.

---

## 2. Tech Stack

| Layer          | Choice                             | Why                                                                                                                                                                                               |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**  | Next.js 14 (App Router)            | React + SSR + API routes in one. Massively in-demand. You already know React/TS.                                                                                                                  |
| **Language**   | TypeScript                         | You can already claim this. Next.js is TS-first. In-demand everywhere.                                                                                                                            |
| **Database**   | PostgreSQL                         | **This is the big win.** Your most urgent skill gap. Learning Postgres here on a lighter project before Vireofi v2 is ideal. Relational data (users, problems, attempts, reviews) fits perfectly. |
| **ORM**        | Drizzle ORM                        | Type-safe, SQL-like query syntax — you write queries that look like real SQL. Teaches relational thinking that maps directly to JPA/Hibernate. Lightweight, fastest-growing TS ORM.               |
| **Auth**       | NextAuth.js (Auth.js v5)           | Standard for Next.js. GitHub/Google OAuth + optional credentials. Free.                                                                                                                           |
| **Styling**    | Tailwind CSS                       | Fast to build with. In-demand. You don't need a component library for MVP.                                                                                                                        |
| **Deployment** | Vercel (app) + Supabase (db)       | Both have generous free tiers. Supabase gives you hosted Postgres for free.                                                                                                                       |
| **Scraper**    | Python script (one-time/on-demand) | Python for scraping NeetCode problem metadata. Runs locally or as a script, not a service.                                                                                                        |

### Stack Rationale

This stack is **not** a detour from your goals — it directly builds toward them:

- **PostgreSQL** — you need this for Vireofi v2 and it's your biggest gap. Learning it here (simpler schema, lower stakes) means you hit Vireofi v2 already comfortable with SQL, migrations, relational modeling.
- **TypeScript + Next.js** — you already have React/TS from Finch. Next.js is the natural next step and is arguably the most in-demand React framework right now.
- **Drizzle ORM** — unlike Prisma (which hides SQL behind its own DSL), Drizzle has you writing SQL-shaped queries in TypeScript. Joins, where clauses, group bys — they look like SQL. This directly builds the relational thinking you need for JPA/Hibernate + raw SQL in Spring Boot.

This is NOT a resume project (Vireofi v2 is). This is a **tool you actually use** that, as a side effect, teaches you Postgres before you need it.

---

## 3. Core Features (MVP)

### 3.1 Problem Database

- NeetCode 150 at launch. NeetCode 250 as fast follow.
- Each problem has: title, LeetCode URL, NeetCode category, difficulty, optimal time complexity, optimal space complexity, pattern tags.
- **Scraper builds this.** Python script scrapes NeetCode's problem list + known complexities. Output is a JSON seed file that gets imported into Postgres. We curate/verify the complexity answers manually or from known sources — this is a one-time effort for 150 problems.

### 3.2 Per-Problem Tracking

When a user works on a problem, they log an **attempt** with these fields:

| Field                            | Type                                                               | Notes                                                              |
| -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Solved independently?            | Yes / Partial / No                                                 | Did you get to a working solution without looking anything up?     |
| Solution quality                 | Optimal / Suboptimal-but-works / Brute force / No working solution | Self-reported, but we validate complexity if they claim optimal    |
| Time complexity (user's answer)  | Free text (e.g., "O(n log n)")                                     | We compare against known optimal and flag if wrong                 |
| Space complexity (user's answer) | Free text                                                          | Same                                                               |
| Time spent solving               | Minutes (cap guidance: 20 min)                                     | Timer optional — user can enter manually                           |
| Time spent studying solution     | Minutes                                                            | After giving up or finishing, how long reviewing the editorial?    |
| Rewrote from scratch?            | Yes / No / Didn't attempt                                          | After walking away + putting away notes, could you rewrite it?     |
| Confidence level                 | 1-5                                                                | Gut feeling. 1 = "no clue", 5 = "could do this in my sleep"        |
| Code                             | Text (code editor field)                                           | Their solution. Stored as text, syntax highlighted, NOT executed.  |
| Notes / scratch work             | Rich text or markdown                                              | Approach thoughts, edge cases, patterns recognized, mistakes made. |

### 3.3 Spaced Repetition Algorithm

**Base model:** Modified FSRS (Free Spaced Repetition Scheduler) — the algorithm behind modern Anki. Simpler than SM-2 and better calibrated.

**Core concept:**

Each problem has a **stability** value $S$ (how long until you forget it) and a **retrievability** value $R$ (probability you can still solve it right now).

$$R(t) = e^{-t / S}$$

Where $t$ = days since last review, $S$ = stability in days.

**How stability is calculated from attempt data:**

| Signal                            | Impact on $S$                                                  |
| --------------------------------- | -------------------------------------------------------------- |
| Solved independently = Yes        | Large $S$ boost                                                |
| Solution quality = Optimal        | Large $S$ boost                                                |
| Correct time/space complexity     | Moderate $S$ boost                                             |
| Rewrote from scratch successfully | **Largest $S$ boost** (strongest signal of true understanding) |
| High confidence (4-5)             | Small $S$ boost                                                |
| Solved quickly (< 10 min)         | Small $S$ boost                                                |
| Solved independently = No         | $S$ stays low or resets                                        |
| No working solution               | $S$ resets to minimum                                          |

**Decay behavior:**

- **"Mastered" problems** (high $S$): Decay slowly. At $R = 0.7$ they appear as low-priority "maintenance reviews" — a gentle nudge, not urgent.
- **Struggling problems** (low $S$): Decay fast. They resurface within 1-3 days.
- **Floor:** No problem's $R$ ever drops below 0.3 from decay alone. This prevents mastered problems from looking like you've never seen them — they just get a "hey, might want to revisit" flag.
- **Each successful review increases $S$** — so intervals grow: 1 day → 3 days → 7 days → 14 days → 30 days → 90 days, etc.

### 3.4 Review Queue

Priority queue sorted by: `priority = (1 - R) * weight`

Where `weight` factors in:

- Problem importance (NeetCode 150 > NeetCode 250 > extras)
- Category coverage (if user is weak on graphs, graph problems get boosted)
- Difficulty tier (mediums weighted higher than easies for interview prep)

**Daily review screen:** "Here are today's problems to review" — ordered by priority. User can also browse the full list and work on anything.

### 3.5 Interview Readiness Scoring

**User sets a target date** (e.g., "I need to be ready by October 2026").

The system calculates:

- **Coverage:** What % of NeetCode 150 categories have you solved at least X problems in?
- **Retention:** What % of problems you've done have $R > 0.8$?
- **Consistency:** Are you reviewing on schedule?
- **Pace:** At your current rate, will you cover enough problems by the target date?
- **Weak spots:** Which categories have the lowest average $R$?

### 3.6 Tier Definitions

You're right — NeetCode 150 alone is NOT "FAANG-ready" for most people. It's a solid foundation but top-tier companies regularly pull from outside that list. More honest tiers:

| Tier  | Name                                      | Criteria                                                                                                                                                               |
| ----- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S** | Top-tier ready (FAANG/HFT)                | NeetCode 150 mastered ($R > 0.85$ avg) + NeetCode 250 at $R > 0.7$ + can handle hards in 30 min + strong across ALL categories including DP, graphs, advanced patterns |
| **A** | Strong (unicorns, top startups, banks)    | NeetCode 150 at $R > 0.8$ avg + 50+ from NeetCode 250 at $R > 0.7$ + comfortable with mediums in 20 min + covers all major categories                                  |
| **B** | Solid (mid-tier companies, most startups) | NeetCode 150 at $R > 0.7$ avg + mediums solvable in 25 min + most categories covered                                                                                   |
| **C** | Getting there                             | 75+ problems at $R > 0.6$ + comfortable with easies, attempting mediums                                                                                                |
| **D** | Early stage                               | < 75 problems or low retention                                                                                                                                         |

These are calibratable. We can adjust thresholds over time. The point is: the app gives you an honest, data-driven answer to "am I ready?" instead of vibes.

---

## 4. Data Model (Drizzle Schema Sketch)

```
User
  id
  email
  name
  targetDate          // interview readiness target
  createdAt

Problem
  id
  title
  leetcodeUrl
  neetcodeCategory    // "Arrays & Hashing", "Two Pointers", etc.
  difficulty          // Easy, Medium, Hard
  listSource          // NEETCODE_150, NEETCODE_250, CUSTOM
  optimalTimeComplexity
  optimalSpaceComplexity
  patternTags         // ["sliding-window", "hashmap"]

Attempt
  id
  userId              → User
  problemId           → Problem
  solvedIndependently // YES, PARTIAL, NO
  solutionQuality     // OPTIMAL, SUBOPTIMAL, BRUTE_FORCE, NONE
  userTimeComplexity
  userSpaceComplexity
  timeComplexityCorrect  // computed: does it match optimal?
  spaceComplexityCorrect // computed
  solveTimeMinutes
  studyTimeMinutes
  rewroteFromScratch  // YES, NO, DID_NOT_ATTEMPT
  confidence          // 1-5
  code                // text blob
  notes               // text/markdown blob
  createdAt

UserProblemState
  id
  userId              → User
  problemId           → Problem
  stability           // S value (days)
  lastReviewedAt
  nextReviewAt        // computed from S and target R threshold
  totalAttempts
  bestSolutionQuality
  isCompleted         // user manually checks it off
  createdAt
  updatedAt
```

Key relationships:

- A User has many Attempts, many UserProblemStates
- A Problem has many Attempts, many UserProblemStates
- UserProblemState is the "current status" of a user's relationship with a problem (1:1 per user-problem pair)
- Attempt is the history log (many per user-problem pair)

---

## 5. Scraper Plan

**What we scrape:** NeetCode's problem lists (150 and 250) — titles, LeetCode links, categories, difficulty.

**What we curate manually (or from a known source):** Optimal time/space complexity per problem. This data isn't reliably scrapable — editorial solutions vary, some problems have multiple valid optimal approaches. For 150 problems this is maybe 3-4 hours of manual work, or we can source from community-maintained lists and verify.

**Implementation:**

- Python script using `requests` + `BeautifulSoup` (or hit NeetCode's API if they have one)
- Outputs a `problems.json` seed file
- Drizzle seed script imports it into Postgres
- Re-run scraper to update/add NeetCode 250 later

**No ongoing scraping.** This is a one-time data collection step, re-run only when NeetCode updates their list.

---

## 6. Pages / UI (MVP)

| Page               | What it does                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **Dashboard**      | Readiness score, tier, days until target, problems due for review today, category coverage heatmap, streak/consistency   |
| **Review Queue**   | Today's priority-ordered review list. Click a problem → attempt form                                                     |
| **Problem List**   | Browse all NeetCode 150 problems. Filter by category, difficulty, status. Shows R value per problem as a color indicator |
| **Problem Detail** | Problem info + all your past attempts + notes + current R/S values. Log a new attempt from here                          |
| **Attempt Form**   | The structured form from §3.2. Code editor with syntax highlighting (Monaco or CodeMirror)                               |
| **Stats**          | Detailed analytics: problems over time, R distribution, category breakdown, time spent, improvement trends               |
| **Settings**       | Target date, notification preferences, account                                                                           |

---

## 7. What This Is NOT

- **Not a LeetCode clone.** We don't host problems or run code. We link to LeetCode and track your performance.
- **Not a teaching tool.** We don't explain solutions (NeetCode does that). We track whether you've retained them.
- **Not a resume project for you.** Vireofi v2 is the flagship. This is a tool you use + it teaches you Postgres/Next.js as a side effect. If it turns out well, it could go on the portfolio site as a bonus, but it's not the priority.

---

## 8. MVP Scope & Rough Phases

### Phase 1 — Foundation (get it working)

- [ ] Next.js project setup (App Router, TypeScript, Tailwind, Drizzle, Postgres)
- [ ] Auth (NextAuth with GitHub OAuth)
- [ ] Drizzle schema + migrations
- [ ] Python scraper → problems.json → seed script
- [ ] Problem list page (browse, filter)
- [ ] Problem detail page (info, link to LC)
- [ ] Attempt form (all fields from §3.2)
- [ ] Basic code editor (CodeMirror or Monaco)

### Phase 2 — The Brain (what makes it different)

- [ ] Spaced repetition engine (stability calculation, decay, scheduling)
- [ ] UserProblemState management (update after each attempt)
- [ ] Review queue (priority-sorted daily list)
- [ ] Dashboard with readiness score + tier
- [ ] Category coverage tracking

### Phase 3 — Polish

- [ ] Stats/analytics page
- [ ] Target date planner ("you need to do X problems/day to be ready")
- [ ] NeetCode 250 support
- [ ] Complexity validation (compare user's answer to known optimal)
- [ ] Export data (your notes, your code, your stats)
- [ ] Mobile-responsive

### Phase 4 — Stretch (post-MVP)

- [ ] Public problem discussions / community notes
- [ ] Problem difficulty calibration from user data (is this Medium actually Hard in practice?)
- [ ] Integration with LeetCode API (auto-detect submissions — if their API allows)
- [ ] Dark mode (lol, but actually)

---

## 9. Open Questions

- [ ] **Naming?** Need a project name. (SpaceCode? RepCode? GrindTracker? LeetDecay?)
- [ ] **Complexity database:** Best source for verified optimal complexities for all 150 problems? May need to crowdsource or manually curate.
- [ ] **Algorithm tuning:** The FSRS parameters need calibration. Start with sensible defaults, adjust based on real usage.
- [ ] **How to handle problems with multiple valid approaches?** (e.g., a problem solvable in O(n) with a hashmap OR O(n log n) with sorting — both "optimal" depending on constraints)
- [ ] **Timer:** Built-in timer vs. manual entry? Timer is better UX but adds complexity.
- [ ] **When to build this?** This shouldn't delay Vireofi v2. Could be a side project during Spring 2026 (learn Postgres early) or a summer evening project alongside v2.
