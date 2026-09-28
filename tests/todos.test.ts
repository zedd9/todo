import { describe, it, expect, beforeEach } from "vitest";
import * as todosRoute from "@/app/api/todos/route";
import * as todoIdRoute from "@/app/api/todos/[id]/route";
import {
  createTestAuth,
  makeRequestWithCookie,
  type TestAuth,
} from "./authTestUtils";

// The todos API now requires a session, so every request below is made as this
// one owner. The assertions themselves are unchanged.
let auth: TestAuth;

beforeEach(async () => {
  auth = await createTestAuth("owner-1", "owner");
});

function makeRequest(url: string, init?: RequestInit) {
  return makeRequestWithCookie(url, auth.cookie, init);
}

describe("todos API", () => {
  it("creates and lists todos", async () => {
    const createRes = await todosRoute.POST(
      makeRequest("http://localhost/api/todos", {
        method: "POST",
        body: JSON.stringify({ title: "Write report" }),
      })
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.status).toBe("todo");
    expect(created.order).toBeTruthy();

    const listRes = await todosRoute.GET(makeRequest("http://localhost/api/todos"));
    expect(listRes.status).toBe(200);
    expect(await listRes.json()).toHaveLength(1);
  });

  it("returns 400 when title missing", async () => {
    const res = await todosRoute.POST(
      makeRequest("http://localhost/api/todos", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
  });

  it("filters by status, weeklyPlanId, and goalId (combinable)", async () => {
    const weeklyPlanId = "507f1f77bcf86cd799439011";
    const goalId = "507f1f77bcf86cd799439012";

    await todosRoute.POST(
      makeRequest("http://localhost/api/todos", {
        method: "POST",
        body: JSON.stringify({ title: "A", status: "doing", weeklyPlanId, goalId }),
      })
    );
    await todosRoute.POST(
      makeRequest("http://localhost/api/todos", {
        method: "POST",
        body: JSON.stringify({ title: "B", status: "todo" }),
      })
    );

    const statusRes = await todosRoute.GET(
      makeRequest("http://localhost/api/todos?status=doing")
    );
    expect(await statusRes.json()).toHaveLength(1);

    const combinedRes = await todosRoute.GET(
      makeRequest(
        `http://localhost/api/todos?status=doing&weeklyPlanId=${weeklyPlanId}&goalId=${goalId}`
      )
    );
    const combined = await combinedRes.json();
    expect(combined).toHaveLength(1);
    expect(combined[0].title).toBe("A");
  });

  it("PATCH updates status and order", async () => {
    const createRes = await todosRoute.POST(
      makeRequest("http://localhost/api/todos", {
        method: "POST",
        body: JSON.stringify({ title: "Move me" }),
      })
    );
    const created = await createRes.json();

    const patchRes = await todoIdRoute.PATCH(
      makeRequest(`http://localhost/api/todos/${created._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "done", order: "a5" }),
      }),
      { params: Promise.resolve({ id: created._id }) }
    );
    expect(patchRes.status).toBe(200);
    const patched = await patchRes.json();
    expect(patched.status).toBe("done");
    expect(patched.order).toBe("a5");
  });

  it("returns 400 for malformed JSON body on create", async () => {
    const res = await todosRoute.POST(
      makeRequest("http://localhost/api/todos", {
        method: "POST",
        body: "{not valid json",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid status enum value", async () => {
    const res = await todosRoute.POST(
      makeRequest("http://localhost/api/todos", {
        method: "POST",
        body: JSON.stringify({ title: "Bad status", status: "bogus" }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("PATCH rejects fields outside status/order", async () => {
    const createRes = await todosRoute.POST(
      makeRequest("http://localhost/api/todos", {
        method: "POST",
        body: JSON.stringify({ title: "Immutable via PATCH" }),
      })
    );
    const created = await createRes.json();

    const patchRes = await todoIdRoute.PATCH(
      makeRequest(`http://localhost/api/todos/${created._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "doing", dayOfWeek: 2 }),
      }),
      { params: Promise.resolve({ id: created._id }) }
    );
    expect(patchRes.status).toBe(400);
  });

  it("supports GET/PUT/DELETE by id and 400 for invalid ObjectId", async () => {
    const createRes = await todosRoute.POST(
      makeRequest("http://localhost/api/todos", {
        method: "POST",
        body: JSON.stringify({ title: "Detail me" }),
      })
    );
    const created = await createRes.json();

    const getRes = await todoIdRoute.GET(
      makeRequest(`http://localhost/api/todos/${created._id}`),
      { params: Promise.resolve({ id: created._id }) }
    );
    expect(getRes.status).toBe(200);

    const putRes = await todoIdRoute.PUT(
      makeRequest(`http://localhost/api/todos/${created._id}`, {
        method: "PUT",
        body: JSON.stringify({ title: "Renamed", status: "doing", priority: "high" }),
      }),
      { params: Promise.resolve({ id: created._id }) }
    );
    expect(putRes.status).toBe(200);
    expect((await putRes.json()).title).toBe("Renamed");

    const deleteRes = await todoIdRoute.DELETE(
      makeRequest(`http://localhost/api/todos/${created._id}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: created._id }) }
    );
    expect(deleteRes.status).toBe(200);

    const invalidRes = await todoIdRoute.GET(
      makeRequest("http://localhost/api/todos/not-valid"),
      { params: Promise.resolve({ id: "not-valid" }) }
    );
    expect(invalidRes.status).toBe(400);
  });
});
