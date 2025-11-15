'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useKanban } from '../lib/store';
import { Task, TaskStatus } from '../lib/types';
import { DroppableColumn } from './DroppableColumn';
import { AddTaskDialog } from './AddTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { ToastContainer } from './Toast';

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'TODO', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'in-progress', title: '進行中', color: 'bg-blue-100 dark:bg-blue-900/40' },
  { id: 'done', title: '完了', color: 'bg-green-100 dark:bg-green-900/40' },
];

export function KanbanBoard() {
  const { tasks, addTask, updateTask, deleteTask, moveTask, toasts, removeToast } =
    useKanban();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // カラムIDの場合（タスクを別のカラムにドロップ）
    if (['todo', 'in-progress', 'done'].includes(newStatus)) {
      try {
        setIsProcessing(true);
        await moveTask(taskId, newStatus);
      } catch (error) {
        console.error('Failed to move task:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleAddTask = async (title: string, description: string) => {
    try {
      setIsProcessing(true);
      await addTask(title, description);
    } catch (error) {
      console.error('Failed to add task:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = async (
    id: string,
    title: string,
    description: string
  ) => {
    try {
      setIsProcessing(true);
      await updateTask(id, { title, description });
      setIsEditDialogOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('このタスクを削除してもよろしいですか？')) {
      try {
        setIsProcessing(true);
        await deleteTask(id);
      } catch (error) {
        console.error('Failed to delete task:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <>
      {/* トースト通知 */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* ヘッダー */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  タスク管理
                </h1>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  全 {tasks.length} 件のタスク
                </div>
              </div>
              <button
                onClick={() => setIsAddDialogOpen(true)}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 4v16m8-8H4" />
                </svg>
                タスクを追加
              </button>
            </div>
          </div>

          {/* カンバンボード */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {columns.map((column) => {
                const columnTasks = getTasksByStatus(column.id);
                return (
                  <DroppableColumn
                    key={column.id}
                    id={column.id}
                    title={column.title}
                    color={column.color}
                    tasks={columnTasks}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                  />
                );
              })}
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-blue-500 dark:border-blue-400 p-4 cursor-grabbing opacity-90">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {activeTask.title}
                  </h3>
                  {activeTask.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                      {activeTask.description}
                    </p>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* ダイアログ */}
      <AddTaskDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddTask}
      />
      <EditTaskDialog
        isOpen={isEditDialogOpen}
        task={editingTask}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingTask(null);
        }}
        onUpdate={handleUpdateTask}
      />
    </>
  );
}

