import { describe, it, expect, beforeEach } from "vitest";
import * as weeklyRoute from "@/app/api/weekly/route";
import * as weeklyIdRoute from "@/app/api/weekly/[id]/route";
import {
  createTestAuth,
  makeRequestWithCookie,
  type TestAuth,
} from "./authTestUtils";

let userA: TestAuth;
let userB: TestAuth;

beforeEach(async () => {
  userA = await createTestAuth("aaa", "user-a");
  userB = await createTestAuth("bbb", "user-b");
});

function request(url: string, auth: TestAuth | null, init?: RequestInit) {
  return makeRequestWithCookie(url, auth?.cookie, init);
}

async function createPlan(auth: TestAuth, body: Record<string, unknown>) {
  const res = await weeklyRoute.POST(
    request("http://localhost/api/weekly", auth, {
      method: "POST",
      body: JSON.stringify(body),
    })
  );
  expect(res.status).toBe(201);
  return res.json();
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("weekly API auth", () => {
  it("returns 401 on the collection routes without a session cookie", async () => {
    const listRes = await weeklyRoute.GET(request("http://localhost/api/weekly", null));
    expect(listRes.status).toBe(401);

    const createRes = await weeklyRoute.POST(
      request("http://localhost/api/weekly", null, {
        method: "POST",
        body: JSON.stringify({ weekStart: "2026-09-21T00:00:00.000Z" }),
      })
    );
    expect(createRes.status).toBe(401);
  });

  it("returns 401 on every by-id route without a session cookie", async () => {
    const plan = await createPlan(userA, { weekStart: "2026-09-21T00:00:00.000Z" });
    const url = `http://localhost/api/weekly/${plan._id}`;

    const getRes = await weeklyIdRoute.GET(request(url, null), params(plan._id));
    expect(getRes.status).toBe(401);

    const putRes = await weeklyIdRoute.PUT(
      request(url, null, { method: "PUT", body: JSON.stringify({ memo: "x" }) }),
      params(plan._id)
    );
    expect(putRes.status).toBe(401);

    const patchRes = await weeklyIdRoute.PATCH(
      request(url, null, {
        method: "PATCH",
        body: JSON.stringify({ goalIndex: 0, done: true }),
      }),
      params(plan._id)
    );
    expect(patchRes.status).toBe(401);

    const deleteRes = await weeklyIdRoute.DELETE(
      request(url, null, { method: "DELETE" }),
      params(plan._id)
    );
    expect(deleteRes.status).toBe(401);
  });

  it("returns 404 on all by-id methods for a plan owned by someone else", async () => {
    const plan = await createPlan(userA, {
      weekStart: "2026-09-21T00:00:00.000Z",
      goals: [{ text: "A", done: false }],
    });
    const url = `http://localhost/api/weekly/${plan._id}`;

    const getRes = await weeklyIdRoute.GET(request(url, userB), params(plan._id));
    expect(getRes.status).toBe(404);

    const putRes = await weeklyIdRoute.PUT(
      request(url, userB, { method: "PUT", body: JSON.stringify({ memo: "stolen" }) }),
      params(plan._id)
    );
    expect(putRes.status).toBe(404);

    const patchRes = await weeklyIdRoute.PATCH(
      request(url, userB, {
        method: "PATCH",
        body: JSON.stringify({ goalIndex: 0, done: true }),
      }),
      params(plan._id)
    );
    expect(patchRes.status).toBe(404);

    const deleteRes = await weeklyIdRoute.DELETE(
      request(url, userB, { method: "DELETE" }),
      params(plan._id)
    );
    expect(deleteRes.status).toBe(404);

    const ownerRes = await weeklyIdRoute.GET(request(url, userA), params(plan._id));
    expect(ownerRes.status).toBe(200);
  });

  it("never lists another user's weekly plans", async () => {
    await createPlan(userA, { weekStart: "2026-09-21T00:00:00.000Z" });
    await createPlan(userB, { weekStart: "2026-09-21T00:00:00.000Z" });

    const asA = await weeklyRoute.GET(request("http://localhost/api/weekly", userA));
    expect(await asA.json()).toHaveLength(1);

    const asB = await weeklyRoute.GET(request("http://localhost/api/weekly", userB));
    expect(await asB.json()).toHaveLength(1);
  });

  it("allows two different users to have a plan for the same weekStart", async () => {
    const weekStart = "2026-09-21T00:00:00.000Z";
    const planA = await createPlan(userA, { weekStart });
    const planB = await createPlan(userB, { weekStart });
    expect(planA._id).not.toBe(planB._id);
  });
});
