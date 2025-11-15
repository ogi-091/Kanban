'use client';

import { useState } from 'react';
import { useKanban } from './lib/store';
import { NotesProvider } from './lib/notesStore';
import { DirectorySelector } from './components/DirectorySelector';
import { KanbanBoard } from './components/KanbanBoard';
import { NotesView } from './components/NotesView';
import { Sidebar } from './components/Sidebar';

export default function Home() {
  const {
    isLoading,
    directoryName,
    isFileSystemSupported,
    initializeDirectory,
    currentView,
    setCurrentView,
    showToast,
  } = useKanban();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleSelectDirectory = async () => {
    await initializeDirectory();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!directoryName) {
    return (
      <DirectorySelector
        onSelectDirectory={handleSelectDirectory}
        isSupported={isFileSystemSupported}
      />
    );
  }

  return (
    <NotesProvider showToast={showToast}>
      <div className="flex h-screen overflow-hidden">
        {/* サイドバー */}
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          directoryName={directoryName}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* メインコンテンツエリア */}
        <main className="flex-1 overflow-y-auto lg:ml-64">
          {/* モバイル用ヘッダー（ハンバーガーメニュー） */}
          <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* ビューの切り替え */}
          {currentView === 'kanban' ? <KanbanBoard /> : <NotesView />}
        </main>
      </div>
    </NotesProvider>
  );
}
