import { KanbanData, Task, NotesData, Note } from './types';

const FILE_NAME = 'kanban-data.json';
const NOTES_FILE_NAME = 'notes-data.json';

let directoryHandle: FileSystemDirectoryHandle | null = null;

/**
 * KanbanDataの型チェック
 */
function isValidKanbanData(data: unknown): data is KanbanData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // tasksプロパティの確認
  if (!Array.isArray(obj.tasks)) {
    return false;
  }

  // 各タスクの型チェック
  for (const task of obj.tasks) {
    if (!isValidTask(task)) {
      return false;
    }
  }

  // lastModifiedプロパティの確認
  if (typeof obj.lastModified !== 'string') {
    return false;
  }

  return true;
}

/**
 * Taskの型チェック
 */
function isValidTask(task: unknown): task is Task {
  if (!task || typeof task !== 'object') {
    return false;
  }

  const obj = task as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    (obj.status === 'todo' || obj.status === 'in-progress' || obj.status === 'done') &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  );
}

/**
 * File System Access APIがサポートされているかチェック
 */
export function isFileSystemAccessSupported(): boolean {
  // サーバー側では window が存在しないため、チェックが必要
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * ディレクトリを選択してハンドルを保存
 */
export async function selectDirectory(): Promise<boolean> {
  try {
    if (!isFileSystemAccessSupported()) {
      throw new Error('File System Access API is not supported');
    }

    directoryHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
    });

    return true;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // ユーザーがキャンセルした場合
      return false;
    }
    console.error('Failed to select directory:', error);
    throw error;
  }
}

/**
 * 保存されたディレクトリハンドルのアクセス権限をチェック
 */
export async function checkPermission(): Promise<boolean> {
  try {
    if (!directoryHandle) {
      return false;
    }

    const permission = await directoryHandle.queryPermission({
      mode: 'readwrite',
    });

    if (permission === 'granted') {
      return true;
    }

    if (permission === 'prompt') {
      const newPermission = await directoryHandle.requestPermission({
        mode: 'readwrite',
      });
      return newPermission === 'granted';
    }

    return false;
  } catch (error) {
    console.error('Failed to check permission:', error);
    return false;
  }
}

/**
 * カンバンデータをJSONファイルに保存
 */
export async function saveKanbanData(data: KanbanData): Promise<void> {
  try {
    if (!directoryHandle) {
      throw new Error('保存先ディレクトリが選択されていません。');
    }

    const hasPermission = await checkPermission();
    if (!hasPermission) {
      throw new Error('ディレクトリへのアクセス権限がありません。');
    }

    const fileHandle = await directoryHandle.getFileHandle(FILE_NAME, {
      create: true,
    });

    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();

    console.log('Data saved successfully');
  } catch (error) {
    console.error('Failed to save data:', error);
    
    // ユーザーフレンドリーなエラーメッセージに変換
    if (error instanceof Error) {
      if (error.message.includes('保存先') || error.message.includes('アクセス権限')) {
        throw error;
      }
      throw new Error(`データの保存に失敗しました: ${error.message}`);
    }
    throw new Error('データの保存に失敗しました。');
  }
}

/**
 * JSONファイルからカンバンデータを読み込み
 */
export async function loadKanbanData(): Promise<KanbanData | null> {
  try {
    if (!directoryHandle) {
      return null;
    }

    const hasPermission = await checkPermission();
    if (!hasPermission) {
      return null;
    }

    const fileHandle = await directoryHandle.getFileHandle(FILE_NAME);
    const file = await fileHandle.getFile();
    const contents = await file.text();
    
    // JSONのパース
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(contents);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      throw new Error('データファイルの形式が正しくありません。');
    }

    // データのバリデーション
    if (!isValidKanbanData(parsedData)) {
      console.error('Invalid data structure:', parsedData);
      throw new Error('データファイルの構造が正しくありません。');
    }

    console.log('Data loaded successfully');
    return parsedData;
  } catch (error) {
    if ((error as Error).name === 'NotFoundError') {
      // ファイルが存在しない場合は null を返す
      console.log('No existing data file found');
      return null;
    }
    
    console.error('Failed to load data:', error);
    
    // ユーザーフレンドリーなエラーメッセージに変換
    if (error instanceof Error) {
      if (error.message.includes('データファイル')) {
        throw error;
      }
      throw new Error(`データの読み込みに失敗しました: ${error.message}`);
    }
    throw new Error('データの読み込みに失敗しました。');
  }
}

