/**
 * テスト用のモックデータ
 * 
 * 【学習ポイント】
 * テストで繰り返し使うデータは、このようにfixturesとして定義します。
 * これにより：
 * 1. テストコードがシンプルになる
 * 2. データの一貫性が保たれる
 * 3. 変更時の修正箇所が少なくなる
 */

import { Task, KanbanData, TaskStatus } from '@/app/lib/types';

/**
 * タスクを作成するファクトリー関数
 * 
 * 【学習ポイント】ファクトリーパターン
 * デフォルト値を持ちつつ、必要な部分だけ上書きできる便利な関数です
 */
export const createMockTask = (overrides?: Partial<Task>): Task => {
  return {
    id: 'task-1',
    title: 'テストタスク',
    description: 'これはテスト用のタスクです',
    status: 'todo' as TaskStatus,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides, // 上書きしたい値を指定
  };
};

/**
 * 複数のタスクを作成する関数
 */
export const createMockTasks = (): Task[] => {
  return [
    createMockTask({
      id: 'task-1',
      title: 'タスク1',
      description: 'TODO状態のタスク',
      status: 'todo',
    }),
    createMockTask({
      id: 'task-2',
      title: 'タスク2',
      description: '進行中のタスク',
      status: 'in-progress',
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    }),
    createMockTask({
      id: 'task-3',
      title: 'タスク3',
      description: '完了したタスク',
      status: 'done',
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: '2024-01-03T00:00:00.000Z',
    }),
  ];
};

/**
 * カンバンデータを作成するファクトリー関数
 */
export const createMockKanbanData = (
  overrides?: Partial<KanbanData>
): KanbanData => {
  return {
    tasks: createMockTasks(),
    lastModified: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
};

/**
 * 空のカンバンデータ
 */
export const emptyKanbanData: KanbanData = {
  tasks: [],
  lastModified: '2024-01-01T00:00:00.000Z',
};

/**
 * 単一のタスクを持つカンバンデータ
 */
export const singleTaskKanbanData: KanbanData = {
  tasks: [createMockTask()],
  lastModified: '2024-01-01T00:00:00.000Z',
};

