import { KanbanData } from './types';

const FILE_NAME = 'kanban-data.json';

let directoryHandle: FileSystemDirectoryHandle | null = null;

/**
 * File System Access APIがサポートされているかチェック
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
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
}

/**
 * カンバンデータをJSONファイルに保存
 */
export async function saveKanbanData(data: KanbanData): Promise<void> {
  try {
    if (!directoryHandle) {
      throw new Error('Directory not selected');
    }

    const hasPermission = await checkPermission();
    if (!hasPermission) {
      throw new Error('Permission denied');
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
    throw error;
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
    
    const data = JSON.parse(contents) as KanbanData;
    console.log('Data loaded successfully');
    return data;
  } catch (error) {
    if ((error as Error).name === 'NotFoundError') {
      // ファイルが存在しない場合は null を返す
      console.log('No existing data file found');
      return null;
    }
    console.error('Failed to load data:', error);
    throw error;
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

