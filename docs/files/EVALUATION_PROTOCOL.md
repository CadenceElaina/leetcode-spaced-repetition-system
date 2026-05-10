# Evaluation Protocol — Pacing & Queue Management

> How to test, validate, and iterate on the pacing system. Includes test scenarios, success criteria, and data collection plan.

**Status:** Protocol — use when implementing or tuning the pacing system
**Last updated:** 2026-05-10

---

## 1. Simulation Test Scenarios

Before deploying changes to the recommendation engine, run these scenarios through the queue forecast simulation and verify the output matches expectations.

### Scenario Matrix

Each scenario defines a user profile, their behavior pattern, and the expected recommendation at each phase.

#### S1: Normal Ramp-Up (Happy Path)

```
Budget: 60 min (Moderate) → capacity: 2 reviews + 1 new
Pattern: Weeks 1–2: 1 new/day, 1 review/day (light queue)
         Weeks 3–4: 1 new every other day, 2 reviews/day (reviews growing)
         Weeks 5–8: 0–1 new/week, 2–3 reviews/day (plateau)
         Weeks 9+:  early problems mastering, capacity frees up

Expected recommendations:
  Week 1: "Add coverage" (Green zone)
  Week 2: "Add coverage" (still Green)
  Week 3: "Balanced — add carefully" (Yellow zone)
  Week 4: "Review first" if queue growing; "Balanced" if stable
  Week 5–6: "Review first" (peak load, near capacity)
  Week 7–8: "Balanced" (mastery starting to free capacity)
  Week 9+: "Add coverage" again (mastery relief visible in 60-day forecast)
```

#### S2: Aggressive Learner (Queue Overload)

```
Budget: 60 min (Moderate) → capacity: 2 reviews + 1 new
Pattern: 2–3 new/day, 1 review/day for 10 days straight
         (exceeding budget — user is spending 90+ min but declared 60)

Expected:
  Day 3: "Balanced" (queue starting to build, ratio ~0.7)
  Day 5: "Review first" (queue growing, load ratio > 0.85)
  Day 7: "Queue heavy" (load ratio > 1.1 — 5+ due for a 2-capacity user)
  Day 10: Still "Queue heavy" or "Overloaded" depending on whether reviews were done

Verify: forecast shows accelerating growth, not just a spike
Verify: system suggests adjusting budget upward ("you're averaging 4/day — that's a 90-min pace")
```

**S2-R: Recovery Sub-Scenario (Aggressive Learner Follows Advice)**

```
Starting from S2 Day 10: user has ~15 learning problems, ratio > 1.1
User follows advice: 0 new/day, 2–3 reviews/day for 7 days

Expected:
  Day 11: Still "Queue heavy" (backlog doesn't clear instantly)
  Day 13: "Review first" (ratio declining, trend improving)
  Day 15: "Balanced" or better (queue stabilizing, back-half avg declining)
  Day 17: "Add coverage" if queue has cleared to Yellow zone

Verify: queue returns to Yellow zone (ratio < 0.85) within 7 days of following advice
Verify: forecast trend line shifts from "Growing" to "Stable" or "Improving" by Day 14
Failure criterion: if the queue is still in Orange/Red after 7 days of full compliance,
  the zone boundaries or the recovery model is miscalibrated
```

#### S3: Practice Break and Return

```
Budget: 90 min (Focused)
Pattern: 3 weeks active (30 problems learned), then 2 weeks off, then return

Expected:
  Return day: "Welcome back — you've been away 14 days"
  Return day: Queue shows ~15–20 due (problems whose R < 0.7)
  Day 1 back: "Start with 10 reviews today"
  Day 3 back: If queue clearing, "Add 1 new if reviews are done"
  Day 7 back: Normal recommendations resume
```

**S3-R: Recovery Sub-Scenario (Returning User Follows Warmup Advice)**

