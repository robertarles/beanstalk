import React, { useState } from 'react';
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

const MIN_SIDEBAR = 150;
const MAX_SIDEBAR = 600;
const MIN_DETAIL = 200;
const MAX_DETAIL = 800;

/** A draggable 1px-wide column resize handle with an expanded hit area. */
function ResizeDivider({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="relative flex-shrink-0 w-1 cursor-col-resize group"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* Visual indicator — thin line that highlights on hover/active */}
      <div className="absolute inset-y-0 left-0 right-0 bg-gray-200 dark:bg-gray-800 group-hover:bg-blue-400 dark:group-hover:bg-blue-500 transition-colors" />
    </div>
  );
}

export function Layout({ sidebar, list, detail, focusedPanel }: LayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [detailWidth, setDetailWidth] = useState(400);

  const handleLeftDivider = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const onMove = (ev: MouseEvent) => {
      setSidebarWidth(Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, startWidth + ev.clientX - startX)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleRightDivider = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = detailWidth;
    const onMove = (ev: MouseEvent) => {
      setDetailWidth(Math.max(MIN_DETAIL, Math.min(MAX_DETAIL, startWidth - (ev.clientX - startX))));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* macOS overlay titlebar drag region. paddingLeft clears the traffic light buttons
          (3 × 12px buttons at 8px inset + spacing ≈ 68px; 75px adds a small margin). */}
      <div data-tauri-drag-region style={{ height: '28px', paddingLeft: '75px', WebkitAppRegion: 'drag' } as React.CSSProperties} className="shrink-0" />
      <div className="flex flex-1 overflow-hidden" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Sidebar */}
        <aside
          style={{ width: sidebarWidth }}
          className={['flex-shrink-0 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900', focusRing('sidebar', focusedPanel)].join(' ')}
        >
          {sidebar}
        </aside>

        <ResizeDivider onMouseDown={handleLeftDivider} />

        {/* Bean List */}
        <main className={['flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-950', focusRing('list', focusedPanel)].join(' ')}>
          {list}
        </main>

        <ResizeDivider onMouseDown={handleRightDivider} />

        {/* Bean Detail */}
        <aside
          data-detail-panel
          style={{ width: detailWidth }}
          className={['flex-shrink-0 overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-950', focusRing('detail', focusedPanel)].join(' ')}
        >
          {detail}
        </aside>
      </div>
    </div>
  );
}
