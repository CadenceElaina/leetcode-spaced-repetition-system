# Syntax & Concept Drills — Design Decision

> Date: 2026-04-12
> Status: Planning
> Context: Aurora currently tracks LC problem attempts with FSRS. This adds a parallel drill system for syntax fluency.

---

## Problem

Solving LC problems requires two skills: algorithmic thinking (which pattern?) and syntax fluency (can you write it?). Aurora tracks the first but not the second. Users who understand sliding window conceptually but can't reliably write the `while l < r` pattern from memory hit a wall in interviews where speed matters.

## Decision

Add **syntax/concept drills** as a parallel SRS track alongside LC problems. Drills are atomic code-writing exercises that build muscle memory for Python patterns used in coding interviews.

---

## Drill Structure

### Four Levels Per Concept

| Level              | Purpose                             | Example (defaultdict)                                                  |
| ------------------ | ----------------------------------- | ---------------------------------------------------------------------- |
| **L1: Syntax**     | Write the basic pattern from memory | `from collections import defaultdict; graph = defaultdict(list)`       |
| **L2: Variations** | Same tool, different context        | Use defaultdict for: adjacency list, anagram grouping, frequency count |
| **L3: When & Why** | Choose between alternatives         | When defaultdict(list) vs .setdefault() vs `if key not in dict`        |
| **L4: Combine**    | Use in a multi-step solution        | Build graph from edge list + find nodes with in-degree 0               |

### Drill Flow

1. User sees prompt ("Create a frequency counter for a list of words")
2. User types their code in a code input
3. System reveals expected answer + explanation
4. User self-rates 1-4 (Again / Hard / Good / Easy)
5. SRS schedules next review

### Explanations Are Core, Not Optional

Every drill includes curated "why this way" content that explains:

- What the syntax does
- Common alternatives and when to use each (e.g., `range(len(x))` vs `enumerate(x)`)
- Trade-offs and edge cases
- The explicit/transferable version alongside the Pythonic shortcut

Example:

```
Your answer:  for i in range(len(nums)):
Expected:     for i, num in enumerate(nums):

Why enumerate?
- range(len(x)) gives indices only — requires nums[i] access
- enumerate(x) gives (index, value) together — cleaner, less error-prone
- Both O(n), but enumerate signals intent: "I need both index and value"
- When to use range: index manipulation (e.g., range(n-1, -1, -1) for reverse)
```

---

## Category Map

| Category           | Core concepts to drill                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| **Hash Maps**      | `dict`, `defaultdict`, `Counter`, `.get()`, `.setdefault()`, comprehensions, `zip` to build dicts |
| **Two Pointers**   | `while l < r`, swapping, `sorted()` vs `.sort()`, converging pointers                             |
| **Sliding Window** | window expand/shrink, `deque` for monotonic window, tracking window state                         |
| **Stack**          | `list` as stack, monotonic stack, matching brackets, `stack[-1]` peek                             |
| **Binary Search**  | `bisect_left`/`bisect_right`, manual template, search space pattern                               |
| **Linked List**    | node class, dummy head, fast/slow pointers, reversal                                              |
| **Trees**          | recursive DFS, iterative BFS with `deque`, level-order, `nonlocal` closures                       |
| **Graphs**         | adjacency list build, BFS/DFS templates, visited set, `deque` BFS                                 |
| **Heap**           | `heapq.heappush`/`heappop`, nlargest/nsmallest, tuple priority, max-heap `-val` trick             |
| **Backtracking**   | recursive template, `path.append()`/`path.pop()`, `used` set, permutations/combinations           |
| **DP**             | memoization `@cache`, tabulation, 1D/2D array init, base cases                                    |
| **Greedy**         | `sorted()` with key, interval patterns, `zip` paired iteration                                    |

~8-12 drills per category across all levels. **~100-150 total drills** for v1.

---

## SRS Integration

### Scheduling

Reuses the existing FSRS engine (`srs.ts`). Each drill has its own stability and retrievability. Self-rating 1-4 maps to confidence signal for `computeNewStability`.

### Level Gating

- Level 1 drills available immediately
- Level 2 unlocks when L1 drills in that category reach stability > 7d
- Level 3 unlocks when L2 drills reach stability > 14d
- Level 4 unlocks when L3 drills reach stability > 21d

### Session Fatigue (Diminishing Returns)

Users can grind as many drills as they want, but the stability credit decreases to reflect actual learning value:

**Session length:**
| Drills in session | Credit multiplier |
|---|---|
| 1-8 | 1.0× (full) |
| 9-15 | 0.7× |
| 16-25 | 0.4× |
| 26+ | 0.2× (floor) |

**Same-category consecutive penalty:**
| Consecutive same-category | Credit multiplier |
|---|---|
| 1st | 1.0× |
| 2nd | 0.8× |
| 3rd | 0.5× |
| 4th+ | 0.3× |

Multipliers stack: drill #30 that's also the 8th consecutive heap drill → `0.2 × 0.3 = 0.06×` credit.

After ~12 drills, subtle UI note: "Nice session! Returns are diminishing — your best gains now come from problems or a break."

