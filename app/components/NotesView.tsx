'use client';

import { useState, useMemo, useEffect } from 'react';
import { Note } from '../lib/types';
import { useNotes } from '../lib/notesStore';
import { useKanban } from '../lib/store';
import { NoteCard } from './NoteCard';

interface NotesViewProps {
  selectedNote?: Note | null;
  onNoteClose?: () => void;
}

export function NotesView({ selectedNote, onNoteClose }: NotesViewProps) {
  const { notes, addNote, deleteNote, toggleFavorite, setEditingNoteId } = useNotes();
  const { setCurrentView } = useKanban();
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // サイドバーからメモが選択された時に開く
  useEffect(() => {
    if (selectedNote) {
      setEditingNoteId(selectedNote.id);
      setCurrentView('note-edit');
    }
  }, [selectedNote, setEditingNoteId, setCurrentView]);

  // フィルターと検索を適用
  const filteredNotes = useMemo(() => {
    let result = notes;

    // お気に入りフィルター
    if (filterFavorites) {
      result = result.filter((note) => note.isFavorite);
    }

    // 検索フィルター
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [notes, filterFavorites, searchQuery]);

  // お気に入りの数
  const favoriteCount = useMemo(
    () => notes.filter((note) => note.isFavorite).length,
    [notes]
  );

  const handleCreateNote = async () => {
    // 新しいメモを作成してエディターを開く
    const newNote = await addNote('', '');
    if (newNote) {
      setEditingNoteId(newNote.id);
      setCurrentView('note-edit');
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setCurrentView('note-edit');
  };

  return (
    <>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* ヘッダー */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  メモ
                </h1>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  全 {notes.length} 件のメモ
                  {favoriteCount > 0 && (
                    <span className="ml-2">
                      · ⭐ {favoriteCount} 件のお気に入り
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleCreateNote}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
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
                  <path d="M12 4v16m8-8H4" />
                </svg>
                新規メモ
              </button>
            </div>

            {/* 検索とフィルター */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* 検索バー */}
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="メモを検索..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-600 focus:border-transparent"
                />
              </div>

              {/* お気に入りフィルター */}
              <button
                onClick={() => setFilterFavorites(!filterFavorites)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all
                  ${
                    filterFavorites
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-2 border-yellow-300 dark:border-yellow-700'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <svg
                  className={`w-5 h-5 ${filterFavorites ? 'fill-current' : ''}`}
                  fill={filterFavorites ? 'currentColor' : 'none'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                お気に入りのみ
              </button>
            </div>
          </div>

          {/* メモ一覧 */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-purple-600 dark:text-purple-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {searchQuery || filterFavorites
                  ? 'メモが見つかりません'
                  : 'メモがありません'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery || filterFavorites
                  ? '検索条件を変更してみてください'
                  : '新規メモボタンから最初のメモを作成しましょう'}
              </p>
              {!searchQuery && !filterFavorites && (
                <button
                  onClick={handleCreateNote}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
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
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                  新規メモを作成
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleEditNote}
                  onDelete={deleteNote}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

