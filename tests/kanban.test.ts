import { describe, it, expect } from "vitest";
import { generateOrderKey } from "@/lib/fractionalIndex";
import {
  computeDropOrder,
  resolveDrop,
  sortTodosByOrder,
  type DraggableTodo,
  type TodoStatus,
} from "@/lib/kanban";

interface TestTodo extends DraggableTodo {
  priority?: "high" | "medium" | "low";
}

function buildOrders(count: number): string[] {
  const orders: string[] = [];
  for (let i = 0; i < count; i++) {
    orders.push(generateOrderKey(orders[i - 1] ?? undefined, undefined));
  }
  return orders;
}

/**
 * Build a column of todos with real fractional-indexing keys, in the given
 * visual order. `priorities` (optional) is applied positionally.
 */
function buildColumn(
  ids: string[],
  status: TodoStatus = "todo",
  priorities: (TestTodo["priority"] | undefined)[] = []
): TestTodo[] {
  const orders = buildOrders(ids.length);
  return ids.map((id, index) => ({
    _id: id,
    status,
    order: orders[index],
    priority: priorities[index],
  }));
}

function idsInOrder(todos: TestTodo[]): string[] {
  return sortTodosByOrder(todos).map((todo) => todo._id);
}

function applyDrop(todos: TestTodo[], activeId: string, drop: { status: TodoStatus; order: string }) {
  return todos.map((todo) =>
    todo._id === activeId ? { ...todo, status: drop.status, order: drop.order } : todo
  );
}

describe("computeDropOrder", () => {
  it("computes a key before the first item when dropped at the start", () => {
    const orders = buildOrders(2);
    const result = computeDropOrder(orders, 0);
    expect(result < orders[0]).toBe(true);
  });

  it("computes a key between neighbors when dropped in the middle", () => {
    const orders = buildOrders(3);
    const result = computeDropOrder(orders, 1);
    expect(result > orders[0]).toBe(true);
    expect(result < orders[1]).toBe(true);
  });

  it("computes a key after the last item when dropped at the end", () => {
    const orders = buildOrders(2);
    const result = computeDropOrder(orders, orders.length);
    expect(result > orders[orders.length - 1]).toBe(true);
  });

  it("computes a key at the start of an empty column", () => {
    const result = computeDropOrder([], 0);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("clamps out-of-range indices", () => {
    const orders = buildOrders(2);
    const result = computeDropOrder(orders, 99);
    expect(result > orders[orders.length - 1]).toBe(true);
  });
});

describe("sortTodosByOrder", () => {
  it("sorts by order string only, ignoring priority", () => {
    const todos = buildColumn(["a", "b", "c"], "todo", ["low", "high", "medium"]);
    const shuffled = [todos[2], todos[0], todos[1]];
    expect(idsInOrder(shuffled)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the input array", () => {
    const todos = buildColumn(["a", "b"]);
    const input = [todos[1], todos[0]];
    sortTodosByOrder(input);
    expect(input.map((todo) => todo._id)).toEqual(["b", "a"]);
  });
});

describe("resolveDrop", () => {
  it("moves a card down by one position within the same column", () => {
    const todos = buildColumn(["a", "b", "c", "d"]);
    const active = todos[0];

    const drop = resolveDrop(todos, "a", "b", "todo");

    expect(drop).not.toBeNull();
    expect(drop!.status).toBe("todo");
    expect(drop!.order).not.toBe(active.order);
    expect(idsInOrder(applyDrop(todos, "a", drop!))).toEqual(["b", "a", "c", "d"]);
  });

  it("moves a card up by one position within the same column", () => {
    const todos = buildColumn(["a", "b", "c", "d"]);

    const drop = resolveDrop(todos, "c", "b", "todo");

    expect(drop).not.toBeNull();
    expect(idsInOrder(applyDrop(todos, "c", drop!))).toEqual(["a", "c", "b", "d"]);
  });

  it("moves a card to the top of a mixed-priority column", () => {
    const todos = buildColumn(["a", "b", "c"], "todo", ["low", "high", "medium"]);

    const drop = resolveDrop(todos, "c", "a", "todo");

    expect(drop).not.toBeNull();
    expect(drop!.order < todos[0].order).toBe(true);
    expect(idsInOrder(applyDrop(todos, "c", drop!))).toEqual(["c", "a", "b"]);
  });

  it("drops at the very start of a column, before all existing cards", () => {
    const todos = buildColumn(["a", "b", "c", "d"]);

    const drop = resolveDrop(todos, "d", "a", "todo");

    expect(drop).not.toBeNull();
    expect(idsInOrder(applyDrop(todos, "d", drop!))).toEqual(["d", "a", "b", "c"]);
  });

  it("drops at the very end of a column, after all existing cards", () => {
    const todos = buildColumn(["a", "b", "c", "d"]);

    const drop = resolveDrop(todos, "a", "d", "todo");

    expect(drop).not.toBeNull();
    expect(idsInOrder(applyDrop(todos, "a", drop!))).toEqual(["b", "c", "d", "a"]);
  });

  it("appends to the end when dropped on an empty area of the same column", () => {
    const todos = buildColumn(["a", "b", "c"]);

    const drop = resolveDrop(todos, "a", "todo", "todo");

    expect(drop).not.toBeNull();
    expect(idsInOrder(applyDrop(todos, "a", drop!))).toEqual(["b", "c", "a"]);
  });

  it("changes status and position on a cross-column drop onto a card", () => {
    const todoColumn = buildColumn(["a", "b"], "todo");
    const doingColumn = buildColumn(["x", "y"], "doing");
    const todos = [...todoColumn, ...doingColumn];

    const drop = resolveDrop(todos, "a", "y", "doing");

    expect(drop).not.toBeNull();
    expect(drop!.status).toBe("doing");
    const after = applyDrop(todos, "a", drop!).filter((todo) => todo.status === "doing");
    expect(idsInOrder(after)).toEqual(["x", "a", "y"]);
  });

  it("changes status when dropped on an empty column", () => {
    const todos = buildColumn(["a", "b"], "todo");

    const drop = resolveDrop(todos, "a", "done", "done");

    expect(drop).not.toBeNull();
    expect(drop!.status).toBe("done");
  });

  it("returns null when a card is dropped on itself", () => {
    const todos = buildColumn(["a", "b", "c"]);
    expect(resolveDrop(todos, "b", "b", "todo")).toBeNull();
  });

  it("swaps adjacent cards when dropping onto the card directly below", () => {
    const todos = buildColumn(["a", "b", "c"]);

    const drop = resolveDrop(todos, "b", "c", "todo");

    expect(drop).not.toBeNull();
    expect(idsInOrder(applyDrop(todos, "b", drop!))).toEqual(["a", "c", "b"]);
  });

  it("returns null when the last card is dropped on its own column's empty area", () => {
    const todos = buildColumn(["a", "b", "c"]);
    expect(resolveDrop(todos, "c", "todo", "todo")).toBeNull();
  });

  it("returns null for an unknown active id", () => {
    const todos = buildColumn(["a", "b"]);
    expect(resolveDrop(todos, "missing", "a", "todo")).toBeNull();
  });
});
