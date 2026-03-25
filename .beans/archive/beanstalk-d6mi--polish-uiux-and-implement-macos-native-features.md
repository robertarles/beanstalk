---
# beanstalk-d6mi
title: Polish UI/UX and implement macOS native features
status: completed
type: epic
priority: low
tags:
    - master
    - tm_id:12
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T19:58:32Z
parent: beanstalk-ut4w
blocked_by:
    - beanstalk-34eo
    - beanstalk-lpiz
    - beanstalk-64k3
    - beanstalk-rc33
    - beanstalk-9xx8
---

Add final touches for macOS native feel, keyboard shortcuts, window state persistence, and theme support

## Details

1. Implement macOS native window features:
   - Native title bar styling
   - Traffic light buttons (close/minimize/maximize)
   - Window resize constraints (min 1200x800)
   - Persist window size and position in config
   - Restore window state on app launch
2. Add keyboard shortcuts:
   - Cmd+N: New bean
   - Cmd+F: Focus search
   - Cmd+E: Edit selected bean
   - Escape: Cancel edit/close dialogs
   - Up/Down arrows: Navigate bean list
   - Enter: Open selected bean detail
   - Cmd+O: Open selected bean in editor
   - Cmd+W: Close window (standard macOS)
3. Implement system theme support:
   - Detect macOS dark/light mode using Tauri theme API
   - Update CSS variables based on theme
   - Listen for theme changes and update in real-time
4. Add loading states:
   - Spinner while loading beans
   - Skeleton loaders for bean list
   - Loading indicator for create/update operations
5. Add empty states:
   - No projects: "Add a project to get started" with big "Add Project" button
   - No beans: "No beans found. Create your first bean!"
   - No search results: "No beans match your search"
6. Improve error handling UX:
   - Toast notifications for errors (non-blocking)
   - Friendly error messages for common issues
   - Retry buttons where applicable
7. Performance optimizations:
   - Virtualize bean list if > 100 items (react-window)
   - Memoize expensive computations
   - Lazy load markdown rendering
8. Add subtle animations:
   - Fade in/out for bean list changes
   - Smooth transitions between view/edit modes
   - Highlight animation for newly created beans
9. Accessibility:
   - Semantic HTML
   - ARIA labels for buttons and inputs
   - Keyboard navigation support
10. App icon and branding:
    - Design simple app icon
    - Add to tauri.conf.json
    - Ensure it displays in Dock and About dialog
