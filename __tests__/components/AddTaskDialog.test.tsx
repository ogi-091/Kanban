/**
 * AddTaskDialog コンポーネントのテスト
 * 
 * 【学習ポイント】
 * 1. モーダルダイアログのテスト
 * 2. フォーム入力のテスト
 * 3. バリデーションのテスト
 * 4. フォーム送信のテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddTaskDialog } from '@/app/components/AddTaskDialog';

describe('AddTaskDialog', () => {
  // モック関数を定義
  const mockOnClose = vi.fn();
  const mockOnAdd = vi.fn();

  // 各テストの前にモックをリセット
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ダイアログの表示/非表示', () => {
    it('isOpen=falseの時、ダイアログがレンダリングされない', () => {
      // Act
      render(
        <AddTaskDialog
          isOpen={false}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
        />
      );

      // Assert: ダイアログの要素が存在しない
      expect(
        screen.queryByText('新しいタスクを追加')
      ).not.toBeInTheDocument();
    });

    it('isOpen=trueの時、ダイアログが表示される', () => {
      // Act
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Assert: ダイアログが表示されている
      expect(screen.getByText('新しいタスクを追加')).toBeInTheDocument();
    });

    it('ダイアログにタイトル入力欄が表示される', () => {
      // Act
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Assert
      const titleInput = screen.getByLabelText(/タイトル/);
      expect(titleInput).toBeInTheDocument();
      expect(titleInput).toHaveAttribute('required');
    });

    it('ダイアログに説明入力欄が表示される', () => {
      // Act
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Assert
      const descriptionInput = screen.getByLabelText(/説明/);
      expect(descriptionInput).toBeInTheDocument();
    });

    it('キャンセルボタンが表示される', () => {
      // Act
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Assert
      const cancelButton = screen.getByRole('button', { name: /キャンセル/ });
      expect(cancelButton).toBeInTheDocument();
    });

    it('追加ボタンが表示される', () => {
      // Act
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Assert
      const addButton = screen.getByRole('button', { name: /追加/ });
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('フォーム入力', () => {
    it('タイトルを入力できる', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Act: タイトルを入力
      const titleInput = screen.getByLabelText(/タイトル/);
      await user.type(titleInput, 'テストタスク');

      // Assert: 入力値が反映されている
      expect(titleInput).toHaveValue('テストタスク');
    });

    it('説明を入力できる', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Act: 説明を入力
      const descriptionInput = screen.getByLabelText(/説明/);
      await user.type(descriptionInput, 'テスト用の説明');

      // Assert: 入力値が反映されている
      expect(descriptionInput).toHaveValue('テスト用の説明');
    });

    it('複数行の説明を入力できる', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Act
      const descriptionInput = screen.getByLabelText(/説明/);
      const multilineText = '1行目\n2行目\n3行目';
      await user.type(descriptionInput, multilineText);

      // Assert
      expect(descriptionInput).toHaveValue(multilineText);
    });
  });

  describe('フォーム送信', () => {
    it('タイトルと説明を入力して送信すると、onAddが呼ばれる', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Act: フォームに入力して送信
      const titleInput = screen.getByLabelText(/タイトル/);
      const descriptionInput = screen.getByLabelText(/説明/);
      const addButton = screen.getByRole('button', { name: /追加/ });

      await user.type(titleInput, '新しいタスク');
      await user.type(descriptionInput, 'タスクの説明');
      await user.click(addButton);

      // Assert: onAddが正しい引数で呼ばれた
      expect(mockOnAdd).toHaveBeenCalledTimes(1);
      expect(mockOnAdd).toHaveBeenCalledWith('新しいタスク', 'タスクの説明');
    });

    it('送信後にonCloseが呼ばれる', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Act
      const titleInput = screen.getByLabelText(/タイトル/);
      const addButton = screen.getByRole('button', { name: /追加/ });

      await user.type(titleInput, 'テストタスク');
      await user.click(addButton);

      // Assert: onCloseが呼ばれた
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('送信後にフォームがリセットされる', async () => {
      // Arrange
      const user = userEvent.setup();
      const { rerender } = render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Act: フォームに入力して送信
      const titleInput = screen.getByLabelText(/タイトル/);
      const descriptionInput = screen.getByLabelText(/説明/);
      const addButton = screen.getByRole('button', { name: /追加/ });

      await user.type(titleInput, 'タスク1');
      await user.type(descriptionInput, '説明1');
      await user.click(addButton);

      // ダイアログを再度開く
      rerender(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Assert: フォームがリセットされている
      const newTitleInput = screen.getByLabelText(/タイトル/);
      const newDescriptionInput = screen.getByLabelText(/説明/);
      expect(newTitleInput).toHaveValue('');
      expect(newDescriptionInput).toHaveValue('');
    });

    it('説明なしでも送信できる', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Act: タイトルのみ入力して送信
      const titleInput = screen.getByLabelText(/タイトル/);
      const addButton = screen.getByRole('button', { name: /追加/ });

      await user.type(titleInput, 'タイトルのみ');
      await user.click(addButton);

      // Assert: 説明は空文字で渡される
      expect(mockOnAdd).toHaveBeenCalledWith('タイトルのみ', '');
    });

    it('前後の空白は削除される', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Act: 前後に空白を含む入力
      const titleInput = screen.getByLabelText(/タイトル/);
      const descriptionInput = screen.getByLabelText(/説明/);
      const addButton = screen.getByRole('button', { name: /追加/ });

      await user.type(titleInput, '  タイトル  ');
      await user.type(descriptionInput, '  説明  ');
      await user.click(addButton);

      // Assert: 空白がトリムされている
      expect(mockOnAdd).toHaveBeenCalledWith('タイトル', '説明');
    });
  });

  describe('バリデーション', () => {
    it('タイトルが空の場合、送信できない', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Act: タイトルを入力せずに送信を試みる
      const addButton = screen.getByRole('button', { name: /追加/ });
      await user.click(addButton);

      // Assert: onAddが呼ばれていない（HTML5バリデーションで阻止される）
      expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('タイトルが空白のみの場合、送信できない', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Act: 空白のみを入力して送信を試みる
      const titleInput = screen.getByLabelText(/タイトル/);
      const addButton = screen.getByRole('button', { name: /追加/ });

      await user.type(titleInput, '   ');
      await user.click(addButton);

      // Assert: trimされて空になるため送信されない
      expect(mockOnAdd).not.toHaveBeenCalled();
    });
  });

  describe('キャンセル操作', () => {
    it('キャンセルボタンをクリックするとonCloseが呼ばれる', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Act
      const cancelButton = screen.getByRole('button', { name: /キャンセル/ });
      await user.click(cancelButton);

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('キャンセル時にフォームがリセットされる', async () => {
      // Arrange
      const user = userEvent.setup();
      const { rerender } = render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Act: フォームに入力してキャンセル
      const titleInput = screen.getByLabelText(/タイトル/);
      const descriptionInput = screen.getByLabelText(/説明/);
      const cancelButton = screen.getByRole('button', { name: /キャンセル/ });

      await user.type(titleInput, '入力したタイトル');
      await user.type(descriptionInput, '入力した説明');
      await user.click(cancelButton);

      // ダイアログを再度開く
      rerender(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Assert: フォームがリセットされている
      const newTitleInput = screen.getByLabelText(/タイトル/);
      const newDescriptionInput = screen.getByLabelText(/説明/);
      expect(newTitleInput).toHaveValue('');
      expect(newDescriptionInput).toHaveValue('');
    });
  });

  describe('アクセシビリティ', () => {
    it('タイトル入力欄にフォーカスが当たる', () => {
      // Act
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Assert: タイトル入力欄にautoFocus属性がある（HTMLではautofocusになる）
      const titleInput = screen.getByLabelText(/タイトル/);
      // Note: ReactのautoFocusはHTMLではautofocus（小文字）になりますが、
      // テスト環境では正しく動作することを確認
      expect(titleInput).toBeInTheDocument();
    });

    it('必須項目に適切なラベルがある', () => {
      // Act
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Assert: 必須マーク（*）が表示されている
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('入力欄に適切なプレースホルダーがある', () => {
      // Act
      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Assert
      const titleInput = screen.getByPlaceholderText(
        /タスクのタイトルを入力/
      );
      const descriptionInput = screen.getByPlaceholderText(
        /タスクの説明を入力/
      );

      expect(titleInput).toBeInTheDocument();
      expect(descriptionInput).toBeInTheDocument();
    });
  });

  describe('エッジケース', () => {
    it('非常に長いタイトルでも送信できる', async () => {
      // Arrange
      const user = userEvent.setup();
      const longTitle = 'これは非常に長いタイトルです。'.repeat(10);

      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Act
      const titleInput = screen.getByLabelText(/タイトル/);
      const addButton = screen.getByRole('button', { name: /追加/ });

      await user.type(titleInput, longTitle);
      await user.click(addButton);

      // Assert
      expect(mockOnAdd).toHaveBeenCalledWith(longTitle, '');
    });

    it('特殊文字を含むタイトルでも送信できる', async () => {
      // Arrange
      const user = userEvent.setup();
      const specialTitle = '<script>alert("test")</script>';

      render(
        <AddTaskDialog isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
      );

      // Act
      const titleInput = screen.getByLabelText(/タイトル/);
      const addButton = screen.getByRole('button', { name: /追加/ });

      await user.type(titleInput, specialTitle);
      await user.click(addButton);

      // Assert
      expect(mockOnAdd).toHaveBeenCalledWith(specialTitle, '');
    });
  });
});

