---
# beanstalk-i62j
title: Set up React frontend with TypeScript and Tauri API
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:21:43Z
parent: beanstalk-ax33
---

Initialize React project with Vite, TypeScript, and @tauri-apps/api integration for frontend development

## Details

1. Initialize Vite React TypeScript project: `npm create vite@latest . -- --template react-ts` (or in frontend subdirectory)
2. Install Tauri API: `npm install @tauri-apps/api`
3. Configure package.json scripts:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "tauri": "tauri"
}
```
4. Update vite.config.ts to set correct port and configure for Tauri:
```typescript
export default defineConfig({
  server: { port: 5173, strictPort: true },
  envPrefix: ['VITE_', 'TAURI_'],
  build: { target: 'esnext' }
})
```
5. Create basic App.tsx that imports `invoke` from @tauri-apps/api
6. Run `npm install` to install dependencies
