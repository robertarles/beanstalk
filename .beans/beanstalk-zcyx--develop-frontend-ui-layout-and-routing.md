---
# beanstalk-zcyx
title: Develop frontend UI layout and routing
status: todo
type: epic
tags:
    - master
    - tm_id:6
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-ut4w
---

Build the three-pane UI layout with sidebar, bean list, and detail pane using React and CSS

## Details

1. Set up React project structure in src/:
   - components/
     - Sidebar.tsx
     - BeanList.tsx
     - BeanDetail.tsx
     - Layout.tsx
   - hooks/
     - useBeans.ts
     - useConfig.ts
   - types/
     - beans.ts
   - App.tsx
2. Install dependencies:
   - react, react-dom
   - @tauri-apps/api (for Tauri commands)
   - CSS framework: TailwindCSS or plain CSS for macOS native look
   - react-markdown (for rendering bean body)
3. Implement Layout component with CSS Grid for 3-pane layout:
```css
.layout {
  display: grid;
  grid-template-columns: 250px 1fr 1fr;
  height: 100vh;
}
```
4. Implement Sidebar component:
   - Project list with active project highlighting
   - Status filter section (collapsible)
   - Add/remove project buttons
5. Implement BeanList component:
   - Search bar at top
   - Sortable table with columns: title, status, ID, date
   - Click handlers to select bean
   - New Bean button at bottom
   - Support for expandable children (render nested)
6. Implement BeanDetail component:
   - Bean metadata display (title, status, tags, assignee, date)
   - Markdown-rendered body (read-only)
   - Edit form mode (toggle between view/edit)
   - "Open in Editor" button
   - Save/Cancel buttons in edit mode
7. Support dark/light mode using system preferences:
   - Use CSS @media (prefers-color-scheme: dark)
   - Or Tauri theme API
8. Make layout responsive to window resizing
