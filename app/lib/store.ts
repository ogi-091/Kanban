'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, KanbanData, TaskStatus } from './types';
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
  }, []);

  // データ保存ヘルパー
  const saveData = async (updatedTasks: Task[]) => {
    const data: KanbanData = {
      tasks: updatedTasks,
      lastModified: new Date().toISOString(),
    };

    try {
      await saveKanbanData(data);
    } catch (error) {
      console.error('Failed to save data:', error);
      // エラーが発生してもUIの更新は継続
    }
  };

  // ディレクトリ初期化
  const initializeDirectory = async (): Promise<boolean> => {
    try {
      const success = await selectDirectory();
      if (success) {
        setDirectoryName(getDirectoryName());
        
        // 既存データを読み込む
        const data = await loadKanbanData();
        if (data) {
          setTasks(data.tasks);
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
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    
    if (hasDirectorySelected()) {
      await saveData(updatedTasks);
    }
  };

  // タスク更新
  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    );

    setTasks(updatedTasks);
    
    if (hasDirectorySelected()) {
      await saveData(updatedTasks);
    }
  };

  // タスク削除
  const deleteTask = async (id: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);
    
    if (hasDirectorySelected()) {
      await saveData(updatedTasks);
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

