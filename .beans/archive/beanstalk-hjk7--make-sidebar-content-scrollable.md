---
# beanstalk-hjk7
title: Make sidebar content scrollable
status: scrapped
type: epic
priority: high
tags:
    - master
    - tm_id:1
created_at: 2026-04-01T16:06:05Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-ghh8
---

Modify Sidebar component to make content below titlebar scrollable when it exceeds window height

## Details

In `src/components/Sidebar.tsx`, restructure the layout to separate the fixed titlebar spacer from the scrollable content area. The current structure uses `flex flex-col h-full` but needs an `overflow-y-auto` container.

Implementation approach:
1. Keep the titlebar spacer (`env(titlebar-area-height, 28px)`) as `flex-shrink-0` outside the scroll container
2. Wrap Projects, Status, and Tags sections in a new div with `flex-1 overflow-y-auto`
3. Ensure the container uses `flex flex-col` to allow proper scrolling behavior

Pseudo-code:
```tsx
<div className="flex flex-col h-full">
  {/* Fixed titlebar spacer */}
  <div style={{ height: 'env(titlebar-area-height, 28px)' }} className="flex-shrink-0" />
  
  {/* Scrollable content area */}
  <div className="flex-1 overflow-y-auto flex flex-col">
    {/* Projects section */}
    {/* Divider */}
    {/* Status section */}
    {/* Divider */}
    {/* Tags section */}
  </div>
</div>
```
