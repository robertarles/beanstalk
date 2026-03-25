import React from 'react';
import type { ReactNode } from 'react';

interface LayoutProps {
  sidebar: ReactNode;
  list: ReactNode;
  detail: ReactNode;
}

export function Layout({ sidebar, list, detail }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* macOS overlay titlebar drag region. paddingLeft clears the traffic light buttons
          (3 × 12px buttons at 8px inset + spacing ≈ 68px; 75px adds a small margin). */}
      <div data-tauri-drag-region style={{ height: '28px', paddingLeft: '75px', WebkitAppRegion: 'drag' } as React.CSSProperties} className="shrink-0" />
      <div className="grid flex-1 overflow-hidden" style={{ gridTemplateColumns: '240px 1fr 400px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Sidebar */}
        <aside className="overflow-y-auto overflow-x-hidden border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          {sidebar}
        </aside>

        {/* Bean List */}
        <main className="overflow-y-auto overflow-x-hidden border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          {list}
        </main>

        {/* Bean Detail */}
        <aside className="overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-950">
          {detail}
        </aside>
      </div>
    </div>
  );
}
