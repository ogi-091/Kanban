/**
 * TaskCard コンポーネントのテスト
 * 
 * 【学習ポイント】
 * 1. Reactコンポーネントのレンダリングテスト
 * 2. ユーザーインタラクション（クリックイベント）のテスト
 * 3. @dnd-kit のモック化
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from '@/app/components/TaskCard';
import { createMockTask } from '@/__tests__/fixtures/tasks';

/**
 * 【学習ポイント】@dnd-kit のモック
 * ドラッグ&ドロップライブラリはテスト環境で動作させるのが複雑なため、
 * モックを使用して必要な部分だけを再現します
 */
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}));

describe('TaskCard', () => {
  // モック関数を定義
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  // 各テストの前にモックをリセット
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('タスクのタイトルが表示される', () => {
      // Arrange
      const task = createMockTask({
        title: 'テストタスクのタイトル',
      });

      // Act: コンポーネントをレンダリング
      render(
        <TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      // Assert: タイトルが表示されていることを確認
      expect(screen.getByText('テストタスクのタイトル')).toBeInTheDocument();
    });

    it('タスクの説明が表示される', () => {
      // Arrange
      const task = createMockTask({
        description: 'これはテスト用の説明文です',
      });

      // Act
      render(
        <TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      // Assert
      expect(
        screen.getByText('これはテスト用の説明文です')
      ).toBeInTheDocument();
    });

    it('説明が空の場合は説明文が表示されない', () => {
      // Arrange
      const task = createMockTask({
        title: 'タイトルのみ',
        description: '',
      });

      // Act
      render(
        <TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      // Assert: 説明文の要素が存在しない
      const description = screen.queryByText(/説明/);
      expect(description).not.toBeInTheDocument();
    });

    it('作成日が表示される', () => {
      // Arrange
      const task = createMockTask({
        createdAt: '2024-01-15T10:30:00.000Z',
      });

      // Act
      render(
        <TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      // Assert: 作成日が表示されている
      // 日本語ロケールでフォーマットされた日付が表示される
      expect(screen.getByText(/作成:/)).toBeInTheDocument();
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    it('編集ボタンが表示される', () => {
      // Arrange
      const task = createMockTask();

      // Act
      render(
        <TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      // Assert
      const editButton = screen.getByRole('button', { name: /編集/ });
      expect(editButton).toBeInTheDocument();
    });

    it('削除ボタンが表示される', () => {
      // Arrange
      const task = createMockTask();

      // Act
      render(
        <TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      // Assert
      const deleteButton = screen.getByRole('button', { name: /削除/ });
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('ユーザー操作', () => {
    it('編集ボタンをクリックするとonEditが呼ばれる', async () => {
      // Arrange
      const task = createMockTask({ id: 'task-123', title: '編集テスト' });
      const user = userEvent.setup();

      render(
        <TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      // Act: 編集ボタンをクリック
      const editButton = screen.getByRole('button', { name: /編集/ });
      await user.click(editButton);

      // Assert: onEditが正しい引数で呼ばれた
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(task);
    });

    it('削除ボタンをクリックするとonDeleteが呼ばれる', async () => {
      // Arrange
      const task = createMockTask({ id: 'task-456', title: '削除テスト' });
      const user = userEvent.setup();

      render(
        <TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      // Act: 削除ボタンをクリック
      const deleteButton = screen.getByRole('button', { name: /削除/ });
      await user.click(deleteButton);

      // Assert: onDeleteが正しい引数で呼ばれた
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith('task-456');
    });

    it('複数回クリックしても正しく動作する', async () => {
      // Arrange
      const task = createMockTask({ id: 'task-789' });
      const user = userEvent.setup();

      render(
        <TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      // Act: 編集ボタンを3回クリック
      const editButton = screen.getByRole('button', { name: /編集/ });
      await user.click(editButton);
      await user.click(editButton);
      await user.click(editButton);

      // Assert: 3回呼ばれている
      expect(mockOnEdit).toHaveBeenCalledTimes(3);
    });
  });

  // Note: ドラッグ状態のテストについて
  // @dnd-kitのuseSortableモックを動的に変更するのは複雑なため、
  // ドラッグ中のビジュアル変更は実際のコンポーネントテスト/E2Eテストで確認することを推奨

  describe('エッジケース', () => {
    it('非常に長いタイトルでも正しく表示される', () => {
      // Arrange
      const longTitle = 'これは非常に長いタイトルです。'.repeat(10);
      const task = createMockTask({ title: longTitle });

      // Act
      render(
        <TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      // Assert: タイトルが表示される
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('非常に長い説明でも正しく表示される', () => {
      // Arrange
      const longDescription = 'これは非常に長い説明文です。'.repeat(20);
      const task = createMockTask({ description: longDescription });

      // Act
      render(
        <TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      // Assert: 説明が表示される
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('改行を含む説明文が正しく表示される', () => {
      // Arrange
      const descriptionWithNewlines = '1行目\n2行目\n3行目';
      const task = createMockTask({ description: descriptionWithNewlines });

      // Act
      render(
        <TaskCard task={task} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );

      // Assert: 説明が表示される（whitespace-pre-wrapで改行が保持される）
      // getByTextはデフォルトで正規化するため、正規表現または関数を使用
      expect(screen.getByText((content, element) => {
        return element?.textContent === descriptionWithNewlines;
      })).toBeInTheDocument();
    });
  });
});

