/**
 * store.tsx のユニットテスト
 * 
 * 【学習ポイント】
 * 1. React Context のテスト方法
 * 2. カスタムフックのテスト方法
 * 3. 非同期処理のテスト
 * 4. モックを使った外部依存の制御
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { KanbanProvider, useKanban } from '@/app/lib/store';
import { createMockTask } from '@/__tests__/fixtures/tasks';
import * as fileSystem from '@/app/lib/fileSystem';

/**
 * 【学習ポイント】モックの設定
 * fileSystemモジュール全体をモック化します
 */
vi.mock('@/app/lib/fileSystem', () => ({
  loadKanbanData: vi.fn(),
  saveKanbanData: vi.fn(),
  selectDirectory: vi.fn(),
  hasDirectorySelected: vi.fn(),
  getDirectoryName: vi.fn(),
  isFileSystemAccessSupported: vi.fn(() => true),
}));

describe('KanbanProvider と useKanban', () => {
  // 各テストの前に実行される処理
  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();
    
    // デフォルトの動作を設定
    vi.mocked(fileSystem.hasDirectorySelected).mockReturnValue(false);
    vi.mocked(fileSystem.getDirectoryName).mockReturnValue(null);
    vi.mocked(fileSystem.loadKanbanData).mockResolvedValue(null);
    vi.mocked(fileSystem.saveKanbanData).mockResolvedValue();
  });

  // テスト後のクリーンアップ
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * 【学習ポイント】カスタムフックのテスト用ラッパー
   * useKanbanはKanbanProvider内で使う必要があるため、
   * ラッパーコンポーネントを作成します
   */
  const wrapper = ({ children }: { children: ReactNode }) => (
    <KanbanProvider>{children}</KanbanProvider>
  );

  describe('初期化', () => {
    it('初期状態では空のタスクリストを持つ', async () => {
      // Act: フックをレンダリング
      const { result } = renderHook(() => useKanban(), { wrapper });

      // Assert: 初期状態を検証
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.tasks).toEqual([]);
      expect(result.current.directoryName).toBeNull();
      expect(result.current.isFileSystemSupported).toBe(true);
    });

    it('ディレクトリが選択されている場合、データを読み込む', async () => {
      // Arrange: ディレクトリが選択されている状態をモック
      const mockTasks = [createMockTask()];
      vi.mocked(fileSystem.hasDirectorySelected).mockReturnValue(true);
      vi.mocked(fileSystem.getDirectoryName).mockReturnValue('test-directory');
      vi.mocked(fileSystem.loadKanbanData).mockResolvedValue({
        tasks: mockTasks,
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      // Act
      const { result } = renderHook(() => useKanban(), { wrapper });

      // Assert: データが読み込まれることを確認
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.directoryName).toBe('test-directory');
    });
  });

  describe('addTask', () => {
    it('新しいタスクを追加する', async () => {
      // Arrange
      const { result } = renderHook(() => useKanban(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act: タスクを追加
      await result.current.addTask('新しいタスク', 'タスクの説明');

      // Assert: タスクが追加されたことを確認
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      const addedTask = result.current.tasks[0];
      expect(addedTask.title).toBe('新しいタスク');
      expect(addedTask.description).toBe('タスクの説明');
      expect(addedTask.status).toBe('todo');
      expect(addedTask.id).toBeDefined(); // IDが生成されている
      expect(addedTask.createdAt).toBeDefined();
      expect(addedTask.updatedAt).toBeDefined();
    });

    it('タスクIDが一意に生成される', async () => {
      // Arrange
      const { result } = renderHook(() => useKanban(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act: 複数のタスクを追加（少し時間をずらす）
      await result.current.addTask('タスク1', '説明1');
      
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });
      
      await result.current.addTask('タスク2', '説明2');

      // Assert: IDが異なることを確認
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2);
      }, { timeout: 3000 });

      const [task1, task2] = result.current.tasks;
      expect(task1.id).not.toBe(task2.id);
    });

    it('ディレクトリが選択されている場合、保存する', async () => {
      // Arrange
      vi.mocked(fileSystem.hasDirectorySelected).mockReturnValue(true);
      
      const { result } = renderHook(() => useKanban(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act
      await result.current.addTask('新しいタスク', 'タスクの説明');

      // Assert: saveKanbanDataが呼ばれたことを確認
      await waitFor(() => {
        expect(fileSystem.saveKanbanData).toHaveBeenCalled();
      });
    });
  });

  describe('updateTask', () => {
    it('指定したタスクを更新する', async () => {
      // Arrange: 既存のタスクを持つ状態
      const mockTask = createMockTask({ id: 'task-1', title: '元のタイトル' });
      vi.mocked(fileSystem.hasDirectorySelected).mockReturnValue(true);
      vi.mocked(fileSystem.loadKanbanData).mockResolvedValue({
        tasks: [mockTask],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const { result } = renderHook(() => useKanban(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      // Act: タスクを更新
      await result.current.updateTask('task-1', {
        title: '新しいタイトル',
        description: '新しい説明',
      });

      // Assert: タスクが更新されたことを確認
      await waitFor(() => {
        const updatedTask = result.current.tasks[0];
        expect(updatedTask.title).toBe('新しいタイトル');
        expect(updatedTask.description).toBe('新しい説明');
        expect(updatedTask.updatedAt).not.toBe(mockTask.updatedAt); // updatedAtが更新されている
      });
    });

    it('他のタスクに影響しない', async () => {
      // Arrange: 複数のタスクを持つ状態
      const tasks = [
        createMockTask({ id: 'task-1', title: 'タスク1' }),
        createMockTask({ id: 'task-2', title: 'タスク2' }),
        createMockTask({ id: 'task-3', title: 'タスク3' }),
      ];
      
      vi.mocked(fileSystem.hasDirectorySelected).mockReturnValue(true);
      vi.mocked(fileSystem.loadKanbanData).mockResolvedValue({
        tasks,
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const { result } = renderHook(() => useKanban(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(3);
      });

      // Act: task-2のみを更新
      await result.current.updateTask('task-2', { title: '更新されたタスク2' });

      // Assert: task-2のみが更新され、他は変更されていない
      await waitFor(() => {
        const resultTasks = result.current.tasks;
        expect(resultTasks[0].title).toBe('タスク1');
        expect(resultTasks[1].title).toBe('更新されたタスク2');
        expect(resultTasks[2].title).toBe('タスク3');
      });
    });
  });

  describe('deleteTask', () => {
    it('指定したタスクを削除する', async () => {
      // Arrange
      const tasks = [
        createMockTask({ id: 'task-1', title: 'タスク1' }),
        createMockTask({ id: 'task-2', title: 'タスク2' }),
      ];
      
      vi.mocked(fileSystem.hasDirectorySelected).mockReturnValue(true);
      vi.mocked(fileSystem.loadKanbanData).mockResolvedValue({
        tasks,
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const { result } = renderHook(() => useKanban(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2);
      });

      // Act: task-1を削除
      await result.current.deleteTask('task-1');

      // Assert: task-1が削除され、task-2は残っている
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
        expect(result.current.tasks[0].id).toBe('task-2');
      });
    });

    it('存在しないタスクIDを指定しても他のタスクに影響しない', async () => {
      // Arrange
      const tasks = [createMockTask({ id: 'task-1' })];
      
      vi.mocked(fileSystem.hasDirectorySelected).mockReturnValue(true);
      vi.mocked(fileSystem.loadKanbanData).mockResolvedValue({
        tasks,
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const { result } = renderHook(() => useKanban(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      // Act: 存在しないIDで削除を試みる
      await result.current.deleteTask('non-existent-id');

      // Assert: タスクは削除されない
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
        expect(result.current.tasks[0].id).toBe('task-1');
      });
    });
  });

  describe('moveTask', () => {
    it('タスクのstatusを変更する', async () => {
      // Arrange
      const task = createMockTask({ id: 'task-1', status: 'todo' });
      
      vi.mocked(fileSystem.hasDirectorySelected).mockReturnValue(true);
      vi.mocked(fileSystem.loadKanbanData).mockResolvedValue({
        tasks: [task],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const { result } = renderHook(() => useKanban(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      // Act: todoからin-progressに移動
      await result.current.moveTask('task-1', 'in-progress');

      // Assert: statusが変更された
      await waitFor(() => {
        expect(result.current.tasks[0].status).toBe('in-progress');
      });
    });

    it('statusを変更してもupdatedAtが更新される', async () => {
      // Arrange
      const originalUpdatedAt = '2024-01-01T00:00:00.000Z';
      const task = createMockTask({
        id: 'task-1',
        status: 'todo',
        updatedAt: originalUpdatedAt,
      });
      
      vi.mocked(fileSystem.hasDirectorySelected).mockReturnValue(true);
      vi.mocked(fileSystem.loadKanbanData).mockResolvedValue({
        tasks: [task],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const { result } = renderHook(() => useKanban(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      // Act
      await result.current.moveTask('task-1', 'done');

      // Assert: updatedAtが更新された
      await waitFor(() => {
        expect(result.current.tasks[0].updatedAt).not.toBe(originalUpdatedAt);
      });
    });
  });

  describe('initializeDirectory', () => {
    it('ディレクトリ選択に成功した場合、ディレクトリ名を設定する', async () => {
      // Arrange
      vi.mocked(fileSystem.selectDirectory).mockResolvedValue(true);
      vi.mocked(fileSystem.getDirectoryName).mockReturnValue('my-kanban');
      vi.mocked(fileSystem.loadKanbanData).mockResolvedValue({
        tasks: [],
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const { result } = renderHook(() => useKanban(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act
      const success = await result.current.initializeDirectory();

      // Assert
      expect(success).toBe(true);
      await waitFor(() => {
        expect(result.current.directoryName).toBe('my-kanban');
      });
    });

    it('ディレクトリ選択に失敗した場合、falseを返す', async () => {
      // Arrange
      vi.mocked(fileSystem.selectDirectory).mockResolvedValue(false);

      const { result } = renderHook(() => useKanban(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act
      const success = await result.current.initializeDirectory();

      // Assert
      expect(success).toBe(false);
      expect(result.current.directoryName).toBeNull();
    });

    it('既存データがある場合、読み込む', async () => {
      // Arrange
      const existingTasks = [createMockTask({ id: 'existing-1' })];
      vi.mocked(fileSystem.selectDirectory).mockResolvedValue(true);
      vi.mocked(fileSystem.getDirectoryName).mockReturnValue('my-kanban');
      vi.mocked(fileSystem.loadKanbanData).mockResolvedValue({
        tasks: existingTasks,
        lastModified: '2024-01-01T00:00:00.000Z',
      });

      const { result } = renderHook(() => useKanban(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act
      await result.current.initializeDirectory();

      // Assert: 既存タスクが読み込まれている
      await waitFor(() => {
        expect(result.current.tasks).toEqual(existingTasks);
      });
    });
  });

  describe('useKanbanのエラーハンドリング', () => {
    it('KanbanProvider外で使用するとエラーをスローする', () => {
      // Assert: エラーがスローされることを確認
      expect(() => {
        renderHook(() => useKanban());
      }).toThrow('useKanban must be used within a KanbanProvider');
    });
  });
});

