# Syntax Reference Panel + Run Button — Agent 2 Handoff

> Date: April 13, 2026
> Branch: `main`
> Status: Shell built. This doc defines what agent 2 needs to implement.

---

## What's Already Built (do not change)

### `src/components/syntax-reference-panel.tsx`

The full panel UI is implemented and wired into the dashboard. Your job is to fill the content. The component exports:

```typescript
export interface SyntaxEntry {
  id: string;
  name: string;
  category: string;
  summary: string;
  syntax: string;       // read-only CodeEditor
  example: string;      // read-only CodeEditor
  variants?: string[];  // inline code pills
}

export const SYNTAX_ENTRIES: SyntaxEntry[] = [ /* YOU FILL THIS */ ];
```

Currently has 2 placeholder entries (`defaultdict`, `Counter`). Replace/extend to ~80–100 entries.

### Dashboard toggle

The right column in the Drills tab has a "Fluency Stats / Syntax Ref" pill toggle. It persists to `localStorage` as `"aurora-right-panel"`. This is wired up — you don't need to touch `dashboard-client.tsx` for the toggle itself.

### CodeEditor component

`src/components/code-editor.tsx` — CodeMirror with Python syntax highlighting, Aurora dark theme. Props:

```typescript
interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  onSubmit?: () => void;  // fires on Ctrl+Shift+Enter
}
```

---

## Task 1: Fill SYNTAX_ENTRIES (~80–100 entries)

Target: every Python pattern a user will encounter in NeetCode 150.

### Required categories and entries

| Category | Entries needed |
|----------|---------------|
| **Collections** | `defaultdict`, `Counter`, `deque`, `OrderedDict`, `set`, `frozenset` |
| **Sorting** | `sorted()`, `sort()`, `key=lambda`, `key=len`, `reverse=True`, `sorted(zip(...))` |
| **Heap / heapq** | `heapq.heappush`, `heapq.heappop`, `heapq.heapify`, `heapq.nlargest`, min-heap negation pattern |
| **String** | `s.split()`, `s.join()`, `s.strip()`, `s[::-1]`, `s.isdigit()`, `ord(c)`, `chr(n)`, `ord(c)-ord('a')` |
| **List** | `list comprehension`, `enumerate()`, `zip()`, `zip_longest`, `reversed()`, `bisect.bisect_left`, `bisect.insort` |
| **Dict** | `d.get(k, default)`, `d.items()`, `d.keys()`, `d.values()`, dict comprehension, `setdefault` |
| **Two Pointers** | `left, right = 0, len(a)-1`, swap pattern `a[l], a[r] = a[r], a[l]` |
| **Sliding Window** | fixed window loop, variable window expand/shrink pattern |
| **Binary Search** | `bisect.bisect_left`, manual `lo, hi, mid` template, `while lo <= hi` |
| **Stack patterns** | monotonic stack (increasing / decreasing), push/pop template |
| **Graph** | `collections.defaultdict(list)` adjacency list, BFS with `deque`, DFS with visited set |
| **Tree** | `TreeNode` class pattern, recursive DFS template, iterative BFS |
| **Intervals** | sort by start, merge pattern, overlap check |
| **Math** | `//` floor div, `%` modulo, `abs()`, `float('inf')`, `math.gcd`, `divmod` |
| **Comprehensions** | list, dict, set, nested, conditional |
| **Iteration** | `range(n)`, `range(a,b)`, `range(a,b,-1)`, `enumerate`, `zip`, `*unpacking` |
| **Functional** | `map()`, `filter()`, `any()`, `all()`, `sum()`, `max/min with key` |

### Entry quality bar

Each entry must have:
- `syntax`: the canonical import + usage signature (1–4 lines)
- `example`: a complete, runnable minimal example (5–15 lines) that shows the pattern in a realistic context — not just `x = foo(bar)`
- `variants`: common variations or gotchas (2–5 items)
- `summary`: one sentence, no jargon — explain it like the user knows Python basics but not this specific thing

