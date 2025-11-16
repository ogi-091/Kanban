'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Task, KanbanData, TaskStatus, AppView } from './types';
import {
  loadKanbanData,
  saveKanbanData,
  selectDirectory,
  hasDirectorySelected,
  getDirectoryName,
  isFileSystemAccessSupported,
} from './fileSystem';

interface KanbanContextType {
  tasks: Task[];
  isLoading: boolean;
  directoryName: string | null;
  isFileSystemSupported: boolean;
  currentView: AppView;
  editingTaskId: string | null;
  setCurrentView: (view: AppView) => void;
  setEditingTaskId: (id: string | null) => void;
  addTask: (title: string, description: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  initializeDirectory: () => Promise<boolean>;
}

const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [isFileSystemSupported] = useState(() => isFileSystemAccessSupported());
  const [currentView, setCurrentView] = useState<AppView>('kanban');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const lastTasksRef = useRef<Task[]>([]);

  // 安全なID生成（crypto.randomUUIDが使えない環境ではフォールバック）
  const generateId = (): string => {
    try {
      const maybeCrypto = (typeof globalThis !== 'undefined'
        ? (globalThis as any).crypto
        : undefined) as { randomUUID?: () => string } | undefined;
      if (maybeCrypto && typeof maybeCrypto.randomUUID === 'function') {
        return `task-${maybeCrypto.randomUUID()}`;
      }
    } catch {
      // ignore
    }
    return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  };

  // 初回ロード
  useEffect(() => {
    const loadData = async () => {
      try {
        if (hasDirectorySelected()) {
          const data = await loadKanbanData();
          if (data) {
            setTasks(data.tasks);
          }
          setDirectoryName(getDirectoryName());
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // データ保存ヘルパー
  const saveData = async (updatedTasks: Task[]): Promise<boolean> => {
    const data: KanbanData = {
      tasks: updatedTasks,
      lastModified: new Date().toISOString(),
    };

    try {
      await saveKanbanData(data);
      return true;
    } catch (error) {
      console.error('Failed to save data:', error);
      return false;
    }
  };

  // ディレクトリ初期化
  const initializeDirectory = async (): Promise<boolean> => {
    try {
      const success = await selectDirectory();
      if (success) {
        setDirectoryName(getDirectoryName());
        
        // 既存データを読み込む
        try {
          const data = await loadKanbanData();
          if (data) {
            setTasks(data.tasks);
          }
        } catch (loadError) {
          console.error('Failed to load data after directory selection:', loadError);
        }
      }
      return success;
    } catch (error) {
      console.error('Failed to initialize directory:', error);
      return false;
    }
  };

  // タスク追加
  const addTask = async (title: string, description: string) => {
    const newTask: Task = {
      id: generateId(),
      title,
      description,
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    let nextTasksSnapshot: Task[] = [];
    setTasks((prev) => {
      lastTasksRef.current = prev;
      nextTasksSnapshot = [...prev, newTask];
      return nextTasksSnapshot;
    });
    if (hasDirectorySelected()) {
      const success = await saveData(nextTasksSnapshot);
      if (success) {
      } else {
        // 保存に失敗した場合はロールバック
        setTasks(lastTasksRef.current);
      }
    } else {
    }
  };

  // タスク更新
  const updateTask = async (id: string, updates: Partial<Task>) => {
    let nextTasksSnapshot: Task[] = [];
    setTasks((prev) => {
      lastTasksRef.current = prev;
      nextTasksSnapshot = prev.map((task) =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      );
      return nextTasksSnapshot;
    });
    if (hasDirectorySelected()) {
      const success = await saveData(nextTasksSnapshot);
      if (success) {
      } else {
        // 保存に失敗した場合はロールバック
        setTasks(lastTasksRef.current);
      }
    } else {
    }
  };

  // タスク削除
  const deleteTask = async (id: string) => {
    let nextTasksSnapshot: Task[] = [];
    setTasks((prev) => {
      lastTasksRef.current = prev;
      nextTasksSnapshot = prev.filter((task) => task.id !== id);
      return nextTasksSnapshot;
    });
    if (hasDirectorySelected()) {
      const success = await saveData(nextTasksSnapshot);
      if (success) {
      } else {
        // 保存に失敗した場合はロールバック
        setTasks(lastTasksRef.current);
      }
    } else {
    }
  };

  // タスク移動
  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const value: KanbanContextType = {
    tasks,
    isLoading,
    directoryName,
    isFileSystemSupported,
    currentView,
    editingTaskId,
    setCurrentView,
    setEditingTaskId,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    initializeDirectory,
  };

  return (
    <KanbanContext.Provider value={value}>
      {children}
    </KanbanContext.Provider>
  );
}

export function useKanban() {
  const context = useContext(KanbanContext);
  if (context === undefined) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
}

