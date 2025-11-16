'use client';

import { useState, useMemo } from 'react';
import { useKanban } from './lib/store';
import { NotesProvider, useNotes } from './lib/notesStore';
import { DirectorySelector } from './components/DirectorySelector';
import { KanbanBoard } from './components/KanbanBoard';
import { NotesView } from './components/NotesView';
import { EditTaskScreen } from './components/EditTaskScreen';
import { NoteEditorScreen } from './components/NoteEditorScreen';
import { Sidebar } from './components/Sidebar';
import { Note } from './lib/types';

// メインコンテンツコンポーネント（NotesProvider内で使用するため分離）
function MainContent() {
  const {
    currentView,
    setCurrentView,
    tasks,
    updateTask,
    editingTaskId,
    setEditingTaskId,
  } = useKanban();
  const { notes, updateNote, editingNoteId, setEditingNoteId } = useNotes();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // 編集中のタスクを取得
  const editingTask = useMemo(() => {
    return tasks.find((task) => task.id === editingTaskId) || null;
  }, [tasks, editingTaskId]);

  // 編集中のメモを取得
  const editingNote = useMemo(() => {
    return notes.find((note) => note.id === editingNoteId) || null;
  }, [notes, editingNoteId]);

  // タスク更新ハンドラー
  const handleUpdateTask = async (
    id: string,
    title: string,
    description: string
  ) => {
    await updateTask(id, { title, description });
    // 保存後、カンバンボードに戻る
    setEditingTaskId(null);
    setCurrentView('kanban');
  };

  // タスク編集をキャンセル
  const handleCancelTaskEdit = () => {
    setEditingTaskId(null);
    setCurrentView('kanban');
  };

  // メモ保存ハンドラー（保存後も編集画面に留まる）
  const handleSaveNote = async (
    id: string,
    title: string,
    content: string,
    tags: string[]
  ) => {
    await updateNote(id, { title, content, tags });
  };

  // メモ編集を終了
  const handleBackToNotes = () => {
    setEditingNoteId(null);
    setCurrentView('notes');
  };

  return (
    <>
      {/* ビューの切り替え */}
      {currentView === 'task-edit' && editingTask ? (
        <EditTaskScreen
          task={editingTask}
          onUpdate={handleUpdateTask}
          onBack={handleCancelTaskEdit}
        />
      ) : currentView === 'note-edit' && editingNote ? (
        <NoteEditorScreen
          note={editingNote}
          onSave={handleSaveNote}
          onBack={handleBackToNotes}
        />
      ) : currentView === 'kanban' ? (
        <KanbanBoard />
      ) : (
        <NotesView
          selectedNote={selectedNote}
          onNoteClose={() => setSelectedNote(null)}
        />
      )}
    </>
  );
}

export default function Home() {
  const {
    isLoading,
    directoryName,
    isFileSystemSupported,
    initializeDirectory,
    currentView,
    setCurrentView,
  } = useKanban();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

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
    <NotesProvider>
      <div className="flex h-screen overflow-hidden">
        {/* サイドバー */}
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          directoryName={directoryName}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
          isDesktopOpen={isDesktopSidebarOpen}
          onDesktopToggle={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          onSelectNote={setSelectedNote}
        />

        {/* メインコンテンツエリア */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isDesktopSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
          {/* ヘッダー（モバイル用ハンバーガーメニュー + デスクトップ用開閉ボタン） */}
          <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
            <div className="flex items-center justify-between">
              {/* モバイル用ハンバーガーメニュー */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
              
              {/* デスクトップ用サイドバー開閉ボタン（サイドバーが閉じている時のみ表示） */}
              {!isDesktopSidebarOpen && (
                <button
                  onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                  className="hidden lg:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="サイドバーを開く"
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
                    <path d="M13 19l7-7-7-7M6 19l7-7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <MainContent />
        </main>
      </div>
    </NotesProvider>
  );
}
