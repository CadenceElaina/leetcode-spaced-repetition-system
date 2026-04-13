# Aurora — Test Plan

> Date: April 13, 2026
> Status: Planning
> Prerequisite: Zero testing infrastructure exists today. This document defines what to build.

---

## 1. Framework & Tooling Decision

### Recommended: Vitest + React Testing Library + Playwright

| Layer | Tool | Why |
|-------|------|-----|
| **Unit tests** | [Vitest](https://vitest.dev/) | Native ESM, TypeScript, same Vite ecosystem as Next.js. Faster than Jest for this stack. Compatible with React 19. |
| **Component tests** | Vitest + `@testing-library/react` | Render DrillCard, simulate clicks/keyboard, assert DOM output. No browser needed. |
| **Integration / API route tests** | Vitest + `next/test` (or direct handler invocation) | Test API routes as functions — mock `auth()` and `db`, call the handler, assert response. |
| **E2E tests** | [Playwright](https://playwright.dev/) | Cross-browser, reliable, built-in assertions. Better than Cypress for Next.js App Router. |

### Packages to install

```bash
# Unit + component
npm i -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# E2E (Phase 2 — after unit/component coverage)
npm i -D @playwright/test
```

### Config files to create

- `vitest.config.ts` — path aliases (`@/` → `src/`), jsdom environment for component tests, exclude `e2e/`
- `vitest.setup.ts` — import `@testing-library/jest-dom` matchers
- `playwright.config.ts` — (Phase 2) base URL, webServer config for `npm run dev`

### Scripts to add to package.json

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test"
}
```

---

## 2. Test Organization

```
tests/
  unit/
    srs.test.ts                    # Pure SRS functions
    srs-drills.test.ts             # Drill-specific SRS (fatigue, stability, fluency)
    drill-scoring.test.ts          # checkCode, normalize, tokenize
    auth-config.test.ts            # isAuthConfigured conditional logic
    demo-data.test.ts              # Data integrity checks
  api/
    attempts.test.ts               # POST/GET/DELETE /api/attempts
    drills.test.ts                 # GET /api/drills (incl. computeCategoryUnlocks)
    drills-attempt.test.ts         # POST /api/drills/attempt
    review.test.ts                 # POST /api/review (skip + feedback)
    webhook-github.test.ts         # POST /api/webhook/github (HMAC, parsing)
  components/
    drill-card.test.tsx            # DrillCard render, MC mode, retry flow, keyboard
    session-header.test.tsx        # (future) pips, combo, mute, auto-continue
    nav.test.tsx                   # Auth-aware rendering
  e2e/                             # Phase 2
    drill-session.spec.ts          # Full 8-drill daily session flow
    auth-flow.spec.ts              # Sign in → dashboard → sign out
    demo-mode.spec.ts              # Unauthenticated browsing
```

---

## 3. Unit Tests — SRS Engine

**File: `tests/unit/srs.test.ts`**

The SRS engine is the core of the app and entirely pure functions — no I/O, no side effects. This is the highest-value, easiest-to-write test target.

### `computeRetrievability(stabilityDays, daysSinceReview)`

| Test case | Input | Expected |
|-----------|-------|----------|
| Same day (no decay) | `(10, 0)` | `1.0` |
| Negative days since review | `(10, -1)` | `1.0` |
| Normal decay | `(10, 10)` | `≈ 0.368` ($e^{-1}$) |
| Heavy decay hits floor | `(1, 100)` | `0.3` (RETRIEVABILITY_FLOOR) |
| Zero stability (edge) | `(0, 5)` | `0.3` (exp(-Infinity) → 0 → clamped) |
| Very large stability | `(365, 1)` | `≈ 0.997` |

### `computeNewStability(oldStability, signals)`

| Test case | Key signals | Expected behavior |
|-----------|------------|-------------------|
| YES + OPTIMAL → strong growth | `{YES, OPTIMAL, conf: 4}` | `old * (2.5 + 0.1)` = old * 2.6 |
| YES + OPTIMAL + rewrite bonus | `{YES, OPTIMAL, rewrite: YES, conf: 5}` | `old * (2.5 + 0.5 + 0.3)` = old * 3.3 |
| NO + NONE → decay | `{NO, NONE, conf: 1}` | `old * (0.5 + (-0.4))` = old * 0.1 → clamp to 0.5 |
| PARTIAL always ~neutral | `{PARTIAL, OPTIMAL, conf: 3}` | `old * (1.1 + 0)` = old * 1.1 |
| Fast solve bonus (Medium, <10min) | `{YES, OPTIMAL, Medium, 8min}` | modifier +0.2 applied |
| Fast solve NOT for Easy/Hard | `{YES, OPTIMAL, Easy, 5min}` | No +0.2 bonus |
| Missing combo (NO:OPTIMAL) | `{NO, OPTIMAL}` | Falls back to multiplier 1.0 |
| Clamp to MAX_STABILITY | Very high old + high multiplier | Capped at 365 |
| Clamp to MIN_STABILITY | Low old + very low multiplier | Floored at 0.5 |

### `computeInitialStability(signals)`

Same signal matrix as above, but base is `MIN_STABILITY (0.5)` instead of `oldStability`.

### `computeReadiness(input)`

| Test case | Expected |
|-----------|----------|
| All zeros (no problems) | `{ score: 0, tier: "D", … }` |
| Perfect scores all around | `{ score: 100, tier: "S", … }` |
| High retention but low coverage | Tier reflects weakest component |
| Score exactly at tier boundaries (90, 75, 55, 35) | Verify correct tier assignment |

### `computeReviewPriority(input)`

| Test case | Expected |
|-----------|----------|
| Low retrievability → high priority | `(1 - 0.1) * weight` is high |
| High retrievability → low priority | `(1 - 0.9) * weight` is low |
| Blind 75 bonus | weight gets +0.2 |
| Weak category bonus | categoryAvgR < 0.6 → weight gets +0.3 |

### `computeNextReviewDate(stability, fromDate)`

| Test case | Expected |
|-----------|----------|
| Stability of 1 day | fromDate + 86400000ms |
| Stability of 0 | Same date returned |
| Fractional stability (0.5) | fromDate + 12 hours |

---

## 4. Unit Tests — Drill SRS Functions

**File: `tests/unit/srs-drills.test.ts`**

### `computeSessionFatigue(position)`

Step function — test each boundary:
- 1 → 1.0, 8 → 1.0, 9 → 0.7, 15 → 0.7, 16 → 0.4, 25 → 0.4, 26 → 0.2, 100 → 0.2

### `computeCategoryStreakPenalty(streak)`

- 0 → 1.0, 1 → 1.0, 2 → 0.8, 3 → 0.5, 4 → 0.3, 10 → 0.3

### `computeFatigueCredit(position, streak)`

- Verify it's the product: `(8, 1)` → 1.0 × 1.0 = 1.0; `(30, 8)` → 0.2 × 0.3 = 0.06

### `computeDrillStability(oldStability, confidence, fatigueCredit)`

| Test case | Expected behavior |
|-----------|-------------------|
| Confidence 4, full credit | `old * 2.5` |
| Confidence 1, full credit | `old * 0.5` → clamp |
| Confidence 3, zero credit | `old * (1 + (1.8-1)*0)` = `old * 1.0` (no change) |
| Confidence 4, half credit | `old * (1 + (2.5-1)*0.5)` = `old * 1.75` |
| Out-of-range confidence (0 or 5) | Falls back to multiplier 1.0 |

### `computeDrillFluency(input)`

| Test case | Expected |
|-----------|----------|
| Zero drills → D tier | `{ fluency: 0, tier: "D" }` |
| All reviewed, high stability, nothing due | High fluency, S tier |
| Half reviewed, medium stability | Mid-range fluency |
| Many drills due | Due penalty reduces fluency |

---

## 5. Unit Tests — Drill Card Scoring

**File: `tests/unit/drill-scoring.test.ts`**

These functions currently live inside `drill-card.tsx` as non-exported internals. **Recommendation:** extract `normalize`, `tokenize`, and `checkCode` into `src/lib/drill-scoring.ts` so they can be directly imported in tests without rendering a React component. This is a small, safe refactor.

### `normalize(code)`

| Input | Expected output |
|-------|-----------------|
| `"  foo  "` | `"foo"` |
| `"a = 1  # comment"` | `"a = 1"` |
| `"a = 1\n\nb = 2"` | `"a = 1 b = 2"` |
| `""` | `""` |
| `"# just a comment"` | `""` |
| `"FOR i IN range(10):"` | `"for i in range(10):"` |
| Tabs and mixed whitespace | Collapsed to single spaces |

### `tokenize(code)`

| Input | Expected output |
|-------|-----------------|
| `"for i in range(10):"` | `["for", "i", "in", "range", "10"]` |
| `""` | `[]` |
| `"a + b"` | `["a", "b"]` |
| `"dict_of_lists"` | `["dict_of_lists"]` (underscores preserved) |

### `checkCode(userCode, expectedCode, alternatives, level)`

**L1/L2 exact match tests (level ≤ 2):**

| Test case | Expected |
|-----------|----------|
| Exact match | `{ verdict: "correct", confidence: 4 }` |
| Match after whitespace normalization | `{ verdict: "correct", confidence: 4 }` |
| Match to an alternative | `{ verdict: "correct", confidence: 4 }` |
| Close but not exact (e.g., typo) | `{ verdict: "incorrect", confidence: 1 }` — no partial at L1/L2 |
| Empty input | `{ verdict: "incorrect", confidence: 1 }` |

**L3+ recall-biased coverage tests (level ≥ 3):**

| Test case | Expected |
|-----------|----------|
| Exact match | `{ verdict: "correct", confidence: 4 }` |
| All expected tokens present + extra tokens | `{ verdict: "correct", confidence: 4 }` (extra tokens don't penalize) |
| Missing 1 of 10 tokens (coverage ~0.9) | `{ verdict: "correct", confidence: 4 }` |
| Coverage 0.75–0.84 | `{ verdict: "close", confidence: 3 }` |
| Coverage 0.65–0.74 | `{ verdict: "close", confidence: 2 }` |
| Coverage < 0.65 | `{ verdict: "incorrect", confidence: 1 }` |
| Empty user code | `{ verdict: "incorrect", confidence: 1 }` |
| Empty expected code → both empty | `{ verdict: "correct", confidence: 4 }` (exact match on "") |

**Boundary tests**: Coverage at exactly 0.85, 0.75, 0.65 thresholds.

---

## 6. API Route Tests

**General pattern:** Mock `auth()` to return a controlled session (or null for auth tests). Mock `db` methods. Call the route handler directly with a constructed `NextRequest`. Assert the response status and JSON body.

### `tests/api/attempts.test.ts`

**POST /api/attempts:**
- ✅ Valid attempt → 201, returns SRS diff
- ❌ Missing auth → 401
- ❌ Invalid problemId type → 400
- ❌ Invalid enum values → 400
- ❌ Problem not found → 404
- ❌ Duplicate same-day attempt → 409
- ✅ Duplicate with `force: true` → 201
- ✅ Future attemptDate → rejected (must be ≤ now)
- ✅ First attempt creates new userProblemState
- ✅ Subsequent attempt updates existing state
- ✅ Failed attempt (solved=NO) → nextReview = now
- ✅ Struggled attempt (PARTIAL + conf ≤ 2) → nextReview = +1 day
- ✅ Auto-resolves matching pending submissions

**DELETE /api/attempts:**
- ✅ Delete and rebuild stability from remaining attempts
- ✅ Delete last attempt → removes userProblemState entirely
- ❌ Delete someone else's attempt → 404

### `tests/api/drills.test.ts`

**GET /api/drills:**
- ✅ Returns all drills with user state
- ✅ Level gating: L2 locked when L1 avg stability < 7d
- ✅ Level gating: L2 unlocked when L1 avg stability > 7d
- ✅ Filter by "due" / "new" / "all"
- ✅ Filter by category
- ❌ No auth → 401

**`computeCategoryUnlocks` (pure function, test directly):**
- No reviewed drills → unlock = 1 for all categories
- L1 reviewed with avg stability 5d → unlock = 1 (below 7d threshold)
- L1 reviewed with avg stability 10d → unlock = 2
- Progressive unlock through L1 → L2 → L3 → L4
- Category with drills at L1 but no L2 drills exist → unlock = 2 (gating says "eligible" even if no L2 content)

### `tests/api/drills-attempt.test.ts`

**POST /api/drills/attempt:**
- ✅ Valid attempt → 200, returns new stability + nextReviewAt
- ✅ First attempt creates userDrillState
- ✅ Subsequent attempt updates state, increments totalAttempts
- ✅ bestConfidence tracks maximum
- ✅ Fatigue credit applied correctly
- ❌ Invalid drillId → 400
- ❌ Confidence out of range → 400
- ❌ Drill not found → 404
- ❌ No auth → 401

### `tests/api/review.test.ts`

**POST /api/review:**
- ✅ Skip with "too_easy" → postpone 72h
- ✅ Skip with "wrong_timing" / "wrong_category" → postpone 24h
- ✅ Feedback "too_early" → stability × 1.3
- ✅ Feedback "too_late" → stability × 0.8
- ✅ Stability clamped to [0.5, 365] after feedback
- ❌ Invalid reason → 400
- ❌ Invalid action → 400
- ❌ No userProblemState row → 404

### `tests/api/webhook-github.test.ts`

**POST /api/webhook/github:**
- ✅ Ping event → pong response
- ✅ Non-push event → ignored
- ✅ Valid push → creates pending submissions
- ✅ HMAC verification passes with correct secret
- ❌ Missing x-hub-signature-256 → 401
- ❌ Wrong HMAC → 401
- ❌ Unknown repo → 404
- ✅ Duplicate commit SHA → skipped
- ✅ Duplicate unresolved pending → skipped
- ✅ Commits before githubConnectedAt → skipped
- ✅ isReview = true when user has prior attempts
- ✅ Commit message regex parsing (valid/invalid formats)
- ⚠️ Buffer length mismatch in timingSafeEqual → should not crash (needs defensive code or test)

---

## 7. Component Tests

### `tests/components/drill-card.test.tsx`

These require jsdom environment and React Testing Library.

**Render tests:**
- Renders prompt, title, category, level badge
- Textarea is editable in prompt phase
- Textarea is read-only in result phase
- Level badge shows correct L1/L2/L3/L4 styling

**MC mode (L1) — Phase 1 feature, test when built:**
- Level 1 renders clickable MC options
- Clicking correct option → green highlight + explanation shown
- Clicking wrong option → red highlight + explanation shown
- Tab switches to type-it mode (MC options dim, textarea focused)

**Submit flow:**
- Ctrl+Shift+Enter triggers submit
- Submit button disabled when textarea empty
- After submit: verdict banner appears, expected code shown, explanation shown

**Retry flow — Phase 1 feature, test when built:**
- Wrong answer → read-only panel above + fresh textarea below
- Second wrong → solution shown, move on (confidence 1)
- First retry correct → confidence 2

**Keyboard navigation — Phase 1 feature, test when built:**
- Ctrl+. fires advance callback
- Ctrl+, fires previous callback
- Dirty textarea + Ctrl+. → inline discard prompt
- sessionStorage draft save/restore on Ctrl+,

---

## 8. E2E Tests (Phase 2)

Run against a real dev server. Require seeded test data.

### `e2e/demo-mode.spec.ts`
- Visit `/` without auth → see landing page
- Navigate to problems → see problem list
- Navigate to dashboard → see demo data (no sign-in required)
- Click "Sign in" → redirected to auth flow

### `e2e/drill-session.spec.ts`
- Start "Daily Drill" → 8 drills load
- Complete a drill: type code → submit → see verdict → click Next
- Progress pips advance
- Session complete → summary modal appears
- "Keep going" → enters open practice

### `e2e/auth-flow.spec.ts`
- Sign in with GitHub OAuth (mock or real test account)
- Verify dashboard loads with user data
- Sign out → redirected to landing

---

## 9. What NOT to Test

- **Drizzle schema definitions** — these are declarative. Push to DB and verify via migration, not unit tests.
- **Tailwind styling** — visual correctness is better caught by review/Storybook than assertions.
- **Static demo data contents** — the exact values in demo arrays aren't worth asserting (they change often). Test _structure_ and _type integrity_ instead.
- **Third-party libraries** (NextAuth internals, Drizzle query builder) — trust them, test our usage of them.

---

## 10. Known Issues to Cover with Tests

These are bugs or gaps discovered during the audit:

| Issue | Where | Test to add |
|-------|-------|-------------|
| `SUBOPTIMAL` is in schema enum but has no `BASE_MULTIPLIERS` entry | `srs.ts` | Test `computeNewStability` with `SUBOPTIMAL` quality → verify it falls back to 1.0 multiplier (or fix the gap) |
| `NO:OPTIMAL` combo has no multiplier entry | `srs.ts` | Test this combo → verify fallback to 1.0 |
| `normalize()` strips `#` inside Python string literals | `drill-card.tsx` | Test `code = 'a = "foo#bar"'` → verify correct normalization |
| Confidence can theoretically be a float | `srs.ts` | Test with `confidence: 2.5` → verify it doesn't trigger any modifier |
| `checkCode` with empty expectedCode and non-empty alternatives | `drill-card.tsx` | Test that alternatives are still checked |
| `timingSafeEqual` with different-length buffers | `webhook/github/route.ts` | Test that mismatched signature lengths don't throw uncaught |
| `SUBOPTIMAL` in attempt validation but not in SRS | `api/attempts/route.ts` | Test POST with `SUBOPTIMAL` quality → verify it processes (with 1.0 fallback) |

---

## 11. Recommended Implementation Order

### Step 1: Infrastructure (30 min)
Install vitest + testing-library, create config files, add scripts, verify `npm test` runs.

### Step 2: SRS unit tests (high value, easy)
`srs.test.ts` + `srs-drills.test.ts` — pure functions, no mocking needed. This covers the most critical app logic.

### Step 3: Drill scoring tests
Extract `normalize`/`tokenize`/`checkCode` to `src/lib/drill-scoring.ts`, write `drill-scoring.test.ts`. This validates the scoring changes from plan v2 (Jaccard → recall-biased).

### Step 4: API route tests
Start with `attempts.test.ts` (most complex, most branches), then `webhook-github.test.ts` (security-critical HMAC verification).

### Step 5: Component tests
DrillCard tests once MC mode and retry flow are implemented.

### Step 6: E2E tests
After drill session UX (Phase 2) is stable.

---

## 12. Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| `src/lib/srs.ts` | **95%+** | Core algorithm. Every branch matters. |
| `src/lib/drill-scoring.ts` (extracted) | **95%+** | Scoring directly affects user experience and SRS scheduling. |
| API routes | **80%+** | Cover happy paths + all error branches. |
| Components | **60%+** | Focus on interaction logic, not styling. |
| E2E | Key user flows | Not measured by line coverage — measured by scenario coverage. |

---

## Appendix: Mocking Strategy

### Auth mock
```typescript
// tests/mocks/auth.ts
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "test-user-id" } }),
}));
```

### DB mock
```typescript
// tests/mocks/db.ts — mock Drizzle query builder chain
vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
  },
}));
```

### NextRequest factory
```typescript
function makeRequest(method: string, url: string, body?: object): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
}
```
