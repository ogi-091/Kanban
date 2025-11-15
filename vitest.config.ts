import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // ブラウザ環境をシミュレート
    environment: 'jsdom',
    // セットアップファイルを指定
    setupFiles: ['./vitest.setup.ts'],
    // テストファイルのパターン
    include: ['**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    // カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.{ts,tsx}'],
      exclude: [
        'app/**/*.d.ts',
        'app/layout.tsx',
        'app/page.tsx',
        '**/__tests__/**',
      ],
    },
    // グローバル設定（describe, it, expectをimportなしで使用可能）
    globals: true,
  },
  resolve: {
    // Next.jsのパスエイリアスを解決
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});

