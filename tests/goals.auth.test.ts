import { describe, it, expect, beforeEach } from "vitest";
import * as goalsRoute from "@/app/api/goals/route";
import * as goalIdRoute from "@/app/api/goals/[id]/route";
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

async function createGoal(auth: TestAuth, body: Record<string, unknown>) {
  const res = await goalsRoute.POST(
    request("http://localhost/api/goals", auth, {
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

describe("goals API auth", () => {
  it("returns 401 on the collection routes without a session cookie", async () => {
    const listRes = await goalsRoute.GET(request("http://localhost/api/goals", null));
    expect(listRes.status).toBe(401);

    const createRes = await goalsRoute.POST(
      request("http://localhost/api/goals", null, {
        method: "POST",
        body: JSON.stringify({ title: "Anonymous" }),
      })
    );
    expect(createRes.status).toBe(401);
  });

  it("returns 401 on every by-id route without a session cookie", async () => {
    const goal = await createGoal(userA, { title: "Private" });
    const url = `http://localhost/api/goals/${goal._id}`;

    const getRes = await goalIdRoute.GET(request(url, null), params(goal._id));
    expect(getRes.status).toBe(401);

    const putRes = await goalIdRoute.PUT(
      request(url, null, { method: "PUT", body: JSON.stringify({ title: "X" }) }),
      params(goal._id)
    );
    expect(putRes.status).toBe(401);

    const deleteRes = await goalIdRoute.DELETE(
      request(url, null, { method: "DELETE" }),
      params(goal._id)
    );
    expect(deleteRes.status).toBe(401);
  });

  it("returns 404 on GET/PUT/DELETE for a goal owned by someone else", async () => {
    const goal = await createGoal(userA, { title: "Belongs to A" });
    const url = `http://localhost/api/goals/${goal._id}`;

    const getRes = await goalIdRoute.GET(request(url, userB), params(goal._id));
    expect(getRes.status).toBe(404);

    const putRes = await goalIdRoute.PUT(
      request(url, userB, {
        method: "PUT",
        body: JSON.stringify({ title: "Stolen" }),
      }),
      params(goal._id)
    );
    expect(putRes.status).toBe(404);

    const deleteRes = await goalIdRoute.DELETE(
      request(url, userB, { method: "DELETE" }),
      params(goal._id)
    );
    expect(deleteRes.status).toBe(404);

    const ownerRes = await goalIdRoute.GET(request(url, userA), params(goal._id));
    expect(ownerRes.status).toBe(200);
    expect((await ownerRes.json()).title).toBe("Belongs to A");
  });

  it("never lists another user's goals", async () => {
    await createGoal(userA, { title: "A visible" });
    await createGoal(userB, { title: "B hidden" });

    const asA = await goalsRoute.GET(request("http://localhost/api/goals", userA));
    const listA = await asA.json();
    expect(listA).toHaveLength(1);
    expect(listA[0].title).toBe("A visible");

    const asB = await goalsRoute.GET(request("http://localhost/api/goals", userB));
    const listB = await asB.json();
    expect(listB).toHaveLength(1);
    expect(listB[0].title).toBe("B hidden");
  });
});
