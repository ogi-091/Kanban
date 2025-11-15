'use client';

import { AppView } from '../lib/types';
import { DarkModeToggle } from './DarkModeToggle';
import { useNotes } from '../lib/notesStore';
import { Note } from '../lib/types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  directoryName: string | null;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  onSelectNote: (note: Note) => void;
}

export function Sidebar({
  currentView,
  onViewChange,
  directoryName,
  isMobileOpen,
  onMobileClose,
  onSelectNote,
}: SidebarProps) {
  const { notes, setEditingNoteId } = useNotes();
  
  // お気に入りのメモのみを取得
  const favoriteNotes = notes.filter((note) => note.isFavorite);

  const handleViewChange = (view: AppView) => {
    onViewChange(view);
    onMobileClose(); // モバイルでビュー変更したらサイドバーを閉じる
  };

  const handleSelectNote = (note: Note) => {
    // お気に入りメモをクリックした場合は編集画面に直接遷移
    setEditingNoteId(note.id);
    onViewChange('note-edit');
    onMobileClose(); // モバイルでメモ選択したらサイドバーを閉じる
  };

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* サイドバー本体 */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          flex flex-col z-50 transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* ヘッダー */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Kanban
              </h1>
            </div>
            {/* モバイル用閉じるボタン */}
            <button
              onClick={onMobileClose}
              className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <svg
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
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
          </div>

          {/* ダークモードトグル */}
          <div className="flex items-center justify-center">
            <DarkModeToggle />
          </div>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1 mb-6">
            <button
              onClick={() => handleViewChange('kanban')}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  currentView === 'kanban'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>タスク管理</span>
            </button>

            <button
              onClick={() => handleViewChange('notes')}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  currentView === 'notes'
                    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>メモ</span>
            </button>
          </div>

          {/* お気に入りセクション */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                お気に入り
              </h3>
            </div>
            <div className="space-y-0.5">
              {favoriteNotes.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                  お気に入りなし
                </div>
              ) : (
                favoriteNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
                    title={note.title || '無題のメモ'}
                  >
                    <svg
                      className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="truncate flex-1">
                      {note.title || '無題のメモ'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </nav>

        {/* フッター（保存先情報） */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2 mb-1">
              <svg
                className="w-4 h-4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="font-medium">保存先</span>
            </div>
            <div className="pl-6 font-mono text-gray-600 dark:text-gray-400 truncate">
              {directoryName || '未設定'}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

