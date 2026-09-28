import { describe, it, expect, beforeEach } from "vitest";
import * as todosRoute from "@/app/api/todos/route";
import * as todoIdRoute from "@/app/api/todos/[id]/route";
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

async function createTodo(auth: TestAuth, body: Record<string, unknown>) {
  const res = await todosRoute.POST(
    request("http://localhost/api/todos", auth, {
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

describe("todos API auth", () => {
  it("returns 401 on the collection routes without a session cookie", async () => {
    const listRes = await todosRoute.GET(
      request("http://localhost/api/todos", null)
    );
    expect(listRes.status).toBe(401);

    const createRes = await todosRoute.POST(
      request("http://localhost/api/todos", null, {
        method: "POST",
        body: JSON.stringify({ title: "Anonymous" }),
      })
    );
    expect(createRes.status).toBe(401);
  });

  it("returns 401 on every by-id route without a session cookie", async () => {
    const todo = await createTodo(userA, { title: "Private" });
    const url = `http://localhost/api/todos/${todo._id}`;

    const getRes = await todoIdRoute.GET(
      request(url, null),
      params(todo._id)
    );
    expect(getRes.status).toBe(401);

    const putRes = await todoIdRoute.PUT(
      request(url, null, { method: "PUT", body: JSON.stringify({ title: "X" }) }),
      params(todo._id)
    );
    expect(putRes.status).toBe(401);

    const patchRes = await todoIdRoute.PATCH(
      request(url, null, {
        method: "PATCH",
        body: JSON.stringify({ status: "done" }),
      }),
      params(todo._id)
    );
    expect(patchRes.status).toBe(401);

    const deleteRes = await todoIdRoute.DELETE(
      request(url, null, { method: "DELETE" }),
      params(todo._id)
    );
    expect(deleteRes.status).toBe(401);
  });

  it("returns 404 on all four by-id methods for a todo owned by someone else", async () => {
    const todo = await createTodo(userA, { title: "Belongs to A" });
    const url = `http://localhost/api/todos/${todo._id}`;

    const getRes = await todoIdRoute.GET(
      request(url, userB),
      params(todo._id)
    );
    expect(getRes.status).toBe(404);

    const putRes = await todoIdRoute.PUT(
      request(url, userB, {
        method: "PUT",
        body: JSON.stringify({ title: "Stolen", status: "doing" }),
      }),
      params(todo._id)
    );
    expect(putRes.status).toBe(404);

    const patchRes = await todoIdRoute.PATCH(
      request(url, userB, {
        method: "PATCH",
        body: JSON.stringify({ status: "done" }),
      }),
      params(todo._id)
    );
    expect(patchRes.status).toBe(404);

    const deleteRes = await todoIdRoute.DELETE(
      request(url, userB, { method: "DELETE" }),
      params(todo._id)
    );
    expect(deleteRes.status).toBe(404);

    // None of the rejected calls touched the document.
    const ownerRes = await todoIdRoute.GET(
      request(url, userA),
      params(todo._id)
    );
    expect(ownerRes.status).toBe(200);
    expect((await ownerRes.json()).title).toBe("Belongs to A");
  });

  it("lets the owner GET/PUT/PATCH/DELETE their own todo", async () => {
    const todo = await createTodo(userA, { title: "Mine" });
    const url = `http://localhost/api/todos/${todo._id}`;
    expect(String(todo.userId)).toBe(userA.userId);

    const getRes = await todoIdRoute.GET(
      request(url, userA),
      params(todo._id)
    );
    expect(getRes.status).toBe(200);
    expect((await getRes.json()).title).toBe("Mine");

    const putRes = await todoIdRoute.PUT(
      request(url, userA, {
        method: "PUT",
        body: JSON.stringify({ title: "Renamed", status: "doing", priority: "high" }),
      }),
      params(todo._id)
    );
    expect(putRes.status).toBe(200);
    const updated = await putRes.json();
    expect(updated.title).toBe("Renamed");
    expect(updated.priority).toBe("high");
    expect(String(updated.userId)).toBe(userA.userId);

    const patchRes = await todoIdRoute.PATCH(
      request(url, userA, {
        method: "PATCH",
        body: JSON.stringify({ status: "done", order: "a5" }),
      }),
      params(todo._id)
    );
    expect(patchRes.status).toBe(200);
    const patched = await patchRes.json();
    expect(patched.status).toBe("done");
    expect(patched.order).toBe("a5");

    const deleteRes = await todoIdRoute.DELETE(
      request(url, userA, { method: "DELETE" }),
      params(todo._id)
    );
    expect(deleteRes.status).toBe(200);
    expect(await deleteRes.json()).toEqual({ success: true });

    const goneRes = await todoIdRoute.GET(
      request(url, userA),
      params(todo._id)
    );
    expect(goneRes.status).toBe(404);
  });

  it("never lists another user's todos, whatever filters are passed", async () => {
    const weeklyPlanId = "507f1f77bcf86cd799439011";
    const goalId = "507f1f77bcf86cd799439012";
    const shared = { status: "doing", weeklyPlanId, goalId };

    await createTodo(userA, { title: "A visible", ...shared });
    await createTodo(userB, { title: "B hidden", ...shared });

    const unfiltered = await todosRoute.GET(
      request("http://localhost/api/todos", userA)
    );
    expect(unfiltered.status).toBe(200);
    const all = await unfiltered.json();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe("A visible");

    const filtered = await todosRoute.GET(
      request(
        `http://localhost/api/todos?status=doing&weeklyPlanId=${weeklyPlanId}&goalId=${goalId}`,
        userA
      )
    );
    const matching = await filtered.json();
    expect(matching).toHaveLength(1);
    expect(matching[0].title).toBe("A visible");

    const asB = await todosRoute.GET(
      request("http://localhost/api/todos?status=doing", userB)
    );
    const bList = await asB.json();
    expect(bList).toHaveLength(1);
    expect(bList[0].title).toBe("B hidden");
  });

  it("ignores a spoofed userId in the POST body", async () => {
    const created = await createTodo(userA, {
      title: "Spoofed",
      userId: userB.userId,
    });

    expect(String(created.userId)).toBe(userA.userId);
    expect(String(created.userId)).not.toBe(userB.userId);

    const asB = await todosRoute.GET(request("http://localhost/api/todos", userB));
    expect(await asB.json()).toHaveLength(0);
  });
});
