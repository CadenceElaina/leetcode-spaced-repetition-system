/**
 * API tests for POST /api/review
 *
 * Tests cover:
 *   1. Unauthenticated → 401
 *   2. Invalid problemId type → 400
 *   3. Successful defer → 200 with deferredUntil
 *   4. Skip with invalid reason → 400
 *   5. Successful skip → 200 with nextReviewAt
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/* ── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/db", () => ({
  get db() {
    return mockDb;
  },
}));

let mockDb: ReturnType<typeof buildFlexibleDbMock>;

/**
 * Flexible DB mock that handles both `.where().limit(n)` and `.where().orderBy()`
 * patterns. Each `from()` call advances the sequence index.
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

/* ── Fixtures ─────────────────────────────────────────────────────────────── */

const MOCK_STATE = {
  id: "state-1",
  userId: "user-1",
  problemId: 1,
  stability: 5,
  nextReviewAt: new Date(),
  deferredUntil: null,
  totalAttempts: 1,
  bestSolutionQuality: "OPTIMAL",
};

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* ── Tests ────────────────────────────────────────────────────────────────── */

describe("POST /api/review", () => {
  let auth: ReturnType<typeof vi.fn>;
  let POST: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default: state found for problem 1
    mockDb = buildFlexibleDbMock([[MOCK_STATE]]);

    const authModule = await import("@/auth");
    auth = authModule.auth as ReturnType<typeof vi.fn>;

    const route = await import("@/app/api/review/route");
    POST = route.POST;
  });

  /* ── 1. Unauthenticated → 401 ─────────────────────────────────────────── */

  it("returns 401 when not authenticated", async () => {
    auth.mockResolvedValue(null);

    const res = await POST(makePostRequest({ action: "defer", problemId: 1 }));
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Unauthorized" });
  });

  /* ── 2. Invalid problemId type → 400 ─────────────────────────────────── */

  it("returns 400 when action is defer and problemId is a string", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });

    // No DB queries hit — validation rejects before any DB access
    mockDb = buildFlexibleDbMock([]);

    const res = await POST(makePostRequest({ action: "defer", problemId: "not-a-number" }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Invalid problemId" });
  });

  /* ── 3. Successful defer → 200 with deferredUntil ────────────────────── */

  it("returns 200 with deferredUntil when deferring a valid problem", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });

    mockDb = buildFlexibleDbMock([[MOCK_STATE]]);

    const res = await POST(makePostRequest({ action: "defer", problemId: 1 }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty("ok", true);
    expect(json).toHaveProperty("deferredUntil");
    expect(typeof json.deferredUntil).toBe("string");
  });

  /* ── 4. Skip with invalid reason → 400 ───────────────────────────────── */

  it("returns 400 when skip reason is invalid", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });

    mockDb = buildFlexibleDbMock([[MOCK_STATE]]);

    const res = await POST(makePostRequest({ action: "skip", problemId: 1, reason: "not_valid" }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Invalid skip reason" });
  });

  /* ── 5. Successful skip → 200 with nextReviewAt ───────────────────────── */

  it("returns 200 with nextReviewAt when skipping with a valid reason", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });

    mockDb = buildFlexibleDbMock([[MOCK_STATE]]);

    const res = await POST(makePostRequest({ action: "skip", problemId: 1, reason: "too_easy" }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty("ok", true);
    expect(json).toHaveProperty("nextReviewAt");
    expect(typeof json.nextReviewAt).toBe("string");
  });
});
