import React from 'react';
import type { ReactNode } from 'react';
import type { FocusedPanel } from '../types/keyboard';

interface LayoutProps {
  sidebar: ReactNode;
  list: ReactNode;
  detail: ReactNode;
  /** Which panel currently has keyboard focus; used for subtle focus ring. */
  focusedPanel?: FocusedPanel;
}

/** Returns a subtle inset ring class when the panel is focused. */
function focusRing(panel: FocusedPanel, focused: FocusedPanel | undefined): string {
  return focused === panel ? 'ring-1 ring-inset ring-blue-400/40 dark:ring-blue-500/40' : '';
}

export function Layout({ sidebar, list, detail, focusedPanel }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* macOS overlay titlebar drag region. paddingLeft clears the traffic light buttons
          (3 × 12px buttons at 8px inset + spacing ≈ 68px; 75px adds a small margin). */}
      <div data-tauri-drag-region style={{ height: '28px', paddingLeft: '75px', WebkitAppRegion: 'drag' } as React.CSSProperties} className="shrink-0" />
      <div className="grid flex-1 overflow-hidden" style={{ gridTemplateColumns: '240px 1fr 400px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Sidebar */}
        <aside className={['overflow-y-auto overflow-x-hidden border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900', focusRing('sidebar', focusedPanel)].join(' ')}>
          {sidebar}
        </aside>

        {/* Bean List */}
        <main className={['overflow-y-auto overflow-x-hidden border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950', focusRing('list', focusedPanel)].join(' ')}>
          {list}
        </main>

        {/* Bean Detail */}
        <aside className={['overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-950', focusRing('detail', focusedPanel)].join(' ')}>
          {detail}
        </aside>
      </div>
    </div>
  );
}