```
Starting from S3 return day: ~15–20 due, 7-day pace = 0
User follows warmup: 5–8 reviews/day for days 1–3, then 3 reviews + 1 new for days 4–7

Expected:
  Day 1: Queue drops from ~18 to ~12 (5–6 reviewed, some re-due in 2–5 days)
  Day 3: Queue at ~8–10 (clearing faster than new items return)
  Day 5: Queue at ~5–7, ratio approaching Yellow zone
  Day 7: Normal steady state for a Focused user; "Balanced" or "Add coverage"

Verify: queue returns to Yellow zone within 7 days when user follows warmup advice
Verify: pace metrics recover (7-day avg reflects resumed activity by Day 5)
Verify: the system does NOT say "Add coverage" before Day 3, even if the user
  has high capacity — queue clearing takes priority after a break
Failure criterion: if a compliant user is still in Amber/Orange after 7 days
  of resumed practice, the warm-up logic or overshoot tolerance is miscalibrated
```

#### S4: Light User (30 min budget)

```
Budget: 30 min (Light)
Pattern: 1 new every other day, 1–2 reviews/day

Expected:
  Week 1–4: "Add coverage" (queue stays small)
  Week 6+: "Balanced" (5–8 learning problems generating ~1 review/day)
  Never: "Queue heavy" — light users rarely hit overload because they add slowly

Verify: load ratio stays < 0.85 throughout
```

#### S5: Sprint Learner (Intensive, Short Timeline)

```
Budget: 120 min (Intensive)
Pattern: 4 new/day, 6–8 reviews/day for 3 weeks

Expected:
  Week 1: "Add coverage" (Green, high capacity)
  Week 2: "Balanced" (Yellow, reviews building)
  Week 3: "Review first" (Amber, 30+ learning problems)
  
Verify: system correctly distinguishes high-capacity user from an overloaded one
The same queue size that's "overloaded" for a 30-min user is "balanced" for a 120-min user
```

#### S6: Binge + Coast

```
Budget: 60 min (Moderate)
Pattern: 10 new on Saturday, 0 new Sun–Fri, 3–5 reviews/day

Expected:
  Saturday: No warning (single-day spike is fine)
  Tuesday: Forecast shows spike, but recommendation is "Review first" not "overloaded"
  Thursday: Queue clearing, "Balanced"
  Next Saturday: If they binge again, 3+ consecutive over-threshold → soft warning
```

#### S7: Zero Reviews, All New

```
Budget: 60 min (Moderate)
Pattern: 3 new/day, 0 reviews, for 7 days

Expected:
  Day 3: "Review first" — queue growing, reviews neglected
  Day 5: Firm warning — queue is growing unsustainably
  Day 7: "Overloaded" — 15+ problems in queue, none reviewed

Verify: the system flags this even though total/day (3) is within budget
The issue is the mix, not the total
```

---

## 2. Success Criteria

For each recommendation scenario, verify:

| Criterion | Test |
|---|---|
| **Correct zone** | Load ratio maps to the right color/tone (5 zones: Green/Yellow/Amber/Orange/Red) |
| **Correct timing** | Warning appears before the queue becomes unrecoverable |
| **Not premature** | Warning doesn't appear when the user has capacity headroom |
| **Recoverable** | If the user follows the recommendation, the queue stabilizes within 7 days (verified in S2-R, S3-R) |
| **Budget-sensitive** | Same queue size produces different recommendations for 30-min vs. 120-min users |
| **Trend-aware** | Growing queues are flagged; declining queues are not, even at the same absolute size |
| **Overshoot-tolerant** | 1–2 days over threshold doesn't trigger; 3+ does |

---

## 3. Unit Test Plan

### Pacing Constants

