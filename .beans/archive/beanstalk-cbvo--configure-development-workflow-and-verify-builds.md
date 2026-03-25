---
# beanstalk-cbvo
title: Configure development workflow and verify builds
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:6
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:23:52Z
parent: beanstalk-ax33
---

Set up hot-reload development environment and verify both dev and production builds work correctly

## Details

1. Verify tauri.conf.json has correct devPath pointing to Vite server: `"devPath": "http://localhost:5173"`
2. Verify distDir points to build output: `"distDir": "../dist"`
3. Test development mode: `cargo tauri dev` - should start both Vite and Tauri, open macOS window with React app
4. Verify hot-reload: make a change to App.tsx and confirm it updates without restart
5. Test production build: `cargo tauri build`
6. Verify .app bundle is created in src-tauri/target/release/bundle/macos/
7. Test launching the built .app and verify it runs standalone
8. Document common development commands in README
