'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, KanbanData, TaskStatus, AppView } from './types';
import {
  loadKanbanData,
  saveKanbanData,
  selectDirectory,
  hasDirectorySelected,
  getDirectoryName,
  isFileSystemAccessSupported,
} from './fileSystem';
import { ToastMessage, ToastType } from '../components/Toast';

interface KanbanContextType {
  tasks: Task[];
  isLoading: boolean;
  directoryName: string | null;
  isFileSystemSupported: boolean;
  toasts: ToastMessage[];
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  addTask: (title: string, description: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  initializeDirectory: () => Promise<boolean>;
  showToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [isFileSystemSupported] = useState(() => isFileSystemAccessSupported());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentView, setCurrentView] = useState<AppView>('kanban');

  // トースト通知を表示
  const showToast = (message: string, type: ToastType) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  // トースト通知を削除
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // 初回ロード
  useEffect(() => {
    const loadData = async () => {
      try {
        if (hasDirectorySelected()) {
          const data = await loadKanbanData();
          if (data) {
            setTasks(data.tasks);
            showToast('データを読み込みました。', 'success');
          }
          setDirectoryName(getDirectoryName());
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
        const errorMessage = error instanceof Error ? error.message : 'データの読み込みに失敗しました。';
        showToast(errorMessage, 'error');
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
      const errorMessage = error instanceof Error ? error.message : 'データの保存に失敗しました。';
      showToast(errorMessage, 'error');
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
            showToast('既存のデータを読み込みました。', 'success');
          } else {
            showToast('保存先ディレクトリを設定しました。', 'success');
          }
        } catch (loadError) {
          console.error('Failed to load data after directory selection:', loadError);
          const errorMessage = loadError instanceof Error ? loadError.message : 'データの読み込みに失敗しました。';
          showToast(errorMessage, 'error');
        }
      }
      return success;
    } catch (error) {
      console.error('Failed to initialize directory:', error);
      const errorMessage = error instanceof Error ? error.message : 'ディレクトリの選択に失敗しました。';
      showToast(errorMessage, 'error');
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
      const success = await saveData(updatedTasks);
      if (success) {
        showToast('タスクを追加しました。', 'success');
      } else {
        // 保存に失敗した場合はロールバック
        setTasks(tasks);
      }
    } else {
      showToast('タスクを追加しました。（保存先未設定）', 'warning');
    }
  };

  // タスク更新
  const updateTask = async (id: string, updates: Partial<Task>) => {
    const previousTasks = tasks;
    const updatedTasks = tasks.map((task) =>
      task.id === id
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    );

    setTasks(updatedTasks);
    
    if (hasDirectorySelected()) {
      const success = await saveData(updatedTasks);
      if (success) {
        showToast('タスクを更新しました。', 'success');
      } else {
        // 保存に失敗した場合はロールバック
        setTasks(previousTasks);
      }
    } else {
      showToast('タスクを更新しました。（保存先未設定）', 'warning');
    }
  };

  // タスク削除
  const deleteTask = async (id: string) => {
    const previousTasks = tasks;
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);
    
    if (hasDirectorySelected()) {
      const success = await saveData(updatedTasks);
      if (success) {
        showToast('タスクを削除しました。', 'success');
      } else {
        // 保存に失敗した場合はロールバック
        setTasks(previousTasks);
      }
    } else {
      showToast('タスクを削除しました。（保存先未設定）', 'warning');
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
    toasts,
    currentView,
    setCurrentView,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    initializeDirectory,
    showToast,
    removeToast,
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