```typescript
// deriveCapacity produces expected values for each preset
// Uses session-time constants: AVG_REVIEW_SESSION_MINUTES = 25, AVG_NEW_SESSION_MINUTES = 45
deriveCapacity(30, 0)  → { reviewCapacity: 1, newCapacity: 0 }  // floor(30/25)=1; floor(30/45)=0
deriveCapacity(60, 0)  → { reviewCapacity: 2, newCapacity: 1 }  // floor(60/25)=2; floor(60/45)=1
deriveCapacity(90, 0)  → { reviewCapacity: 3, newCapacity: 2 }  // floor(90/25)=3; floor(90/45)=2
deriveCapacity(120, 0) → { reviewCapacity: 4, newCapacity: 2 }  // floor(120/25)=4; floor(120/45)=2

// newCapacity decreases as reviews consume budget
deriveCapacity(60, 2)  → { reviewCapacity: 2, newCapacity: 0 }  // 2×25=50 → 10 left → floor(10/45)=0
deriveCapacity(90, 2)  → { reviewCapacity: 3, newCapacity: 0 }  // 2×25=50 → 40 left → floor(40/45)=0
deriveCapacity(90, 1)  → { reviewCapacity: 3, newCapacity: 1 }  // 1×25=25 → 65 left → floor(65/45)=1
deriveCapacity(120, 2) → { reviewCapacity: 4, newCapacity: 1 }  // 2×25=50 → 70 left → floor(70/45)=1

// Edge: zero budget → floor at 1 review capacity to prevent division by zero
deriveCapacity(0, 0) → { reviewCapacity: 1, newCapacity: 0 }
```

### Load Ratio Zones

```typescript
// Zone classification — 5 zones matching PACING_SYSTEM.md and CONSTANTS.md
classifyLoadRatio(0.3)  → "green"    // ≤ 0.6
classifyLoadRatio(0.7)  → "yellow"   // 0.6–0.85
classifyLoadRatio(0.9)  → "amber"    // 0.85–1.1
classifyLoadRatio(1.3)  → "orange"   // 1.1–1.5
classifyLoadRatio(1.8)  → "red"      // > 1.5

// Budget sensitivity — same absolute due count, different zones
classifyLoadRatio(8 / 2) → "red"     // 8 due for 30-min user (ratio 4.0)
classifyLoadRatio(8 / 4) → "red"     // 8 due for 120-min user (ratio 2.0)
classifyLoadRatio(4 / 4) → "green"   // 4 due for 120-min user (ratio 1.0 — wait, that's amber)

// Corrected budget sensitivity examples:
// 30-min user: reviewCapacity = 1
classifyLoadRatio(3 / 1) → "red"     // 3 due, capacity 1 → ratio 3.0
// 60-min user: reviewCapacity = 2
classifyLoadRatio(3 / 2) → "orange"  // 3 due, capacity 2 → ratio 1.5
// 120-min user: reviewCapacity = 4
classifyLoadRatio(3 / 4) → "yellow"  // 3 due, capacity 4 → ratio 0.75
```

### Overshoot Detection

```typescript
// Track consecutive days over threshold (ratio > 1.0)
consecutiveDaysOver([0.5, 0.6, 0.7, 0.9, 0.95, 0.88]) → 0  // never over 1.0
consecutiveDaysOver([0.9, 1.1, 1.2, 0.8]) → 2  // 2 days over, then recovered
consecutiveDaysOver([0.9, 1.1, 1.2, 1.3, 1.1]) → 4  // 4 consecutive days over
```

---

## 4. Data Collection Plan

### What to Track (for future calibration)

Once the pacing system is live, collect these per-user metrics for calibration:

| Metric | Purpose | Collection |
|---|---|---|
| `declaredBudgetMinutes` | User's stated capacity | On set/change |
| `observedMinutesPerDay` | Actual time spent (sum of solve + study times) | Derived from attempts |
| `observedReviewsPerDay` | Actual reviews completed | Derived from attempts |
| `observedNewPerDay` | Actual new problems attempted | Derived from attempts |
| `queueLoadRatio` daily snapshot | Load ratio at time of recommendation | Logged client-side |
| `recommendationShown` | Which recommendation the user saw | Event log |
| `recommendationFollowed` | Did the user's next action match the recommendation? | Inferred |
| `retentionAtReview` | Predicted R at time of review vs. actual outcome | From SRS state + attempt |
| `daysToFirstWarning` | Practice days before first Yellow+ recommendation | One-time event per user |

