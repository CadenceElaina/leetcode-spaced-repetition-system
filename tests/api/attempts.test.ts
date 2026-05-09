/**
 * API tests for POST /api/attempts
 *
 * Tests are structured to mock the DB and auth layer so they run without a
 * real Postgres connection.  The three cases from T-014:
 *   1. Unauthenticated → 401
 *   2. Invalid outcome field → 400
 *   3. Successful attempt → 200 with SRS data
 *
 * Additional coverage:
 *   4. Confidence out-of-range → 400
 *   5. Duplicate attempt same day → 409
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/* ── Module mocks ─────────────────────────────────────────────────────────── */

// We mock auth and db before importing the route so the mocks are in place.

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// Build a flexible chainable Drizzle mock.
// Each query method returns `this` so calls can be chained; the final
// `.limit()`, `.returning()`, or awaited `.where()` resolves the promise.
function makeDbMock() {
  const chain: Record<string, unknown> = {};

  const proxy = new Proxy(chain, {
    get(_target, prop: string) {
      // Return a function that always returns the proxy so the chain works.
      return vi.fn(() => proxy);
    },
  });

  return proxy;
}

// We expose a mutable `dbMock` so individual tests can configure responses.
let dbSelectResults: unknown[][] = [];
let dbInsertId = "test-attempt-id";
let dbCallIndex = 0;

vi.mock("@/db", () => ({
  get db() {
    return mockDb;
  },
}));

// mockDb is configured per-test in beforeEach.
let mockDb: ReturnType<typeof buildStructuredDbMock>;

function buildStructuredDbMock(selectSequence: unknown[][], insertId: string) {
  let selectCallCount = 0;

  function makeSelect() {
    return {
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(selectSequence[selectCallCount++] ?? []),
        }),
        orderBy: () => ({
          limit: () => Promise.resolve([]),
        }),
        limit: () => Promise.resolve(selectSequence[selectCallCount++] ?? []),
      }),
    };
  }

  return {
    select: vi.fn(makeSelect),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: insertId }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve([])),
    })),
  };
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  problemId: 1,
  solvedIndependently: "YES",
  solutionQuality: "OPTIMAL",
  confidence: 3,
  solveTimeMinutes: 20,
};

const MOCK_PROBLEM = {
  id: 1,
  title: "Two Sum",
  difficulty: "Easy",
  leetcodeUrl: "https://leetcode.com/problems/two-sum/",
  neetcodeUrl: null,
  optimalTimeComplexity: "O(n)",
  optimalSpaceComplexity: "O(n)",
};

/* ── Tests ────────────────────────────────────────────────────────────────── */

describe("POST /api/attempts", () => {
  let auth: ReturnType<typeof vi.fn>;
  let POST: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    dbCallIndex = 0;

    // Reset to a sensible default: problem found, no existing state, no dupes
    mockDb = buildStructuredDbMock(
      [
        [MOCK_PROBLEM],   // select problems
        [],               // select existing attempts (dupe check)
        [],               // select userProblemStates (existing state)
      ],
      "test-attempt-id",
    );

    // Re-import auth mock so we can configure it per-test
    const authModule = await import("@/auth");
    auth = authModule.auth as ReturnType<typeof vi.fn>;

    // Import POST fresh (vitest module cache is stable after first import)
    const route = await import("@/app/api/attempts/route");
    POST = route.POST;
  });

  /* ── 1. Unauthenticated → 401 ─────────────────────────────────────────── */

  it("returns 401 when not authenticated", async () => {
    auth.mockResolvedValue(null);

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Unauthorized" });
  });

  /* ── 2. Invalid outcome → 400 ─────────────────────────────────────────── */

  it("returns 400 for an invalid solvedIndependently value", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });

    const res = await POST(makeRequest({ ...VALID_BODY, solvedIndependently: "MAYBE" }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Invalid input" });
  });

  /* ── 3. Confidence out of range → 400 ────────────────────────────────── */

  it("returns 400 when confidence is out of range (1–5)", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });

    const res = await POST(makeRequest({ ...VALID_BODY, confidence: 6 }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Invalid input" });
  });

  /* ── 4. Successful attempt (first attempt) → 200 with SRS data ────────── */

  it("returns 200 with SRS data on a valid first attempt", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json).toHaveProperty("id");
    expect(json).toHaveProperty("srs");
    expect(json.srs).toHaveProperty("newStability");
    expect(json.srs).toHaveProperty("nextReviewAt");
    expect(json.srs.newStability).toBeGreaterThan(0);
  });

  /* ── 5. Duplicate attempt same day → 409 ─────────────────────────────── */

  it("returns 409 when the same problem is logged twice on the same day", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });

    // Override DB to return an existing attempt in the dupe-check query
    mockDb = buildStructuredDbMock(
      [
        [MOCK_PROBLEM],                                    // select problems
        [{ id: "existing-attempt", createdAt: new Date() }], // dupe check → found
      ],
      "test-attempt-id",
    );

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json).toMatchObject({ error: "duplicate" });
  });

  /* ── 6. Missing problemId (omitted from body) → 400 ──────────────────── */

  it("returns 400 when problemId is missing from the body", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });

    // JSON.stringify with undefined value omits the key entirely
    const body = { ...VALID_BODY, problemId: undefined };
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Invalid input" });
  });

  /* ── 7. problemId is a string → 400 ──────────────────────────────────── */

  it("returns 400 when problemId is a string instead of a number", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });

    const res = await POST(makeRequest({ ...VALID_BODY, problemId: "abc" }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Invalid input" });
  });

  /* ── 8. Invalid solutionQuality enum value → 400 ─────────────────────── */

  it("returns 400 when solutionQuality is an invalid enum value", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });

    const res = await POST(makeRequest({ ...VALID_BODY, solutionQuality: "PERFECT" }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Invalid input" });
  });
});

