# SRS Initial Stability Calibration

**Date:** 2026-04-20  
**Status:** Implemented  
**Scope:** `src/lib/srs.ts`, `src/app/dashboard/dashboard-client.tsx`, docs

---

## Context

With `INITIAL_STABILITY_BASE = MIN_STABILITY = 0.5`, even a best-case first solve
(YES:OPTIMAL, confidence 5, rewrite) produced an initial stability of only **1.65 days**:

```
s = 0.5 × (2.5 + 0.5 + 0.3) = 1.65 days
```

A typical solve (YES:OPTIMAL, confidence 3) was **1.25 days** — the problem returned
the next day, every time.

### Why this is wrong for this domain

Coding problems are not vocabulary flashcards. A review takes 15–30 minutes minimum
(attempt, watch solution video, verify understanding). Scheduling daily recall does not
strengthen long-term memory faster — it just burns time and builds queue debt that the
user cannot clear at any realistic pace (1–4 problems/day for most learners).

FSRS calibration data from Anki (millions of card reviews) targets a first "good"
recall interval of ~15 days. For a skill-heavy domain where each item takes 10–30×
longer than a flashcard, spacing the initial review further out is scientifically
appropriate: **the forgetting curve is slower for procedural skills than for declarative
recall**, and the cost of reviewing too early is high.

### Queue debt spiral

The forecast simulation was also using `stability: 0.5` for new problem insertions,
so the projected queue never cleared even at 6 reviews/day. With stability = 0.5 and
`AVG_MULTIPLIER = 2.0`, a reviewed item returned in `round(0.5 × 2.0) = 1 day` —
every reviewed new item immediately re-appeared the next day in perpetuity. The
forecast was technically correct given the (wrong) initial values.

---

## Decision

Change `computeInitialStability` to multiply `INITIAL_STABILITY_BASE = 2.0` instead
of `MIN_STABILITY = 0.5`.

| Outcome | Old first review | New first review |
|---|---|---|
| YES:OPTIMAL, conf 3 | 1.25 days | 5 days |
| YES:OPTIMAL, conf 5 + rewrite | 1.65 days | 6.6 days |
| YES:BRUTE_FORCE, conf 3 | 0.75 days | 3 days |
| PARTIAL, conf 3 | 0.55 days | 2.2 days |
| NO | 0.5 days | 0.5 days (unchanged) |

The value 2.0 is a pragmatic choice: it produces a first-review interval of ~5 days
for a solid first solve, which feels appropriate given the time cost per review.
It is not derived from empirical user data (we don't have enough yet). The constant
is named `INITIAL_STABILITY_BASE` and can be tuned once data is available.

### Also fixed: missing SUBOPTIMAL multiplier

`YES:SUBOPTIMAL` had no entry in `BASE_MULTIPLIERS`, falling back to `?? 1.0` —
the same as "could not solve." Someone who solved independently with a working but
non-optimal solution was being penalized as if they had failed. Fixed to `2.0×`
(between OPTIMAL 2.5× and BRUTE_FORCE 1.5×).

---

## Alternatives Considered

**Keep 0.5 base, educate users that queue growth is expected.**  
Rejected: the queue growth rate at this base is _mechanically broken_, not just
hard. At stability 0.5, new problems re-enter the queue the next day after every
review regardless of how well the user did. No realistic pace can clear it.

**Use FSRS default (~15 days for first good recall).**  
Rejected: may be too aggressive for a skill with high initial failure rate. Users
expect to see problems again within a week when first learning them. 5 days is
a reasonable middle ground.

**Per-difficulty base (Easy higher, Hard lower).**  
Deferred: conceptually appealing (Hard problems need more repetition) but adds
complexity. Can revisit when we have retention data.

---

## Data Migration

Existing `user_problem_state` rows were recalculated by replaying each user's full
attempt history through the updated formula using:

```bash
npx tsx scripts/recalculate-srs-states.ts
```

This is the same replay logic used by the attempt deletion handler. The script is
idempotent and can be re-run safely. The `attempts` table is not modified.

---

## Files Changed

- `src/lib/srs.ts` — added `INITIAL_STABILITY_BASE`, `YES:SUBOPTIMAL` multiplier
- `src/app/dashboard/dashboard-client.tsx` — forecast simulation new-item stability
- `src/app/info/page.tsx` — updated First Attempt example, removed stale complexity modifiers, added Suboptimal column
- `docs/ARCHITECTURE.md` — updated multiplier table, initial stability bounds
- `scripts/recalculate-srs-states.ts` — one-time migration script (kept for reference)