### Time-to-First-Warning

Track the number of practice days before each user first receives a Yellow-or-above recommendation. This is a leading indicator of zone boundary calibration:

- **< 5 days for most users** → thresholds too tight; the system nags before users have context to understand the warning
- **5–14 days** → healthy range; users have built enough queue to encounter the dynamics
- **> 21 days** → thresholds too loose; users are building unsustainable queues before getting any feedback
- **Never triggered (30+ days active)** → either thresholds are too loose, or Light users genuinely never hit capacity (which is acceptable)

Log as a one-time event: `{ userId, daysToFirstWarning, budgetPreset, zone }`. Aggregate across users to validate zone boundaries.

### Calibration Questions

After 3+ months of data:

1. **Are the time cost constants accurate?** Compare declared budget to observed minutes. If users consistently spend 20 min on reviews (not 25), adjust `AVG_REVIEW_SESSION_MINUTES`.

2. **Are the zone thresholds correct?** When the system says "Balanced" (Yellow zone), do users actually maintain stable queues? If they frequently tip into overload from Yellow, the `QUEUE_YELLOW_RATIO` threshold is too high.

3. **Is overshoot tolerance calibrated correctly?** Do users who get a warning at 3 days actually benefit from it? Or are most of them already self-correcting by day 2?

4. **Do users follow recommendations?** If the system says "Review first" but users keep adding new problems, the messaging may need to be more compelling — or the system should accept that users will add some new problems regardless and factor that into the forecast.

5. **Is recovery achievable in 7 days?** Per the S2-R and S3-R scenarios, a compliant user should return to Yellow zone within 7 days. If real users consistently take longer, either the zone boundaries need loosening or the recovery model is too optimistic.

---

## 5. Iteration Process

### Tuning Cycle

1. **Deploy** with initial constants from `CONSTANTS.md`
2. **Observe** for 2–4 weeks of real usage
3. **Measure** the metrics above
4. **Compare** observed outcomes to expected outcomes from the scenario matrix
5. **Adjust** constants that produce incorrect recommendations
6. **Re-test** with updated constants against the scenario matrix
7. **Repeat**

### What "Correct" Looks Like

A recommendation is correct if:

- Users who follow it maintain stable or declining queues
- Users who ignore it experience the predicted queue growth
- The recommendation changes tone at the right time (not too early, not too late)
- Users with different budgets get different recommendations for the same queue state

### Red Flags (System Is Miscalibrated)

- Users consistently in "Overloaded" zone within 2 weeks of starting (thresholds too tight)
- Users with 30+ overdue problems never see a warning (thresholds too loose)
- "Review first" appears when the user has 2 due reviews and plenty of capacity (zone boundaries wrong)
- Users ignore recommendations because they feel unreasonable (messaging or threshold issue)
- Compliant users can't recover to Yellow zone within 7 days (recovery model too optimistic or capacity estimates too aggressive)

---

## 6. Manual Testing Checklist

Before deploying pacing system changes, verify in the browser:

- [ ] New user onboarding shows time budget selector
- [ ] Budget presets derive correct capacity numbers (25/45 session-time basis)
- [ ] Custom budget input validates (min 10, max 480)
- [ ] Settings panel shows current budget with edit capability
- [ ] Recommendation updates when budget changes
- [ ] Forecast Goals mode auto-populates from budget
- [ ] Demo mode shows budget selector with sensible defaults
- [ ] Mobile layout handles budget selector without overflow
- [ ] Budget persists across page refreshes (DB + localStorage)
- [ ] Budget survives sign-out → sign-in cycle (DB)
- [ ] All 5 zones render with correct colors (Green/Yellow/Amber/Orange/Red)
- [ ] Budget mismatch detection fires after 5+ days of divergence
