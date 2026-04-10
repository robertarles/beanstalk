---
# beanstalk-wkb0
title: 'Keyboard: l=expand/collapse, c=create, Ctrl+hl=panes'
status: completed
type: feature
priority: normal
created_at: 2026-04-04T17:33:50Z
updated_at: 2026-04-04T17:39:36Z
---

Add l for expand/collapse, c for new bean, Ctrl+h/Ctrl+l for panel navigation (replaces plain h/l for panels).

## Summary of Changes

- useKeyboardNav.ts: Added onToggleExpand option + toggleExpand action. Rebound h→Ctrl+h, l→expand/collapse. Added Ctrl+l for right panel. Added c as alias for n (new bean).
- BeanList.tsx: Added toggleExpandRef prop; made toggleExpand a stable useCallback; effect sets ref on mount.
- App.tsx: Added beanListToggleExpandRef, selectedBeanIndexRef (kept current after hook call), handleKbToggleExpand. Wired to useKeyboardNav and BeanList.
- KeyboardHelp.tsx: Updated bindings table.