### Interleaving Strategy

- **Initial exposure** (Level 1, first time): blocked (3-5 drills in same category to learn the syntax)
- **Once seen**: Daily Drill sessions are interleaved across categories
- **Review sessions**: always interleaved
- **"Daily Drill" button**: pulls ~8 due drills from SRS queue, interleaved across categories, ~10 min

---

## Scoring — Parallel Track

Drills do NOT inflate the existing Readiness Score. Two separate tracks:

### Problem Readiness (existing, unchanged)

- Coverage 30%, Retention 40%, Category Balance 20%, Consistency 10%
- Driven by LC problem attempts only

### Syntax Fluency (new)

- Per-category fluency score based on drill stability
- Overall fluency tier (S/A/B/C/D)
- Displayed alongside problem readiness

### Combined Category Health

```
"Arrays & Hashing: Problems B+ | Syntax A | Combined: B+"
```

Combined takes the LOWER of the two:

- Great problem-solving + shaky syntax → system says drill
- Perfect syntax + can't apply it → system says do problems
- Neither track inflates the other

### Drill data influences problem review queue

If syntax stability in "Heap" is low, heap problems get a slight priority boost — user will likely struggle with `heapq` syntax.

---

## Dashboard Integration

Drills live as a tab on the existing dashboard — no separate page:

```
[Review 8] [New 8] [Done 16] [Import] [🧪 Drills]
```

### Drill tab active → left panel shows:

- [Due 5] [New 12] [Mastered 28] sub-tabs
- "Daily Drill (8 drills, ~10 min)" one-click start button
- Drill queue list with category, level, due date

### Drill tab active → right panel shows:

- Syntax Fluency score + tier
- Per-category fluency breakdown
- Weakest/strongest categories
- Drill activity chart

### Drill interaction (inline):

Click drill → expands inline or opens code input view → type answer → see expected + explanation → self-rate → next. Never leaves dashboard.

---

## Data Model

### New Tables

```sql
-- Drill content (seeded, not user-generated)
syntax_drill:
  id            SERIAL PRIMARY KEY
  title         VARCHAR(255) NOT NULL        -- "enumerate vs range(len())"
  category      VARCHAR(100) NOT NULL        -- matches problem categories
  level         SMALLINT NOT NULL             -- 1-4
  language      VARCHAR(20) NOT NULL DEFAULT 'python'
  prompt        TEXT NOT NULL                 -- what user sees
  expected_code TEXT NOT NULL                 -- ideal answer
  alternatives  TEXT[]                        -- other acceptable answers
  explanation   TEXT NOT NULL                 -- "why this way" content
  tags          TEXT[]                        -- e.g., ['iteration', 'indexing']

-- User state per drill (mirrors user_problem_state)
user_drill_state:
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         UUID NOT NULL REFERENCES user(id) ON DELETE CASCADE
  drill_id        INT NOT NULL REFERENCES syntax_drill(id) ON DELETE CASCADE
  stability       REAL NOT NULL DEFAULT 0.5
  last_reviewed_at TIMESTAMP
  next_review_at  TIMESTAMP
  total_attempts  INT NOT NULL DEFAULT 0
  best_confidence SMALLINT               -- 1-4
  notes           TEXT
  created_at      TIMESTAMP NOT NULL DEFAULT now()
  updated_at      TIMESTAMP NOT NULL DEFAULT now()

-- Drill attempts (for history/analytics)
drill_attempt:
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         UUID NOT NULL REFERENCES user(id) ON DELETE CASCADE
  drill_id        INT NOT NULL REFERENCES syntax_drill(id) ON DELETE CASCADE
  user_code       TEXT                    -- what they typed
  confidence      SMALLINT NOT NULL       -- 1-4 self-rating
  session_position INT                    -- nth drill in this session (for fatigue calc)
  category_streak  INT                    -- nth consecutive same-category (for interleave calc)
  effective_credit REAL                   -- actual multiplier applied
  created_at      TIMESTAMP NOT NULL DEFAULT now()
```

### API Routes

- `GET /api/drills` — fetch drill queue (due, new, by category)
- `POST /api/drills/attempt` — log a drill attempt (self-rating, user code)
- `GET /api/drills/stats` — fluency scores per category

---

## Language Support

Python first. Schema includes `language` column for future expansion (Java, C++). Drill content is language-specific — the same concept (e.g., "frequency counter") has different drills per language.

---

## What This Is NOT

- Not a code editor / execution environment (no running user code)
- Not NLP evaluation of user code correctness
- Not flashcards (user produces code, doesn't just flip a card)
- Not a replacement for solving real problems

---

## Implementation Priority

1. Schema + seed data (Level 1-2 drills for 4 categories: Hash Maps, Two Pointers, Stack, Trees)
2. Drill review UI (inline on dashboard)
3. SRS scheduling integration
4. Daily Drill mode (interleaved session)
5. Syntax Fluency scoring
6. Remaining categories + Level 3-4 drills
7. Session fatigue tracking
8. Category health combined scoring
