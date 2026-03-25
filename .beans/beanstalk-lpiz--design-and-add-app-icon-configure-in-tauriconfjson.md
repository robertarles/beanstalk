---
# beanstalk-lpiz
title: Design and add app icon, configure in tauri.conf.json
status: todo
type: task
priority: normal
tags:
    - master
    - tm_id:8
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T18:05:43Z
parent: beanstalk-d6mi
blocked_by:
    - beanstalk-alub
    - beanstalk-7hz1
---

Create simple app icon, add to tauri.conf.json, and verify it displays correctly in macOS Dock and About dialog

## Details

1. Design app icon:
   - Create simple, recognizable icon (e.g., coffee bean shape or stylized "B")
   - Use design tool (Figma, Sketch) or generate with icon generator
   - Export in required sizes: 32x32, 128x128, 256x256, 512x512 (PNG with transparency)
   - Use macOS iconset format (.icns) for best results
2. Add icon files to src-tauri/icons/ directory
3. Update tauri.conf.json:
   - Set `icon` path in `tauri.bundle.icon` section
   - Specify different sizes for different contexts (Dock, About, etc.)
4. Rebuild app and test:
   - Verify icon appears in Dock when app is running
   - Open About dialog (if implemented) and verify icon appears
   - Check app icon in Finder (app bundle icon)
5. Optional: Add branding to title bar (app name in window title)
