"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Modal from "@/components/shared/Modal";
import TodoForm from "@/components/board/TodoForm";
import { TodoItem } from "@/store/todoSlice";
import useStore from "@/store";
import { redirectToLoginOn401 } from "@/lib/authRedirect";

const KanbanBoard = dynamic(() => import("@/components/board/KanbanBoard"), {
  ssr: false,
});

export default function TodosPage() {
  const fetchTodos = useStore((state) => state.fetchTodos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | undefined>(undefined);

  useEffect(() => {
    // A 401 here means the session cookie present at the middleware layer is
    // invalid/expired (middleware only checks for its presence). Send the
    // user back through login instead of showing a broken board.
    fetchTodos().catch(redirectToLoginOn401);
  }, [fetchTodos]);

  const openCreateModal = () => {
    setEditingTodo(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (todo: TodoItem) => {
    setEditingTodo(todo);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTodo(undefined);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">할일</h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded bg-foreground px-3 py-2 text-sm font-medium text-background"
        >
          새 할 일
        </button>
      </div>

      <KanbanBoard onCardClick={openEditModal} />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTodo ? "할 일 수정" : "새 할 일"}
      >
        <TodoForm todo={editingTodo} onDone={closeModal} onCancel={closeModal} />
      </Modal>
    </div>
  );
}
