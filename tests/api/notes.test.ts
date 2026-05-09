/**
 * API tests for GET /api/notes and PUT /api/notes
 *
 * GET tests:
 *   1. Unauthenticated → 401
 *   2. Missing problemId query param → 400
 *   3. State exists → 200 with notes string
 *   4. No state found → 200 with empty string
 *
 * PUT tests:
 *   1. Unauthenticated → 401
 *   2. Missing problemId in body → 400
 *   3. notes is not a string → 400
 *   4. Valid request → 200 { ok: true }
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

const MOCK_PROBLEM = { id: 1 };
const MOCK_STATE_WITH_NOTES = { id: "state-1", notes: "my note" };

/* ── GET /api/notes ───────────────────────────────────────────────────────── */

describe("GET /api/notes", () => {
  let auth: ReturnType<typeof vi.fn>;
  let GET: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default: state with notes found
    mockDb = buildFlexibleDbMock([[MOCK_STATE_WITH_NOTES]]);

    const authModule = await import("@/auth");
    auth = authModule.auth as ReturnType<typeof vi.fn>;

    const route = await import("@/app/api/notes/route");
    GET = route.GET;
  });

  /* ── 1. Unauthenticated → 401 ─────────────────────────────────────────── */

  it("returns 401 when not authenticated", async () => {
    auth.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/notes?problemId=1");
    const res = await GET(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Unauthorized" });
  });

  /* ── 2. Missing problemId → 400 ───────────────────────────────────────── */

  it("returns 400 when problemId query param is missing", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });
    mockDb = buildFlexibleDbMock([]);

    const req = new NextRequest("http://localhost/api/notes");
    const res = await GET(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Missing problemId" });
  });

  /* ── 3. State exists → 200 with notes ─────────────────────────────────── */

  it("returns 200 with the stored notes when a state exists", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });
    mockDb = buildFlexibleDbMock([[MOCK_STATE_WITH_NOTES]]);

    const req = new NextRequest("http://localhost/api/notes?problemId=1");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({ notes: "my note" });
  });

  /* ── 4. No state → 200 with empty string ──────────────────────────────── */

  it("returns 200 with empty string when no state is found", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });
    mockDb = buildFlexibleDbMock([[]]); // empty result

    const req = new NextRequest("http://localhost/api/notes?problemId=1");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({ notes: "" });
  });
});

/* ── PUT /api/notes ───────────────────────────────────────────────────────── */

describe("PUT /api/notes", () => {
  let auth: ReturnType<typeof vi.fn>;
  let PUT: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default: problem found, existing state found → update path
    mockDb = buildFlexibleDbMock([[MOCK_PROBLEM], [MOCK_STATE_WITH_NOTES]]);

    const authModule = await import("@/auth");
    auth = authModule.auth as ReturnType<typeof vi.fn>;

    const route = await import("@/app/api/notes/route");
    PUT = route.PUT;
  });

  function makePutRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost/api/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  /* ── 1. Unauthenticated → 401 ─────────────────────────────────────────── */

  it("returns 401 when not authenticated", async () => {
    auth.mockResolvedValue(null);

    const res = await PUT(makePutRequest({ problemId: 1, notes: "note" }));
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Unauthorized" });
  });

  /* ── 2. Missing problemId → 400 ───────────────────────────────────────── */

  it("returns 400 when problemId is missing from the body", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });
    mockDb = buildFlexibleDbMock([]);

    // Omit problemId — JSON.stringify drops undefined fields
    const res = await PUT(makePutRequest({ notes: "note" }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Invalid input" });
  });

  /* ── 3. notes is not a string → 400 ──────────────────────────────────── */

  it("returns 400 when notes is not a string", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });
    mockDb = buildFlexibleDbMock([]);

    const res = await PUT(makePutRequest({ problemId: 1, notes: 42 }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Invalid input" });
  });

  /* ── 4. Valid request → 200 { ok: true } ─────────────────────────────── */

  it("returns 200 { ok: true } when request is valid", async () => {
    auth.mockResolvedValue({ user: { id: "user-1" } });
    // problem found → existing state found → update path
    mockDb = buildFlexibleDbMock([[MOCK_PROBLEM], [MOCK_STATE_WITH_NOTES]]);

    const res = await PUT(makePutRequest({ problemId: 1, notes: "updated note" }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toMatchObject({ ok: true });
  });
});
