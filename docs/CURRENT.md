# Current Implementation State — Aurora Ascent

**Last updated: 2026-05-03 — polish sprint complete**

Read this before every work session. Update it after every session.

---

## In Progress

_None — ready for next task._

---

## Known Bugs / Issues

_None open at P0 or P1. Remaining open tasks are P2/P3 — see docs/TASKS.md._

---

## Recently Completed (2026-05-03 session)

| Date | Change |
|---|---|
| 2026-05-03 | fix(dashboard): `pickMockProblems` always returns 2; Medium+Medium fallback when no Hards |
| 2026-05-03 | fix(srs): `PARTIAL:NONE` multiplier 1.0→1.1; added 2 unit tests (55 total) |
| 2026-05-03 | fix(srs): explicit `NO:OPTIMAL`=0.8 and `NO:SUBOPTIMAL`=0.8 entries — defensive against direct API calls |
| 2026-05-03 | fix(dashboard): cold start — New tab default when queue empty; neutral tone at < 5 attempts |
| 2026-05-03 | fix(dashboard): tone badge "Watch"→"Review first", "Plan"→"Getting started"; all 7 branches audited |
| 2026-05-03 | fix(dashboard): "Done" tab renamed to "Completed" |
| 2026-05-03 | fix(nav): Setup Guide moved to authenticated user menu; removed from primary nav slot |
| 2026-05-03 | fix(nav): avatar `<img>` → `next/image`; added avatars.githubusercontent.com to remotePatterns |
| 2026-05-03 | fix(dashboard): readiness "limited data" label at < 5 attempts; consistency raw fraction |
| 2026-04-22 | feat(onboarding): persist tour completion in DB, fix stability message |
| 2026-04-22 | feat(nav): improve profile menu with identity header, grouped actions, GitHub sync status |
| 2026-04-22 | feat(hosting): user cap, Supabase keep-alive cron, waitlist page |
| 2026-04-22 | fix(dashboard): calm strategy recommendation UI |
| 2026-04-22 | fix(readiness): show tier from day one, D is the honest starting grade |

---

## Next Iteration Candidates

| Priority | Area | Task |
|---|---|---|
| P1 | Algorithm | Audit SRS multipliers end-to-end — trace through `computeNewStability`, verify stability update matches README table (T-011) |
| P2 | UX | "Log" button: verify attempt modal pre-fills problem context correctly in all list modes (T-010) |
| P2 | Feature | Problem detail page: video link prominence, optimal complexity as post-attempt reference (T-013) |
| P3 | Tests | Add API route tests for `/api/attempts` (T-014) |
| P3 | Meta | OG/social preview metadata — og:image, twitter:card (T-015) |

See `docs/TASKS.md` for the full prioritized queue.

---

## Product Goals (Professor Presentation)

**Primary goal:** Email Dr. Wilson mid-summer 2026. Show Aurora Ascent as a working, polished product. Pitch Aurora Research as a Fall 2026 pilot. Get her buy-in.

**What "done" means for Ascent:**
- No visible bugs in any flow a professor would click through
- Algorithm behaves correctly and is explainable
- UI is professional (not childish) — clean purple aesthetic, minimal pink
- All features in the README actually work
- Cold-start experience for a new user is smooth and not confusing

**Scale expectations:** Aurora Ascent is public/open-source; Aurora Research (private repo) handles the classroom pilot with invite-only auth.

---

## Infra Limits to Watch

| Risk | Status |
|---|---|
| Supabase pause after 7 days inactivity | Mitigated — cron ping every 3 days via vercel.json |
| MAX_USERS cap | Currently 500, enforced in src/auth.ts |
| Vercel free tier function invocations | 1M/month; low risk at current scale |

---

## Tests

- `tests/unit/srs.test.ts` — 55 SRS unit tests (passing)
- No API, component, or E2E tests yet (see T-014 in docs/TASKS.md)

Run: `npm test`
