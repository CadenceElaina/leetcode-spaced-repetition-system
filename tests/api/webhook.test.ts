/**
 * API tests for POST /api/webhook/github
 *
 * Tests cover:
 *   1. Non-push event (e.g. pull_request) → 200 ignored
 *   2. Push event but no user registered → 404
 *   3. Push event, user found, missing signature header → 401
 *   4. Push event, user found, invalid HMAC → 401
 *   5. Valid push with recognized commit slug → 200 { created: 1, skipped: 0 }
 *   6. Valid push with unrecognized commit message → 200 { created: 0, skipped: 1 }
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import crypto from "node:crypto";

/* ── Module mocks ─────────────────────────────────────────────────────────── */

// next/cache's unstable_cache wraps a function for caching.
// In tests we want it to just call the wrapped function directly (no caching).
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

vi.mock("@/db", () => ({
  get db() {
    return mockDb;
  },
}));

vi.mock("@/lib/webhook-crypto", () => ({
  decryptWebhookSecret: vi.fn((s: string) => s),
}));

let mockDb: ReturnType<typeof buildFlexibleDbMock>;

/**
 * Flexible DB mock that handles both `.where().limit(n)` and bare `.from()` (no .where())
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

const SECRET = "test-webhook-secret";

const MOCK_USER = {
  id: "user-1",
  githubRepo: "testuser/neetcode",
  githubWebhookSecret: SECRET,
  githubConnectedAt: null,
};

const MOCK_PROBLEM = {
  id: 1,
  neetcodeUrl: "https://neetcode.io/problems/two-sum/",
};

const PUSH_PAYLOAD = {
  repository: { full_name: "testuser/neetcode" },
  commits: [
    {
      id: "sha-abc123",
      message: "Add: two-sum - submission-1",
      timestamp: "2025-01-01T00:00:00Z",
    },
  ],
};

/**
 * Build a NextRequest for the webhook endpoint.
 *
 * - Provide `secret` to generate a valid HMAC signature header.
 * - Provide `badSig` to inject a deliberately wrong signature.
 * - Omit both to send the request without any signature header.
 * - Use `event` to set the x-github-event header (default: "push").
 */
function makeWebhookRequest({
  event = "push",
  body,
  secret,
  badSig,
}: {
  event?: string;
  body: unknown;
  secret?: string;
  badSig?: string;
}): NextRequest {
  const raw = JSON.stringify(body);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-github-event": event,
  };

  if (secret !== undefined) {
    headers["x-hub-signature-256"] =
      "sha256=" +
      crypto.createHmac("sha256", secret).update(raw).digest("hex");
  } else if (badSig !== undefined) {
    headers["x-hub-signature-256"] = badSig;
  }

  return new NextRequest("http://localhost/api/webhook/github", {
    method: "POST",
    headers,
    body: raw,
  });
}

/* ── Tests ────────────────────────────────────────────────────────────────── */

describe("POST /api/webhook/github", () => {
  let POST: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default DB: user found, problem found, no per-commit duplicates
    mockDb = buildFlexibleDbMock([
      [MOCK_USER],   // user lookup by repo name
      [MOCK_PROBLEM], // all problems (getCachedProblemsForWebhook)
      [],             // existing states (userProblemStates)
      [],             // SHA dupe check
      [],             // unresolved pending check
    ]);

    const route = await import("@/app/api/webhook/github/route");
    POST = route.POST;
  });

  /* ── 1. Non-push event → 200 ignored ─────────────────────────────────── */

  it("returns 200 ignored for a non-push event", async () => {
    mockDb = buildFlexibleDbMock([]); // no DB calls for non-push

    const req = makeWebhookRequest({
      event: "pull_request",
      body: PUSH_PAYLOAD,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toMatchObject({ ok: true, message: "ignored" });
  });

  /* ── 2. No user registered → 404 ─────────────────────────────────────── */

  it("returns 404 when no user is registered for the repo", async () => {
    mockDb = buildFlexibleDbMock([
      [], // user lookup → not found
    ]);

    const req = makeWebhookRequest({
      body: PUSH_PAYLOAD,
      secret: SECRET,
    });

    const res = await POST(req);
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json).toMatchObject({ error: "No user registered for this repo" });
  });

  /* ── 3. Missing signature header → 401 ───────────────────────────────── */

  it("returns 401 when the x-hub-signature-256 header is missing", async () => {
    mockDb = buildFlexibleDbMock([
      [MOCK_USER], // user lookup succeeds
    ]);

    // No `secret` or `badSig` → no signature header attached
    const req = makeWebhookRequest({ body: PUSH_PAYLOAD });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Missing signature" });
  });

  /* ── 4. Invalid HMAC → 401 ───────────────────────────────────────────── */

  it("returns 401 when the HMAC signature is invalid", async () => {
    mockDb = buildFlexibleDbMock([
      [MOCK_USER], // user lookup succeeds
    ]);

    const req = makeWebhookRequest({
      body: PUSH_PAYLOAD,
      badSig: "sha256=" + "0".repeat(64),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json).toMatchObject({ error: "Invalid signature" });
  });

  /* ── 5. Valid push, recognized slug → 200 { created: 1, skipped: 0 } ── */

  it("returns { created: 1, skipped: 0 } for a valid push with a recognized commit slug", async () => {
    mockDb = buildFlexibleDbMock([
      [MOCK_USER],    // user lookup
      [MOCK_PROBLEM], // all problems (getCachedProblemsForWebhook)
      [],             // existing states
      [],             // SHA dupe check for commit sha-abc123
      [],             // unresolved pending check for problem 1
    ]);

    const req = makeWebhookRequest({ body: PUSH_PAYLOAD, secret: SECRET });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({ created: 1, skipped: 0 });

    // Confirm an insert was called (the pending submission)
    expect(mockDb.insert).toHaveBeenCalledOnce();
  });

  /* ── 6. Valid push, unrecognized message → 200 { created: 0, skipped: 1 } */

  it("returns { created: 0, skipped: 1 } when the commit message does not match the pattern", async () => {
    const payloadBadMessage = {
      ...PUSH_PAYLOAD,
      commits: [
        {
          id: "sha-xyz999",
          message: "Just some random commit",
          timestamp: "2025-01-01T00:00:00Z",
        },
      ],
    };

    mockDb = buildFlexibleDbMock([
      [MOCK_USER],    // user lookup
      [MOCK_PROBLEM], // all problems
      [],             // existing states
      // no per-commit queries — message doesn't match, skipped before DB
    ]);

    const req = makeWebhookRequest({ body: payloadBadMessage, secret: SECRET });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({ created: 0, skipped: 1 });

    // No insert should have been called
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
