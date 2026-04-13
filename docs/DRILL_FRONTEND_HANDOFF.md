# Drill Frontend Handoff — Other Machine

> **SUPERSEDED** — This document describes the original two-machine split from April 2026. Both branches have been merged. All described work is complete.
> For current implementation state see: `docs/decisions/2026-04-13-drill-system-v2-plan.md`
> For active agent work see: `docs/decisions/2026-04-13-syntax-panel-agent2-handoff.md`

---

> Branch from: `main` at `234f0fe`
> Branch name: `feat/drill-frontend`
> Design doc: `docs/decisions/2026-04-12-syntax-drills.md`

---

## What This Machine Does (feat/drill-backend)

Files touched (DO NOT touch these on frontend branch):
- `src/db/schema.ts` — 3 new tables: `syntaxDrills`, `userDrillStates`, `drillAttempts`
- `src/lib/srs.ts` — adds `computeFatigueCredit()` and `computeDrillStability()` functions
- `src/app/api/drills/route.ts` — GET drill queue
- `src/app/api/drills/attempt/route.ts` — POST log drill attempt
- `src/app/api/drills/stats/route.ts` — GET fluency scores
- `scripts/seed-drills.ts` — seed script + JSON data
- `drills.json` — drill content data file

---

## What Your Machine Does (feat/drill-frontend)

### 1. Dashboard Drill Tab

In `src/app/dashboard/dashboard-client.tsx`:

Add a "Drills" tab alongside existing tabs:
```
[Review 8] [New 8] [Done 16] [Import] [🧪 Drills]
```

When active, left panel shows:
- Sub-tabs: [Due N] [New N] [Mastered N]
- "Daily Drill (8 drills, ~10 min)" button at top
- List of drills: category badge, level (L1-L4), title, due status

### 2. Drill Interaction Component

New file: `src/components/drill-card.tsx`

States:
1. **Prompt** — show drill.prompt, code textarea for user input
2. **Reveal** — show expected answer + explanation side-by-side with user code
3. **Rate** — 4 buttons: Again (1) / Hard (2) / Good (3) / Easy (4)

Code input should be a `<textarea>` with monospace font, ~8-12 rows.
Explanation renders markdown-ish content (code blocks, bullet points).

### 3. Demo Data

Add to `src/app/dashboard/demo-data.ts`:

```typescript
export const DEMO_DRILLS: DemoDrill[] = [
  {
    id: 1,
    title: "Build a frequency counter",
    category: "Arrays & Hashing",
    level: 1,
    prompt: "Given a list of words, create a dictionary mapping each word to its count.",
    expectedCode: `from collections import Counter\nword_count = Counter(words)`,
    explanation: "Counter is a dict subclass for counting hashable objects...",
    dueStatus: "due", // "due" | "new" | "mastered"
  },
  // ... more drills
];
```

Create ~8-10 demo drills across Hash Maps, Two Pointers, Stack, Trees for the demo mode.

### 4. Syntax Fluency Panel

When Drill tab active, right panel shows (instead of the normal stats):
- Overall fluency tier (S/A/B/C/D) — big display
- Per-category mini-bars showing fluency %
- Weakest / strongest category callout
- "Drill streak" or activity mini-chart

For demo mode, use hardcoded fluency data.

### 5. Daily Drill Session Flow

"Daily Drill" button starts a session:
- Progress bar: "Drill 3/8"
- One drill at a time (prompt → code → reveal → rate → next)
- Session summary at end: "8 drills complete. 5 Good, 2 Hard, 1 Again"
- Subtle fatigue note after drill 12+ if user continues past daily

### 6. Types

```typescript
// Types for the drill system — will match backend schema
export type DrillLevel = 1 | 2 | 3 | 4;
export type DrillConfidence = 1 | 2 | 3 | 4; // Again/Hard/Good/Easy

export interface SyntaxDrill {
  id: number;
  title: string;
  category: string;
  level: DrillLevel;
  language: string;
  prompt: string;
  expectedCode: string;
  alternatives: string[];
  explanation: string;
  tags: string[];
}

export interface UserDrillState {
  drillId: number;
  stability: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  totalAttempts: number;
  bestConfidence: DrillConfidence | null;
}

export interface DrillAttemptPayload {
  drillId: number;
  userCode: string;
  confidence: DrillConfidence;
  sessionPosition: number;
  categoryStreak: number;
}
```

---

## API Contract (what backend will provide)

### GET /api/drills?filter=due|new|all&category=optional
```json
{
  "drills": [
    {
      "id": 1, "title": "...", "category": "Arrays & Hashing",
      "level": 1, "prompt": "...", "expectedCode": "...",
      "alternatives": [], "explanation": "...", "tags": [],
      "state": { "stability": 2.5, "nextReviewAt": "...", "totalAttempts": 3 }
    }
  ]
}
```

### POST /api/drills/attempt
Request: `{ drillId, userCode, confidence, sessionPosition, categoryStreak }`
Response: `{ newStability, nextReviewAt, effectiveCredit }`

### GET /api/drills/stats
```json
{
  "overallTier": "B",
  "categories": [
    { "name": "Arrays & Hashing", "fluency": 0.72, "drillsDue": 3, "totalDrills": 12, "mastered": 5 }
  ]
}
```

---

## styling notes

- Follow existing patterns: `bg-muted`, `text-foreground`, `border rounded-xl p-4`
- Drill level badge: L1 = subtle, L2 = accent/30, L3 = accent/60, L4 = accent
- Category badges: reuse existing category colors from drill-client.tsx
- Code textarea: `font-mono text-sm bg-card border border-border rounded-lg p-3`
- Rate buttons: match existing button styles. "Again" red-ish, "Easy" green-ish, "Good" accent

---

## existing drill page note

There's already `src/app/drill/` — this is the **Pattern Drill** page (LC problems by category).
The new syntax drills are DIFFERENT — they go on the DASHBOARD as a tab, not on `/drill`.
Don't modify the existing `/drill` page.
