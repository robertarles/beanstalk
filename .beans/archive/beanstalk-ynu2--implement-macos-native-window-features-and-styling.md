---
# beanstalk-ynu2
title: Implement macOS native window features and styling
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T19:58:28Z
parent: beanstalk-d6mi
---

Configure native title bar, traffic light buttons, and window resize constraints through tauri.conf.json and CSS

## Details

1. Update tauri.conf.json to enable native window decorations:
   - Set `decorations: true` for native title bar
   - Configure `titleBarStyle: "overlay"` for macOS native look
   - Set minimum window size: `minWidth: 1200, minHeight: 800`
2. Add CSS for title bar integration:
   - Ensure app content respects title bar height
   - Add padding-top to prevent content overlap with traffic lights
   - Style for transparent title bar if using overlay mode
3. Test traffic light buttons (close/minimize/maximize) work natively
4. Verify window resize constraints prevent shrinking below 1200x800
