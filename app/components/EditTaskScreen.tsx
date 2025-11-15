'use client';

import { useState, useEffect, useRef } from 'react';
import { Task } from '../lib/types';

interface EditTaskScreenProps {
  task: Task | null;
  onUpdate: (id: string, title: string, description: string) => void;
  onBack: () => void;
}

export function EditTaskScreen({
  task,
  onUpdate,
  onBack,
}: EditTaskScreenProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
    }
  }, [task]);

  // フォーカス処理
  useEffect(() => {
    setTimeout(() => {
      titleRef.current?.focus();
    }, 100);
  }, []);

  if (!task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onUpdate(task.id, title.trim(), description.trim());
    }
  };

  const handleBack = () => {
    setTitle('');
    setDescription('');
    onBack();
  };

  // Cmd/Ctrl + S で保存
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (title.trim()) {
          onUpdate(task.id, title.trim(), description.trim());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, task]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="戻る"
              >
                <svg
                  className="w-6 h-6 text-gray-600 dark:text-gray-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                タスクを編集
              </h1>
            </div>
          </div>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* タイトル */}
            <div>
              <label
                htmlFor="edit-title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                タイトル <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                ref={titleRef}
                type="text"
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 text-lg"
                placeholder="タスクのタイトルを入力"
                required
              />
            </div>

            {/* 説明 */}
            <div>
              <label
                htmlFor="edit-description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                説明
              </label>
              <textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none resize-none text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                placeholder="タスクの説明を入力（任意）"
                rows={10}
              />
            </div>

            {/* メタデータ */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span>
                    作成日: {new Date(task.createdAt).toLocaleString('ja-JP')}
                  </span>
                  <span>
                    更新日: {new Date(task.updatedAt).toLocaleString('ja-JP')}
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-xs font-mono">
                    {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                  </kbd>
                  <span>+</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-xs font-mono">
                    S
                  </kbd>
                  <span className="ml-1">で保存</span>
                </span>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold shadow-sm"
              >
                更新
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

