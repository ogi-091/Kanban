'use client';

import { useState, useEffect, useRef } from 'react';
import { Note } from '../lib/types';

interface NoteEditorScreenProps {
  note: Note | null;
  onSave: (id: string, title: string, content: string, tags: string[]) => void;
  onBack: () => void;
}

export function NoteEditorScreen({ note, onSave, onBack }: NoteEditorScreenProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
    }
    
    // エディターを開いたときにタイトル入力にフォーカス
    setTimeout(() => {
      titleRef.current?.focus();
    }, 100);
  }, [note]);

  const handleSave = () => {
    if (!note) return;
    
    // タイトルが空の場合はコンテンツの最初の行をタイトルにする
    let finalTitle = title.trim();
    if (!finalTitle) {
      const firstLine = content.split('\n')[0].trim();
      finalTitle = firstLine || '無題のメモ';
    }

    onSave(note.id, finalTitle, content, tags);
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Cmd/Ctrl + S で保存
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, tags, note]);

  if (!note) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                メモを編集
              </h1>
            </div>

            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              保存
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-6">
          {/* タイトル */}
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="無題のメモ"
            className="w-full text-4xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none placeholder-gray-400 dark:placeholder-gray-600"
          />

          {/* タグ */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded p-0.5"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                onBlur={handleAddTag}
                placeholder="タグを追加..."
                className="px-3 py-1.5 text-sm bg-transparent border border-dashed border-gray-300 dark:border-gray-700 rounded-md outline-none focus:border-purple-400 dark:focus:border-purple-600 placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* 本文 */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="メモの内容を入力..."
              className="w-full min-h-[500px] text-base text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600 leading-relaxed"
              style={{ fontFamily: 'inherit' }}
            />
          </div>

          {/* フッター（メタデータとショートカットヒント） */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span>
                  作成日: {new Date(note.createdAt).toLocaleString('ja-JP')}
                </span>
                <span>
                  最終更新: {new Date(note.updatedAt).toLocaleString('ja-JP')}
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
        </div>
      </div>
    </div>
  );
}

