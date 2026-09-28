import { generateOrderKey } from "@/lib/fractionalIndex";

export type TodoStatus = "todo" | "doing" | "done";

/**
 * Minimal shape `resolveDrop` needs from a todo. `TodoItem` is structurally
 * compatible, so the board can pass its store items directly.
 */
export interface DraggableTodo {
  _id: string;
  status: TodoStatus;
  order: string;
}

/**
 * The single source of truth for kanban column ordering: the `order` string
 * only. Both the render path (`KanbanColumn`) and the drag-index path
 * (`resolveDrop`) must use this so the index a user sees always matches the
 * index the drop math walks. Priority is purely visual (the card's badge) and
 * intentionally does not affect ordering.
 */
export function sortTodosByOrder<T extends { order: string }>(todos: T[]): T[] {
  return [...todos].sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
}

/**
 * Given the `order` strings of the todos currently in a column (sorted,
 * dragged item excluded) and the index the dragged item should land at,
 * compute a new order key that sorts between its new neighbors.
 */
export function computeDropOrder(orders: string[], targetIndex: number): string {
  const clampedIndex = Math.max(0, Math.min(targetIndex, orders.length));
  const before = clampedIndex > 0 ? orders[clampedIndex - 1] : undefined;
  const after = clampedIndex < orders.length ? orders[clampedIndex] : undefined;
  return generateOrderKey(before, after);
}

/**
 * Resolve a drag-and-drop gesture into the `{ status, order }` the dragged
 * todo should end up with, or `null` when the drop is a no-op.
 *
 * `overId` is either another todo's id or a column id; `overContainerStatus`
 * is the status of the column the pointer ended over.
 */
export function resolveDrop<T extends DraggableTodo>(
  todos: T[],
  activeId: string,
  overId: string,
  overContainerStatus: TodoStatus
): { status: TodoStatus; order: string } | null {
  const active = todos.find((todo) => todo._id === activeId);
  if (!active) return null;
  if (overId === activeId) return null;

  const sameColumn = active.status === overContainerStatus;
  const columnTodos = sortTodosByOrder(todos.filter((todo) => todo.status === overContainerStatus));
  const siblings = columnTodos.filter((todo) => todo._id !== activeId);
  const overIndex = siblings.findIndex((todo) => todo._id === overId);

  let targetIndex: number;
  if (overIndex === -1) {
    // Dropped on the column itself (or on an unknown id): append to the end.
    targetIndex = siblings.length;
  } else if (sameColumn && active.order < siblings[overIndex].order) {
    // Downward move within the same column. The active card is removed from
    // above the target, so the target's index in `siblings` is already shifted
    // up by one; land *after* it, otherwise the drop resolves to the card's own
    // current slot and silently becomes a no-op.
    targetIndex = overIndex + 1;
  } else {
    targetIndex = overIndex;
  }

  if (sameColumn) {
    const currentIndex = columnTodos.findIndex((todo) => todo._id === activeId);
    if (currentIndex === targetIndex) return null;
  }

  return {
    status: overContainerStatus,
    order: computeDropOrder(
      siblings.map((todo) => todo.order),
      targetIndex
    ),
  };
}
