import { describe, it, expect, beforeEach } from "vitest";
import * as goalsRoute from "@/app/api/goals/route";
import * as goalRoute from "@/app/api/goals/[id]/route";
import {
  createTestAuth,
  makeRequestWithCookie,
  type TestAuth,
} from "./authTestUtils";

// The goals API now requires a session, so every request below is made as
// this one owner. The assertions themselves are unchanged.
let auth: TestAuth;

beforeEach(async () => {
  auth = await createTestAuth("owner-1", "owner");
});

function makeRequest(url: string, init?: RequestInit) {
  return makeRequestWithCookie(url, auth.cookie, init);
}

describe("goals API", () => {
  it("creates and lists goals", async () => {
    const createRes = await goalsRoute.POST(
      makeRequest("http://localhost/api/goals", {
        method: "POST",
        body: JSON.stringify({ title: "Learn TypeScript", description: "desc" }),
      })
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.title).toBe("Learn TypeScript");
    expect(created.progress).toBe(0);

    const listRes = await goalsRoute.GET(makeRequest("http://localhost/api/goals"));
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    expect(list).toHaveLength(1);
  });

  it("returns 400 when title missing on create", async () => {
    const res = await goalsRoute.POST(
      makeRequest("http://localhost/api/goals", {
        method: "POST",
        body: JSON.stringify({ description: "no title" }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("gets, updates, and deletes a goal by id", async () => {
    const createRes = await goalsRoute.POST(
      makeRequest("http://localhost/api/goals", {
        method: "POST",
        body: JSON.stringify({ title: "Original" }),
      })
    );
    const created = await createRes.json();

    const getRes = await goalRoute.GET(makeRequest(`http://localhost/api/goals/${created._id}`), {
      params: Promise.resolve({ id: created._id }),
    });
    expect(getRes.status).toBe(200);

    const putRes = await goalRoute.PUT(
      makeRequest(`http://localhost/api/goals/${created._id}`, {
        method: "PUT",
        body: JSON.stringify({ title: "Updated", description: "d", progress: 50 }),
      }),
      { params: Promise.resolve({ id: created._id }) }
    );
    expect(putRes.status).toBe(200);
    const updated = await putRes.json();
    expect(updated.title).toBe("Updated");
    expect(updated.progress).toBe(50);

    const deleteRes = await goalRoute.DELETE(
      makeRequest(`http://localhost/api/goals/${created._id}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: created._id }) }
    );
    expect(deleteRes.status).toBe(200);

    const getAfterDelete = await goalRoute.GET(
      makeRequest(`http://localhost/api/goals/${created._id}`),
      { params: Promise.resolve({ id: created._id }) }
    );
    expect(getAfterDelete.status).toBe(404);
  });

  it("returns 400 for malformed JSON body on create", async () => {
    const res = await goalsRoute.POST(
      makeRequest("http://localhost/api/goals", {
        method: "POST",
        body: "{not valid json",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid ObjectId", async () => {
    const res = await goalRoute.GET(makeRequest("http://localhost/api/goals/not-a-valid-id"), {
      params: Promise.resolve({ id: "not-a-valid-id" }),
    });
    expect(res.status).toBe(400);
  });
});