**Good example summary:** `"Dict that auto-initialises missing keys — no KeyError on first access."`
**Bad example summary:** `"A subclass of dict with a default factory."`

---

## Task 2: Run Button in CodeEditor

### Goal

Add a "Run" button to the drill flow that executes the user's code via Pyodide and shows stdout output. This is separate from the L5 test-case grading — it's a scratch execution for exploration.

### Where to add it

In `src/components/drill-card.tsx`, the prompt phase currently shows:

```tsx
<div className="flex items-center gap-2">
  <button onClick={handleSubmit} ...>Check Answer</button>
  <span>Ctrl+Shift+Enter</span>
</div>
```

Add a "Run" button next to Check Answer that:
1. Calls `getPyodide().runCode(userCode)` — see below
2. Shows a small output panel below the editor with stdout/stderr
3. Is disabled when Pyodide isn't ready (shows "loading…" state)
4. Is available on L1–L4 drills; hidden on L5 (L5 has its own test runner)

### API to add to Pyodide runner

In `src/lib/pyodide.ts`, add a `runCode(code: string): Promise<string>` method to `PyodideRunner` that runs arbitrary code and returns stdout as a string. Wire it in the worker at `public/workers/pyodide-worker.js`.

The worker already handles `init` / `run` message types. Add a `run-code` type:

```javascript
// In worker, handle message type "run-code":
// Execute code, capture sys.stdout, return { type: "run-code-result", id, output }
// On error: return { type: "run-code-error", id, error: errorMessage }
```

### Output panel UI (in DrillCard)

```tsx
{runOutput !== null && (
  <div className="rounded-lg border border-border bg-card p-3 font-mono text-xs">
    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Output</p>
    <pre className={`whitespace-pre-wrap ${runError ? 'text-red-400' : 'text-foreground/70'}`}>
      {runOutput || <span className="text-muted-foreground/40 italic">no output</span>}
    </pre>
  </div>
)}
```

---

## Task 3: Syntax Panel Availability During Sessions

### Rule

- **Available** on L1–L4 drill sessions and at the drills landing page
- **Hidden by default** on L5 (capstone) drills — the syntax panel would let users look up the exact answer
- **User override** — a session-level toggle in the session header: "Syntax Ref: on/off" (or a small icon button)

### Implementation

1. Add `syntaxRefEnabled` prop to `DrillCard` and `SessionHeader`
2. In `DrillCard`, when `syntaxRefEnabled` is false and `drill.level === 5`, hide any syntax panel trigger
3. In `SessionHeader`, add a small "ref" toggle button that fires `onToggleSyntaxRef`
4. In `dashboard-client.tsx`, add `drillSyntaxRefEnabled` state (default: `true`, set to `false` when starting an L5-only session, user can toggle)

---

## Files to Touch

| File | Change |
|------|--------|
| `src/components/syntax-reference-panel.tsx` | Fill `SYNTAX_ENTRIES` (main content work) |
| `src/lib/pyodide.ts` | Add `runCode(code: string): Promise<string>` method |
| `public/workers/pyodide-worker.js` | Add `run-code` message handler |
| `src/components/drill-card.tsx` | Add Run button + output panel to prompt phase |
| `src/components/session-header.tsx` | Add syntax ref toggle button + prop |
| `src/app/dashboard/dashboard-client.tsx` | Wire `drillSyntaxRefEnabled` state |

## Files NOT to Touch

- `src/components/code-editor.tsx` — no changes needed
- `src/db/schema.ts` — no changes needed
- `src/lib/sounds.ts` — no changes needed
- `src/lib/srs.ts` — no changes needed
- Any API routes — no changes needed

---

## Context

- Tech stack: Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4
- All drill UI is in `dashboard-client.tsx` (client component) — no server components involved
- Demo mode: unauthenticated users see `DEMO_DRILLS` from `demo-data.ts`. Run button should work in demo mode since Pyodide runs client-side.
- `getPyodide()` returns the singleton `PyodideRunner`. Call `getPyodide().init()` is already called on drill mode entry.
