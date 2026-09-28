import { describe, it, expect } from "vitest";
import { getWeekStart, isSameDay, isOverdue } from "@/lib/utils";

describe("getWeekStart", () => {
  it("returns the Monday of a mid-week date", () => {
    // Wednesday 2026-09-23
    const result = getWeekStart(new Date(2026, 8, 23));
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(8);
    expect(result.getDate()).toBe(21); // Monday 2026-09-21
    expect(result.getDay()).toBe(1);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it("returns the previous Monday when given a Sunday", () => {
    // Sunday 2026-09-27 belongs to the week starting Mon 2026-09-21,
    // not the upcoming Monday 2026-09-28.
    const result = getWeekStart(new Date(2026, 8, 27));
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(8);
    expect(result.getDate()).toBe(21);
    expect(result.getDay()).toBe(1);
  });

  it("returns the same date when given a Monday", () => {
    const result = getWeekStart(new Date(2026, 8, 21, 15, 30));
    expect(result.getDate()).toBe(21);
    expect(result.getHours()).toBe(0);
  });
});

describe("isSameDay", () => {
  it("matches a plan whose weekStart is this Monday", () => {
    const thisMonday = getWeekStart(new Date(2026, 8, 23)); // Mon 2026-09-21
    const storedWeekStart = new Date(2026, 8, 21); // same Monday, exact midnight
    expect(isSameDay(thisMonday, storedWeekStart)).toBe(true);
  });

  it("does not match a plan from last week", () => {
    const thisMonday = getWeekStart(new Date(2026, 8, 23)); // Mon 2026-09-21
    const lastMonday = new Date(2026, 8, 14); // previous Monday
    expect(isSameDay(thisMonday, lastMonday)).toBe(false);
  });

  it("ignores time-of-day differences on the same date", () => {
    const a = new Date(2026, 8, 21, 0, 0, 0);
    const b = new Date(2026, 8, 21, 23, 59, 59);
    expect(isSameDay(a, b)).toBe(true);
  });
});

describe("isOverdue", () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  it("returns true for a past date that is not done", () => {
    expect(isOverdue(yesterday, "todo")).toBe(true);
  });

  it("returns false for a past date that is done", () => {
    expect(isOverdue(yesterday, "done")).toBe(false);
  });

  it("returns false for a future date", () => {
    expect(isOverdue(tomorrow, "todo")).toBe(false);
  });

  it("returns false for today's date", () => {
    expect(isOverdue(new Date(), "todo")).toBe(false);
  });
});
