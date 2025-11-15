'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Note, NotesData } from './types';
import {
  loadNotesData,
  saveNotesData,
  hasDirectorySelected,
} from './fileSystem';
import { ToastType } from '../components/Toast';

interface NotesContextType {
  notes: Note[];
  isLoading: boolean;
  addNote: (title: string, content: string, tags?: string[]) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  loadNotes: () => Promise<void>;
  showToast: (message: string, type: ToastType) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ 
  children,
  showToast,
}: { 
  children: ReactNode;
  showToast: (message: string, type: ToastType) => void;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // データ保存ヘルパー
  const saveData = async (updatedNotes: Note[]): Promise<boolean> => {
    const data: NotesData = {
      notes: updatedNotes,
      lastModified: new Date().toISOString(),
    };

    try {
      await saveNotesData(data);
      return true;
    } catch (error) {
      console.error('Failed to save notes data:', error);
      const errorMessage = error instanceof Error ? error.message : 'メモデータの保存に失敗しました。';
      showToast(errorMessage, 'error');
      return false;
    }
  };

  // メモデータの読み込み
  const loadNotes = async () => {
    try {
      setIsLoading(true);
      if (hasDirectorySelected()) {
        const data = await loadNotesData();
        if (data) {
          setNotes(data.notes);
        }
      }
    } catch (error) {
      console.error('Failed to load notes data:', error);
      const errorMessage = error instanceof Error ? error.message : 'メモデータの読み込みに失敗しました。';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 初回ロード
  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // メモ追加
  const addNote = async (title: string, content: string, tags?: string[]): Promise<Note | null> => {
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      tags: tags || [],
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...notes]; // 新しいメモを先頭に追加
    setNotes(updatedNotes);
    
    if (hasDirectorySelected()) {
      const success = await saveData(updatedNotes);
      if (success) {
        showToast('メモを追加しました。', 'success');
        return newNote;
      } else {
        // 保存に失敗した場合はロールバック
        setNotes(notes);
        return null;
      }
    } else {
      showToast('メモを追加しました。（保存先未設定）', 'warning');
      return newNote;
    }
  };

  // メモ更新
  const updateNote = async (id: string, updates: Partial<Note>) => {
    const previousNotes = notes;
    const updatedNotes = notes.map((note) =>
      note.id === id
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    );

    setNotes(updatedNotes);
    
    if (hasDirectorySelected()) {
      const success = await saveData(updatedNotes);
      if (success) {
        showToast('メモを更新しました。', 'success');
      } else {
        // 保存に失敗した場合はロールバック
        setNotes(previousNotes);
      }
    } else {
      showToast('メモを更新しました。（保存先未設定）', 'warning');
    }
  };

  // メモ削除
  const deleteNote = async (id: string) => {
    const previousNotes = notes;
    const updatedNotes = notes.filter((note) => note.id !== id);
    setNotes(updatedNotes);
    
    if (hasDirectorySelected()) {
      const success = await saveData(updatedNotes);
      if (success) {
        showToast('メモを削除しました。', 'success');
      } else {
        // 保存に失敗した場合はロールバック
        setNotes(previousNotes);
      }
    } else {
      showToast('メモを削除しました。（保存先未設定）', 'warning');
    }
  };

  // お気に入りトグル
  const toggleFavorite = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    await updateNote(id, { isFavorite: !note.isFavorite });
  };

  const value: NotesContextType = {
    notes,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    loadNotes,
    showToast,
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}

