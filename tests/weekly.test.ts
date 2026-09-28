import { describe, it, expect, beforeEach } from "vitest";
import * as weeklyRoute from "@/app/api/weekly/route";
import * as weeklyIdRoute from "@/app/api/weekly/[id]/route";
import {
  createTestAuth,
  makeRequestWithCookie,
  type TestAuth,
} from "./authTestUtils";

// The weekly API now requires a session, so every request below is made as
// this one owner. The assertions themselves are unchanged.
let auth: TestAuth;

beforeEach(async () => {
  auth = await createTestAuth("owner-1", "owner");
});

function makeRequest(url: string, init?: RequestInit) {
  return makeRequestWithCookie(url, auth.cookie, init);
}

describe("weekly API", () => {
  it("creates and lists weekly plans, with optional weekStart filter", async () => {
    const weekStart = "2026-09-21T00:00:00.000Z";
    const createRes = await weeklyRoute.POST(
      makeRequest("http://localhost/api/weekly", {
        method: "POST",
        body: JSON.stringify({
          weekStart,
          goals: [{ text: "Ship feature", done: false }],
          memo: "memo",
        }),
      })
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.goals).toHaveLength(1);

    const listRes = await weeklyRoute.GET(makeRequest("http://localhost/api/weekly"));
    expect(listRes.status).toBe(200);
    expect(await listRes.json()).toHaveLength(1);

    const filteredRes = await weeklyRoute.GET(
      makeRequest(`http://localhost/api/weekly?weekStart=${encodeURIComponent(weekStart)}`)
    );
    expect(filteredRes.status).toBe(200);
    expect(await filteredRes.json()).toHaveLength(1);
  });

  it("returns 409 on duplicate weekStart", async () => {
    const weekStart = "2026-09-21T00:00:00.000Z";
    const first = await weeklyRoute.POST(
      makeRequest("http://localhost/api/weekly", {
        method: "POST",
        body: JSON.stringify({ weekStart }),
      })
    );
    expect(first.status).toBe(201);

    const second = await weeklyRoute.POST(
      makeRequest("http://localhost/api/weekly", {
        method: "POST",
        body: JSON.stringify({ weekStart }),
      })
    );
    expect(second.status).toBe(409);
    const body = await second.json();
    expect(body.error).toBeTruthy();
  });

  it("PATCH toggles goals[index].done and returns the updated subdocument", async () => {
    const createRes = await weeklyRoute.POST(
      makeRequest("http://localhost/api/weekly", {
        method: "POST",
        body: JSON.stringify({
          weekStart: "2026-09-14T00:00:00.000Z",
          goals: [
            { text: "Goal A", done: false },
            { text: "Goal B", done: false },
          ],
        }),
      })
    );
    const created = await createRes.json();

    const patchRes = await weeklyIdRoute.PATCH(
      makeRequest(`http://localhost/api/weekly/${created._id}`, {
        method: "PATCH",
        body: JSON.stringify({ goalIndex: 1, done: true }),
      }),
      { params: Promise.resolve({ id: created._id }) }
    );
    expect(patchRes.status).toBe(200);
    const updatedGoal = await patchRes.json();
    expect(updatedGoal.text).toBe("Goal B");
    expect(updatedGoal.done).toBe(true);

    const getRes = await weeklyIdRoute.GET(
      makeRequest(`http://localhost/api/weekly/${created._id}`),
      { params: Promise.resolve({ id: created._id }) }
    );
    const plan = await getRes.json();
    expect(plan.goals[1].done).toBe(true);
    expect(plan.goals[0].done).toBe(false);
  });

  it("supports GET/PUT/DELETE by id", async () => {
    const createRes = await weeklyRoute.POST(
      makeRequest("http://localhost/api/weekly", {
        method: "POST",
        body: JSON.stringify({ weekStart: "2026-09-07T00:00:00.000Z" }),
      })
    );
    const created = await createRes.json();

    const putRes = await weeklyIdRoute.PUT(
      makeRequest(`http://localhost/api/weekly/${created._id}`, {
        method: "PUT",
        body: JSON.stringify({ memo: "updated memo" }),
      }),
      { params: Promise.resolve({ id: created._id }) }
    );
    expect(putRes.status).toBe(200);
    expect((await putRes.json()).memo).toBe("updated memo");

    const deleteRes = await weeklyIdRoute.DELETE(
      makeRequest(`http://localhost/api/weekly/${created._id}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: created._id }) }
    );
    expect(deleteRes.status).toBe(200);
  });

  it("returns 400 for malformed JSON body on create", async () => {
    const res = await weeklyRoute.POST(
      makeRequest("http://localhost/api/weekly", {
        method: "POST",
        body: "{not valid json",
      })
    );
    expect(res.status).toBe(400);
  });
});
