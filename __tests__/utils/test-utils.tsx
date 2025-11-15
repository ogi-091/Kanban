/**
 * テストユーティリティ
 * 
 * 【学習ポイント】カスタムレンダー関数
 * Reactコンポーネントのテストでは、Context Providerなどでラップする必要があります。
 * このカスタムレンダー関数を使うことで、毎回ラップする手間が省けます。
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { KanbanProvider } from '@/app/lib/store';

/**
 * KanbanProviderでラップしたレンダー関数
 * 
 * 使い方:
 * ```typescript
 * import { renderWithProvider } from '@/__tests__/utils/test-utils';
 * 
 * test('コンポーネントのテスト', () => {
 *   renderWithProvider(<MyComponent />);
 *   // テストコード...
 * });
 * ```
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // 将来的に追加のオプションをここに定義できます
}

function AllTheProviders({ children }: { children: ReactNode }) {
  return <KanbanProvider>{children}</KanbanProvider>;
}

export function renderWithProvider(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * 【学習ポイント】re-export
 * @testing-library/reactの全てのエクスポートを再エクスポートすることで、
 * このファイルだけをimportすれば、全てのテスト機能が使えます
 */
export * from '@testing-library/react';

// カスタムレンダー関数を上書き
export { renderWithProvider as render };

