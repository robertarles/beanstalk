---
# beanstalk-jwvb
title: Implement system theme detection and CSS variable updates
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T19:58:28Z
parent: beanstalk-d6mi
blocked_by:
    - beanstalk-wizg
---

Detect macOS dark/light mode using Tauri theme API, update CSS variables dynamically, and listen for theme changes

## Details

1. Use Tauri's theme API to detect system theme:
   - Import `@tauri-apps/api/window` and use `theme()` method
   - Returns 'light' or 'dark'
2. Create CSS variables for light and dark themes in :root:
   - --bg-color, --text-color, --border-color, --accent-color, etc.
   - Define two sets: one for light, one for dark
3. In React app, on mount:
   - Call theme API to get current theme
   - Set data-theme="light" or data-theme="dark" on <html> element
   - Use CSS selector html[data-theme="dark"] to apply dark variables
4. Listen for theme changes:
   - Use Tauri event listener for theme change events
   - Update data-theme attribute when theme changes
5. Ensure all components use CSS variables instead of hardcoded colors