/**
 * ディレクトリが選択されているかチェック
 */
export function hasDirectorySelected(): boolean {
  return directoryHandle !== null;
}

/**
 * 選択されたディレクトリの名前を取得
 */
export function getDirectoryName(): string | null {
  return directoryHandle?.name || null;
}

// ========================================
// メモ機能関連
// ========================================

/**
 * NotesDataの型チェック
 */
function isValidNotesData(data: unknown): data is NotesData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // notesプロパティの確認
  if (!Array.isArray(obj.notes)) {
    return false;
  }

  // 各メモの型チェック
  for (const note of obj.notes) {
    if (!isValidNote(note)) {
      return false;
    }
  }

  // lastModifiedプロパティの確認
  if (typeof obj.lastModified !== 'string') {
    return false;
  }

  return true;
}

/**
 * Noteの型チェック
 */
function isValidNote(note: unknown): note is Note {
  if (!note || typeof note !== 'object') {
    return false;
  }

  const obj = note as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.isFavorite === 'boolean' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string' &&
    (obj.tags === undefined || Array.isArray(obj.tags))
  );
}

/**
 * メモデータをJSONファイルに保存
 */
export async function saveNotesData(data: NotesData): Promise<void> {
  try {
    if (!directoryHandle) {
      throw new Error('保存先ディレクトリが選択されていません。');
    }

    const hasPermission = await checkPermission();
    if (!hasPermission) {
      throw new Error('ディレクトリへのアクセス権限がありません。');
    }

    const fileHandle = await directoryHandle.getFileHandle(NOTES_FILE_NAME, {
      create: true,
    });

    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();

    console.log('Notes data saved successfully');
  } catch (error) {
    console.error('Failed to save notes data:', error);
    
    // ユーザーフレンドリーなエラーメッセージに変換
    if (error instanceof Error) {
      if (error.message.includes('保存先') || error.message.includes('アクセス権限')) {
        throw error;
      }
      throw new Error(`メモデータの保存に失敗しました: ${error.message}`);
    }
    throw new Error('メモデータの保存に失敗しました。');
  }
}

/**
 * JSONファイルからメモデータを読み込み
 */
export async function loadNotesData(): Promise<NotesData | null> {
  try {
    if (!directoryHandle) {
      return null;
    }

    const hasPermission = await checkPermission();
    if (!hasPermission) {
      return null;
    }

    const fileHandle = await directoryHandle.getFileHandle(NOTES_FILE_NAME);
    const file = await fileHandle.getFile();
    const contents = await file.text();
    
    // JSONのパース
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(contents);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      throw new Error('メモデータファイルの形式が正しくありません。');
    }

    // データのバリデーション
    if (!isValidNotesData(parsedData)) {
      console.error('Invalid notes data structure:', parsedData);
      throw new Error('メモデータファイルの構造が正しくありません。');
    }

    console.log('Notes data loaded successfully');
    return parsedData;
  } catch (error) {
    if ((error as Error).name === 'NotFoundError') {
      // ファイルが存在しない場合は null を返す
      console.log('No existing notes data file found');
      return null;
    }
    
    console.error('Failed to load notes data:', error);
    
    // ユーザーフレンドリーなエラーメッセージに変換
    if (error instanceof Error) {
      if (error.message.includes('メモデータファイル')) {
        throw error;
      }
      throw new Error(`メモデータの読み込みに失敗しました: ${error.message}`);
    }
    throw new Error('メモデータの読み込みに失敗しました。');
  }
}

