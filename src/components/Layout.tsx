import React from 'react';
import type { ReactNode } from 'react';

interface LayoutProps {
  sidebar: ReactNode;
  list: ReactNode;
  detail: ReactNode;
}

export function Layout({ sidebar, list, detail }: LayoutProps) {
  return (
    // BUG: -webkit-app-region: no-drag on the root prevents the overlay titlebar
    // from being used to drag the window. The entire content area blocks dragging.
    <div className="grid h-screen overflow-hidden" style={{ gridTemplateColumns: '240px 1fr 400px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
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
  );
}