/* ── DELETE /api/attempts ─────────────────────────────────────────────────── */

/**
 * A more flexible DB mock that handles both:
 *   - `.where().limit(n)` (most selects)
 *   - `.where().orderBy()` (the remaining-attempts query in DELETE)
 *
 * Each call to `from()` advances the sequence index and captures the data for
 * that call.  The returned chain object is both awaitable (thenable) and
 * supports further chaining with `.where()`, `.limit()`, `.orderBy()`.
 */
function buildFlexibleDbMock(selectResponses: unknown[][]) {
  let idx = 0;
  function makeChain(data: unknown[]): any {
    const p = Promise.resolve(data);
    return {
      then: (res: any, rej?: any) => p.then(res, rej),
      catch: (fn: any) => p.catch(fn),
      finally: (fn: any) => p.finally(fn),
      where: () => makeChain(data),
      limit: (n: number) => Promise.resolve(data.slice(0, n)),
      orderBy: () => makeChain(data),
    };
  }
  return {
    select: vi.fn(() => ({ from: vi.fn(() => makeChain(selectResponses[idx++] ?? [])) })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: "new-id" }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve([])) })),
    })),
    delete: vi.fn(() => ({ where: vi.fn(() => Promise.resolve([])) })),
  };
}

function makeDeleteRequest(attemptId?: string): NextRequest {
  const url = attemptId
    ? `http://localhost/api/attempts?id=${attemptId}`
    : "http://localhost/api/attempts";
  return new NextRequest(url, { method: "DELETE" });
}

describe("DELETE /api/attempts", () => {
  let auth: ReturnType<typeof vi.fn>;
  let DELETE: (req: NextRequest) => Promise<Response>;

  const MOCK_ATTEMPT = {
    id: "attempt-1",
    problemId: 1,
    userId: "user-1",
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default: attempt found, belongs to user, no remaining attempts
    mockDb = buildFlexibleDbMock([
      [MOCK_ATTEMPT], // select attempt by id
      [],             // remaining attempts (empty → delete state path)
    ]) as any;

    const authModule = await import("@/auth");
    auth = authModule.auth as ReturnType<typeof vi.fn>;

    const route = await import("@/app/api/attempts/route");
    DELETE = route.DELETE;
  });

  /* ── 1. Unauthenticated → 401 ─────────────────────────────────────────── */

  it("returns 401 when not authenticated", async () => {
    auth.mockResolvedValue(null);

    const res = await DELETE(makeDeleteRequest("attempt-1"));
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Unauthorized" });
  });

  /* ── 2. Attempt not found → 404 ───────────────────────────────────────── */

  it("returns 404 when the attempt does not exist", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });

    mockDb = buildFlexibleDbMock([
      [], // select attempt → not found
    ]) as any;

    const res = await DELETE(makeDeleteRequest("nonexistent-id"));
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Attempt not found" });
  });

  /* ── 3. Attempt belongs to different user → 404 ───────────────────────── */

  it("returns 404 when the attempt belongs to a different user", async () => {
    auth.mockResolvedValue({ user: { id: "user-2" } });

    mockDb = buildFlexibleDbMock([
      [{ ...MOCK_ATTEMPT, userId: "user-1" }], // attempt owned by user-1
    ]) as any;

    const res = await DELETE(makeDeleteRequest("attempt-1"));
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Attempt not found" });
  });

  /* ── 4. Successful delete (no remaining attempts) → 200 ───────────────── */

  it("returns 200 ok when attempt is deleted and no remaining attempts exist", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });

    // attempt found → remaining attempts empty → state deleted
    mockDb = buildFlexibleDbMock([
      [MOCK_ATTEMPT], // select attempt by id
      [],             // remaining attempts → empty → delete state path
    ]) as any;

    const res = await DELETE(makeDeleteRequest("attempt-1"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toMatchObject({ ok: true });
  });
});
