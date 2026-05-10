# Current Implementation State — Aurora Ascent

**Last updated: 2026-05-10 — pacing system Phase 1 complete; doc audit + pre-Phase-2 hardening**

Read this before every work session. Update it after every session.

---

## In Progress

_None — clean slate._

---

## Known Bugs / Issues

| Priority | Area | Issue |
|---|---|---|
| P2 | Dashboard | Cheatsheet panel: Queue Forecast bars visible behind panel when open (z-index / compositing) — intermittent |

---

## Recently Completed (this session)

| Date | Change |
|---|---|
| 2026-05-10 | `fix(capacity)`: `reviewCapacity` floors at 1 (prevents Phase 2 division-by-zero); `timeBudget` state replaces stale `localStorage` read in `practiceRecommendation` memo; Intensive + zero-budget unit test cases added |
| 2026-05-10 | `docs`: implementation status table updated to reflect Phase 1 complete; ADR status → "Phase 1 Implemented"; backAvg Phase 2 slice-index note added to CONSTANTS.md |

## Previously Completed (2026-05-03 polish sprint)

| Date | Change |
|---|---|
| 2026-05-03 | `fix(dashboard)`: `pickMockProblems` always returns 2; Medium+Medium fallback when no Hards |
| 2026-05-03 | `fix(srs)`: `PARTIAL:NONE` multiplier 1.0→1.1; 2 new unit tests (55 total) |
| 2026-05-03 | `fix(srs)`: explicit `NO:OPTIMAL`=0.8 and `NO:SUBOPTIMAL`=0.8 entries |
| 2026-05-03 | `fix(dashboard)`: New tab default when queue empty; neutral tone at < 5 attempts |
| 2026-05-03 | `fix(dashboard)`: tone badge "Watch"→"Review first", "Plan"→"Getting started" |
| 2026-05-03 | `fix(dashboard)`: "Done" tab renamed to "Completed" |
| 2026-05-03 | `fix(nav)`: Setup Guide moved to authenticated user menu |
| 2026-05-03 | `fix(nav)`: avatar `<img>` → `next/image`; added remotePatterns |
| 2026-05-03 | `fix(dashboard)`: readiness "limited data" label at < 5 attempts |
| 2026-05-03 | `feat(theme)`: light mode — system preference default, localStorage persistence, toggle |
| 2026-05-03 | `feat(insights)`: per-user Insights page + admin dashboard |
| 2026-05-03 | `feat(ux)`: unified demo, onboarding, and sign-in flow |
| 2026-05-03 | `feat(info)`: 3-col layout with sticky glossary + references right panel |
| 2026-05-03 | `fix(info)`: anchor scroll offset, formula readability, forgetting curve chart |

---

## Open Tasks

| Priority | Area | Task |
|---|---|---|
| P2 | pacing | T-023: Phase 2 load ratio zones — wire `queueLoadRatio` into `computePracticeRecommendation`; extend forecast 30→60 days; add overshoot tracking |
| P2 | Bug | Fix cheatsheet panel z-index so Queue Forecast bars don't bleed through |

---

## Product Goals (Professor Presentation)

**Primary goal:** Email Dr. Wilson mid-summer 2026. Present Aurora Ascent as a working, polished product. Pitch Aurora Research as a Fall 2026 pilot.

**Aurora Ascent (public, this repo):**
- Public-facing, open-source, fully functional
- No visible bugs in any flow a professor would click through
- Algorithm correct and explainable (see ARCHITECTURE.md)
- Clean professional UI — cheatsheets, insights, readiness dashboard all working
- Demo mode functional for unauthenticated visitors
- README and docs are professor-readable

**Aurora Research (separate private repo):**
- Classroom pilot version — invite-only auth (no GitHub OAuth requirement)
- Instructor dashboard, cohort analytics, assignment/deadline features
- Currently behind Ascent — needs to be brought up to feature parity on core SRS + UI

---

## Infra Limits to Watch

| Risk | Status |
|---|---|
| Supabase pause after 7 days inactivity | Mitigated — cron ping every 3 days via vercel.json |
| MAX_USERS cap | Set to 500, enforced in src/auth.ts |
| Vercel free tier function invocations | 1M/month; low risk at current scale |

---

## Tests

- `tests/unit/srs.test.ts` — **55 SRS unit tests** (all passing)
- No API, component, or E2E tests yet

Run: `npm test`
