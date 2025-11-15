export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanData {
  tasks: Task[];
  lastModified: string;
}

export interface Column {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

// アプリケーションビュー
export type AppView = 'kanban' | 'notes';

// メモ関連の型定義
export interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotesData {
  notes: Note[];
  lastModified: string;
}

